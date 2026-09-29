import { apiFetch } from "./apiClient";

export type DesafioStatus = "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "ENCERRADO" | "CANCELADO";
export type DesafioAcesso = "FREE" | "PAGO";
export interface DesafioPayload {
  nome: string;
  descricao: string | null;
  tipoAcesso: DesafioAcesso;
  valorInscricao: string;
  inicioInscricao: string;
  fimInscricao: string;
  dataInicio: string;
  dataFim: string;
  limiteParticipantes: number | null;
}
export interface AdminDesafio extends DesafioPayload {
  id: number;
  status: DesafioStatus;
  criadoPorId: number;
  criadoPor: { idUsuario: number; nome: string };
  publicadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
export interface DesafioPage {
  itens: AdminDesafio[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
}
export interface DesafioFilters { pagina?: number; limite?: number; status?: DesafioStatus | ""; tipoAcesso?: DesafioAcesso | "" }
export interface FixtureFilters { date?: string; from?: string; to?: string; league?: number; team?: number; season?: number }
export interface DesafioFixture {
  fixtureId: number;
  leagueId: number;
  leagueNome: string;
  dataHoraInicio: string;
  mandanteId: number;
  mandanteNome: string;
  mandanteLogo: string | null;
  visitanteId: number;
  visitanteNome: string;
  visitanteLogo: string | null;
  horarioConfirmado: boolean;
  statusInterno: "AGENDADA" | "EM_ANDAMENTO" | "FINALIZADA" | "ANULADA" | null;
}
export interface DesafioPartida {
  id: number;
  desafioId: number;
  fixtureIdApiFootball: number;
  leagueIdApiFootball: number;
  nomeCompeticao: string;
  nomeMandante: string;
  logoMandanteUrl: string | null;
  nomeVisitante: string;
  logoVisitanteUrl: string | null;
  dataInicio: string;
  status: string;
  ordem: number;
}
const root = "/admin/desafios";
const auth = { authenticated: true, preserveSessionOnForbidden: true };
const read = { ...auth, cache: "no-store" as const };
function query(filters: DesafioFilters | FixtureFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return params.size ? `?${params}` : "";
}
function write<T>(path: string, method: string, body?: unknown) {
  return apiFetch<T>(`${root}${path}`, { ...auth, method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
export const adminDesafioService = {
  list: (filters: DesafioFilters = {}) => apiFetch<DesafioPage>(`${root}${query(filters)}`, read),
  get: (id: number) => apiFetch<AdminDesafio>(`${root}/${id}`, read),
  create: (body: DesafioPayload) => write<AdminDesafio>("", "POST", body),
  update: (id: number, body: Partial<DesafioPayload>) => write<AdminDesafio>(`/${id}`, "PATCH", body),
  publish: (id: number) => write<AdminDesafio>(`/${id}/publicar`, "POST"),
  cancel: (id: number) => write<AdminDesafio>(`/${id}/cancelar`, "POST"),
  fixtures: (filters: FixtureFilters) => apiFetch<DesafioFixture[]>(`${root}/fixtures${query(filters)}`, read),
  matches: (id: number) => apiFetch<DesafioPartida[]>(`${root}/${id}/partidas`, read),
  addMatch: (id: number, fixtureId: number) => write<DesafioPartida>(`/${id}/partidas`, "POST", { fixtureId }),
  removeMatch: (id: number, partidaId: number) => write<DesafioPartida[]>(`/${id}/partidas/${partidaId}`, "DELETE"),
  reorder: (id: number, partidaIds: number[]) => write<DesafioPartida[]>(`/${id}/partidas/ordem`, "PATCH", { partidaIds }),
};
