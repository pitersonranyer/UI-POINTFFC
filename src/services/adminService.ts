import { apiFetch } from "@/services/apiClient";

export type AdminCompetitionStatus = "RASCUNHO" | "INSCRICOES_ABERTAS" | "INSCRICOES_ENCERRADAS" | "EM_ANDAMENTO" | "ENCERRADA" | "CANCELADA";

export interface AdminCompetition {
  id: number;
  nome: string;
  slug: string;
  tipoAcesso: string;
  valorInscricao: number;
  rodadaInicio: number | null;
  rodadaFim: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  status: AdminCompetitionStatus;
  visivelApp: boolean;
  destaque: boolean;
  atualizadoEm: string;
  liga: { id: number; nome: string; slug: string };
  modalidade: { id: number; codigo: string; nome: string };
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
};
