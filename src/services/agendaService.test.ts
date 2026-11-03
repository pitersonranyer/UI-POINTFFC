import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./apiClient";
import { createAgendaLoader, UnsupportedAgendaSeason } from "./agendaService";
import fixture from "@/components/matches/__fixtures__/agenda-2026.json";

vi.mock("./apiClient", async importOriginal => ({ ...await importOriginal<typeof import("./apiClient")>(), apiFetch: vi.fn() }));
beforeEach(() => { vi.mocked(apiFetch).mockResolvedValue(structuredClone(fixture)); });

it("deduplicates the automatic request and caches the returned round", async () => {
  const load = createAgendaLoader(2026);
  const [first, concurrent] = await Promise.all([load(), load()]);
  expect(first).toBe(concurrent);
  await load(first.rodada);
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(apiFetch).toHaveBeenCalledWith("/fantasy/agenda?temporada=2026");
});
it("requests a selected round and retries failures without caching the error", async () => {
  vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError(503, "Serviço indisponível")).mockResolvedValueOnce({ ...fixture, rodada: 5 });
  const load = createAgendaLoader(2026);
  await expect(load(5)).rejects.toThrow("Serviço indisponível");
  expect((await load(5)).rodada).toBe(5);
  await load(5);
  expect(apiFetch).toHaveBeenCalledTimes(2);
  expect(apiFetch).toHaveBeenLastCalledWith("/fantasy/agenda?temporada=2026&rodada=5");
});
it("handles the unsupported-season 404 and a mismatched response season", async () => {
  vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError(404, "Temporada não suportada"));
  await expect(createAgendaLoader(1900)()).rejects.toBeInstanceOf(UnsupportedAgendaSeason);
  vi.mocked(apiFetch).mockResolvedValueOnce({ ...fixture, temporada: 2025 });
  await expect(createAgendaLoader(2026)()).rejects.toBeInstanceOf(UnsupportedAgendaSeason);
});
it("rejects incompatible providers, impossible rounds and a response for another round", async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ ...fixture, fornecedor: "CARTOLA" }).mockResolvedValueOnce({ ...fixture, rodada: 39 }).mockResolvedValueOnce(fixture);
  await expect(createAgendaLoader(2026)()).rejects.toThrow("incompatível");
  await expect(createAgendaLoader(2026)()).rejects.toThrow("incompatível");
  await expect(createAgendaLoader(2026)(1)).rejects.toThrow("incompatível");
  await expect(createAgendaLoader(2026)(0)).rejects.toThrow("Rodada inválida");
});
