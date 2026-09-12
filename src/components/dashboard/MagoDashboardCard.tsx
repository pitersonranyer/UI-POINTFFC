"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, Flame, Swords, Target, TriangleAlert, WandSparkles } from "lucide-react";
import type { MagoRound } from "@/types/mago-premium";
import styles from "./MagoDashboardCard.module.css";

const number = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const labels = ["SG do Mago", "Melhores ataques", "Especialistas", "Alerta do Mago"];

export function MagoDashboardCard({ data }: { data: MagoRound }) {
  const carousel = useRef<HTMLDivElement>(null);
  const carouselId = useId();
  const [active, setActive] = useState(0);
  const pick = data.topSg[0];
  const attack = data.ataques[0];
  const platoon = data.pelotoes[0];
  const favorites = new Set(data.convergencia.find(item => item.rotulo === "Pelotão 1 confirmados pelo Mago")?.valor.split(/, | e /) ?? []);
  const overlap = platoon.clubes.filter(clube => favorites.has(clube)).length;
  function goTo(index: number) {
    const element = carousel.current;
    if (!element) return;
    element.scrollTo({ left: index * element.clientWidth, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    setActive(index);
  }
  return <section className={styles.card} aria-labelledby="dashboard-mago-title">
    <header className={styles.header}>
      <WandSparkles className={styles.icon} aria-hidden="true" />
      <div className={styles.identity}><h2 id="dashboard-mago-title">Mago do Point Fantasy</h2><p>Inteligência para sua rodada</p></div>
      <span className={styles.badge}>Rodada {data.rodada}</span>
    </header>
    <div ref={carousel} id={carouselId} className={styles.carousel} role="region" aria-label="Insights do Mago" aria-roledescription="carrossel" tabIndex={0}
      onScroll={event => setActive(Math.max(0, Math.min(3, Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))))}
      onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); goTo(Math.max(0, Math.min(3, active + (event.key === "ArrowRight" ? 1 : -1)))); } }}>
      <article className={styles.slide} aria-label="1 de 4: SG do Mago">
        <h3><Flame aria-hidden="true" /> SG do Mago</h3>
        <div className={styles.insight}><div className={styles.highlight}><span>{pick.clube}</span><strong>{number.format(pick.sg)}%</strong><small>Confiança: {pick.confianca}</small></div>
          <ol className={styles.ranking}>{data.topSg.slice(0, 3).map(team => <li key={team.clube}><span>{team.clube}</span><strong>{number.format(team.sg)}%</strong></li>)}</ol></div>
      </article>
      <article className={styles.slide} aria-label="2 de 4: Melhores ataques">
        <h3><Swords aria-hidden="true" /> Melhores ataques</h3>
        <div className={styles.insight}><div className={styles.highlight}><span>{attack.clube}</span><strong>{number.format(attack.xg)} xG</strong><small>Maior xG projetado da R{data.rodada}</small></div>
          <ol className={styles.ranking}>{data.ataques.slice(0, 3).map(team => <li key={team.clube}><span>{team.clube}</span><strong>{number.format(team.xg)} xG</strong></li>)}</ol></div>
      </article>
      <article className={styles.slide} aria-label="3 de 4: Especialistas">
        <h3><Target aria-hidden="true" /> Especialistas</h3>
        <div className={styles.specialists}><strong>{platoon.nome}</strong><div className={styles.chips}>{platoon.clubes.map(clube => <span key={clube}>{clube}</span>)}</div><p>{overlap} dos principais nomes também estão entre os favoritos do Mago.</p></div>
      </article>
      <article className={`${styles.slide} ${styles.warning}`} aria-label="4 de 4: Alerta do Mago">
        <h3><TriangleAlert aria-hidden="true" /> Alerta do Mago</h3>
        <div className={styles.insight}><div className={styles.highlight}><span>{data.alerta.clube}</span><strong>{number.format(data.alerta.sg)}% SG</strong><small>Risco alto para SG</small></div>
          <p className={styles.opponent}>Adversário: <b>{data.alerta.adversario}</b><br />{data.alerta.adversario}: <b>{data.alerta.xgAdversario === null ? "—" : number.format(data.alerta.xgAdversario)} xG projetado</b></p></div>
      </article>
    </div>
    <div className={styles.dots} aria-label="Selecionar insight">{labels.map((label, index) => <button key={label} type="button" aria-label={`Ir para ${label}`} aria-controls={carouselId} aria-current={active === index ? "true" : undefined} onClick={() => goTo(index)} />)}</div>
    <footer className={styles.footer}><Link href="/mago">Ver análise completa <ArrowRight size={17} aria-hidden="true" /></Link></footer>
  </section>;
}
