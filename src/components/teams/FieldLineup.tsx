import { LineupPlayerCard } from "./LineupPlayerCard";
import type { CartolaClub, CartolaTeamLineupAthlete } from "@/types/cartola";
import styles from "./TeamDetail.module.css";

type Props = { players: CartolaTeamLineupAthlete[]; reserves: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null };
export function FieldLineup({ players, reserves, clubs, captainId, luxuryReserveId }: Props) {
  const coach = players.find((player) => player.posicao_id === 6);
  const rows = [5, 4, 3, 2, 1].map((position) => position === 3 ? players.filter((player) => player.posicao_id === 2 || player.posicao_id === 3) : position === 2 ? [] : players.filter((player) => player.posicao_id === position)).filter((row) => row.length);
  return <><section className={styles.pitch} aria-label="Escalação no campo">{rows.map((row, index) => <div className={styles.fieldRow} key={index}>{row.map((player) => <LineupPlayerCard key={player.atleta_id} player={player} clubs={clubs} isCaptain={player.atleta_id === captainId} isLuxuryReserve={player.atleta_id === luxuryReserveId} />)}</div>)}</section>{coach && <section className={styles.coach}><h3>Técnico</h3><LineupPlayerCard player={coach} clubs={clubs} compact /></section>}<Bench players={reserves} clubs={clubs} luxuryReserveId={luxuryReserveId} /></>;
}

export function Bench({ players, clubs, luxuryReserveId }: { players: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; luxuryReserveId?: number | null }) {
  if (!players.length) return null;
  return <section className={styles.bench}><h3>Banco de reservas</h3><div>{players.map((player) => <LineupPlayerCard key={player.atleta_id} player={player} clubs={clubs} isReserve compact isLuxuryReserve={player.atleta_id === luxuryReserveId} />)}</div></section>;
}
