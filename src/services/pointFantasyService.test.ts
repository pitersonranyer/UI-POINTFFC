import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { filterFantasyAthletes, loadFantasyCatalog, loadFantasyPages, sortFantasyCatalogs } from "./pointFantasyService";
import { emptyAthleteFilters } from "@/types/pointFantasy";
import type { PointFantasyAthlete, PointFantasyCatalog } from "@/types/pointFantasy";
vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
export const athlete = (id: number, extra: Partial<PointFantasyAthlete> = {}): PointFantasyAthlete => ({ id, catalogoId: 3, atletaIdExterno: id, clubeIdExterno: 262, posicaoId: 5, statusId: 7, apelido: `Atleta ${id}`, precoCartola: "9.00", categoriaId: 2, pointcoins: 77, ...extra });
describe("Point Fantasy API", () => {
  it("loads every page using only supported query parameters", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ items: [athlete(1), athlete(2)], total: 3, page: 1, limit: 2 }).mockResolvedValueOnce({ items: [athlete(3)], total: 3, page: 2, limit: 2 });
    expect(await loadFantasyPages("/example", new AbortController().signal)).toHaveLength(3);
    expect(apiFetch).toHaveBeenLastCalledWith("/example?page=2&limit=100", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
  it("supports an empty catalog", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 100 });
    expect(await loadFantasyPages("/example", new AbortController().signal)).toEqual([]);
  });
  it.each([
    { items: [], total: 3, page: 1, limit: 2 },
    { items: [{ id: 1 }, { id: 1 }], total: 2, page: 1, limit: 2 },
    { items: [], total: 0, page: 2, limit: 100 },
  ])("rejects incomplete, duplicated or invalid pages: %j", async response => {
    vi.mocked(apiFetch).mockResolvedValueOnce(response);
    await expect(loadFantasyPages("/example", new AbortController().signal)).rejects.toThrow();
  });
  it("does not return partial success when a later request fails", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ items: [{ id: 1 }], total: 2, page: 1, limit: 1 }).mockRejectedValueOnce(new Error("HTTP 503"));
    await expect(loadFantasyPages("/example", new AbortController().signal)).rejects.toThrow("HTTP 503");
  });
  it("cancels before requesting another page", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(loadFantasyPages("/example", controller.signal)).rejects.toThrow();
    expect(apiFetch).not.toHaveBeenCalled();
  });
  it("rejects mixed catalogs", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ items: [athlete(1, { catalogoId: 99 })], total: 1, page: 1, limit: 100 }).mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [] });
    await expect(loadFantasyCatalog(3, new AbortController().signal)).rejects.toThrow("inconsistente");
  });
  it("sorts by season, round, version and ID without mutating input", () => {
    const input = [{ id: 1, temporada: 2026, rodada: 31, versao: 1 }, { id: 2, temporada: 2026, rodada: 31, versao: 2 }, { id: 3, temporada: 2027, rodada: 1, versao: 1 }] as PointFantasyCatalog[];
    expect(sortFantasyCatalogs(input).map(c => c.id)).toEqual([3, 2, 1]);
    expect(input[0].id).toBe(1);
  });
  it("searches the complete list with accent normalization and combines all filters", () => {
    const items = [...Array.from({ length: 100 }, (_, i) => athlete(i)), athlete(101, { apelido: "João Silva", clubeIdExterno: 284, posicaoId: 4, categoriaId: 3 })];
    expect(filterFantasyAthletes(items, { ...emptyAthleteFilters, search: " joao ", club: "284", position: "4", category: "3" }).map(a => a.id)).toEqual([101]);
    expect(filterFantasyAthletes(items, { ...emptyAthleteFilters, search: "inexistente" })).toEqual([]);
  });
  it("includes coaches independently of category and supports hiding them", () => {
    const coach = athlete(1, { posicaoId: 6, categoriaId: null });
    expect(filterFantasyAthletes([coach], emptyAthleteFilters)).toEqual([coach]);
    expect(filterFantasyAthletes([coach], { ...emptyAthleteFilters, coaches: false })).toEqual([]);
    expect(filterFantasyAthletes([coach], { ...emptyAthleteFilters, category: "1" })).toEqual([]);
  });
});
