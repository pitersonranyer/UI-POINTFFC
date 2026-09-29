import { apiFetch, ApiError } from "./apiClient";

export type Palpite = "CASA" | "EMPATE" | "FORA";
export interface DesafioResumo {
  id: number; nome: string; descricao: string | null;
  tipoAcesso: "FREE" | "PAGO"; valorInscricao: string;
  status: "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "ENCERRADO" | "CANCELADO";
  inicioInscricao: string; fimInscricao: string; dataInicio: string; dataFim: string;
}
export interface DesafioJogo {
  id: number; ordem: number; nomeCompeticao: string;
  nomeMandante: string; logoMandanteUrl: string | null;
  nomeVisitante: string; logoVisitanteUrl: string | null;
  dataInicio: string; status: "AGENDADA" | "EM_ANDAMENTO" | "FINALIZADA" | "ANULADA";
  fechamentoEm: string; podeAlterarPalpite: boolean; meuPalpite?: Palpite | null;
}
export interface DesafioInscricao {
  id: number; desafioId: number; status: "ATIVA" | "CANCELADA";
  valorInscricao: string; dataInscricao: string;
}
export interface DesafioDetalhe extends DesafioResumo {
  partidas: DesafioJogo[]; inscrito?: boolean; minhaInscricao?: DesafioInscricao | null;
}
export interface DesafiosPagina {
  itens: DesafioResumo[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
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
  predict: (id: number, partidaId: number, palpite: Palpite) => apiFetch<PalpiteSalvo>(`/desafios/${id}/partidas/${partidaId}/palpite`, { method: "PUT", authenticated: true, body: JSON.stringify({ palpite }) }),
  participate: (id: number) => apiFetch<ParticipacaoConfirmada>(`/desafios/${id}/participar`, { method: "POST", authenticated: true }),
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
    if ([400, 409].includes(error.status)) return error.message;
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}
export const desafioStatus = { RASCUNHO: "Rascunho", ABERTO: "Aberto", EM_ANDAMENTO: "Em andamento", ENCERRADO: "Encerrado", CANCELADO: "Cancelado" };
export const desafioDate = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
