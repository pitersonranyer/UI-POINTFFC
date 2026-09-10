import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { walletService } from "./walletService";
vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
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
