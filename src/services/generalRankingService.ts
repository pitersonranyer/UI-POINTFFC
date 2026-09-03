import { apiFetch } from "@/services/apiClient";
import type { GeneralRankingResponse } from "@/types/general-ranking";

export const GENERAL_RANKING_LIMIT = 15;
export const generalRankingService = {
  buscar(temporada: number, rodada: number, limit = GENERAL_RANKING_LIMIT) {
    const params = new URLSearchParams({ temporada: String(temporada), rodada: String(rodada), limit: String(limit) });
    return apiFetch<GeneralRankingResponse>(`/ranking-geral?${params}`);
  },
};
