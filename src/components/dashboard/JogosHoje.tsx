"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useJogosHoje } from "@/hooks/useJogosHoje";
import { futebolStatus } from "@/lib/futebolStatus";
import { FutebolShield } from "@/components/matches/FutebolMatch";
import type { FutebolJogoHoje } from "@/types/futebol";
import shared from "@/components/matches/FutebolMatches.module.css";
import styles from "./JogosHoje.module.css";

function Match({ jogo }: { jogo: FutebolJogoHoje }) {
  const { label, scheduled, score } = futebolStatus(jogo);
  const date = new Date(jogo.dataHoraUtc);
  const time = Number.isNaN(date.getTime()) ? "A definir" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return <article className={styles.match} aria-label={`${jogo.mandante.nome} contra ${jogo.visitante.nome}`}>
    <div className={styles.meta}><time dateTime={jogo.dataHoraUtc}>{time}</time><span title={jogo.competicao.nome}>{jogo.competicao.nomeCurto || jogo.competicao.nome}</span></div>
    {[jogo.mandante, jogo.visitante].map((team, index) => <div className={styles.team} key={index}>
      <FutebolShield team={team} /><strong title={team.nome}>{team.nomeCurto || team.nome}</strong>
      {score && <b aria-label={`Placar do ${team.nome}`}>{index === 0 ? jogo.placar.mandante : jogo.placar.visitante}</b>}
    </div>)}
    <small className={jogo.status === "IN_PLAY" ? styles.live : styles.status}>{scheduled ? `Às ${time}` : label}</small>
  </article>;
}

export function JogosHoje() {
  const { data, loading, error, atualizar } = useJogosHoje();
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
  const hasGames = !loading && !error && data && data.total > 0 && data.jogos.length > 0;
  return <section className={`${shared.card} ${styles.section}`} aria-label="Jogos de hoje">
    <header><h2>Jogos de hoje</h2><div className={shared.headingActions}>
      {hasGames && <div className={`${shared.controls} ${styles.controls}`} aria-label="Navegação dos jogos de hoje">
        <button type="button" aria-label="Jogos de hoje anteriores" aria-controls={carouselId} disabled={!arrows.previous} onClick={() => move(-1)}><ArrowLeft size={17} /></button>
        <button type="button" aria-label="Próximos jogos de hoje" aria-controls={carouselId} disabled={!arrows.next} onClick={() => move(1)}><ArrowRight size={17} /></button>
      </div>}
      <Link className={shared.viewAll} href="/jogos">Ver todos <ArrowRight size={14} /></Link>
    </div></header>
    {loading ? <div role="status" aria-label="Carregando jogos de hoje" className={styles.skeletonTrack}>{Array.from({ length: 6 }, (_, index) => <div key={index} className={`${styles.match} ${styles.skeleton}`} aria-hidden="true" />)}</div>
      : error ? <div className={styles.message}><p role="alert">{error}</p><button type="button" onClick={atualizar}>Tentar novamente</button></div>
      : !hasGames ? <p className={styles.message}>Nenhum jogo programado para hoje.</p>
      : <div className={styles.carousel} ref={carousel} id={carouselId} role="region" aria-label="Carrossel de jogos de hoje" aria-roledescription="carrossel" tabIndex={0} onScroll={updateArrows} onKeyDown={event => {
        if (event.target === event.currentTarget && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
      }}>{data.jogos.map(jogo => <Match key={jogo.id} jogo={jogo} />)}</div>}
  </section>;
}
