import { ArrowDown, ArrowUp, ImageOff, Star } from "lucide-react";
import { escudoClube, nomeClube, obterClube } from "@/lib/cartola";
import type { CartolaClub, CartolaTeamLineupAthlete } from "@/types/cartola";
import styles from "./TeamDetail.module.css";
import enhancements from "./TeamDetailEnhancements.module.css";
import type { SubstitutionStatus } from "./lineupSubstitutions";

export const positionLabel: Record<number, string> = { 1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC" };
const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const playerPhoto = (url?: string) => url?.replace("FORMATO", "140x140") ?? "";

export interface LineupPlayerCardProps {
  player: CartolaTeamLineupAthlete; clubs: Record<string, CartolaClub>; isCaptain?: boolean; isReserve?: boolean; isLuxuryReserve?: boolean; compact?: boolean; substitution?: SubstitutionStatus;
}

export function LineupPlayerCard({ player, clubs, isCaptain = false, isReserve = false, isLuxuryReserve = false, compact = false, substitution }: LineupPlayerCardProps) {
  const club = obterClube(clubs, player.clube_id), photo = playerPhoto(player.foto), shield = escudoClube(club);
  return <article className={`${styles.playerCard} ${compact ? styles.compactPlayer : ""}`} data-reserve={isReserve || undefined}>
    <span className={styles.playerPhoto}>{photo ? <img src={photo} alt="" /> : <ImageOff />}{isCaptain && <b className={styles.captain} title="Capitão">C</b>}{substitution && <i className={`${enhancements.substitution} ${substitution === "in" ? enhancements.substitutionIn : enhancements.substitutionOut}`} title={substitution === "in" ? "Entrou na substituição" : "Saiu na substituição"} aria-label={substitution === "in" ? "Entrou" : "Saiu"}>{substitution === "in" ? <ArrowUp /> : <ArrowDown />}</i>}</span>
    <strong title={player.nome}>{player.apelido}</strong>
    <small>{positionLabel[player.posicao_id] ?? "--"}{club.abreviacao ? ` · ${club.abreviacao}` : ` · ${nomeClube(club, player.clube_id)}`}</small>
    {player.pontos_num != null && <em>{points.format(player.pontos_num)} pts</em>}
    {isLuxuryReserve && <span className={styles.luxury}><Star />Reserva de luxo</span>}
    {shield && <img className={styles.clubShield} src={shield} alt="" />}
  </article>;
}
