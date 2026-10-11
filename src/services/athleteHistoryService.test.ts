import { expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { fetchAthleteHistory } from "./athleteHistoryService";
vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
it("deduplica consultas em andamento e permite consultar novamente ao concluir", async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(apiFetch).mockReturnValueOnce(new Promise(r => { resolve = r; }));
  const first = fetchAthleteHistory("63008", 2025, 28, 10);
  expect(fetchAthleteHistory("63008", 2025, 28, 10)).toBe(first);
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(apiFetch).toHaveBeenCalledWith("/cartola/atletas/63008/historico?temporada=2025&rodadaReferencia=28&limite=10", expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }));
  resolve({}); await first;
  vi.mocked(apiFetch).mockResolvedValueOnce({});
  await fetchAthleteHistory("63008", 2025, 28, 10);
  expect(apiFetch).toHaveBeenCalledTimes(2);
});
