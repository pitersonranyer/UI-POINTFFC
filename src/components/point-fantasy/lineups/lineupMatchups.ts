import type { FantasyMatch } from "@/types/pointFantasyLineup";
import type { FantasyReference } from "@/types/pointFantasy";

export interface LineupMatchup {
  match: FantasyMatch;
  home: FantasyReference | null;
  away: FantasyReference | null;
  timestamp: number | null;
}

export function sortLineupMatchups(matches: FantasyMatch[], clubs: FantasyReference[]): LineupMatchup[] {
  const byId = new Map(clubs.map(club => [club.id, club]));
  return matches.map(match => {
    const timestamp = Date.parse(match.inicioPrevisto);
    return {
      match,
      home: Number.isSafeInteger(match.clubeMandanteId) ? byId.get(match.clubeMandanteId) ?? null : null,
      away: Number.isSafeInteger(match.clubeVisitanteId) ? byId.get(match.clubeVisitanteId) ?? null : null,
      timestamp: Number.isFinite(timestamp) ? timestamp : null,
    };
  }).sort((a, b) => {
    if (a.timestamp === null && b.timestamp !== null) return 1;
    if (a.timestamp !== null && b.timestamp === null) return -1;
    return (a.timestamp ?? 0) - (b.timestamp ?? 0) || a.match.id - b.match.id;
  });
}

export function formatMatchupDate(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Horário indisponível";
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit" }).format(timestamp);
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone:"America/Sao_Paulo", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(timestamp);
  return `${date} · ${time}`;
}
