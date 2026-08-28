import Link from "next/link";
import { Clock3, Trophy, Users } from "lucide-react";
import type { League } from "@/types/league";
import { formatCurrency } from "@/lib/format";
import styles from "./LeagueList.module.css";
import { EnrollButton } from "@/components/ui/EnrollButton";

export function LeagueList({ leagues }: { leagues: League[] }) {
  return (
    <div className={styles.list}>
      {leagues.map((league) => (
        <article className={styles.item} key={league.id}>
          <Link href={`/ligas/${league.id}`} className={styles.main}>
            <span className={styles.icon}><Trophy size={20} /></span>
            <span className={styles.heading}><strong>{league.name}</strong><small>{league.category}</small></span>
            <span className={styles.meta}><Users size={15} />{league.currentParticipants} times</span>
            <span className={styles.meta}><Trophy size={15} />{formatCurrency(league.prizePool)}</span>
            <span className={styles.meta}><Clock3 size={15} />{league.marketCloseDate}</span>
            <span className={styles.price}>{formatCurrency(league.entryFee)}</span>
          </Link>
          <EnrollButton compact leagueId={league.id} leagueName={league.name} entryFee={league.entryFee} maxTeamsPerUser={league.maxTeamsPerUser} />
        </article>
      ))}
    </div>
  );
}
