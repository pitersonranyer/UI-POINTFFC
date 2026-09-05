import type { CartolaTeamLineupAthlete } from "@/types/cartola";

export type SubstitutionStatus = "in" | "out";

export function substitutionStatusByAthlete(players: CartolaTeamLineupAthlete[], reserves: CartolaTeamLineupAthlete[]) {
  const status = new Map<number, SubstitutionStatus>();
  const availableOutgoing = players.filter((player) => player.posicao_id !== 6 && player.entrou_em_campo === false);

  for (const reserve of reserves.filter((player) => player.entrou_em_campo === true)) {
    const outgoingIndex = availableOutgoing.findIndex((player) => player.posicao_id === reserve.posicao_id);
    if (outgoingIndex < 0) continue;
    const [outgoing] = availableOutgoing.splice(outgoingIndex, 1);
    status.set(outgoing.atleta_id, "out");
    status.set(reserve.atleta_id, "in");
  }
  return status;
}
