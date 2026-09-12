import Link from "next/link";
import { ArrowRight, Flame, Swords, WandSparkles } from "lucide-react";
import type { MagoRound } from "@/types/mago-premium";
import styles from "./MagoDashboardCard.module.css";

const number = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function MagoDashboardCard({ data }: { data: MagoRound }) {
  const pick = data.topSg[0];
  const attack = data.ataques[0];
  return <section className={styles.card} aria-labelledby="dashboard-mago-title">
    <header className={styles.header}>
      <WandSparkles className={styles.icon} aria-hidden="true" />
      <div><h2 id="dashboard-mago-title">Mago do Point Fantasy</h2><p>Inteligência para sua rodada</p></div>
      <span className={styles.badge}>Rodada {data.rodada}</span>
    </header>
    <div className={styles.content}>
      <div className={styles.pick}>
        <h3><Flame size={20} aria-hidden="true" /> {pick.clube} é o SG nº 1 do Mago</h3>
        <p><strong className={styles.probability}>{number.format(pick.sg)}%</strong> de probabilidade de SG</p>
        {pick.xgAdversario !== null && <p>{pick.adversario}: <b>{number.format(pick.xgAdversario)} xG projetado</b></p>}
        <span className={styles.confidence}>Confiança: {pick.confianca}</span>
      </div>
      <div className={styles.summary}>
        <h3>Top 3 SG</h3>
        <ol>{data.topSg.slice(0, 3).map(team => <li key={team.clube}><span>{team.clube}</span><strong>{number.format(team.sg)}%</strong></li>)}</ol>
        <p className={styles.attack}><Swords size={18} aria-hidden="true" /><span>Melhor ataque<br /><b>{attack.clube} — {number.format(attack.xg)} xG</b></span></p>
      </div>
    </div>
    <footer className={styles.footer}><small>Análise e projeções do Mago · R{data.rodada}</small><Link href="/mago">Ver análise completa <ArrowRight size={17} aria-hidden="true" /></Link></footer>
  </section>;
}
