import type { CartolaTeamLineupAthlete, CartolaTeamLineupResponse, CartolaTeamSubstitution } from "@/types/cartola";

export type SubstitutionStatus = { direction: "in" | "out"; label: string };

export function substitutionStatusByAthlete(players: CartolaTeamLineupAthlete[], reserves: CartolaTeamLineupAthlete[], records?: CartolaTeamSubstitution[]) {
  const athletes = new Map([...players, ...reserves].map((player) => [player.atleta_id, player]));
  const result = new Map<number, SubstitutionStatus>();
  for (const record of records ?? []) {
    if (!record.ativa) continue;
    const outgoing = athletes.get(record.titularSaiuId), incoming = athletes.get(record.reservaEntrouId);
    result.set(record.reservaEntrouId, { direction: "in", label: `Entrou no lugar de ${outgoing?.apelido ?? record.titularSaiuId}` });
    result.set(record.titularSaiuId, { direction: "out", label: `Saiu por ${incoming?.apelido ?? record.reservaEntrouId}` });
  }
  return result;
}

export function effectiveLineup(team: CartolaTeamLineupResponse) {
  if (team.substituicoes === undefined) return { players: team.atletas ?? [], reserves: team.reservas ?? [] };
  const unique = new Map<number, CartolaTeamLineupAthlete>();
  for (const player of [...(team.atletas ?? []), ...(team.reservas ?? [])]) {
    if (!unique.has(player.atleta_id)) unique.set(player.atleta_id, player);
  }
  return {
    players: [...unique.values()].filter((player) => player.titularEfetivo === true),
    reserves: [...unique.values()].filter((player) => player.titularEfetivo === false),
  };
}

export const isLuxuryReserve = (player: CartolaTeamLineupAthlete, effective: boolean, legacyId?: number | null) => effective
  ? player.reservaLuxo === true && (player.titularEfetivo === true || player.reservaLuxoUtilizado === false)
  : player.atleta_id === legacyId;
