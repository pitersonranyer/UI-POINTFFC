import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { walletService } from "./walletService";
vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
it("consulta recarga somente por GET autenticado", async () => {
  const signal = new AbortController().signal;
  await walletService.getPix(7, signal);
  expect(apiFetch).toHaveBeenCalledWith("/carteira/recargas/7", {
    method: "GET", authenticated: true, cache: "no-store", signal,
  });
});
it("envia POST autenticado com chave e somente valor textual", async () => {
  await walletService.createPix("10.50", "test-idempotency-key");
  expect(apiFetch).toHaveBeenCalledWith("/carteira/recargas/pix", {
    method: "POST", authenticated: true, headers: { "Idempotency-Key": "test-idempotency-key" },
    body: '{"valor":"10.50"}', signal: undefined,
  });
});
beforeEach(() => vi.mocked(apiFetch).mockReset());
it("consulta carteira autenticada sem identidade no request", async () => {
  const result = { saldoDisponivel: "0.00", saldoBloqueado: "10.00", status: "ATIVA" };
  vi.mocked(apiFetch).mockResolvedValue(result);
  const signal = new AbortController().signal;
  expect(await walletService.getWallet(signal)).toEqual(result);
  expect(apiFetch).toHaveBeenCalledWith("/carteira", { authenticated: true, cache: "no-store", signal });
});
it.each([null, { saldoDisponivel: 10, saldoBloqueado: "0.00", status: "ATIVA" }, { saldoDisponivel: "0.00", saldoBloqueado: "0.00", status: "UNKNOWN" }])("rejeita resposta inválida %j", async (result) => {
  vi.mocked(apiFetch).mockResolvedValue(result);
  await expect(walletService.getWallet()).rejects.toThrow();
});
