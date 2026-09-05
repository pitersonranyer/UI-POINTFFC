import { apiFetch } from "@/services/apiClient";
import type { PartialScoresResponse, PreviousRoundUpdate, TeamPartialScore } from "@/types/partial-score";

export const PARTIAL_SCORE_CHUNK_SIZE = 100;
const cache = new Map<string, Promise<TeamPartialScore[]>>();
const previousRoundUpdates = new Map<number, Promise<PreviousRoundUpdate>>();

export function chunkTeamIds(ids: number[], size = PARTIAL_SCORE_CHUNK_SIZE): number[][] {
  const unique = [...new Set(ids.filter(Number.isFinite))];
  return Array.from({ length: Math.ceil(unique.length / size) }, (_, index) => unique.slice(index * size, (index + 1) * size));
}

const cacheKey = (season: number, round: number, ids: number[]) => `${season}:${round}:${[...ids].sort((a, b) => a - b).join(",")}`;

async function fetchChunk(season: number, round: number, ids: number[]) {
  const params = new URLSearchParams({ temporada: String(season), rodada: String(round), timeIds: ids.join(",") });
  const response = await apiFetch<PartialScoresResponse>(`/parciais?${params}`, { authenticated: true });
  return response.parciais;
}

export const partialScoreService = {
  async buscarParcialTime(temporada: number, rodada: number, timeId: number): Promise<TeamPartialScore | undefined> {
    return (await fetchChunk(temporada, rodada, [timeId])).find((team) => team.timeId === timeId);
  },
  atualizarRodadaAnterior(temporada: number): Promise<PreviousRoundUpdate> {
    const current = previousRoundUpdates.get(temporada);
    if (current) return current;
    const params = new URLSearchParams({ temporada: String(temporada) });
    const request = apiFetch<PreviousRoundUpdate>(`/parciais/atualizar-rodada-anterior?${params}`, { method: "POST", authenticated: true }).finally(() => previousRoundUpdates.delete(temporada));
    previousRoundUpdates.set(temporada, request);
    return request;
  },
  async buscarParciais(temporada: number, rodada: number, timeIds: number[]): Promise<TeamPartialScore[]> {
    if (!timeIds.length) return [];
    const key = cacheKey(temporada, rodada, timeIds);
    const existing = cache.get(key);
    if (existing) return existing;
    const request = Promise.all(chunkTeamIds(timeIds).map((ids) => fetchChunk(temporada, rodada, ids))).then((chunks) => chunks.flat());
    cache.set(key, request);
    try { return await request; }
    catch (error) { cache.delete(key); throw error; }
  },
  clearCache() { cache.clear(); previousRoundUpdates.clear(); },
};
