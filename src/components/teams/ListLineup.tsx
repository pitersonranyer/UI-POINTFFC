import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { LineupListImage } from "./LineupListImage";
import { playerPhoto, positionLabel } from "./LineupPlayerCard";
import type { CartolaClub, CartolaTeamLineupAthlete, CartolaTeamSubstitution } from "@/types/cartola";
import styles from "./TeamDetail.module.css";
import enhancements from "./TeamDetailEnhancements.module.css";
import { isLuxuryReserve, substitutionStatusByAthlete, type SubstitutionStatus } from "./lineupSubstitutions";

import { lineupPoints } from "./lineupPoints";
type Props = { players: CartolaTeamLineupAthlete[]; reserves: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null; records?: CartolaTeamSubstitution[] };
export function ListLineup({ players, reserves, clubs, captainId, luxuryReserveId, records }: Props) {
  const ordered = (items: CartolaTeamLineupAthlete[]) => [...items].sort((a, b) => a.posicao_id - b.posicao_id);
  const effective = records !== undefined;
  const substitutions = substitutionStatusByAthlete(players, reserves, records);
  return <div className={styles.listView}><PlayerList title="Titulares" players={ordered(players)} clubs={clubs} captainId={captainId} luxuryReserveId={luxuryReserveId} substitutions={substitutions} effective={effective}/>{reserves.length > 0 && <PlayerList title="Banco de reservas" players={ordered(reserves)} clubs={clubs} luxuryReserveId={luxuryReserveId} substitutions={substitutions} effective={effective}/>}</div>;
}
function PlayerList({ title, players, clubs, captainId, luxuryReserveId, substitutions, effective }: { title: string; players: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null; substitutions: Map<number, SubstitutionStatus>; effective: boolean }) {
  return <section className={styles.playerList}><h3>{title}</h3>{players.map((player) => { const club = clubs[String(player.clube_id)] ?? {}, photo = playerPhoto(player.foto), substitution = substitutions.get(player.atleta_id); return <article key={player.atleta_id}><b>{positionLabel[player.posicao_id] ?? "--"}</b><span className={`${styles.listPhoto} ${enhancements.listPhotoWithBadge}`}><LineupListImage key={player.atleta_id} photo={photo} club={club} name={player.apelido} />{(effective ? player.capitaoEfetivo === true : player.atleta_id === captainId) && <i className={styles.captain} title="Capitão">C</i>}</span><span><strong>{player.apelido}</strong><small>{club.nome ?? club.abreviacao ?? `Clube ${player.clube_id}`}</small>{substitution && <span className={`${enhancements.substitutionLine} ${substitution.direction === "in" ? enhancements.entryLine : enhancements.exitLine}`}>{substitution.direction === "in" ? <ArrowUp /> : <ArrowDown />}{substitution.label}</span>}{isLuxuryReserve(player, effective, luxuryReserveId) && <em className={styles.listLuxury}><Star />Reserva de luxo</em>}</span><strong className={styles.listPoints}>{lineupPoints(player, effective)}</strong></article>; })}</section>;
}
