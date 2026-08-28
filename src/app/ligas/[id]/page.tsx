import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, CircleDollarSign, ShieldCheck, Trophy, Users } from "lucide-react";
import { EnrollButton } from "@/components/ui/EnrollButton";
import { leagueService } from "@/services/leagueService";
import { formatCurrency } from "@/lib/format";
import styles from "./page.module.css";

export function generateStaticParams() { return leagueService.getAll().map(({ id }) => ({ id })); }

export default function LeagueDetails({ params }: { params: { id: string } }) {
  const { id } = params;
  const league = leagueService.getById(id);
  if (!league) notFound();
  return (
    <div className="page-shell">
      <Link href="/ligas" className={styles.back}><ArrowLeft size={17} /> Voltar para ligas</Link>
      <section className={styles.hero}>
        <div><span className={styles.category}>{league.category}</span><h1>{league.name}</h1><p>Organizada por <strong>{league.organizer}</strong></p></div>
        <div className={styles.heroPrize}><small>Premiação</small><strong>{formatCurrency(league.prizePool)}</strong></div>
      </section>
      <div className={styles.stats}>
        <div><CircleDollarSign /><span><small>Inscrição</small><strong>{formatCurrency(league.entryFee)}</strong></span></div>
        <div><Users /><span><small>Times inscritos</small><strong>{league.currentParticipants}</strong></span></div>
        <div><Trophy /><span><small>Premiação</small><strong>{formatCurrency(league.prizePool)}</strong></span></div>
        <div><CalendarClock /><span><small>Mercado fecha</small><strong>{league.marketCloseDate}</strong></span></div>
      </div>
      <div className={styles.layout}>
        <div className={styles.content}>
          <section><h2>Sobre a liga</h2><p>{league.description}</p></section>
          <section><h2>Regras básicas</h2><ul>{league.rules.map((rule) => <li key={rule}><ShieldCheck size={18} />{rule}</li>)}</ul></section>
          <section><h2>Distribuição da premiação</h2><div className={styles.prizes}>{league.prizeDistribution.map((tier) => <div key={tier.position}><span>{tier.position}</span><strong>{tier.value} do prêmio</strong></div>)}</div></section>
        </div>
        <aside className={styles.aside}><p>Inscreva um ou vários times e participe desta rodada.</p><EnrollButton leagueId={league.id} leagueName={league.name} entryFee={league.entryFee} maxTeamsPerUser={league.maxTeamsPerUser} /><small>Você também pode participar de outras ligas com o mesmo time.</small></aside>
      </div>
    </div>
  );
}
