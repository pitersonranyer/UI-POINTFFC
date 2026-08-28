import { Clock3, Trophy, Users } from "lucide-react";
import type { League } from "@/types/league";
import { formatCurrency } from "@/lib/format";
import { EnrollButton } from "@/components/ui/EnrollButton";
import styles from "./FeaturedLeague.module.css";

export function FeaturedLeague({ league }: { league: League }) {
  return (
    <section className={styles.card}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <span className={styles.badge}>Liga oficial</span>
        <p className={styles.category}>{league.category}</p>
        <h1>{league.name}</h1>
        <p className={styles.lead}>Seu time. Sua rodada. Seu prêmio.</p>
        <div className={styles.prize}><small>Premiação garantida</small><strong>{formatCurrency(league.prizePool)}</strong></div>
        <div className={styles.stats}>
          <span><Users size={18} /><b>{league.currentParticipants}</b> times inscritos</span>
          <span><Trophy size={18} />Inscrição <b>{formatCurrency(league.entryFee)}</b></span>
          <span><Clock3 size={18} />Fecha {league.marketCloseDate}</span>
        </div>
        <EnrollButton leagueId={league.id} leagueName={league.name} entryFee={league.entryFee} maxTeamsPerUser={league.maxTeamsPerUser} />
      </div>
      <div className={styles.emblem} aria-hidden="true"><Trophy size={78} strokeWidth={1.5} /></div>
    </section>
  );
}
