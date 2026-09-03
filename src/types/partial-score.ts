export type PartialScoreStatus = "PARCIAL" | "AGUARDANDO" | "NAO_ENCONTRADO";

export type TeamPartialScore = {
  timeId: number;
  nomeTime: string;
  nomeCartoleiro: string;
  escudoUrl: string;
  pontuacao: number | null;
  status: PartialScoreStatus;
  atualizadoEm: string | null;
};

export type PartialScoresResponse = {
  temporada: number;
  rodada: number;
  parciais: TeamPartialScore[];
};
