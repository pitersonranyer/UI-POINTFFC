import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AddBalanceModal, normalizePixValue } from "./AddBalanceModal";
import { walletService } from "@/services/walletService";
import type { WalletPix } from "@/types/wallet";
vi.mock("@/services/walletService", () => ({ walletService: { createPix: vi.fn() } }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ refreshWallet: refresh }) }));
const refresh = vi.fn().mockResolvedValue(true);
const charge: WalletPix = { id: 1, valor: "10.50", status: "PENDENTE", idPagamentoExterno: "private-order", pixCopiaCola: "pix-code", qrCode: "aGVsbG8=", expiracao: "2020-01-01T12:00:00Z", criadoEm: "", atualizadoEm: "", aprovadoEm: null };
const copy = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  vi.mocked(walletService.createPix).mockReset().mockResolvedValue(charge);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
function submit() {
  fireEvent.change(screen.getByLabelText("Valor da recarga"), { target: { value: "10,50" } });
  fireEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));
}
it.each([["10", "10.00"], ["10,50", "10.50"], ["25,00", "25.00"], ["1,5", "1.50"], ["0001", "1.00"], ["9999999999,99", "9999999999.99"], ["0,99", null], ["-1", null], ["1,001", null], ["1e3", null], ["", null]])("normaliza %s sem float", (raw, expected) => {
  expect(normalizePixValue(raw)).toBe(expected);
});
it("bloqueia duplo clique e mantém chave/valor no retry", async () => {
  let reject!: (reason: Error) => void;
  vi.mocked(walletService.createPix).mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
  render(<AddBalanceModal close={vi.fn()} />);
  submit();
  fireEvent.submit(screen.getByLabelText("Valor da recarga").closest("form")!);
  expect(walletService.createPix).toHaveBeenCalledTimes(1);
  const first = vi.mocked(walletService.createPix).mock.calls[0];
  expect(first[0]).toBe("10.50");
  expect(first[1]).toMatch(/^[a-zA-Z0-9_-]{16,128}$/);
  await act(async () => reject(new Error("private stack")));
  expect(screen.queryByText(/private stack/)).toBeNull();
  expect((screen.getByLabelText("Valor da recarga") as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Pix gerado");
  const second = vi.mocked(walletService.createPix).mock.calls[1];
  expect(second.slice(0, 2)).toEqual(first.slice(0, 2));
});
it("renderiza QR base64, copia código e limpa feedback temporário", async () => {
  render(<AddBalanceModal close={vi.fn()} />);
  submit();
  await screen.findByText("Pix gerado");
  expect(screen.getByAltText("QR Code para pagamento Pix").getAttribute("src")).toBe("data:image/png;base64,aGVsbG8=");
  expect((screen.getByLabelText("Pix copia e cola") as HTMLTextAreaElement).value).toBe("pix-code");
  expect(screen.queryByText("private-order")).toBeNull();
  expect(screen.getByText("Aguardando pagamento")).toBeTruthy();
  expect(screen.getByText(/Expiração:/)).toBeTruthy();
  vi.useFakeTimers();
  await act(async () => fireEvent.click(screen.getByText("Copiar código Pix")));
  expect(copy).toHaveBeenCalledWith("pix-code");
  expect(screen.getByText("Copiado!")).toBeTruthy();
  act(() => vi.advanceTimersByTime(1800));
  expect(screen.queryByText("Copiado!")).toBeNull();
  expect(walletService.createPix).toHaveBeenCalledTimes(1);
});
it("trata dados Pix nulos sem imagem ou botão de cópia", async () => {
  vi.mocked(walletService.createPix).mockResolvedValue({ ...charge, qrCode: null, pixCopiaCola: null, expiracao: null });
  render(<AddBalanceModal close={vi.fn()} />);
  submit();
  await screen.findByText("QR Code indisponível no momento.");
  expect(screen.getByText("Código Pix indisponível no momento.")).toBeTruthy();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByText("Copiar código Pix")).toBeNull();
});
it.each([
  ["PENDENTE", "Aguardando pagamento"], ["PROCESSANDO", "Pagamento em processamento"],
  ["APROVADA", "Pagamento confirmado"], ["REJEITADA", "Pagamento rejeitado"],
  ["CANCELADA", "Pagamento cancelado"], ["EXPIRADA", "Pix expirado"], ["REEMBOLSADA", "Pagamento reembolsado"],
] as const)("apresenta status %s sem alterá-lo pela expiração", async (status, label) => {
  vi.mocked(walletService.createPix).mockResolvedValue({ ...charge, status });
  render(<AddBalanceModal close={vi.fn()} />); submit();
  expect(await screen.findByText(label)).toBeTruthy();
});
it("cancela request ao desmontar", async () => {
  vi.mocked(walletService.createPix).mockReturnValue(new Promise(() => {}));
  const ui = render(<AddBalanceModal close={vi.fn()} />); submit();
  await waitFor(() => expect(walletService.createPix).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(walletService.createPix).mock.calls[0][2];
  ui.unmount();
  expect(signal?.aborted).toBe(true);
});
