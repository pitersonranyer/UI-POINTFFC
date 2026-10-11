"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Search, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { nomeClube } from "@/lib/cartola";
import { AthleteRow, AthleteDetails } from "./AthleteRanking";
import styles from "./AthleteScoresPage.module.css";
import paginationStyles from "./Pagination.module.css";

const positionNames: Record<number, string> = { 1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC" };
const positionOptions = [1, 2, 3, 4, 5, 6] as const;
const PAGE_SIZE = 30;
type PositionFilter = "ALL" | number;

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
          athleteId={selectedId}
          season={dashboard.mercado.temporada}
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
