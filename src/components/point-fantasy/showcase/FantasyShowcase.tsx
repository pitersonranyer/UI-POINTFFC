"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, RefreshCw, Trophy } from "lucide-react";
import { lineupError, listFantasyCompetitions } from "@/services/pointFantasyLineupService";
import type { FantasyCompetition } from "@/types/pointFantasyLineup";
import { FantasyLineupBuilder } from "../lineups/FantasyLineupBuilder";
import { competitionAvailability, competitionDeadline, competitionIdFromSearch } from "./competitionPresentation";
import styles from "./FantasyShowcase.module.css";
import editorStyles from "../lineups/LineupBuilder.module.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function FantasyShowcase() {
  const [competitions, setCompetitions] = useState<FantasyCompetition[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(0);
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const tabId = useId();

  useEffect(() => {
    const sync = () => { setSelected(competitionIdFromSearch(window.location.search)); setReady(true); };
    sync(); window.addEventListener("popstate", sync);
    const tick = () => setNow(Date.now());
    tick(); const timer = window.setInterval(tick, 1000);
    return () => { window.removeEventListener("popstate", sync); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!ready || selected !== null) return;
    const controller = new AbortController();
    const load = () => {
      setLoading(true); setError("");
      listFantasyCompetitions(controller.signal).then(items => {
        if (controller.signal.aborted) return;
        // Draft competitions are private; retain published/closed competitions for their actual state.
        setCompetitions(items.filter(c => ["PUBLICADA", "ENCERRADA", "FINALIZADA", "FECHADA"].includes(c.status)));
        setLoading(false); setActive(0);
        if (rail.current) rail.current.scrollLeft = 0;
      }).catch(err => { if (!controller.signal.aborted) { setError(lineupError(err)); setLoading(false); } });
    };
    load();
    const refresh = () => { if (document.visibilityState === "visible") setRevision(n => n + 1); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [ready, selected, revision]);

  function select(id: number | null) {
    const url = new URL(window.location.href);
    if (id === null) url.searchParams.delete("competicao"); else url.searchParams.set("competicao", String(id));
    window.history.pushState(window.history.state, "", `/point-fantasy${url.search}${url.hash}`);
    setSelected(id); setActive(0);
  }

  function goTo(index: number) {
    const element = rail.current;
    if (!element) return;
    const target = element.children[index] as HTMLElement | undefined;
    if (!target) return;
    element.scrollTo({ left: target.offsetLeft - (element.children[0] as HTMLElement).offsetLeft, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setActive(index);
  }

  if (!ready) return <p role="status">Carregando competições…</p>;
  if (selected !== null) return <div className={editorStyles.builder}><button className={styles.back} type="button" onClick={() => select(null)}><ArrowLeft size={16} /> Voltar às competições</button><FantasyLineupBuilder key={selected} competitionId={selected} onBack={() => select(null)} /></div>;

  return <section className={styles.showcase} aria-label="Competições POINT FFC Fantasy">
    <div className={styles.toolbar}>
      {/* The list contract has no championship identifier/name. Never infer it from competition titles. */}
      <div className={styles.tabs} role="tablist" aria-label="Campeonatos"><button id={tabId} type="button" role="tab" aria-selected="true" aria-controls={panelId} tabIndex={0}>Todas</button></div>
      <button className={styles.refresh} type="button" onClick={() => setRevision(n => n + 1)} disabled={loading}><RefreshCw size={16} aria-hidden="true" />Atualizar</button>
    </div>
    <div id={panelId} role="tabpanel" aria-labelledby={tabId} tabIndex={0} aria-busy={loading}>
      {loading ? <div className={styles.empty} role="status">Carregando competições…</div>
        : error ? <div className={styles.empty} role="alert"><p>{error}</p><button type="button" onClick={() => setRevision(n => n + 1)}>Tentar novamente</button></div>
        : !competitions.length ? <div className={styles.empty} role="status"><Trophy size={24} aria-hidden="true" /><h2>Novas disputas vêm aí</h2><p>Nenhuma competição disponível no momento.</p></div>
        : <>
          <div className={styles.sectionHeading}><div><h2>Escolha sua próxima disputa</h2><p>Encontre uma competição e prepare sua escalação.</p></div><span>{competitions.length} {competitions.length === 1 ? "competição" : "competições"}</span></div>
          <div ref={rail} className={`${styles.rail} ${competitions.length === 1 ? styles.single : ""}`} role="region" aria-label="Carrossel de competições" aria-roledescription={competitions.length > 1 ? "carrossel" : undefined} tabIndex={competitions.length > 1 ? 0 : undefined}
            onScroll={() => {
              const element = rail.current;
              if (!element || !element.children.length) return;
              if (element.scrollLeft > 0 && element.scrollLeft + element.clientWidth >= element.scrollWidth - 2) { setActive(competitions.length - 1); return; }
              const first = (element.children[0] as HTMLElement).offsetLeft;
              const offsets = Array.from(element.children).map(child => Math.abs((child as HTMLElement).offsetLeft - first - element.scrollLeft));
              setActive(offsets.indexOf(Math.min(...offsets)));
            }}
            onKeyDown={event => {
              if (event.target !== event.currentTarget || competitions.length < 2) return;
              const index = event.key === "Home" ? 0 : event.key === "End" ? competitions.length - 1 : event.key === "ArrowRight" ? Math.min(active + 1, competitions.length - 1) : event.key === "ArrowLeft" ? Math.max(0, active - 1) : null;
              if (index !== null) { event.preventDefault(); goTo(index); }
            }}>
            {competitions.map((competition, index) => {
              const availability = competitionAvailability(competition, now);
              const open = availability === "Inscrições abertas";
              return <article key={competition.id} className={styles.card} aria-label={competition.nome}>
                <div className={styles.cardTop}><span><Trophy size={15} aria-hidden="true" />Rodada {competition.rodada}</span><span>{competition.temporada}</span></div>
                <h3>{competition.nome}</h3>
                <div className={styles.entry}><span className={competition.tipoAcesso === "FREE" ? styles.free : styles.paid}>{competition.tipoAcesso === "FREE" ? "FREE" : "PAGA"}</span><strong>{competition.tipoAcesso === "FREE" ? "Grátis para participar" : Number.isFinite(Number(competition.valorInscricao)) ? currency.format(Number(competition.valorInscricao)) : "Valor não informado"}</strong></div>
                <div className={styles.deadline}><CalendarClock size={18} aria-hidden="true" /><div><span>Participe até</span><strong>{competitionDeadline(competition.fimInscricao)}</strong><small>Horário de Brasília</small></div></div>
                <p className={styles.limit}>{competition.limiteEscalacoesUsuario === null ? "Sem limite de times por usuário" : `Até ${competition.limiteEscalacoesUsuario} ${competition.limiteEscalacoesUsuario === 1 ? "time" : "times"} por usuário`}</p>
                <div className={styles.cardFooter}><span className={open ? styles.open : styles.closed}>{availability}</span><button type="button" disabled={!open} onClick={() => { if (competitionAvailability(competition, Date.now()) === "Inscrições abertas") select(competition.id); }}>{open ? "Participar" : availability}<ArrowRight size={17} aria-hidden="true" /></button></div>
                {competitions.length > 1 && <span className={styles.srOnly}>{index + 1} de {competitions.length}</span>}
              </article>;
            })}
          </div>
          {competitions.length > 1 && <div className={styles.controls} aria-label="Navegação do carrossel"><button type="button" aria-label="Competição anterior" disabled={active === 0} onClick={() => goTo(active - 1)}><ArrowLeft size={18} /></button><span role="status" aria-live="polite">{active + 1} / {competitions.length}</span><button type="button" aria-label="Próxima competição" disabled={active === competitions.length - 1} onClick={() => goTo(active + 1)}><ArrowRight size={18} /></button></div>}
        </>}
    </div>
    <p className={styles.note}>A disponibilidade é confirmada ao abrir a competição. Sua inscrição só acontece na etapa de confirmação.</p>
    <Link className={styles.catalog} href="/point-fantasy/atletas/">Explorar catálogo de atletas <ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
}
