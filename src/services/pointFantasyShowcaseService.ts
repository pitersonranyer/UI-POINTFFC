import { apiFetch } from "./apiClient";
import type { FantasyReference } from "@/types/pointFantasy";
import type { CompetitionDetail, FantasyMatch } from "@/types/pointFantasyLineup";

export interface FantasyShowcaseMatchups {
  partidas: FantasyMatch[];
  clubes: FantasyReference[];
}

export async function getFantasyShowcaseMatchups(competitionId: number, catalogId: number, signal: AbortSignal): Promise<FantasyShowcaseMatchups> {
  const competition = await apiFetch<CompetitionDetail>(`/point-fantasy/competicoes/${competitionId}`, { signal, cache: "no-store" });
  if (competition.id !== competitionId || competition.catalogoId !== catalogId || !Array.isArray(competition.partidas)) {
    throw new Error("A resposta da competição está incompleta. Tente novamente.");
  }
  const partidas = competition.partidas.filter(match => match.competicaoId === competitionId);
  if (!partidas.length) return { partidas, clubes: [] };
  const response = await apiFetch<{ items: FantasyReference[] }>(`/point-fantasy/catalogos/${catalogId}/clubes`, { signal, cache: "no-store" });
  return { partidas, clubes: Array.isArray(response?.items) ? response.items : [] };
}
