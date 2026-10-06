export interface FantasyTeam {
  idExterno: number;
  nome: string;
  logo: string | null;
}

export interface FantasyParticipant {
  idExterno: number | null;
  nome: string;
}

export interface FantasyEvent {
  // Open string: the UI must also handle event types it does not know yet.
  tipo: string;
  tempo: { minuto: number | null; acrescimo: number | null; exibicao: string };
  equipe: FantasyTeam | null;
  comentarios: string | null;
  origem: string | null;
  jogador?: FantasyParticipant | null;
  assistencia?: FantasyParticipant | null;
  placarAposEvento?: { mandante: number | null; visitante: number | null } | null;
  jogadorSai?: FantasyParticipant | null;
  jogadorEntra?: FantasyParticipant | null;
}

export interface FantasySummary {
  partida: {
    idExterno: number;
    campeonato: string;
    rodada: number | null;
    fase: string | null;
    status: string;
    data: string;
    estadio: string | null;
    mandante: FantasyTeam;
    visitante: FantasyTeam;
    placar: { mandante: number | null; visitante: number | null };
  };
  eventos: FantasyEvent[];
}

export interface FantasyStatisticsValues {
  finalizacoesNoGol: number | null;
  finalizacoesFora: number | null;
  finalizacoes: number | null;
  finalizacoesBloqueadas: number | null;
  finalizacoesDentroArea: number | null;
  finalizacoesForaArea: number | null;
  faltas: number | null;
  escanteios: number | null;
  impedimentos: number | null;
  posseBola: number | null;
  cartoesAmarelos: number | null;
  cartoesVermelhos: number | null;
  defesasGoleiro: number | null;
  passes: number | null;
  passesCertos: number | null;
  precisaoPasses: number | null;
  golsEsperados: number | null;
  golsEvitados: number | null;
}

export interface FantasyStatistics {
  partida: { idExterno: number };
  mandante: FantasyTeam & { estatisticas: FantasyStatisticsValues };
  visitante: FantasyTeam & { estatisticas: FantasyStatisticsValues };
}

export interface FantasyPlayer {
  idExterno: number;
  nome: string;
  numero: number | null;
  posicao: string | null;
  grid: string | null;
}

export interface FantasyLineupTeam extends FantasyTeam {
  formacao: string | null;
  treinador: { idExterno: number | null; nome: string | null; foto: string | null } | null;
  titulares: FantasyPlayer[];
  reservas: FantasyPlayer[];
}

export interface FantasyLineup {
  partida: { idExterno: number };
  mandante: FantasyLineupTeam;
  visitante: FantasyLineupTeam;
}

// UI state belongs to each endpoint independently, not to the whole page.
export type FantasySectionState<T> =
  | { status: "ready"; data: T }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" };
