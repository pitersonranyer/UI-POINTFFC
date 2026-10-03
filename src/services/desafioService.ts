import { apiFetch, ApiError } from "./apiClient";

export type Palpite = "CASA" | "EMPATE" | "FORA";
export interface DesafioResumo {
  id: number; nome: string; descricao: string | null;
  limiteInscricoesPorUsuario?: number;
  tipoAcesso: "FREE" | "PAGO"; valorInscricao: string;
  status: "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "ENCERRADO" | "CANCELADO";
  inicioInscricao: string; fimInscricao: string; dataInicio: string; dataFim: string;
}
export interface DesafioJogo {
  id: number; ordem: number; nomeCompeticao: string;
  nomeMandante?: string | null; logoMandanteUrl: string | null;
  nomeVisitante?: string | null; logoVisitanteUrl: string | null;
  mandanteNome?: string | null; visitanteNome?: string | null;
  golsMandante?: number | null; golsVisitante?: number | null;
  pontos?: number | null; apurado?: boolean | null;
  dataInicio: string; status: "AGENDADA" | "EM_ANDAMENTO" | "FINALIZADA" | "ANULADA";
  fechamentoEm: string; podeAlterarPalpite: boolean; meuPalpite?: Palpite | null;
}
export interface DesafioInscricao {
  id: number; desafioId: number; status: "RASCUNHO" | "ATIVA" | "CANCELADA";
  numero?: number; nome?: string;
  valorInscricao: string; dataInscricao: string;
}
export interface DesafioPalpiteInscricao {
  partidaId: number; meuPalpite: Palpite | null; pontos: number | null;
  apurado: boolean; podeAlterarPalpite: boolean;
}
export interface DesafioMinhaInscricao extends DesafioInscricao {
  numero: number; nome: string; palpites: DesafioPalpiteInscricao[];
}
export interface DesafioDetalhe extends DesafioResumo {
  partidas: DesafioJogo[]; inscrito?: boolean; minhaInscricao?: DesafioInscricao | null;
  minhasInscricoes?: DesafioMinhaInscricao[]; quantidadeUtilizada?: number;
}
export interface DesafiosPagina {
  itens: DesafioResumo[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
}
export interface DesafioRankingItem {
  posicao: number;
  inscricaoId?: number; numero?: number; nome?: string;
  participante: { idUsuario: number; nome: string | null; fotoUrl: string | null };
  pontos: number;
  acertos: number;
}
export interface DesafioRanking {
  desafioId: number;
  status: DesafioResumo["status"];
  totalPartidasValidas: number;
  totalPartidasApuradas: number;
  totalPartidasAnuladas: number;
  pontuacaoMaxima: number;
  ranking: DesafioRankingItem[];
  paginacao: DesafiosPagina["paginacao"];
}
export interface PalpiteSalvo { desafioId: number; partidaId: number; palpite: Palpite; fechamentoEm: string; podeAlterarPalpite: boolean }
export interface ParticipacaoConfirmada { inscricao: DesafioInscricao; tipoAcesso: "FREE" | "PAGO"; valorCobrado: string }
export interface SaldoInsuficiente { saldoDisponivel: string; valorNecessario: string; valorFaltante: string }
export const desafioService = {
  list: (pagina = 1, tipoAcesso = "", signal?: AbortSignal) => {
    const query = new URLSearchParams({ pagina: String(pagina), limite: "20" });
    if (tipoAcesso) query.set("tipoAcesso", tipoAcesso);
    return apiFetch<DesafiosPagina>(`/desafios?${query}`, { cache: "no-store", signal });
  },
  detail: (id: number, authenticated: boolean, signal?: AbortSignal) => apiFetch<DesafioDetalhe>(`/desafios/${id}`, { authenticated, cache: "no-store", signal }),
  ranking: (id: number, pagina = 1, signal?: AbortSignal) => apiFetch<DesafioRanking>(`/desafios/${id}/ranking?pagina=${pagina}&limite=20`, { cache: "no-store", signal }),
  createInscricao: (id: number, chaveIdempotencia: string) => apiFetch<DesafioInscricao>(`/desafios/${id}/inscricoes`, { method: "POST", authenticated: true, body: JSON.stringify({ chaveIdempotencia }) }),
  predict: (id: number, partidaId: number, palpite: Palpite, inscricaoId?: number) => apiFetch<PalpiteSalvo>(`/desafios/${id}/partidas/${partidaId}/palpite`, { method: "PUT", authenticated: true, body: JSON.stringify({ ...(inscricaoId !== undefined ? { inscricaoId } : {}), palpite }) }),
  participate: (id: number, inscricaoId?: number) => apiFetch<ParticipacaoConfirmada>(`/desafios/${id}/participar`, { method: "POST", authenticated: true, ...(inscricaoId !== undefined ? { body: JSON.stringify({ inscricaoId }) } : {}) }),
};
export function insufficientBalance(error: unknown): SaldoInsuficiente | null {
  if (!(error instanceof ApiError) || error.details.code !== "SALDO_INSUFICIENTE") return null;
  const { saldoDisponivel, valorNecessario, valorFaltante } = error.details;
  const decimal = (value: unknown): value is string => typeof value === "string" && /^\d+\.\d{2}$/.test(value);
  return decimal(saldoDisponivel) && decimal(valorNecessario) && decimal(valorFaltante) ? { saldoDisponivel, valorNecessario, valorFaltante } : null;
}
export function desafioMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
    if (error.status === 403) return "Sua conta não está autorizada para esta operação.";
    if (error.status === 404) return "Este Desafio não está disponível.";
    if ([400, 409].includes(error.status)) return error.message.replace(/\bcartela(s)?\b/gi, (_match, plural) => plural ? "palpites" : "palpite").replace(/\bRASCUNHO\b/g, "não confirmado");
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}
export const desafioStatus = { RASCUNHO: "Rascunho", ABERTO: "Aberto", EM_ANDAMENTO: "Em andamento", ENCERRADO: "Encerrado", CANCELADO: "Cancelado" };
export const desafioDate = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
