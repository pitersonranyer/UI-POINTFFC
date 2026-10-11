"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, ImageOff, RefreshCw, Search, Sparkles, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { escudoClube, nomeClube } from "@/lib/cartola";
import type { CartolaClub, CartolaScoredAthlete } from "@/types/cartola";
import styles from "./AthleteScoresPage.module.css";
import paginationStyles from "./Pagination.module.css";

const positionNames: Record<number, string> = { 1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC" };
const positionOptions = [1, 2, 3, 4, 5, 6] as const;
const scoreFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PAGE_SIZE = 30;
const SCOUT_LIMIT = 3;

type RankingItem = { id: string; athlete: CartolaScoredAthlete };
type ScoutInfo = { code: string; count: number; description: string };
type PositionFilter = "ALL" | number;

const scoutDescriptions: Record<string, string> = {
  G: "Gols", A: "Assistências", SG: "Saldo de gols", GC: "Gol contra",
  CA: "Cartões amarelos", CV: "Cartões vermelhos", DS: "Defesas",
  DP: "Defesas difíceis", DD: "Defesas de pênalti", GS: "Gols sofridos",
  FS: "Faltas sofridas", FC: "Faltas cometidas", FT: "Finalizações na trave",
  FD: "Finalizações defendidas", FF: "Finalizações para fora", I: "Impedimentos",
  PE: "Passes errados", RB: "Roubadas de bola", PC: "Pênaltis cometidos",
  PP: "Pênaltis perdidos",
};
const scoutPriority = ["G", "A", "SG", "DS", "DP", "DD", "CA", "CV", "GC"];
const negativeScouts = new Set(["GC", "CA", "CV", "GS", "FC", "I", "PE", "PC", "PP"]);

function getScouts(athlete: CartolaScoredAthlete): ScoutInfo[] {
  const scout = athlete.scout;
  if (!scout || typeof scout !== "object") return [];
  return Object.entries(scout)
    .filter(([code, count]) => code.trim() && typeof count === "number" && Number.isFinite(count) && count !== 0)
    .map(([code, count]) => ({ code, count, description: scoutDescriptions[code] ?? `Scout ${code}` }))
    .sort((a, b) => {
      const aPriority = scoutPriority.indexOf(a.code);
      const bPriority = scoutPriority.indexOf(b.code);
      const aRank = aPriority < 0 ? scoutPriority.length : aPriority;
      const bRank = bPriority < 0 ? scoutPriority.length : bPriority;
      return aRank - bRank || a.code.localeCompare(b.code);
    });
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function AthleteScoresPage() {
  const { dashboard, loading, error, atualizar, athletes, athletesLoading, athletesError } = useCartolaDashboard();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rankingRef = useRef<HTMLElement>(null);

  const ranking = useMemo(() => athletes
    ? Object.entries(athletes.atletas).map(([id, athlete]) => ({ id, athlete }))
      .sort((a, b) => b.athlete.pontuacao - a.athlete.pontuacao)
    : [], [athletes]);
  const filteredRanking = useMemo(() => {
    const normalized = normalizeSearch(search);
    return ranking.filter(({ athlete }) => {
      if (position !== "ALL" && athlete.posicao_id !== position) return false;
      if (!normalized) return true;
      const club = athlete.clube_id ? athletes?.clubes?.[String(athlete.clube_id)] : undefined;
      const clubName = club && athlete.clube_id ? nomeClube(club, athlete.clube_id) : "";
      return normalizeSearch(athlete.apelido).includes(normalized)
        || normalizeSearch(clubName ?? "").includes(normalized)
        || normalizeSearch(club?.abreviacao ?? "").includes(normalized);
    });
  }, [athletes, position, ranking, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRanking.length / PAGE_SIZE));
  const visibleRanking = filteredRanking.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = selectedId ? athletes?.atletas[selectedId] : undefined;
  const selectedClub = selected?.clube_id ? athletes?.clubes?.[String(selected.clube_id)] : undefined;

  useEffect(() => { setPage(1); }, [athletes]);
  useEffect(() => {
    if (!selectedId) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
      if (event.key === "Tab") {
        event.preventDefault();
        document.getElementById("athlete-details-close")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.getElementById("athlete-details-close")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selectedId]);

  const displayedRound = dashboard
    ? (dashboard.mercadoAberto ? Math.max(1, dashboard.rodada - 1) : dashboard.rodada)
    : undefined;

  if (loading && !dashboard) return <main className={styles.shell}><ScoresHeader /><div className={styles.loading}><RefreshCw /> Carregando pontuações...</div></main>;
  if (!dashboard) return <main className={styles.shell}><ScoresHeader /><div className={styles.error}><p>Não foi possível carregar as informações da rodada.</p><button onClick={atualizar}>Tentar novamente</button></div></main>;

  const firstRound = dashboard.mercadoAberto && dashboard.rodada === 1;
  const changePage = (next: number) => {
    setPage(Math.min(totalPages, Math.max(1, next)));
    rankingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  const changePosition = (value: PositionFilter) => { setPosition(value); setPage(1); };

  return (
    <main className={styles.shell}>
      <Link className={styles.back} href="/"><ArrowLeft /> Voltar ao Dashboard</Link>
      <ScoresHeader round={displayedRound} totalAthletes={athletes?.total_atletas ?? ranking.length} />
      <div className={styles.statusBar}>
        <span className={dashboard.mercadoAberto ? styles.open : styles.closed}>Mercado {dashboard.mercadoAberto ? "aberto" : "fechado"}</span>
        {!dashboard.mercadoAberto && dashboard.bolaRolando && <b>● Ao vivo</b>}
        <small>Exibindo rodada {displayedRound}</small>
      </div>
      <section className={styles.ranking} ref={rankingRef}>
        <header className={styles.rankingHeader}>
          <div><h2>Classificação da rodada</h2><p>Ordenada pela maior pontuação</p></div>
          <button className={styles.refresh} type="button" onClick={atualizar} aria-label="Atualizar pontuações"><RefreshCw /> Atualizar</button>
        </header>
        <div className={styles.controls}>
          <label className={styles.search}>
            <Search aria-hidden="true" />
            <input type="search" value={search} onChange={event => changeSearch(event.target.value)} placeholder="Buscar atleta ou clube" aria-label="Buscar atleta ou clube" />
            {search && <button type="button" onClick={() => changeSearch("")} aria-label="Limpar busca"><X /></button>}
          </label>
          <div className={styles.filters} role="group" aria-label="Filtrar por posição">
            <button type="button" className={position === "ALL" ? styles.activeFilter : ""} aria-pressed={position === "ALL"} onClick={() => changePosition("ALL")}>Todos</button>
            {positionOptions.map(id => {
              const hasPosition = ranking.some(item => item.athlete.posicao_id === id);
              return hasPosition ? <button key={id} type="button" className={position === id ? styles.activeFilter : ""} aria-pressed={position === id} onClick={() => changePosition(id)}>{positionNames[id]}</button> : null;
            })}
          </div>
          <small className={styles.scope}>Busca e filtros consideram os atletas carregados nesta rodada.</small>
        </div>
        {firstRound ? <p className={styles.feedback}>Os destaques dos atletas aparecerão após a primeira rodada.</p>
          : athletesLoading && !athletes ? <div className={styles.skeleton} />
          : athletesError && !athletes ? <div className={styles.feedback}><p>Não foi possível carregar a pontuação dos atletas.</p><button onClick={atualizar}>Tentar novamente</button></div>
          : filteredRanking.length ? <>
            <ol className={styles.list}>
              {visibleRanking.map(({ id, athlete }, index) => (
                <AthleteRow
                  key={id}
                  athlete={athlete}
                  club={athlete.clube_id ? athletes?.clubes?.[String(athlete.clube_id)] : undefined}
                  rank={(page - 1) * PAGE_SIZE + index + 1}
                  onOpen={() => setSelectedId(id)}
                />
              ))}
            </ol>
            {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={changePage} />}
          </> : <p className={styles.feedback}>{search || position !== "ALL" ? "Nenhum atleta corresponde à busca ou aos filtros." : "Ainda não existem atletas pontuados nesta rodada."}</p>}
        {(athletesError || error) && athletes && <small className={styles.updateError}>Não foi possível obter a atualização mais recente. Exibindo os últimos dados válidos.</small>}
      </section>
      {selected && selectedId && (
        <AthleteDetails
          key={selectedId}
          athlete={selected}
          club={selectedClub}
          clubs={dashboard.clubes}
          matches={dashboard.partidas}
          round={displayedRound}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}

function ScoresHeader({ round, totalAthletes }: { round?: number; totalAthletes?: number }) {
  return (
    <section className={styles.hero}>
      <div><span className={styles.eyebrow}>Brasileirão{round !== undefined && <> • Rodada {round}</>}</span><h1>Pontuação e Parciais do Cartola</h1>
        <p>Acompanhe a pontuação e as parciais dos atletas do Cartola durante a rodada. Consulte as parciais durante os jogos e as pontuações finais após sua conclusão.</p>
        <p>Para planejar a próxima escalação, consulte as <Link href="/mago/">dicas do Mago</Link>.</p>
      </div>
      {totalAthletes !== undefined && <div className={styles.roundInfo}><Trophy /><span><small>Atletas pontuados</small><strong>{totalAthletes}</strong></span></div>}
    </section>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pages = Array.from({ length: total }, (_, index) => index + 1).filter(value => value === 1 || value === total || Math.abs(value - page) <= 1);
  return <nav className={paginationStyles.pagination} aria-label="Páginas do ranking">
    <button disabled={page === 1} onClick={() => onChange(page - 1)}>Anterior</button>
    <div>{pages.map((value, index) => <span key={value}>{index > 0 && value - pages[index - 1] > 1 && <i>…</i>}<button className={value === page ? paginationStyles.current : ""} aria-current={value === page ? "page" : undefined} onClick={() => onChange(value)}>{value}</button></span>)}</div>
    <button disabled={page === total} onClick={() => onChange(page + 1)}>Próxima</button>
  </nav>;
}

function AthleteRow({ athlete, club, rank, onOpen }: { athlete: CartolaScoredAthlete; club?: CartolaClub; rank: number; onOpen: () => void }) {
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
  const visible = scouts.slice(0, SCOUT_LIMIT);
  const hiddenCount = scouts.length - visible.length;
  return <span className={styles.scoutSummary} aria-label={`Scouts: ${scouts.map(item => `${item.count} ${item.code}`).join(", ")}`}>
    {visible.map(item => <ScoutTag key={item.code} item={item} compact />)}
    {hiddenCount > 0 && <span className={styles.moreScouts} aria-label={`${hiddenCount} scouts adicionais`}>+{hiddenCount}</span>}
  </span>;
}

function ScoutTag({ item, compact = false }: { item: ScoutInfo; compact?: boolean }) {
  const tone = negativeScouts.has(item.code) ? styles.scoutNegative : ["G", "A", "SG", "DS", "DP", "DD"].includes(item.code) ? styles.scoutPositive : styles.scoutNeutral;
  return <span className={`${styles.scoutTag} ${tone}`} title={`${item.description}: ${item.count}`}>
    {compact && item.code !== "SG" ? <>{item.count} {item.code}</> : item.code}
  </span>;
}

function AthleteDetails({ athlete, club, clubs, matches, round, onClose }: {
  athlete: CartolaScoredAthlete;
  club?: CartolaClub;
  clubs: Record<string, CartolaClub>;
  matches: Array<{ partida_id: number; clube_casa_id: number; clube_visitante_id: number; placar_oficial_mandante?: number | null; placar_oficial_visitante?: number | null; [key: string]: unknown }>;
  round?: number;
  onClose: () => void;
}) {
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
      <div className={styles.detailsScroll}>
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
      </div>
    </section>
  </div>;
}
