// Public contracts from API-POINTFFC c856d7e: fantasy.types.ts and V2 mappers.
export interface FantasyParticipant { idExterno: number | null; nome: string | null }
export interface FantasyTeam extends FantasyParticipant { logo: string | null }
export interface FantasyPosition { nome: string | null; codigo: string | null; categoria: string | null }
export interface FantasyPlayer extends FantasyParticipant {
  numero: number | null; foto: string | null; posicao: string | null;
  posicaoCadastral: FantasyPosition | null; funcaoPartida: FantasyPosition;
  grid: string | null; coordenada: { linha: number | null; coluna: number | null } | null;
}
export interface FantasySquad {
  formacao: string | null; treinador: (FantasyParticipant & { foto: string | null }) | null;
  titulares: FantasyPlayer[]; reservas: FantasyPlayer[]; atualizadoEm: string | null;
}
export interface FantasyMatch {
  idExterno: number | null; fornecedor: "API_FUTEBOL_V2"; campeonato: string | null;
  campeonatoId: number | null; temporada: string | null; rodada: number | null; fase: string | null;
  status: string; statusOriginal: string | null; periodo: string | null; minuto: number | null;
  acrescimos: { primeiroTempo: number | null; segundoTempo: number | null; primeiroTempoProrrogacao: number | null; segundoTempoProrrogacao: number | null };
  data: string | null; timezone: string | null; estadio: string | null; cidade: string | null;
  mandante: FantasyTeam; visitante: FantasyTeam; placar: { mandante: number | null; visitante: number | null };
}
export interface FantasyPreMatch {
  partida: FantasyMatch; escalacoesDisponiveis: boolean;
  escalacoes: Record<"mandante" | "visitante", { provavel: FantasySquad | null; confirmada: FantasySquad | null }>;
  desfalquesInformados: boolean;
  desfalques: { atleta: FantasyParticipant | null; equipe: FantasyTeam; situacao: string | null; motivo: string | null; atualizadoEm: string | null }[];
}
export interface FantasyEvent {
  tipo: string; periodo: string | null; tempo: { minuto: number | null; acrescimo: number | null; exibicao: string | null };
  equipe: FantasyTeam; jogador: FantasyParticipant | null; assistencia: FantasyParticipant | null;
  jogadorSai: FantasyParticipant | null; jogadorEntra: FantasyParticipant | null; comissaoTecnica: FantasyParticipant | null;
  comentarios: string | null; origem: { tipo: string; detalhe: string | null };
}
export interface FantasySummary {
  partida: FantasyMatch; eventosDisponiveis: boolean; eventos: FantasyEvent[]; narrativaDisponivel: boolean;
  narrativa: { idExterno: number | null; tipo: string | null; periodo: string | null; periodoOriginal: string | null;
    minuto: number | null; segundo: number | null; acrescimo: number | null; titulo: string | null; texto: string | null;
    equipe: FantasyTeam | null; atleta: FantasyParticipant | null; geradoEm: string | null }[];
}
export interface FantasyStatisticsValues {
  finalizacoesNoGol: number | null; finalizacoesFora: number | null; finalizacoes: number | null;
  finalizacoesBloqueadas: number | null; finalizacoesDentroArea: number | null; finalizacoesForaArea: number | null;
  faltas: number | null; escanteios: number | null; impedimentos: number | null; posseBola: number | null;
  cartoesAmarelos: number | null; cartoesVermelhos: number | null; defesasGoleiro: number | null;
  passes: number | null; passesCertos: number | null; precisaoPasses: number | null; golsEsperados: number | null; golsEvitados: number | null;
}
export interface FantasyAthleteStatistics {
  atleta: FantasyParticipant & { foto: string | null }; posicaoCadastral: null; funcaoPartida: FantasyPosition;
  numero: number | null; titular: boolean | null; goleiro: boolean | null;
  estatisticas: Record<string, number | null>; goleiroEstatisticas: Record<string, number | null> | null;
}
export interface FantasyStatisticsTeam extends FantasyTeam {
  disponivel: boolean; estatisticas: FantasyStatisticsValues; atletas: FantasyAthleteStatistics[];
  porTempo: Record<"primeiroTempo" | "segundoTempo", { escanteios: number | null; cartoes: number | null }>;
}
export interface FantasyStatistics {
  partida: Pick<FantasyMatch, "idExterno" | "fornecedor">; mandante: FantasyStatisticsTeam; visitante: FantasyStatisticsTeam;
}
export interface FantasyLineupTeam extends FantasyTeam, FantasySquad { disponivel: boolean; tipoEscalacao: string | null }
export interface FantasyLineup {
  partida: Pick<FantasyMatch, "idExterno" | "fornecedor">; mandante: FantasyLineupTeam; visitante: FantasyLineupTeam;
  substituicoes: FantasyEvent[];
}
export interface MatchCenterResponses { "pre-jogo": FantasyPreMatch; sumario: FantasySummary; formacao: FantasyLineup; estatisticas: FantasyStatistics }
export type FantasySectionState<T> = { status: "ready"; data: T } | { status: "loading" } | { status: "error"; message: string };
