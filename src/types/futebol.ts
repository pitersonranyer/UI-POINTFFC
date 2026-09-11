export interface FutebolTime {
  id: number;
  externalId: number;
  cartolaClubeId: number | null;
  nome: string;
  nomeCurto: string | null;
  sigla: string | null;
  escudoUrl: string | null;
}
export interface FutebolJogo {
  id: number;
  externalId: number;
  temporada: number;
  rodada: number;
  dataHoraUtc: string;
  status: string;
  vencedor: string | null;
  mandante: FutebolTime;
  visitante: FutebolTime;
  placar: { mandante: number | null; visitante: number | null };
  placarIntervalo: { mandante: number | null; visitante: number | null };
}
export interface FutebolRodada {
  competicao: { codigo: string; nome: string };
  temporada: number;
  rodada: number | null;
  total: number;
  jogos: FutebolJogo[];
}
