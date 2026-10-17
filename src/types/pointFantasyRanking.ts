import type { Formation } from "./pointFantasyLineup";

export interface FantasyRankingEntry {
  escalacaoId: number;
  nomePublico: string | null;
  identidade: { identificadorPublico: string; nomeBase: string; sequencial: number } | null;
  formacao: Formation | null;
  meuTime: boolean;
  posicao: number | null;
  pontuacao: number | null;
}

export interface FantasyCompetitionRanking {
  competicaoId: number;
  // Preserve the server state, including future scoring states; never derive a ranking locally.
  estadoPontuacao: string;
  items: FantasyRankingEntry[];
  total: number;
  page: number;
  limit: number;
}
