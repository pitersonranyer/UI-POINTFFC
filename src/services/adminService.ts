import { apiFetch } from "@/services/apiClient";

export type AdminCompetitionStatus = "RASCUNHO" | "INSCRICOES_ABERTAS" | "INSCRICOES_ENCERRADAS" | "EM_ANDAMENTO" | "ENCERRADA" | "CANCELADA";

export interface AdminCompetition {
  id: number;
  ligaModalidadeId: number;
  nome: string;
  slug: string;
  descricao: string | null;
  tipoAcesso: string;
  valorInscricao: number;
  tipoTaxaPlataforma: "PERCENTUAL" | "VALOR_FIXO" | null;
  valorTaxaPlataforma: number | null;
  rodadaInicio: number | null;
  rodadaFim: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  inicioInscricao: string | null;
  fimInscricao: string | null;
  limiteTimesUsuario: number | null;
  limiteParticipantes: number | null;
  status: AdminCompetitionStatus;
  visivelApp: boolean;
  destaque: boolean;
  atualizadoEm: string;
  liga: { id: number; nome: string; slug: string };
  modalidade: { id: number; codigo: string; nome: string };
}

export interface AdminLeague { id: number; nome: string; slug: string; tipo: string; status: string; visivelApp: boolean; imagemUrl: string | null }
export interface AdminLeagueModality { ligaModalidadeId: number; modalidadeId: number; codigo: string; nome: string; ativa: boolean; ordem: number }
export type AdminAwardType = "VALOR_FIXO" | "PERCENTUAL";
export interface AdminAwardInput { posicaoInicio: number; posicaoFim: number; tipoPremiacao: AdminAwardType; valor: number | null; percentual: number | null; ordem: number }
export interface AdminAward extends AdminAwardInput { id: number; competicaoLigaId: number; criadoEm: string; atualizadoEm: string }
export interface AdminCompetitionPayload {
  ligaModalidadeId: number; nome: string; slug: string; descricao: string | null;
  tipoAcesso: "FREE" | "PAGO"; valorInscricao: number;
  tipoTaxaPlataforma: "PERCENTUAL" | "VALOR_FIXO" | null; valorTaxaPlataforma: number | null;
  rodadaInicio: number | null; rodadaFim: number | null; dataInicio: string | null; dataFim: string | null;
  inicioInscricao: string | null; fimInscricao: string | null;
  limiteTimesUsuario: number | null; limiteParticipantes: number | null;
  status: AdminCompetitionStatus; visivelApp: boolean; destaque: boolean;
}

export interface AdminCompetitionPage {
  itens: AdminCompetition[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
}

export interface AdminCompetitionFilters {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: AdminCompetitionStatus | "";
}

function queryString(filters: AdminCompetitionFilters) {
  const params = new URLSearchParams();
  params.set("pagina", String(filters.pagina ?? 1));
  params.set("limite", String(filters.limite ?? 20));
  if (filters.busca?.trim()) params.set("busca", filters.busca.trim());
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

export const adminService = {
  listCompetitions: (filters: AdminCompetitionFilters = {}) => apiFetch<AdminCompetitionPage>(`/admin/competicoes?${queryString(filters)}`, { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" }),
  getCompetition: (id: number) => apiFetch<AdminCompetition>(`/admin/competicoes/${id}`, { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" }),
  getLeagues: () => apiFetch<AdminLeague[]>("/admin/ligas", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" }),
  getLeagueModalities: (leagueId: number) => apiFetch<AdminLeagueModality[]>(`/admin/ligas/${leagueId}/modalidades`, { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" }),
  createCompetition: (payload: AdminCompetitionPayload) => apiFetch<AdminCompetition>("/admin/competicoes", { method: "POST", authenticated: true, preserveSessionOnForbidden: true, body: JSON.stringify(payload) }),
  updateCompetition: (id: number, payload: Partial<AdminCompetitionPayload>) => apiFetch<AdminCompetition>(`/admin/competicoes/${id}`, { method: "PATCH", authenticated: true, preserveSessionOnForbidden: true, body: JSON.stringify(payload) }),
  getCompetitionAwards: (id: number) => apiFetch<AdminAward[]>(`/admin/competicoes/${id}/premiacoes`, { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" }),
  updateCompetitionAwards: (id: number, premiacoes: AdminAwardInput[]) => apiFetch<AdminAward[]>(`/admin/competicoes/${id}/premiacoes`, { method: "PUT", authenticated: true, preserveSessionOnForbidden: true, body: JSON.stringify({ premiacoes }) }),
};
