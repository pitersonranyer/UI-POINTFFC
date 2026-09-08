import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { nomeClube, obterClube } from "@/lib/cartola";
import { LineupListImage } from "./LineupListImage";
import type { CartolaClub, CartolaTeamLineupAthlete } from "@/types/cartola";
import styles from "./TeamDetail.module.css";
import enhancements from "./TeamDetailEnhancements.module.css";
import type { SubstitutionStatus } from "./lineupSubstitutions";

export const positionLabel: Record<number, string> = { 1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC" };
import { lineupPoints } from "./lineupPoints";
export const playerPhoto = (url?: string) => url?.replace("FORMATO", "140x140") ?? "";

export interface LineupPlayerCardProps {
  player: CartolaTeamLineupAthlete; clubs: Record<string, CartolaClub>; isCaptain?: boolean; isReserve?: boolean; isLuxuryReserve?: boolean; compact?: boolean; substitution?: SubstitutionStatus; effective?: boolean;
}

export function LineupPlayerCard({ player, clubs, isCaptain = false, isReserve = false, isLuxuryReserve = false, compact = false, substitution, effective = false }: LineupPlayerCardProps) {
  const club = obterClube(clubs, player.clube_id), photo = playerPhoto(player.foto);
  return <article className={`${styles.playerCard} ${compact ? styles.compactPlayer : ""}`} data-reserve={isReserve || undefined}>
    <span className={styles.playerPhoto}><LineupListImage key={player.atleta_id} photo={photo} club={club} name={player.apelido} />{isCaptain && <b className={styles.captain} title="Capitão">C</b>}</span>
    <strong title={player.nome}>{player.apelido}</strong>
    <small>{positionLabel[player.posicao_id] ?? "--"}{club.abreviacao ? ` · ${club.abreviacao}` : ` · ${nomeClube(club, player.clube_id)}`}</small>
    {substitution && <span className={`${enhancements.substitutionLine} ${substitution.direction === "in" ? enhancements.entryLine : enhancements.exitLine}`}>{substitution.direction === "in" ? <ArrowUp /> : <ArrowDown />}{substitution.label}</span>}
    <em>{lineupPoints(player, effective)}</em>
    {isLuxuryReserve && <span className={styles.luxury}><Star />Reserva de luxo</span>}
  </article>;
}
