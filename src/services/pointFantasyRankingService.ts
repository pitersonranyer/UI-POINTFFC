import { apiFetch } from "./apiClient";
import type { FantasyCompetitionRanking } from "@/types/pointFantasyRanking";

export const RANKING_PAGE_SIZE = 50;
const positiveInteger = (value: number) => Number.isSafeInteger(value) && value > 0;

export async function getFantasyCompetitionRanking(competitionId: number, page: number, signal: AbortSignal): Promise<FantasyCompetitionRanking> {
  if (!positiveInteger(competitionId) || !positiveInteger(page)) throw new Error("Competição ou página inválida.");
  const result = await apiFetch<FantasyCompetitionRanking>(`/point-fantasy/competicoes/${competitionId}/ranking?page=${page}&limit=${RANKING_PAGE_SIZE}`, {
    authenticated: true, preserveSessionOnForbidden: true, cache: "no-store", signal,
  });
  signal.throwIfAborted();
  if (!result || result.competicaoId !== competitionId || result.page !== page || result.limit !== RANKING_PAGE_SIZE
    || !Number.isSafeInteger(result.total) || result.total < 0 || typeof result.estadoPontuacao !== "string"
    || !Array.isArray(result.items) || result.items.length > result.limit || result.items.length > result.total
    || new Set(result.items.map(item => item?.escalacaoId)).size !== result.items.length
    || result.items.some(item => !item || !positiveInteger(item.escalacaoId)
      || (item.nomePublico !== null && typeof item.nomePublico !== "string") || typeof item.meuTime !== "boolean"
      || (item.formacao !== null && !["4-3-3", "4-4-2", "3-5-2", "3-4-3", "4-5-1", "5-3-2", "5-4-1"].includes(item.formacao))
      || (item.posicao !== null && !positiveInteger(item.posicao))
      || (item.pontuacao !== null && (typeof item.pontuacao !== "number" || !Number.isFinite(item.pontuacao)))
      || (item.identidade !== null && (!item.identidade || typeof item.identidade.identificadorPublico !== "string"
        || typeof item.identidade.nomeBase !== "string" || !positiveInteger(item.identidade.sequencial))))) {
    throw new Error("O ranking retornado está incompleto ou pertence a outra consulta. Tente novamente.");
  }
  return result;
}
