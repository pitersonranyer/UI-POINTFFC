export type HistoryRound = {
  rodada: number; statusRodada: string | null;
  situacao: "PONTUADO" | "NAO_JOGOU" | "SEM_DADOS" | "DADO_INVALIDO";
  motivo: string | null; pontuacao: number | null; entrouEmCampo: boolean | null;
  scouts: Record<string, number> | null; consolidadoEm: string | null;
  estadoSnapshot: "AUSENTE" | "SEM_JSON" | "VALIDO" | "INCOMPLETO" | "INVALIDO";
  parcial: boolean;
};
export type AthleteHistory = {
  atletaId: number; temporada: number; rodadaReferencia: number; historico: HistoryRound[];
  indicadores: {
    mediaGeralDisponivel: number | null; mediaUltimas5: number | null;
    maior: { pontuacao: number; rodada: number } | null;
    menor: { pontuacao: number; rodada: number } | null;
    desvioPadrao: number | null; amostraGeral: number; amostraUltimas5: number;
  };
  cobertura: {
    rodadasSemSnapshot: number[]; rodadasSemPontuacaoDoAtleta: number[];
    rodadasParciais: number[]; rodadasComSnapshotInvalidoOuIncompleto: number[];
    temporadaComSnapshotsCompletosAteReferencia: boolean;
  };
};
