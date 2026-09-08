import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MercadoPagoPixPoc } from "./MercadoPagoPixPoc";
import { mercadoPagoPocService as service } from "@/services/mercadoPagoPocService";
import { PIX_STATUS_LABELS, type MercadoPagoPix, type MercadoPagoPixStatus } from "@/types/mercado-pago-poc";

vi.mock("@/services/mercadoPagoPocService", () => ({ mercadoPagoPocService: { health: vi.fn(), create: vi.fn(), status: vi.fn() } }));
const pending: MercadoPagoPix = { id: "internal-1", idExterno: "ORDTST1", status: "PENDENTE", valor: 10, pix: null, atualizadoEm: "2026-09-08T15:00:00Z" };
const complete: MercadoPagoPix = { ...pending, pix: { qrCodeBase64: "aGVsbG8=", copiaCola: "000201-PIX-TEST", expiracao: "2026-09-09T15:00:00Z" } };
const terminals: MercadoPagoPixStatus[] = ["APROVADO", "REJEITADO", "CANCELADO", "EXPIRADO", "REEMBOLSADO"];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
async function flush() { await act(async () => { await Promise.resolve(); }); }
async function tick(ms = 2500) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
async function generate() {
  fireEvent.click(screen.getByRole("button", { name: "R$ 10" }));
  fireEvent.click(screen.getByRole("button", { name: "Gerar PIX" }));
  await flush();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(service.health).mockReset().mockResolvedValue({});
  vi.mocked(service.create).mockReset().mockResolvedValue(pending);
  vi.mocked(service.status).mockReset().mockResolvedValue(pending);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it("não cria automaticamente, valida valores e health não bloqueia", async () => {
  vi.mocked(service.health).mockRejectedValue(new Error("offline"));
  render(<MercadoPagoPixPoc />);
  await flush();
  expect(service.create).not.toHaveBeenCalled();
  expect(screen.getByText(/Aviso: não foi possível verificar/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Gerar PIX" }));
  expect(screen.getByText("Informe o valor.")).toBeTruthy();
  for (const value of ["0", "-1", "abc", "1,234"]) {
    fireEvent.change(screen.getByLabelText("Valor em reais"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Gerar PIX" }));
    expect(screen.getByRole("alert")).toBeTruthy();
  }
  expect(service.create).not.toHaveBeenCalled();
  await generate();
  expect(service.create).toHaveBeenCalledTimes(1);
});

it("envia valor decimal e impede dois POST simultâneos mesmo com submit repetido", async () => {
  const post = deferred<MercadoPagoPix>();
  vi.mocked(service.create).mockReturnValue(post.promise);
  render(<MercadoPagoPixPoc />);
  fireEvent.change(screen.getByLabelText("Valor em reais"), { target: { value: "20,50" } });
  const button = screen.getByRole("button", { name: "Gerar PIX" });
  fireEvent.submit(button.closest("form")!);
  fireEvent.submit(button.closest("form")!);
  expect(service.create).toHaveBeenCalledTimes(1);
  expect(service.create).toHaveBeenCalledWith(20.5, expect.any(AbortSignal));
  expect((screen.getByRole("button", { name: "Gerando PIX..." }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => post.resolve(pending));
});

it("mostra erro do backend e permite tentar novamente", async () => {
  vi.mocked(service.create).mockRejectedValueOnce(new Error("Valor não permitido"));
  render(<MercadoPagoPixPoc />);
  await generate();
  expect(screen.getByRole("alert").textContent).toBe("Valor não permitido");
  await generate();
  expect(screen.getByText("Aguardando pagamento")).toBeTruthy();
});

it("preenche QR, copiaCola e expiração posteriormente e mostra dados técnicos", async () => {
  vi.mocked(service.status).mockResolvedValue({ ...complete, status: "PROCESSANDO" });
  render(<MercadoPagoPixPoc />);
  await generate();
  expect(screen.getByText("Gerando QR Code...")).toBeTruthy();
  expect(service.status).not.toHaveBeenCalled();
  await tick(2499);
  expect(service.status).not.toHaveBeenCalled();
  await tick(1);
  expect(screen.getByText("Processando pagamento")).toBeTruthy();
  expect(screen.getByRole("img").getAttribute("src")).toBe("data:image/png;base64,aGVsbG8=");
  expect((screen.getByLabelText("PIX Copia e Cola") as HTMLTextAreaElement).value).toBe(complete.pix?.copiaCola);
  expect(screen.getByText(/Expiração:/).textContent).not.toContain("Não informada");
  expect(screen.getByText("internal-1")).toBeTruthy();
  expect(screen.getByText("ORDTST1")).toBeTruthy();
  expect(screen.getByText(pending.atualizadoEm)).toBeTruthy();
});

it.each(terminals)("não inicia polling se criação retornar %s", async (status) => {
  vi.mocked(service.create).mockResolvedValue({ ...complete, status });
  render(<MercadoPagoPixPoc />);
  await generate();
  expect(screen.getByText(PIX_STATUS_LABELS[status])).toBeTruthy();
  await tick(10000);
  expect(service.status).not.toHaveBeenCalled();
});

it.each(terminals)("encerra polling ao receber %s", async (status) => {
  vi.mocked(service.status).mockResolvedValue({ ...complete, status });
  render(<MercadoPagoPixPoc />);
  await generate();
  await tick();
  expect(screen.getByText(PIX_STATUS_LABELS[status])).toBeTruthy();
  await tick(10000);
  expect(service.status).toHaveBeenCalledTimes(1);
});

it("aguarda consulta lenta antes de agendar outra e recupera falha de polling", async () => {
  const status = deferred<MercadoPagoPix>();
  vi.mocked(service.status).mockReturnValueOnce(status.promise).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(complete);
  render(<MercadoPagoPixPoc />);
  await generate();
  await tick();
  await tick(10000);
  expect(service.status).toHaveBeenCalledTimes(1);
  await act(async () => status.resolve(pending));
  await tick();
  expect(screen.getByText(/Tentando novamente/)).toBeTruthy();
  await tick();
  expect(screen.queryByText(/Tentando novamente/)).toBeNull();
  expect(screen.getByRole("img")).toBeTruthy();
});

it("cancela consulta antiga, ignora resposta tardia e acompanha somente nova cobrança", async () => {
  const old = deferred<MercadoPagoPix>();
  vi.mocked(service.status).mockReturnValueOnce(old.promise);
  render(<MercadoPagoPixPoc />);
  await generate();
  await tick();
  const signal = vi.mocked(service.status).mock.calls[0][1]!;
  vi.mocked(service.create).mockResolvedValue({ ...pending, id: "internal-2" });
  await generate();
  expect(signal.aborted).toBe(true);
  await act(async () => old.resolve({ ...complete, status: "APROVADO" }));
  expect(screen.queryByText("Pagamento aprovado")).toBeNull();
  expect(screen.getByText("internal-2")).toBeTruthy();
  await tick();
  expect(service.status).toHaveBeenLastCalledWith("internal-2", expect.any(AbortSignal));
});

it("limpa timer ao gerar novamente e ao desmontar", async () => {
  const { unmount } = render(<MercadoPagoPixPoc />);
  await generate();
  await tick(2000);
  await generate();
  await tick(500);
  expect(service.status).not.toHaveBeenCalled();
  unmount();
  await tick(10000);
  expect(service.status).not.toHaveBeenCalled();
});

it("aborta consulta em andamento ao desmontar e não reagenda", async () => {
  const status = deferred<MercadoPagoPix>();
  vi.mocked(service.status).mockReturnValue(status.promise);
  const { unmount } = render(<MercadoPagoPixPoc />);
  await generate();
  await tick();
  const signal = vi.mocked(service.status).mock.calls[0][1]!;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => status.resolve(pending));
  await tick(10000);
  expect(service.status).toHaveBeenCalledTimes(1);
});

it("copia apenas copiaCola e trata falha de clipboard", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  vi.mocked(service.create).mockResolvedValue(complete);
  render(<MercadoPagoPixPoc />);
  await generate();
  fireEvent.click(screen.getByRole("button", { name: "Copiar código PIX" }));
  await flush();
  expect(writeText).toHaveBeenCalledWith("000201-PIX-TEST");
  expect(screen.getByText("Código PIX copiado")).toBeTruthy();
  writeText.mockRejectedValue(new Error("denied"));
  fireEvent.click(screen.getByRole("button", { name: "Copiar código PIX" }));
  await flush();
  expect(screen.getByText(/Selecione e copie o código manualmente/)).toBeTruthy();
  expect(screen.getByRole("img")).toBeTruthy();
});
