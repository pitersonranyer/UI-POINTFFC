import { apiFetch } from "@/services/apiClient";

export interface PointLeague { id: number; nome: string; slug: string; descricao: string | null; imagemUrl: string | null; modalidades: { codigo: string; nome: string }[] }
export interface Competition { id: number; nome: string; slug: string; descricao: string | null; tipoAcesso: string; valorInscricao: number; rodadaInicio: number | null; rodadaFim: number | null; inicioInscricao: string | null; fimInscricao: string | null; limiteTimesUsuario: number | null; limiteParticipantes: number | null; status: string; quantidadeInscritos?: number; premiacao?: Prize[] }
export interface Prize { posicaoInicio: number; posicaoFim: number; tipoPremiacao: string; valor: number | null; percentual: number | null; ordem: number; valorCalculado?: string | null }
// Campo derivado da listagem; opcional durante a atualizacao do backend.
export interface CompetitionCard extends Competition { premiacaoEmDisputa?: string | null }
export interface Entry { id: number; timeIdCartola?: number; nomeTime: string; nomeCartoleiro: string | null; escudoUrl: string | null; pontuacao: number | null; posicao: number | null; posicaoAnterior: number | null }
export interface RankingEntry extends Entry { inscricaoId: number; timeIdCartola: number; capitao?: { atletaId?: number; apelido: string; fotoUrl?: string | null } | null }
export interface CompetitionSummary { competicao: Competition; liga: Pick<PointLeague, "id" | "nome" | "slug" | "imagemUrl">; inscritos: { quantidade: number }; premiacaoEmDisputa?: string | null; premiacao: Prize[]; usuario?: { quantidadeTimesInscritos: number; limiteTimesUsuario: number | null; podeInscrever: boolean; motivoBloqueio: string | null; melhorPosicaoUsuario: number | null; melhorPontuacaoUsuario: number | null }; minhasInscricoes?: Entry[] }

export interface EnrollmentBatchInput { timesCartolaIds: number[]; valorUnitarioEsperado: string }
export interface EnrollmentBatchResult {
  loteId: number; competicaoId: number; quantidade: number; tipoAcesso: "FREE" | "PAGO"; moeda: "BRL";
  valorUnitario: string; valorTotal: string; movimentacaoDebitoId: number | null; saldoDisponivelAposOperacao: string | null;
  inscricoes: Array<{ id: number; timeIdCartola: number; statusInscricao: string }>;
}

export const pointLeagueService = {
  enrollBatch: (id: number, input: EnrollmentBatchInput, key: string) => apiFetch<EnrollmentBatchResult>(`/competicoes/${id}/inscricoes/lote`, { method: "POST", authenticated: true, headers: { "Idempotency-Key": key }, body: JSON.stringify(input) }),
  league: () => apiFetch<PointLeague>("/ligas/point-ffc"),
  competitions: () => apiFetch<CompetitionCard[]>("/ligas/point-ffc/competicoes?modalidade=RODADA", { cache: "no-store" }),
  competition: (id: number) => apiFetch<Competition>(`/competicoes/${id}`),
  summary: (id: number, authenticated: boolean) => apiFetch<CompetitionSummary>(`/competicoes/${id}/resumo`, { authenticated, cache: "no-store" }),
  participants: (id: number) => apiFetch<Entry[]>(`/competicoes/${id}/participantes`),
  ranking: (id: number) => apiFetch<{ ranking: RankingEntry[] }>(`/competicoes/${id}/ranking`),
  myEntries: (id: number) => apiFetch<Entry[]>(`/competicoes/${id}/inscricoes/minhas`, { authenticated: true }),
  enroll: (id: number, timesCartolaIds: number[]) => apiFetch<Entry[]>(`/competicoes/${id}/inscricoes`, { method: "POST", authenticated: true, body: JSON.stringify({ timesCartolaIds }) }),
};

export const blockMessages: Record<string, string> = {
  TIME_JA_INSCRITO: "Um dos times já está inscrito nesta competição. Confira suas inscrições.",
  CARTEIRA_BLOQUEADA: "Sua carteira está bloqueada para inscrições.",
  INSCRICAO_CONCORRENTE: "Outra inscrição está em processamento. Tente novamente com esta mesma tentativa.",
  CONFLITO_INSCRICAO: "Não foi possível concluir o lote. Tente novamente com esta mesma tentativa.",
  LIMITE_TIMES_USUARIO_ATINGIDO: "Você já atingiu o limite de times desta competição.",
  LIMITE_PARTICIPANTES_ATINGIDO: "Esta competição atingiu o limite de participantes.",
  INSCRICOES_FECHADAS: "As inscrições estão encerradas.",
  FORA_JANELA_INSCRICAO: "As inscrições não estão disponíveis neste momento.",
  COMPETICAO_INDISPONIVEL: "Esta competição não está disponível para novas inscrições.",
  COMPETICAO_NAO_FREE: "Esta competição não aceita inscrição gratuita.",
};
