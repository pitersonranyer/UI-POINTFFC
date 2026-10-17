import type { FantasyCompetition } from "@/types/pointFantasyLineup";

export function competitionAvailability(competition: FantasyCompetition, now: number) {
  if (competition.status !== "PUBLICADA" || competition.fechamentoDefinitivoEm) return "Encerrada";
  const start = Date.parse(competition.inicioInscricao);
  const end = Date.parse(competition.fimInscricao);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Prazo indisponível";
  if (now >= end) return "Encerrada";
  return now < start ? "Em breve" : "Inscrições abertas";
}

export function competitionIdFromSearch(search: string): number | null {
  const value = new URLSearchParams(search).get("competicao");
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
}

export const competitionDeadline = (value: string) => Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value))
  : "Não informado";
