import { apiFetch, ApiError } from "./apiClient";
import { loadFantasyPages } from "./pointFantasyService";
import type { FantasyReference, PointFantasyAthlete, PointFantasyCatalog } from "@/types/pointFantasy";
import type { CompetitionDetail, CreateLineupIdentity, FantasyCompetition, FantasyLineup, FreeLineupRegistrationRequest, FreeLineupRegistrationResult, LineupContext, LineupSelection, MyFantasyLineups } from "@/types/pointFantasyLineup";

const authenticated = { authenticated: true, preserveSessionOnForbidden: true };
const base = "/point-fantasy";
export const listFantasyCompetitions = (signal: AbortSignal) => loadFantasyPages<FantasyCompetition>(`${base}/competicoes`, signal);
export async function loadLineupContext(id: number, signal: AbortSignal): Promise<LineupContext> {
  const competition = await apiFetch<CompetitionDetail>(`${base}/competicoes/${id}`, { signal });
  const [athletes, clubs, positions, catalogs] = await Promise.all([
    loadFantasyPages<PointFantasyAthlete>(`${base}/competicoes/${id}/atletas`, signal),
    apiFetch<{ items: FantasyReference[] }>(`${base}/catalogos/${competition.catalogoId}/clubes`, { signal }),
    apiFetch<{ items: FantasyReference[] }>(`${base}/catalogos/${competition.catalogoId}/posicoes`, { signal }),
    loadFantasyPages<PointFantasyCatalog>(`${base}/catalogos`, signal),
  ]);
  const catalog = catalogs.find(c => c.id === competition.catalogoId);
  const ids = new Set(competition.partidas.flatMap(m => [m.clubeMandanteId, m.clubeVisitanteId]));
  if (!catalog || athletes.some(a => a.catalogoId !== catalog.id || !ids.has(a.clubeIdExterno))) throw new Error("Atletas incompatíveis com a competição. Recarregue os dados.");
  return { competition, catalog, athletes, clubs: clubs.items.filter(c => ids.has(c.id)), positions: positions.items };
}
export async function listMyFantasyLineups(competitionId: number, signal: AbortSignal): Promise<MyFantasyLineups> {
  const items: FantasyLineup[] = [];
  let snapshot: string | undefined;
  for (let page = 1; ; page++) {
    signal.throwIfAborted();
    const result = await apiFetch<MyFantasyLineups & { total: number; page: number; limit: number }>(`${base}/competicoes/${competitionId}/escalacoes/minhas?page=${page}&limit=100`, { ...authenticated, signal });
    signal.throwIfAborted();
    const metadata = JSON.stringify([result?.total, result?.estadoIdentidade, result?.identidade, result?.rascunhosLegados]);
    if (!result || !Array.isArray(result.items) || result.page !== page || !Number.isInteger(result.total) || result.total < 0
      || !Number.isInteger(result.limit) || result.limit < 1 || result.limit > 100 || result.items.length > result.limit
      || !["NOVO", "LEGADO", "DEFINIDA"].includes(result.estadoIdentidade)
      || !Number.isInteger(result.rascunhosLegados) || result.rascunhosLegados < 0 || result.rascunhosLegados > result.total
      || (result.estadoIdentidade === "DEFINIDA" ? !result.identidade || typeof result.identidade.nomeBase !== "string" || typeof result.identidade.identificadorPublico !== "string" || !Number.isInteger(result.identidade.ultimoSequencial) : result.identidade !== null)
      || (snapshot !== undefined && snapshot !== metadata)) {
      throw new Error("Seus times mudaram ou a resposta está incompleta. Recarregue os dados.");
    }
    snapshot = metadata;
    items.push(...result.items);
    if (items.some(item => item.competicaoId !== competitionId) || new Set(items.map(item => item.id)).size !== items.length || items.length > result.total) throw new Error("Resposta de times inconsistente. Recarregue os dados.");
    if (items.length === result.total) return { items, estadoIdentidade:result.estadoIdentidade, identidade:result.identidade, rascunhosLegados:result.rascunhosLegados };
    if (result.items.length !== result.limit) throw new Error("Página de times incompleta. Recarregue os dados.");
  }
}
export const getFantasyLineup = (id: number, signal?: AbortSignal) => apiFetch<FantasyLineup>(`${base}/escalacoes/${id}`, { ...authenticated, signal });
export const createFantasyLineup = (competitionId: number, selection: LineupSelection, identity: CreateLineupIdentity) => apiFetch<FantasyLineup>(`${base}/competicoes/${competitionId}/escalacoes`, { ...authenticated, method:"POST", body:JSON.stringify({ ...selection, ...identity }), signal:AbortSignal.timeout(30000) });
export const updateFantasyLineup = (id: number, versao: number, selection: LineupSelection) => apiFetch<FantasyLineup>(`${base}/escalacoes/${id}`, { ...authenticated, method:"PATCH", body:JSON.stringify({ ...selection, versao }) });
export const duplicateFantasyLineup = (id: number, versao: number, identity: CreateLineupIdentity) => apiFetch<FantasyLineup>(`${base}/escalacoes/${id}/duplicar`, { ...authenticated, method:"POST", body:JSON.stringify({ versao, ...identity }), signal:AbortSignal.timeout(30000) });
export const deleteFantasyLineup = (id: number, versao: number) => apiFetch<{ id: number; excluida: boolean }>(`${base}/escalacoes/${id}?versao=${versao}`, { ...authenticated, method:"DELETE" });
export async function confirmFreeFantasyLineups(competitionId: number, request: FreeLineupRegistrationRequest): Promise<FreeLineupRegistrationResult> {
  const result = await apiFetch<FreeLineupRegistrationResult>(`${base}/competicoes/${competitionId}/inscricoes`, { ...authenticated, method:"POST", body:JSON.stringify(request), signal:AbortSignal.timeout(30000) });
  const ids = Array.isArray(result?.escalacoes) ? result.escalacoes.map(item => item.id) : [];
  if (!result || result.estado !== "CONFIRMADA" || result.valorTotal !== "0.00" || result.competicao?.id !== competitionId || result.competicao.tipoAcesso !== "FREE"
    || typeof result.competicao.nome !== "string" || !Array.isArray(result.escalacoes) || result.quantidadeConfirmada !== request.escalacaoIds.length
    || ids.length !== request.escalacaoIds.length || new Set(ids).size !== ids.length || ids.some(id => !request.escalacaoIds.includes(id))
    || result.escalacoes.some(item => item.status !== "INSCRITA" || (item.nomePublico !== null && typeof item.nomePublico !== "string") || typeof item.confirmadaEm !== "string" || !Number.isFinite(Date.parse(item.confirmadaEm)))) {
    // The server may have committed. The caller must reconcile and replay this same key.
    throw new Error("O servidor não retornou uma confirmação válida. Atualize os times antes de tentar novamente.");
  }
  return result;
}
export function lineupError(error: unknown) {
  if (error instanceof ApiError) {
    const labels: Record<number, string> = { 400:"Seleção inválida", 401:"Entre novamente para continuar", 403:"Sua conta está bloqueada ou inativa", 404:"Escalação inexistente ou sem acesso", 409:"A escalação mudou ou a edição está bloqueada" };
    return `${labels[error.status] ?? "Não foi possível concluir a operação"}. ${error.message}`;
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
