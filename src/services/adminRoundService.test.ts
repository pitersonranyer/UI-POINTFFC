import { expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { partialScoreService } from "./partialScoreService";
import { reprocessPartials, simulateReconsolidation, validRound } from "./adminRoundService";
vi.mock("./apiClient", async (original) => ({ ...await original<object>(), apiFetch: vi.fn() }));
it("consulta simulação autenticada sem POST ou invalidação de cache", async () => {
  const clear = vi.spyOn(partialScoreService, "clearCache");
  vi.mocked(apiFetch).mockResolvedValue({ temporada: 2025, rodada: 38 });
  await simulateReconsolidation(2025, 38);
  expect(apiFetch).toHaveBeenCalledWith("/admin/rodadas/38/simular-reconsolidacao?temporada=2025", { method: "GET", authenticated: true, preserveSessionOnForbidden: true });
  expect(clear).not.toHaveBeenCalled();
});
it("rejeita seleção inválida antes da simulação", async () => {
  await expect(simulateReconsolidation(2026, 39)).rejects.toThrow(RangeError);
  expect(apiFetch).not.toHaveBeenCalled();
});
it.each([[2026, 26], [2025, 1], [2025, 38]])("envia POST autenticado para %s/%s sem body e invalida cache após sucesso", async (season, round) => {
  const clear = vi.spyOn(partialScoreService, "clearCache");
  vi.mocked(apiFetch).mockResolvedValue({ status: "PARCIAL" });
  await reprocessPartials(season, round);
  expect(apiFetch).toHaveBeenCalledWith(`/admin/rodadas/${round}/reprocessar-parciais?temporada=${season}`, { method: "POST", authenticated: true, preserveSessionOnForbidden: true });
  expect(clear).toHaveBeenCalledOnce();
});
it.each([[2026, 0], [2026, 39], [0, 26], [65536, 26], [2026, 1.5]])("rejeita parâmetros inválidos %s %s", async (season, round) => {
  expect(validRound(season, round)).toBe(false);
  await expect(reprocessPartials(season, round)).rejects.toThrow();
  expect(apiFetch).not.toHaveBeenCalled();
});
