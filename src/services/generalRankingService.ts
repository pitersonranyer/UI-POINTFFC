import { apiFetch } from "@/services/apiClient";
import type { GeneralRankingResponse } from "@/types/general-ranking";

export const GENERAL_RANKING_LIMIT = 15;
export const generalRankingService = {
  buscar(temporada: number, rodada: number, limit = GENERAL_RANKING_LIMIT, options?: { page?: number; nomeTime?: string; nomeCartoleiro?: string }) {
    const params = new URLSearchParams({ temporada: String(temporada), rodada: String(rodada), limit: String(limit) });
    if (options?.page) params.set("page", String(options.page));
    if (options?.nomeTime) params.set("nomeTime", options.nomeTime);
    if (options?.nomeCartoleiro) params.set("nomeCartoleiro", options.nomeCartoleiro);
    return apiFetch<GeneralRankingResponse>(`/ranking-geral?${params}`);
  },
};
