"use client";
import { ChevronRight, ImageOff, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AthletePerformance } from "./AthletePerformance";
import { escudoClube, nomeClube } from "@/lib/cartola";
import type { CartolaClub, CartolaScoredAthlete } from "@/types/cartola";
import styles from "./AthleteScoresPage.module.css";
const positionNames: Record<number, string> = { 1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC" };
const scoreFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type ScoutInfo = { code: string; count: number; description: string };

const scoutDescriptions: Record<string, string> = {
  G: "Gols", A: "Assistências", SG: "Saldo de gols", GC: "Gol contra",
  CA: "Cartões amarelos", CV: "Cartões vermelhos", DS: "Desarmes",
  DP: "Defesas difíceis", DD: "Defesas de pênalti", DE: "Defesa do goleiro", GS: "Gols sofridos",
  FS: "Faltas sofridas", FC: "Faltas cometidas", FT: "Finalizações na trave",
  FD: "Finalizações defendidas", FF: "Finalizações para fora", I: "Impedimentos",
  PE: "Passes errados", RB: "Roubadas de bola", PC: "Pênaltis cometidos",
  PP: "Pênaltis perdidos",
};
const scoutPriority = ["G", "A", "SG", "CA", "CV", "DS", "DP", "DD", "DE", "GC"];
const negativeScouts = new Set(["GC", "CA", "CV", "GS", "FC", "I", "PE", "PC", "PP"]);

function getScouts(athlete: CartolaScoredAthlete): ScoutInfo[] {
  const scout = athlete.scout;
  if (!scout || typeof scout !== "object") return [];
  return Object.entries(scout)
    .filter(([code, count]) => Object.prototype.hasOwnProperty.call(scoutDescriptions, code) && typeof count === "number" && Number.isFinite(count) && count > 0)
    .map(([code, count]) => ({ code, count, description: scoutDescriptions[code] }))
    .sort((a, b) => {
      const aPriority = scoutPriority.indexOf(a.code);
      const bPriority = scoutPriority.indexOf(b.code);
      const aRank = aPriority < 0 ? scoutPriority.length : aPriority;
      const bRank = bPriority < 0 ? scoutPriority.length : bPriority;
      return aRank - bRank || a.code.localeCompare(b.code);
    });
}

export function AthleteRow({ athlete, club, rank, onOpen }: { athlete: CartolaScoredAthlete; club?: CartolaClub; rank: number; onOpen: () => void }) {
  const clubName = club && athlete.clube_id ? nomeClube(club, athlete.clube_id) : null;
  const shield = club ? escudoClube(club) : null;
  return <li>
    <button className={styles.rowButton} type="button" onClick={onOpen} aria-label={`Ver detalhes de ${athlete.apelido}, ${positionNames[athlete.posicao_id] ?? "posição não informada"}, ${scoreFormat.format(athlete.pontuacao)} pontos`}>
      <span className={styles.rank}>{rank}<sup>º</sup></span>
      <span className={styles.shield} aria-hidden="true">
        {shield && <img src={shield} alt="" onError={event => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.removeAttribute("hidden"); }} />}
        <i hidden={Boolean(shield)}><ImageOff /></i>
      </span>
      <span className={styles.identity}>
        <strong className={styles.name}>{athlete.apelido}</strong>
        <span className={styles.meta}><b>{positionNames[athlete.posicao_id] ?? "--"}</b><i />{club?.abreviacao ?? clubName ?? "Sem clube"}
          {athlete.isMagoPick && <span className={styles.mago}><Sparkles /> Dica do Mago</span>}
        </span>
        <ScoutSummary athlete={athlete} />
      </span>
      <span className={styles.scoreBlock}>
        <strong className={`${styles.points} ${athlete.pontuacao < 0 ? styles.negative : ""}`}>{scoreFormat.format(athlete.pontuacao)}<small>pts</small></strong>
      </span>
      <ChevronRight className={styles.chevron} aria-hidden="true" />
    </button>
  </li>;
}

function ScoutSummary({ athlete }: { athlete: CartolaScoredAthlete }) {
  const scouts = getScouts(athlete);
  if (!scouts.length) return null;
  return <span className={styles.scoutSummary} aria-label={`Scouts: ${scouts.map(item => `${item.count} ${item.code}`).join(", ")}`}>
    {scouts.map(item => <ScoutTag key={item.code} item={item} compact />)}
  </span>;
}

function ScoutTag({ item, compact = false }: { item: ScoutInfo; compact?: boolean }) {
  const tone = negativeScouts.has(item.code) ? styles.scoutNegative : ["G", "A", "SG", "DS", "DE", "DP", "DD"].includes(item.code) ? styles.scoutPositive : styles.scoutNeutral;
  return <span className={`${styles.scoutTag} ${tone}`} aria-label={`${item.count} ${item.description}`} title={`${item.description}: ${item.count}`}>
    {compact && item.code !== "SG" ? <>{item.count} {item.code}</> : item.code}
  </span>;
}

export function AthleteDetails({ athlete, athleteId, season, club, clubs, matches, round, onClose }: {
  athleteId?: string;
  season?: number;
  athlete: CartolaScoredAthlete;
  club?: CartolaClub;
  clubs: Record<string, CartolaClub>;
  matches: Array<{ partida_id: number; clube_casa_id: number; clube_visitante_id: number; placar_oficial_mandante?: number | null; placar_oficial_visitante?: number | null; [key: string]: unknown }>;
  round?: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"current" | "performance">("current");
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const elements = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button, [role="dialog"] select, [role="dialog"] [tabindex="0"]'));
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.getElementById("athlete-details-close")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  const scouts = getScouts(athlete);
  const clubName = club && athlete.clube_id ? nomeClube(club, athlete.clube_id) : "Clube não informado";
  const shield = club ? escudoClube(club) : null;
  const match = athlete.clube_id ? matches.find(item => item.clube_casa_id === athlete.clube_id || item.clube_visitante_id === athlete.clube_id) : undefined;
  const home = match ? nomeClube(clubs[String(match.clube_casa_id)] ?? {}, match.clube_casa_id) : "";
  const away = match ? nomeClube(clubs[String(match.clube_visitante_id)] ?? {}, match.clube_visitante_id) : "";
  const hasScore = match && match.placar_oficial_mandante != null && match.placar_oficial_visitante != null;
  const athletePhoto = typeof athlete.foto === "string" ? athlete.foto : "";

  return <div className={styles.overlay} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles.details} role="dialog" aria-modal="true" aria-labelledby="athlete-details-title" aria-describedby="athlete-details-description">
      <div className={styles.sheetHandle} aria-hidden="true"><span /></div>
      <button id="athlete-details-close" className={styles.close} type="button" onClick={onClose} aria-label="Fechar detalhes"><X /></button>
      <header className={styles.detailsHeader}>
        <span className={styles.detailsImage}>
          {athletePhoto && <img src={athletePhoto} alt="" onError={event => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.removeAttribute("hidden"); }} />}
          <i hidden={Boolean(athletePhoto)}>{shield ? <img src={shield} alt="" /> : <ImageOff />}</i>
        </span>
        <div className={styles.detailsIdentity}>
          <span className={styles.detailsEyebrow}>Atleta{round ? ` • Rodada ${round}` : ""}</span>
          <h2 id="athlete-details-title">{athlete.apelido}</h2>
          <p id="athlete-details-description">{positionNames[athlete.posicao_id] ?? "Posição não informada"} <i /> {clubName}</p>
          {typeof athlete.entrou_em_campo === "boolean" && <span className={athlete.entrou_em_campo ? styles.played : styles.waiting}>{athlete.entrou_em_campo ? "Já entrou em campo" : "Ainda não entrou em campo"}</span>}
        </div>
      </header>
      <div className={styles.detailTabs} role="group" aria-label="Conteúdo do detalhe">
        <button type="button" aria-pressed={tab === "current"} onClick={() => setTab("current")}>Rodada atual</button>
        <button type="button" aria-pressed={tab === "performance"} onClick={() => setTab("performance")}>Desempenho</button>
      </div>
      <div className={styles.detailsScroll}>
        {tab === "performance" ? <AthletePerformance key={athleteId} athleteId={athleteId ?? ""} season={season} round={round} /> : <>
        <section className={styles.roundScore} aria-label="Pontuação na rodada atual">
          <span>Pontuação na rodada atual</span>
          <strong className={athlete.pontuacao < 0 ? styles.negative : ""}>{scoreFormat.format(athlete.pontuacao)}<small> pts</small></strong>
        </section>
        {match && <section className={styles.matchInfo} aria-label="Partida desta rodada">
          <span>Partida</span>
          <strong>{home} <b>{hasScore ? `${match.placar_oficial_mandante} × ${match.placar_oficial_visitante}` : "×"} </b>{away}</strong>
        </section>}
        <section className={styles.scoutsSection}>
          <div className={styles.sectionTitle}><h3>Scouts da rodada</h3><span>{scouts.length}</span></div>
          {scouts.length ? <ul className={styles.scoutList}>{scouts.map(item => <li key={item.code}>
            <ScoutTag item={item} />
            <span>{item.description}</span>
            <strong>{item.count}</strong>
          </li>)}</ul> : <p className={styles.emptyScouts}>Nenhum scout disponível para este atleta nesta rodada.</p>}
        </section>
        </>}
      </div>
    </section>
  </div>;
}
