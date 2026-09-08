import type { CartolaTeamLineupAthlete, CartolaTeamSubstitution } from "@/types/cartola";

type Player = CartolaTeamLineupAthlete;
export type FieldLine = "attack" | "midfield" | "defense" | "goalkeeper";

/** The effective position counts are the formation already used by TeamDetailPage.
 * Original players supply ordering only; every rendered player comes from effectivePlayers.
 */
export function getFieldPositions(
  effectivePlayers: Player[],
  originalPlayers: Player[] = effectivePlayers,
  substitutions: CartolaTeamSubstitution[] = [],
) {
  const originalOrder = new Map(originalPlayers.map((player, index) => [player.atleta_id, index]));
  const replaced = new Map(substitutions.filter((record) => record.ativa)
    .map((record) => [record.reservaEntrouId, record.titularSaiuId]));
  const order = (player: Player, index: number) =>
    originalOrder.get(replaced.get(player.atleta_id) ?? player.atleta_id) ?? originalPlayers.length + index;
  const unique = [...new Map(effectivePlayers.map((player) => [player.atleta_id, player])).values()];
  const ordered = unique.map((player, index) => ({ player, order: order(player, index) }))
    .sort((a, b) => a.order - b.order).map(({ player }) => player);
  const fullbacks = ordered.filter((player) => player.posicao_id === 2);
  const centerbacks = ordered.filter((player) => player.posicao_id === 3);
  // Keep the received order within each role, placing fullbacks outside the centerbacks.
  const leftCount = Math.ceil(fullbacks.length / 2);
  const defense = [...fullbacks.slice(0, leftCount), ...centerbacks, ...fullbacks.slice(leftCount)];
  const rows: { line: FieldLine; players: Player[] }[] = [
    { line: "attack", players: ordered.filter((player) => player.posicao_id === 5) },
    { line: "midfield", players: ordered.filter((player) => player.posicao_id === 4) },
    { line: "defense", players: defense },
    { line: "goalkeeper", players: ordered.filter((player) => player.posicao_id === 1) },
  ];
  return rows;
}
