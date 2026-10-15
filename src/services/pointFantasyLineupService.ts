import { apiFetch, ApiError } from "./apiClient";
import { loadFantasyPages } from "./pointFantasyService";
import type { FantasyReference, PointFantasyAthlete, PointFantasyCatalog } from "@/types/pointFantasy";
import type { CompetitionDetail, FantasyCompetition, FantasyLineup, LineupContext, LineupSelection } from "@/types/pointFantasyLineup";

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
export const listMyFantasyLineups = (competitionId: number, signal: AbortSignal) => loadFantasyPages<FantasyLineup>(`${base}/competicoes/${competitionId}/escalacoes/minhas`, signal, authenticated);
export const getFantasyLineup = (id: number, signal?: AbortSignal) => apiFetch<FantasyLineup>(`${base}/escalacoes/${id}`, { ...authenticated, signal });
export const createFantasyLineup = (competitionId: number, selection: LineupSelection) => apiFetch<FantasyLineup>(`${base}/competicoes/${competitionId}/escalacoes`, { ...authenticated, method:"POST", body:JSON.stringify(selection) });
export const updateFantasyLineup = (id: number, versao: number, selection: LineupSelection) => apiFetch<FantasyLineup>(`${base}/escalacoes/${id}`, { ...authenticated, method:"PATCH", body:JSON.stringify({ ...selection, versao }) });
export const duplicateFantasyLineup = (id: number, versao: number) => apiFetch<FantasyLineup>(`${base}/escalacoes/${id}/duplicar`, { ...authenticated, method:"POST", body:JSON.stringify({ versao }) });
export const deleteFantasyLineup = (id: number, versao: number) => apiFetch<{ id: number; excluida: boolean }>(`${base}/escalacoes/${id}?versao=${versao}`, { ...authenticated, method:"DELETE" });
export function lineupError(error: unknown) {
  if (error instanceof ApiError) {
    const labels: Record<number, string> = { 400:"Seleção inválida", 401:"Entre novamente para continuar", 403:"Sua conta está bloqueada ou inativa", 404:"Escalação inexistente ou sem acesso", 409:"A escalação mudou ou a edição está bloqueada" };
    return `${labels[error.status] ?? "Não foi possível concluir a operação"}. ${error.message}`;
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
