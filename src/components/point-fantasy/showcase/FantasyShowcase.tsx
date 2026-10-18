"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, CalendarDays, RefreshCw, Trophy } from "lucide-react";
import { lineupError, listFantasyCompetitions } from "@/services/pointFantasyLineupService";
import { getFantasyShowcaseMatchups } from "@/services/pointFantasyShowcaseService";
import type { FantasyCompetition } from "@/types/pointFantasyLineup";
import type { FantasyShowcaseMatchups } from "@/services/pointFantasyShowcaseService";
import { FantasyLineupBuilder } from "../lineups/FantasyLineupBuilder";
import { FantasyMatchupsDialog } from "./FantasyMatchupsDialog";
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
  const [matchupCompetition, setMatchupCompetition] = useState<FantasyCompetition | null>(null);
  const [matchupState, setMatchupState] = useState<{ loading: boolean; data?: FantasyShowcaseMatchups; error?: string }>({ loading: false });
  const [matchupCache, setMatchupCache] = useState<Record<number, FantasyShowcaseMatchups>>({});
  const rail = useRef<HTMLDivElement>(null);
  const matchupRequest = useRef<{ id: number; controller: AbortController } | null>(null);
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

  useEffect(() => () => matchupRequest.current?.controller.abort(), []);

  function loadMatchups(competition: FantasyCompetition) {
    matchupRequest.current?.controller.abort();
    const controller = new AbortController();
    const request = { id: competition.id, controller };
    matchupRequest.current = request;
    setMatchupState({ loading: true });
    getFantasyShowcaseMatchups(competition.id, competition.catalogoId, controller.signal).then(data => {
      if (controller.signal.aborted || matchupRequest.current !== request) return;
      setMatchupCache(current => current[competition.id] ? current : { ...current, [competition.id]: data });
      setMatchupState({ loading: false, data });
    }).catch(error => {
      if (controller.signal.aborted || matchupRequest.current !== request) return;
      setMatchupState({ loading: false, error: lineupError(error) });
    });
  }

  function openMatchups(competition: FantasyCompetition) {
    setMatchupCompetition(competition);
    const cached = matchupCache[competition.id];
    if (cached) setMatchupState({ loading: false, data: cached });
    else loadMatchups(competition);
  }

  function closeMatchups() {
    matchupRequest.current?.controller.abort();
    matchupRequest.current = null;
    setMatchupCompetition(null);
    setMatchupState({ loading: false });
  }

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
              const canView = availability === "Encerrada";
              const rawPaidAmount = competition.valorInscricao;
              const paidAmount = typeof rawPaidAmount === "number"
                ? rawPaidAmount
                : typeof rawPaidAmount === "string" && rawPaidAmount.trim() !== ""
                  ? Number(rawPaidAmount)
                  : Number.NaN;
              const validPaidAmount = competition.tipoAcesso === "PAGO" && Number.isFinite(paidAmount) && paidAmount >= 0;
              return <article key={competition.id} className={styles.card} aria-label={competition.nome}>
                <div className={styles.cardTop}><span><Trophy size={14} aria-hidden="true" />Rodada {competition.rodada}<i aria-hidden="true">·</i>{competition.temporada}</span><span className={competition.tipoAcesso === "FREE" ? styles.free : styles.paid}>{competition.tipoAcesso}</span></div>
                <h3 title={competition.nome}>{competition.nome}</h3>
                {validPaidAmount && <p className={styles.entryFee}>Inscrição <strong>{currency.format(paidAmount)}</strong></p>}
                <div className={styles.featureRow}>
                  <div className={styles.prize}><span>Premiação</span><strong>Sem premiação informada</strong></div>
                  <button className={styles.matchupsLink} type="button" aria-haspopup="dialog" onClick={() => openMatchups(competition)}><CalendarDays size={15} aria-hidden="true" />Ver confrontos</button>
                </div>
                <div className={styles.deadline}><CalendarClock size={16} aria-hidden="true" /><div><span>Inscrições até</span><strong>{competitionDeadline(competition.fimInscricao)}</strong><small>Horário de Brasília</small></div></div>
                <div className={styles.cardFooter}><span className={open ? styles.open : styles.closed}>{availability}</span><button type="button" disabled={!open && !canView} onClick={() => { const current = competitionAvailability(competition, Date.now()); if (current === "Inscrições abertas" || current === "Encerrada") select(competition.id); }}>{open ? "Participar" : canView ? "Ver andamento" : availability}<ArrowRight size={17} aria-hidden="true" /></button></div>
                {competitions.length > 1 && <span className={styles.srOnly}>{index + 1} de {competitions.length}</span>}
              </article>;
            })}
          </div>
          {competitions.length > 1 && <div className={styles.controls} aria-label="Navegação do carrossel"><button type="button" aria-label="Competição anterior" disabled={active === 0} onClick={() => goTo(active - 1)}><ArrowLeft size={18} /></button><span role="status" aria-live="polite">{active + 1} / {competitions.length}</span><button type="button" aria-label="Próxima competição" disabled={active === competitions.length - 1} onClick={() => goTo(active + 1)}><ArrowRight size={18} /></button></div>}
        </>}
    </div>
    <p className={styles.note}>A disponibilidade é confirmada ao abrir a competição. Sua inscrição só acontece na etapa de confirmação.</p>
    <Link className={styles.catalog} href="/point-fantasy/atletas/">Explorar catálogo de atletas <ArrowRight size={16} aria-hidden="true" /></Link>
    {matchupCompetition && <FantasyMatchupsDialog competition={matchupCompetition} loading={matchupState.loading} data={matchupState.data} error={matchupState.error} onRetry={() => loadMatchups(matchupCompetition)} onClose={closeMatchups} />}
  </section>;
}
