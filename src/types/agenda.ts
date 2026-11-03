// Public GET /fantasy/agenda response (API Futebol V2).
export interface AgendaTeam { id: number | null; nome: string | null; escudo: string | null }
export interface AgendaMatch {
  fixtureId: number;
  mandante: AgendaTeam;
  visitante: AgendaTeam;
  dataHora: string | null;
  status: string | null;
  placar: { mandante: number | null; visitante: number | null };
}
export interface Agenda {
  fornecedor: "API_FUTEBOL_V2";
  competicao: string;
  temporada: number;
  rodada: number;
  totalRodadas: number;
  partidas: AgendaMatch[];
}
