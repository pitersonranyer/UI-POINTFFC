import type { FantasyLineup, FantasyPlayer, FantasySectionState, FantasyStatistics, FantasySummary, FantasyTeam } from "@/types/fantasy";

const mandante: FantasyTeam = { idExterno: 120, nome: "Botafogo", logo: null };
const visitante: FantasyTeam = { idExterno: 126, nome: "São Paulo", logo: null };

// Deliberate MOCK mode. No requests, provider keys, or API-error fallback.
// Logo URLs, participant IDs, kickoff time and phase were not supplied.
export const summaryMock: FantasySummary = {
  partida: {
    idExterno: 1180729, campeonato: "Brasileirão Série A", rodada: 38,
    fase: null, status: "ENCERRADA", data: "2024-12-08", estadio: "Estádio Nilton Santos",
    mandante, visitante, placar: { mandante: 2, visitante: 1 },
  },
  eventos: [
    { tipo: "GOL", tempo: { minuto: 37, acrescimo: null, exibicao: "37'" }, equipe: mandante, comentarios: null, origem: null,
      jogador: { idExterno: null, nome: "J. Savarino" }, assistencia: { idExterno: null, nome: "Igor Jesus" }, placarAposEvento: { mandante: 1, visitante: 0 } },
    { tipo: "GOL", tempo: { minuto: 63, acrescimo: null, exibicao: "63'" }, equipe: visitante, comentarios: null, origem: null,
      jogador: { idExterno: null, nome: "William" }, assistencia: null, placarAposEvento: { mandante: 1, visitante: 1 } },
    { tipo: "GOL", tempo: { minuto: 90, acrescimo: 2, exibicao: "90+2'" }, equipe: mandante, comentarios: null, origem: null,
      jogador: { idExterno: null, nome: "Gregore" }, assistencia: null, placarAposEvento: { mandante: 2, visitante: 1 } },
  ],
};

export const statisticsMock: FantasyStatistics = {
  partida: { idExterno: 1180729 },
  mandante: { ...mandante, estatisticas: {
    finalizacoesNoGol: 8, finalizacoesFora: 8, finalizacoes: 17, finalizacoesBloqueadas: 1,
    finalizacoesDentroArea: 10, finalizacoesForaArea: 7, faltas: 8, escanteios: 3, impedimentos: 1,
    posseBola: 46, cartoesAmarelos: null, cartoesVermelhos: null, defesasGoleiro: 0,
    passes: 504, passesCertos: 466, precisaoPasses: 92, golsEsperados: 1.88, golsEvitados: 0.5,
  } },
  visitante: { ...visitante, estatisticas: {
    finalizacoesNoGol: 1, finalizacoesFora: 3, finalizacoes: 5, finalizacoesBloqueadas: 1,
    finalizacoesDentroArea: 1, finalizacoesForaArea: 4, faltas: 3, escanteios: 0, impedimentos: 0,
    posseBola: 54, cartoesAmarelos: null, cartoesVermelhos: null, defesasGoleiro: 5,
    passes: 600, passesCertos: 544, precisaoPasses: 91, golsEsperados: 0.32, golsEvitados: 0.5,
  } },
};

export const lineupMock: FantasyLineup = {
  partida: { idExterno: 1180729 },
  mandante: { ...mandante, formacao: "3-3-1-3", treinador: { idExterno: 12089, nome: "Artur Jorge", foto: null }, titulares: [], reservas: [] },
  visitante: { ...visitante, formacao: "3-4-1-2", treinador: { idExterno: 846, nome: "L. Zubeldía", foto: null }, titulares: [], reservas: [] },
};

// These are supplied visual examples, NOT valid backend player records.
// Keep missing external IDs explicit rather than inventing provider identities.
export type FantasyPlayerExample = Omit<FantasyPlayer, "idExterno">;
export const lineupExamples: Record<"mandante" | "visitante", FantasyPlayerExample[]> = {
  mandante: [
    { nome: "John", numero: 12, posicao: "G", grid: "1:1" },
    { nome: "Gregore", numero: 26, posicao: "D", grid: "2:3" },
    { nome: "J. Savarino", numero: 10, posicao: "M", grid: "4:1" },
  ],
  visitante: [
    { nome: "Jandrei", numero: 93, posicao: "G", grid: "1:1" },
    { nome: "William", numero: 39, posicao: "F", grid: "5:1" },
  ],
};

export const matchCenterMock: {
  summary: FantasySectionState<FantasySummary>;
  statistics: FantasySectionState<FantasyStatistics>;
  lineup: FantasySectionState<FantasyLineup>;
} = {
  summary: { status: "ready", data: summaryMock },
  statistics: { status: "ready", data: statisticsMock },
  lineup: { status: "ready", data: lineupMock },
};
