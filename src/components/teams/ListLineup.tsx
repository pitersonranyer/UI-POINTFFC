import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { playerPhoto, positionLabel } from "./LineupPlayerCard";
import type { CartolaClub, CartolaTeamLineupAthlete } from "@/types/cartola";
import styles from "./TeamDetail.module.css";
import enhancements from "./TeamDetailEnhancements.module.css";
import { substitutionStatusByAthlete, type SubstitutionStatus } from "./lineupSubstitutions";

const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Props = { players: CartolaTeamLineupAthlete[]; reserves: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null };
export function ListLineup({ players, reserves, clubs, captainId, luxuryReserveId }: Props) {
  const ordered = (items: CartolaTeamLineupAthlete[]) => [...items].sort((a, b) => a.posicao_id - b.posicao_id);
  const substitutions = substitutionStatusByAthlete(players, reserves);
  return <div className={styles.listView}><PlayerList title="Titulares" players={ordered(players)} clubs={clubs} captainId={captainId} luxuryReserveId={luxuryReserveId} substitutions={substitutions}/>{reserves.length > 0 && <PlayerList title="Banco de reservas" players={ordered(reserves)} clubs={clubs} luxuryReserveId={luxuryReserveId} substitutions={substitutions}/>}</div>;
}
function PlayerList({ title, players, clubs, captainId, luxuryReserveId, substitutions }: { title: string; players: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null; substitutions: Map<number, SubstitutionStatus> }) {
  return <section className={styles.playerList}><h3>{title}</h3>{players.map((player) => { const club = clubs[String(player.clube_id)] ?? {}, photo = playerPhoto(player.foto), substitution = substitutions.get(player.atleta_id); return <article key={player.atleta_id}><b>{positionLabel[player.posicao_id] ?? "--"}</b><span className={`${styles.listPhoto} ${enhancements.listPhotoWithBadge}`}>{photo ? <img src={photo} alt="" /> : player.apelido.charAt(0)}{player.atleta_id === captainId && <i className={styles.captain} title="Capitão">C</i>}</span><span><strong>{player.apelido}{substitution && <i className={`${enhancements.listSubstitution} ${substitution === "in" ? enhancements.substitutionIn : enhancements.substitutionOut}`} title={substitution === "in" ? "Entrou na substituição" : "Saiu na substituição"}>{substitution === "in" ? <ArrowUp /> : <ArrowDown />}</i>}</strong><small>{club.nome ?? club.abreviacao ?? `Clube ${player.clube_id}`}</small>{player.atleta_id === luxuryReserveId && <em className={styles.listLuxury}><Star />Reserva de luxo</em>}</span>{player.pontos_num != null && <strong className={styles.listPoints}>{points.format(player.pontos_num)} pts</strong>}</article>; })}</section>;
}
