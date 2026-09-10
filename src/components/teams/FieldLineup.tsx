import { LineupPlayerCard } from "./LineupPlayerCard";
import type { CartolaClub, CartolaTeamLineupAthlete, CartolaTeamSubstitution } from "@/types/cartola";
import styles from "./TeamDetail.module.css";
import layout from "./FieldLayout.module.css";
import { getFieldPositions } from "./fieldPositions";
import enhancements from "./TeamDetailEnhancements.module.css";
import { isLuxuryReserve, substitutionStatusByAthlete, type SubstitutionStatus } from "./lineupSubstitutions";

type Props = { players: CartolaTeamLineupAthlete[]; reserves: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null; records?: CartolaTeamSubstitution[]; originalPlayers?: CartolaTeamLineupAthlete[] };
export function FieldLineup({ players, reserves, clubs, captainId, luxuryReserveId, records, originalPlayers }: Props) {
  const coach = players.find((player) => player.posicao_id === 6);
  const effective = records !== undefined;
  const substitutions = substitutionStatusByAthlete(players, reserves, records);
  const rows = getFieldPositions(players, originalPlayers, records);
  return <><section className={`${styles.pitch} ${layout.field}`} aria-label="Escalação no campo">{rows.map(({ line, players: row }) => <div className={layout.row} key={line} data-field-line={line} style={{ gridTemplateColumns: `repeat(${Math.max(1, row.length)}, minmax(0, 1fr))` }}>{row.map((player) => <div className={layout.slot} key={player.atleta_id}><LineupPlayerCard player={player} clubs={clubs} isCaptain={(effective ? player.capitaoEfetivo === true : player.atleta_id === captainId)} isLuxuryReserve={isLuxuryReserve(player, effective, luxuryReserveId)} substitution={substitutions.get(player.atleta_id)} effective={effective} /></div>)}</div>)}{coach && <div className={enhancements.coachOnField}><span>Técnico</span><LineupPlayerCard player={coach} clubs={clubs} compact effective={effective} isCaptain={effective && coach.capitaoEfetivo === true} substitution={substitutions.get(coach.atleta_id)} /></div>}</section><Bench players={reserves} clubs={clubs} luxuryReserveId={luxuryReserveId} substitutions={substitutions} effective={effective} /></>;
}

export function Bench({ players, clubs, luxuryReserveId, substitutions = new Map(), effective = false }: { players: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; luxuryReserveId?: number | null; substitutions?: Map<number, SubstitutionStatus>; effective?: boolean }) {
  if (!players.length) return null;
  return <section className={styles.bench}><h3>Banco de reservas</h3><div>{[...players].sort((a, b) => a.posicao_id - b.posicao_id).map((player) => <LineupPlayerCard key={player.atleta_id} player={player} clubs={clubs} isReserve compact isCaptain={effective && player.capitaoEfetivo === true} isLuxuryReserve={isLuxuryReserve(player, effective, luxuryReserveId)} substitution={substitutions.get(player.atleta_id)} effective={effective} />)}</div></section>;
}
