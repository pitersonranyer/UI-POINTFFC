export type GeneralRankingEntry = { posicao: number; timeId: number; nomeTime: string; nomeCartoleiro: string; escudoUrl: string; pontuacao: number; status: string };
export type GeneralRankingResponse = { temporada: number; rodada: number; total: number; ranking: GeneralRankingEntry[] };
