import type { FantasyLineup, LineupContext } from "@/types/pointFantasyLineup";
import { blockingReason } from "./lineupPresentation";

export const lineupRegistrationName = (lineup: FantasyLineup) => lineup.nomePublico ?? `Time #${lineup.id} · Rascunho antigo`;
export const canRegisterLineup = (lineup: FantasyLineup) => lineup.status === "RASCUNHO" && lineup.validacao.completa;
export function freeRegistrationReason(context: LineupContext, now: number) {
  const competition = context.competition;
  if (competition.tipoAcesso !== "FREE") return "Inscrição indisponível para competições pagas nesta fase.";
  if (Number(competition.valorInscricao) !== 0) return "A inscrição gratuita está indisponível para esta competição.";
  const reason = blockingReason(context, now);
  if (reason) return reason;
  if (!Number.isFinite(Date.parse(competition.fimInscricao)) || now >= Date.parse(competition.fimInscricao)) return "O período de inscrição está encerrado.";
  return null;
}
export function registrationSelectionIssue(lineups: FantasyLineup[], ids: number[], currentId: number | null, dirty: boolean, limit: number | null) {
  if (!ids.length) return "Selecione pelo menos um time completo.";
  if (ids.length > 100) return "Selecione até 100 times por confirmação.";
  if (ids.some(id => !lineups.some(lineup => lineup.id === id && canRegisterLineup(lineup)))) return "Selecione somente rascunhos completos ainda não inscritos.";
  if (dirty && currentId !== null && ids.includes(currentId)) return "Salve as alterações do time selecionado antes de inscrever.";
  if (limit !== null && lineups.filter(lineup => lineup.status === "INSCRITA").length + ids.length > limit) return "A seleção excede o limite de inscrições da competição.";
  return null;
}
