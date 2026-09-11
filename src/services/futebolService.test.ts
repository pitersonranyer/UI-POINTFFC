import { expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { buscarRodadaAtualBsa } from "./futebolService";
vi.mock("./apiClient", () => ({ apiFetch: vi.fn().mockResolvedValue({ jogos: [] }) }));
it("consulta somente a rota interna BSA pelo client existente", async () => {
  await buscarRodadaAtualBsa();
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(apiFetch).toHaveBeenCalledWith("/futebol/competicoes/BSA/rodada-atual", { cache: "no-store" });
});
