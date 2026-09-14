import { apiFetch } from "@/services/apiClient";

export interface PointLeague { id: number; nome: string; slug: string; descricao: string | null; imagemUrl: string | null; modalidades: { codigo: string; nome: string }[] }
export interface Competition { id: number; nome: string; slug: string; descricao: string | null; tipoAcesso: string; valorInscricao: number; rodadaInicio: number | null; rodadaFim: number | null; inicioInscricao: string | null; fimInscricao: string | null; limiteTimesUsuario: number | null; limiteParticipantes: number | null; status: string; quantidadeInscritos?: number; premiacao?: Prize[] }
export interface Prize { posicaoInicio: number; posicaoFim: number; tipoPremiacao: string; valor: number | null; percentual: number | null; ordem: number }
export interface Entry { id: number; timeIdCartola?: number; nomeTime: string; nomeCartoleiro: string | null; escudoUrl: string | null; pontuacao: number | null; posicao: number | null; posicaoAnterior: number | null }
export interface RankingEntry extends Entry { inscricaoId: number; timeIdCartola: number; capitao?: { atletaId?: number; apelido: string; fotoUrl?: string | null } | null }
export interface CompetitionSummary { competicao: Competition; liga: Pick<PointLeague, "id" | "nome" | "slug" | "imagemUrl">; inscritos: { quantidade: number }; premiacao: Prize[]; usuario?: { quantidadeTimesInscritos: number; limiteTimesUsuario: number | null; podeInscrever: boolean; motivoBloqueio: string | null; melhorPosicaoUsuario: number | null; melhorPontuacaoUsuario: number | null }; minhasInscricoes?: Entry[] }

export const pointLeagueService = {
  league: () => apiFetch<PointLeague>("/ligas/point-ffc"),
  competitions: () => apiFetch<Competition[]>("/ligas/point-ffc/competicoes?modalidade=RODADA"),
  competition: (id: number) => apiFetch<Competition>(`/competicoes/${id}`),
  summary: (id: number, authenticated: boolean) => apiFetch<CompetitionSummary>(`/competicoes/${id}/resumo`, { authenticated }),
  participants: (id: number) => apiFetch<Entry[]>(`/competicoes/${id}/participantes`),
  ranking: (id: number) => apiFetch<{ ranking: RankingEntry[] }>(`/competicoes/${id}/ranking`),
  myEntries: (id: number) => apiFetch<Entry[]>(`/competicoes/${id}/inscricoes/minhas`, { authenticated: true }),
  enroll: (id: number, timeIdCartola: number) => apiFetch<Entry>(`/competicoes/${id}/inscricoes`, { method: "POST", authenticated: true, body: JSON.stringify({ timeIdCartola }) }),
};

export const blockMessages: Record<string, string> = {
  LIMITE_TIMES_USUARIO_ATINGIDO: "Você já atingiu o limite de times desta competição.",
  LIMITE_PARTICIPANTES_ATINGIDO: "Esta competição atingiu o limite de participantes.",
  INSCRICOES_FECHADAS: "As inscrições estão encerradas.",
  FORA_JANELA_INSCRICAO: "As inscrições não estão disponíveis neste momento.",
  COMPETICAO_INDISPONIVEL: "Esta competição não está disponível para novas inscrições.",
  COMPETICAO_NAO_FREE: "Esta competição não aceita inscrição gratuita.",
};
