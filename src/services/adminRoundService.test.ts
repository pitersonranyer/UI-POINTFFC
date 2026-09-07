import { expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { partialScoreService } from "./partialScoreService";
import { reprocessPartials, validRound } from "./adminRoundService";
vi.mock("./apiClient", async (original) => ({ ...await original<object>(), apiFetch: vi.fn() }));
it("envia POST autenticado sem body e invalida cache após sucesso", async () => {
  const clear = vi.spyOn(partialScoreService, "clearCache");
  vi.mocked(apiFetch).mockResolvedValue({ status: "PARCIAL" });
  await reprocessPartials(2026, 26);
  expect(apiFetch).toHaveBeenCalledWith("/admin/rodadas/26/reprocessar-parciais?temporada=2026", { method: "POST", authenticated: true, preserveSessionOnForbidden: true });
  expect(clear).toHaveBeenCalledOnce();
});
it.each([[2026, 0], [2026, 39], [0, 26], [65536, 26], [2026, 1.5]])("rejeita parâmetros inválidos %s %s", async (season, round) => {
  expect(validRound(season, round)).toBe(false);
  await expect(reprocessPartials(season, round)).rejects.toThrow();
  expect(apiFetch).not.toHaveBeenCalled();
});
