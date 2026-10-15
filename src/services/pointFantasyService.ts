import { apiFetch } from "./apiClient";
import type { AthleteFilters, FantasyCatalogData, FantasyPage, FantasyReference, PointFantasyAthlete, PointFantasyCatalog } from "@/types/pointFantasy";

// The current DTO only accepts page and limit. Never filter a partial catalog.
export async function loadFantasyPages<T extends { id: number }>(path: string, signal: AbortSignal, options: { authenticated?: boolean; preserveSessionOnForbidden?: boolean } = {}): Promise<T[]> {
  const items: T[] = [];
  let expectedTotal: number | undefined;
  for (let page = 1; ; page++) {
    signal.throwIfAborted();
    const result = await apiFetch<FantasyPage<T>>(`${path}?page=${page}&limit=100`, { ...options, signal });
    signal.throwIfAborted();
    if (!result || !Array.isArray(result.items) || result.page !== page || !Number.isInteger(result.total)
      || result.total < 0 || !Number.isInteger(result.limit) || result.limit < 1 || result.limit > 100
      || result.items.length > result.limit || (expectedTotal !== undefined && expectedTotal !== result.total)) {
      throw new Error("O catálogo mudou ou retornou uma paginação inválida. Recarregue os dados.");
    }
    expectedTotal = result.total;
    items.push(...result.items);
    if (new Set(items.map(item => item.id)).size !== items.length || items.length > result.total) {
      throw new Error("O catálogo retornou registros duplicados ou inconsistentes.");
    }
    if (items.length === result.total) return items;
    if (result.items.length !== result.limit) throw new Error("O catálogo retornou uma página incompleta.");
  }
}
export function sortFantasyCatalogs(catalogs: PointFantasyCatalog[]) {
  return [...catalogs].sort((a, b) => b.temporada - a.temporada || b.rodada - a.rodada || b.versao - a.versao || b.id - a.id);
}
export async function loadFantasyCatalog(id: number, signal: AbortSignal): Promise<FantasyCatalogData> {
  const path = `/point-fantasy/catalogos/${id}`;
  const [athletes, clubs, positions] = await Promise.all([
    loadFantasyPages<PointFantasyAthlete>(`${path}/atletas`, signal),
    apiFetch<{ items: FantasyReference[] }>(`${path}/clubes`, { signal }),
    apiFetch<{ items: FantasyReference[] }>(`${path}/posicoes`, { signal }),
  ]);
  if (athletes.some(a => a.catalogoId !== id) || !Array.isArray(clubs?.items) || !Array.isArray(positions?.items)) {
    throw new Error("Resposta de catálogo inconsistente.");
  }
  return { athletes, clubs: clubs.items, positions: positions.items };
}
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
export function filterFantasyAthletes(athletes: PointFantasyAthlete[], filters: AthleteFilters) {
  const search = normalize(filters.search.trim());
  return athletes.filter(a => normalize(a.apelido).includes(search)
    && (!filters.club || a.clubeIdExterno === Number(filters.club))
    && (!filters.position || a.posicaoId === Number(filters.position))
    && (!filters.category || (a.posicaoId !== 6 && a.categoriaId === Number(filters.category)))
    && (filters.coaches || a.posicaoId !== 6));
}
