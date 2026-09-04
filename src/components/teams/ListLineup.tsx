import { Star } from "lucide-react";
import { playerPhoto, positionLabel } from "./LineupPlayerCard";
import type { CartolaClub, CartolaTeamLineupAthlete } from "@/types/cartola";
import styles from "./TeamDetail.module.css";

const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Props = { players: CartolaTeamLineupAthlete[]; reserves: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null };
export function ListLineup({ players, reserves, clubs, captainId, luxuryReserveId }: Props) {
  const ordered = (items: CartolaTeamLineupAthlete[]) => [...items].sort((a, b) => a.posicao_id - b.posicao_id);
  return <div className={styles.listView}><PlayerList title="Titulares" players={ordered(players)} clubs={clubs} captainId={captainId} luxuryReserveId={luxuryReserveId}/>{reserves.length > 0 && <PlayerList title="Banco de reservas" players={ordered(reserves)} clubs={clubs} luxuryReserveId={luxuryReserveId}/>}</div>;
}
function PlayerList({ title, players, clubs, captainId, luxuryReserveId }: { title: string; players: CartolaTeamLineupAthlete[]; clubs: Record<string, CartolaClub>; captainId?: number | null; luxuryReserveId?: number | null }) {
  return <section className={styles.playerList}><h3>{title}</h3>{players.map((player) => { const club = clubs[String(player.clube_id)] ?? {}, photo = playerPhoto(player.foto); return <article key={player.atleta_id}><b>{positionLabel[player.posicao_id] ?? "--"}</b><span className={styles.listPhoto}>{photo ? <img src={photo} alt="" /> : player.apelido.charAt(0)}</span><span><strong>{player.apelido}{player.atleta_id === captainId && <i className={styles.listCaptain}>C</i>}</strong><small>{club.nome ?? club.abreviacao ?? `Clube ${player.clube_id}`}</small>{player.atleta_id === luxuryReserveId && <em className={styles.listLuxury}><Star />Reserva de luxo</em>}</span>{player.pontos_num != null && <strong className={styles.listPoints}>{points.format(player.pontos_num)} pts</strong>}</article>; })}</section>;
}
