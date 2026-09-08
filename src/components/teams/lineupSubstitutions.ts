import type { CartolaTeamLineupAthlete } from "@/types/cartola";

export type SubstitutionStatus = "in" | "out";

// The public lineup and aggregate partial-score endpoints do not expose
// applied substitutions. Participation alone cannot establish a replacement.
export function substitutionStatusByAthlete(_players: CartolaTeamLineupAthlete[], _reserves: CartolaTeamLineupAthlete[]) {
  return new Map<number, SubstitutionStatus>();
}
