import React, { useState } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AddBalanceModal } from "./AddBalanceModal";
import { useWalletPixStatus } from "@/hooks/useWalletPixStatus";
import { walletService } from "@/services/walletService";
import { ApiError } from "@/services/apiClient";
import type { WalletPix } from "@/types/wallet";

vi.mock("@/services/walletService", () => ({ walletService: { createPix: vi.fn(), getPix: vi.fn() } }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ refreshWallet: refresh }) }));
const refresh = vi.fn<() => Promise<boolean>>();
const charge: WalletPix = { id: 10, valor: "10.00", status: "PENDENTE", idPagamentoExterno: null, qrCode: "YQ==", pixCopiaCola: "original-pix", expiracao: null, criadoEm: "", atualizadoEm: "", aprovadoEm: null };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { resolve, promise };
}
beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockReset().mockResolvedValue(true);
  vi.mocked(walletService.createPix).mockReset().mockResolvedValue(charge);
  vi.mocked(walletService.getPix).mockReset().mockResolvedValue(charge);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
async function advance(ms = 4000) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
async function open() {
  function Host() {
    const [opened, setOpened] = useState(true);
    return opened ? <AddBalanceModal close={() => setOpened(false)} /> : null;
  }
  const ui = render(<Host />);
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Valor da recarga"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Gerar Pix"));
  });
  return ui;
}
it("PENDENTE aguarda 4 segundos e PROCESSANDO continua apenas com GET", async () => {
  vi.mocked(walletService.getPix).mockResolvedValue({ ...charge, status: "PROCESSANDO" });
  await open();
  await advance(3999); expect(walletService.getPix).not.toHaveBeenCalled();
  await advance(1); expect(screen.getByText("Pagamento em processamento")).toBeTruthy();
  await advance(); expect(walletService.getPix).toHaveBeenCalledTimes(2);
  expect(walletService.createPix).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
});
it("nunca sobrepõe GET e conta intervalo após a conclusão", async () => {
  const result = deferred<WalletPix>();
  vi.mocked(walletService.getPix).mockReturnValueOnce(result.promise);
  await open(); await advance(); await advance(20000);
  expect(walletService.getPix).toHaveBeenCalledTimes(1);
  await act(async () => result.resolve(charge));
  await advance(3999); expect(walletService.getPix).toHaveBeenCalledTimes(1);
  await advance(1); expect(walletService.getPix).toHaveBeenCalledTimes(2);
});
it.each(["APROVADA", "REJEITADA", "CANCELADA", "EXPIRADA", "REEMBOLSADA"] as const)("encerra polling em %s", async (status) => {
  vi.mocked(walletService.getPix).mockResolvedValue({ ...charge, status });
  await open(); await advance(); await advance(20000);
  expect(walletService.getPix).toHaveBeenCalledTimes(1);
  expect(refresh).toHaveBeenCalledTimes(status === "APROVADA" ? 1 : 0);
  if (status === "APROVADA") {
    expect(screen.getByText("Saldo adicionado à sua carteira")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  }
});
it("APROVADA no POST confirma e atualiza sem GET de recarga", async () => {
  vi.mocked(walletService.createPix).mockResolvedValue({ ...charge, status: "APROVADA" });
  await open(); await advance(20000);
  expect(screen.getByText("Pagamento confirmado")).toBeTruthy();
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(walletService.getPix).not.toHaveBeenCalled();
});
it.each(["close", "unmount"])("%s cancela request e ignora aprovação atrasada", async (action) => {
  const result = deferred<WalletPix>();
  vi.mocked(walletService.getPix).mockReturnValue(result.promise);
  const ui = await open(); await advance();
  const signal = vi.mocked(walletService.getPix).mock.calls[0][1];
  if (action === "close") fireEvent.click(screen.getByLabelText("Fechar")); else ui.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => result.resolve({ ...charge, status: "APROVADA" }));
  await advance(20000);
  expect(refresh).not.toHaveBeenCalled();
  expect(walletService.getPix).toHaveBeenCalledTimes(1);
});
it("fechar antes do primeiro GET cancela timer", async () => {
  await open(); fireEvent.click(screen.getByLabelText("Fechar")); await advance(20000);
  expect(walletService.getPix).not.toHaveBeenCalled();
});
it("erro temporário/persistente preserva QR e status e retoma após intervalo", async () => {
  vi.mocked(walletService.getPix).mockRejectedValueOnce(new Error("private")).mockRejectedValueOnce(new Error("private"));
  await open(); await advance();
  expect(screen.getByText("Aguardando pagamento")).toBeTruthy();
  expect(screen.getByAltText("QR Code para pagamento Pix")).toBeTruthy();
  expect((screen.getByLabelText("Pix copia e cola") as HTMLTextAreaElement).value).toBe("original-pix");
  expect(screen.getByText(/Tentaremos novamente/)).toBeTruthy();
  await advance(); await advance();
  expect(screen.queryByText(/Tentaremos novamente/)).toBeNull();
  expect(walletService.createPix).toHaveBeenCalledTimes(1);
});
it.each([false, "reject"])("falha no refresh (%s) mantém sucesso e permite retry", async (result) => {
  if (result === false) refresh.mockResolvedValueOnce(false); else refresh.mockRejectedValueOnce(new Error("private"));
  vi.mocked(walletService.getPix).mockResolvedValue({ ...charge, status: "APROVADA" });
  await open(); await advance();
  expect(screen.getByText("Saldo adicionado à sua carteira")).toBeTruthy();
  expect(screen.getByText("Pagamento confirmado. Não foi possível atualizar o saldo agora.")).toBeTruthy();
  await act(async () => fireEvent.click(screen.getByText("Tentar atualizar saldo")));
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/Não foi possível atualizar o saldo agora/)).toBeNull();
  await advance(20000); expect(walletService.getPix).toHaveBeenCalledTimes(1);
});
it("ignora resposta da tentativa anterior após mudar a ativa", async () => {
  const result = deferred<WalletPix>();
  vi.mocked(walletService.getPix).mockReturnValueOnce(result.promise);
  const hook = renderHook(({ initial }) => useWalletPixStatus(initial), { initialProps: { initial: charge } });
  await advance();
  const next = { ...charge, id: 11 };
  hook.rerender({ initial: next });
  await act(async () => result.resolve({ ...charge, status: "APROVADA" }));
  expect(hook.result.current.charge?.id).toBe(11);
  expect(hook.result.current.charge?.status).toBe("PENDENTE");
  expect(refresh).not.toHaveBeenCalled();
});
it.each([401, 403])("erro de autenticação %s encerra consultas", async (code) => {
  vi.mocked(walletService.getPix).mockRejectedValue(new ApiError(code));
  await open(); await advance(); await advance(20000);
  expect(walletService.getPix).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Sua sessão não está disponível/)).toBeTruthy();
});
