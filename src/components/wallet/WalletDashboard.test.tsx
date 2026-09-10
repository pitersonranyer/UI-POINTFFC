import React, { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import { walletService } from "@/services/walletService";
import { WalletDashboard } from "./WalletDashboard";
import { formatWalletCurrency } from "@/lib/format";
import type { Wallet } from "@/types/wallet";
import type { WalletPix } from "@/types/wallet";

let identity: string | null = "one";
let authLoading = false;
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({
  user: identity ? { idUsuario: identity } : null, firebaseUser: identity ? { uid: identity } : null,
  isAuthenticated: !!identity, isLoading: authLoading,
}) }));
vi.mock("@/services/walletService", () => ({ walletService: { getWallet: vi.fn(), createPix: vi.fn(), getPix: vi.fn() } }));
const zero: Wallet = { saldoDisponivel: "0.00", saldoBloqueado: "0.00", status: "ATIVA" };
const positive: Wallet = { ...zero, saldoDisponivel: "1234.56" };
function Refresh() {
  const { refreshWallet, wallet } = useWallet();
  return <><button onClick={() => { void refreshWallet(); void refreshWallet(); }}>Atualizar</button><output data-testid="wallet">{wallet?.saldoDisponivel ?? "ausente"}</output></>;
}
const view = () => <StrictMode><WalletProvider><WalletDashboard /><Refresh /></WalletProvider></StrictMode>;
function pending() {
  let resolve!: (wallet: Wallet) => void;
  const promise = new Promise<Wallet>((done) => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => { identity = "one"; authLoading = false; vi.mocked(walletService.getWallet).mockReset().mockResolvedValue(zero); });
afterEach(cleanup);
it("carrega resposta oficial uma vez e distingue zero real", async () => {
  render(view());
  expect(screen.getByText("Carregando saldo...")).toBeTruthy();
  expect(screen.queryByText(/R\$\s*0,00/)).toBeNull();
  await waitFor(() => expect(screen.getAllByText(/R\$\s*0,00/)).toHaveLength(2));
  expect(walletService.getWallet).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("wallet").textContent).toBe("0.00");
  expect(screen.queryByText(/125,00/)).toBeNull();
  expect((screen.getByRole("button", { name: "Adicionar saldo" }) as HTMLButtonElement).disabled).toBe(false);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar saldo" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
});
it("exibe positivo e saldo bloqueado, sem float", async () => {
  vi.mocked(walletService.getWallet).mockResolvedValue({ ...positive, saldoBloqueado: "10.99", status: "BLOQUEADA" });
  render(view());
  expect(await screen.findByText(/R\$\s*1\.234,56/)).toBeTruthy();
  expect(screen.getByText(/R\$\s*10,99/)).toBeTruthy();
  expect(screen.getByText("Carteira bloqueada")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar saldo" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(formatWalletCurrency("9999999999.99")).toBe("R$\u00a09.999.999.999,99");
});
it("erro amigável não vira zero e permite retry", async () => {
  vi.mocked(walletService.getWallet).mockRejectedValueOnce(new Error("private stack"));
  render(view());
  await screen.findByText("Não foi possível carregar seu saldo.");
  expect(screen.queryByText(/R\$/)).toBeNull();
  expect(screen.queryByText(/private/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(screen.getAllByText(/R\$\s*0,00/)).toHaveLength(2));
  expect(walletService.getWallet).toHaveBeenCalledTimes(2);
});
it("refresh atualiza a carteira e deduplica chamadas simultâneas", async () => {
  render(view());
  await waitFor(() => expect(screen.getByTestId("wallet").textContent).toBe("0.00"));
  vi.mocked(walletService.getWallet).mockResolvedValue(positive);
  fireEvent.click(screen.getByText("Atualizar"));
  await screen.findByText(/R\$\s*1\.234,56/);
  expect(walletService.getWallet).toHaveBeenCalledTimes(2);
});
it("logout limpa saldo e não consulta sem autenticação", async () => {
  vi.mocked(walletService.getWallet).mockResolvedValue(positive);
  const ui = render(view());
  await screen.findByText(/R\$\s*1\.234,56/);
  identity = null; ui.rerender(view());
  expect(screen.getByTestId("wallet").textContent).toBe("ausente");
  expect(screen.queryByText(/1\.234,56/)).toBeNull();
  expect(walletService.getWallet).toHaveBeenCalledTimes(1);
});
it("troca usuário limpa imediatamente e ignora resposta atrasada", async () => {
  const old = pending(), next = pending();
  vi.mocked(walletService.getWallet).mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const ui = render(view());
  await waitFor(() => expect(walletService.getWallet).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(walletService.getWallet).mock.calls[0][0];
  identity = "two"; ui.rerender(view());
  expect(screen.getByTestId("wallet").textContent).toBe("ausente");
  expect(signal?.aborted).toBe(true);
  await waitFor(() => expect(walletService.getWallet).toHaveBeenCalledTimes(2));
  await act(async () => old.resolve(positive));
  expect(screen.queryByText(/1\.234,56/)).toBeNull();
  await act(async () => next.resolve(zero));
  expect(screen.getByTestId("wallet").textContent).toBe("0.00");
});
it("troca de usuário remove saldo já carregado antes da próxima resposta", async () => {
  vi.mocked(walletService.getWallet).mockResolvedValueOnce(positive);
  const ui = render(view());
  await screen.findByText(/1\.234,56/);
  const next = pending();
  vi.mocked(walletService.getWallet).mockReturnValue(next.promise);
  identity = "two"; ui.rerender(view());
  expect(screen.queryByText(/1\.234,56/)).toBeNull();
  expect(screen.getByText("Carregando saldo...")).toBeTruthy();
  await act(async () => next.resolve(zero));
  expect(screen.getByTestId("wallet").textContent).toBe("0.00");
});
it("aguarda autenticação e cancela consulta ao desmontar", async () => {
  const next = pending();
  vi.mocked(walletService.getWallet).mockReturnValue(next.promise);
  authLoading = true;
  const ui = render(view());
  expect(walletService.getWallet).not.toHaveBeenCalled();
  authLoading = false; ui.rerender(view());
  await waitFor(() => expect(walletService.getWallet).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(walletService.getWallet).mock.calls[0][0];
  ui.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => next.resolve(positive));
});

const approvedPix: WalletPix = { id: 1, valor: "10.00", status: "APROVADA", idPagamentoExterno: null, pixCopiaCola: null, qrCode: null, expiracao: null, criadoEm: "", atualizadoEm: "", aprovadoEm: null };
it("mantém modal aprovado aberto durante refresh real e falha do saldo", async () => {
  let fail!: (error: Error) => void;
  const result = new Promise<Wallet>((_, reject) => { fail = reject; });
  vi.mocked(walletService.getWallet).mockResolvedValueOnce(zero).mockReturnValueOnce(result);
  vi.mocked(walletService.createPix).mockResolvedValueOnce(approvedPix);
  render(view());
  await waitFor(() => expect(screen.getByTestId("wallet").textContent).toBe("0.00"));
  fireEvent.click(screen.getByRole("button", { name: "Adicionar saldo" }));
  fireEvent.change(screen.getByLabelText("Valor da recarga"), { target: { value: "10" } });
  fireEvent.click(screen.getByText("Gerar Pix"));
  await screen.findByText("Saldo adicionado à sua carteira");
  expect(screen.getByText("Carregando saldo...")).toBeTruthy();
  expect(walletService.getWallet).toHaveBeenCalledTimes(2);
  await act(async () => fail(new Error("offline")));
  await screen.findByText("Não foi possível carregar seu saldo.");
  expect(screen.getByText("Pagamento confirmado. Não foi possível atualizar o saldo agora.")).toBeTruthy();
  expect(screen.getByText("Saldo adicionado à sua carteira")).toBeTruthy();
  expect(screen.getByRole("dialog")).toBeTruthy();
});
it("logout desmonta modal e cancela polling em andamento", async () => {
  vi.mocked(walletService.createPix).mockResolvedValueOnce({ ...approvedPix, status: "PENDENTE" });
  vi.mocked(walletService.getPix).mockReturnValueOnce(new Promise(() => {}));
  const ui = render(view());
  await waitFor(() => expect(screen.getByTestId("wallet").textContent).toBe("0.00"));
  fireEvent.click(screen.getByRole("button", { name: "Adicionar saldo" }));
  fireEvent.change(screen.getByLabelText("Valor da recarga"), { target: { value: "10" } });
  vi.useFakeTimers();
  try {
    await act(async () => fireEvent.click(screen.getByText("Gerar Pix")));
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    const calls = vi.mocked(walletService.getPix).mock.calls;
    const signal = calls[calls.length - 1]?.[1];
    identity = null; ui.rerender(view());
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(signal?.aborted).toBe(true);
  } finally { vi.useRealTimers(); }
});
