import { expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { buscarRodadaAtualBsa, buscarJogosHoje } from "./futebolService";
vi.mock("./apiClient", () => ({ apiFetch: vi.fn().mockResolvedValue({ jogos: [] }) }));
it("consulta somente a rota interna BSA pelo client existente", async () => {
  await buscarRodadaAtualBsa();
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(apiFetch).toHaveBeenCalledWith("/futebol/competicoes/BSA/rodada-atual", { cache: "no-store" });
});
it("jogos de hoje consulta exclusivamente o endpoint interno, sem football-data.org", async () => {
  await buscarJogosHoje();
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(apiFetch).toHaveBeenCalledWith("/futebol/jogos/hoje", { cache: "no-store" });
});
