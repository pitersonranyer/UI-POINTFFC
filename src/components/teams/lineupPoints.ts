import type { CartolaTeamLineupAthlete } from "@/types/cartola";

const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function lineupPoints(player: CartolaTeamLineupAthlete, effective: boolean) {
  const value = effective && player.titularEfetivo !== false ? player.pontuacaoContabilizada : player.pontos_num;
  if (player.entrou_em_campo === false || value == null ||
    (value === 0 && player.entrou_em_campo !== true)) return "-- pts";
  return `${points.format(value)} pts`;
}
