import { LeagueList } from "@/components/leagues/LeagueList";
import { leagueService } from "@/services/leagueService";
import styles from "./page.module.css";

export default function LeaguesPage() {
  const leagues = leagueService.getOpen();
  return (
    <div className="page-shell">
      <header className={styles.header}><p className="eyebrow">Mercado aberto</p><h1 className="page-title">Encontre sua próxima liga</h1><p className="page-subtitle">Escolha uma ou mais disputas e coloque seu time para jogo.</p></header>
      <LeagueList leagues={leagues} />
    </div>
  );
}
