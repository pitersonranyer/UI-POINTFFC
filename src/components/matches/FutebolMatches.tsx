"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useFutebolRodada } from "@/hooks/useFutebolRodada";
import { FutebolMatchInfo, FutebolShield } from "./FutebolMatch";
import styles from "./FutebolMatches.module.css";

export function FutebolMatches() {
  const { data, loading, error } = useFutebolRodada();
  const carousel = useRef<HTMLDivElement>(null);
  const carouselId = useId();
  const [arrows, setArrows] = useState({ previous: false, next: false });
  const updateArrows = useCallback(() => {
    const element = carousel.current;
    if (element) setArrows({ previous: element.scrollLeft > 1, next: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 });
  }, []);
  useEffect(() => {
    const element = carousel.current;
    if (!element) return;
    updateArrows();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateArrows) : null;
    observer?.observe(element);
    window.addEventListener("resize", updateArrows);
    return () => { observer?.disconnect(); window.removeEventListener("resize", updateArrows); };
  }, [data, loading, error, updateArrows]);
  function move(direction: number) {
    const element = carousel.current;
    if (!element) return;
    element.scrollBy({ left: direction * (element.clientWidth + 10), behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  return <section className={styles.card} aria-label="Jogos da Rodada">
    <header><h2>Jogos da Rodada</h2><div className={styles.headingActions}>{data?.rodada != null && <span>Rodada {data.rodada}</span>}<Link className={styles.viewAll} href="/jogos">Ver todos <ArrowRight size={14} /></Link></div></header>
    {loading ? <p role="status">Carregando jogos da rodada...</p> : error ? <p role="alert">{error}</p> : !data || data.rodada == null || !data.jogos.length ? <p>Nenhum jogo disponível no momento.</p> :
      <><div className={styles.carousel} ref={carousel} id={carouselId} role="region" aria-label="Carrossel de jogos da rodada" aria-roledescription="carrossel" tabIndex={0} onScroll={updateArrows} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>{data.jogos.map(jogo => <Link className={styles.match} key={jogo.id} href={`/jogos?futebol=${jogo.id}`} aria-label={`Ver detalhes de ${jogo.mandante.nome} contra ${jogo.visitante.nome}`}>
        <div className={styles.team}><FutebolShield team={jogo.mandante} /><strong>{jogo.mandante.nome}</strong></div>
        <FutebolMatchInfo jogo={jogo} />
        <div className={styles.team}><FutebolShield team={jogo.visitante} /><strong>{jogo.visitante.nome}</strong></div>
      </Link>)}</div><div className={styles.controls} aria-label="Navegação dos jogos"><button type="button" aria-label="Jogos anteriores" aria-controls={carouselId} disabled={!arrows.previous} onClick={() => move(-1)}><ArrowLeft size={17} /></button><button type="button" aria-label="Próximos jogos" aria-controls={carouselId} disabled={!arrows.next} onClick={() => move(1)}><ArrowRight size={17} /></button></div></>}
  </section>;
}
