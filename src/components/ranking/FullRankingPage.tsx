"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { buscarDashboardComMetadados } from "@/services/cartola/cartola.service";
import { generalRankingService } from "@/services/generalRankingService";
import type { GeneralRankingResponse } from "@/types/general-ranking";
import styles from "./FullRankingPage.module.css";

const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Context = { season: number; round: number };
const validRound = (value: number) => Number.isInteger(value) && value >= 1 && value <= 38;

export function FullRankingPage() {
  const searchParams = useSearchParams();
  const [context, setContext] = useState<Context | null>(null);
  const [contextError, setContextError] = useState(false);
  const [contextAttempt, setContextAttempt] = useState(0);
  const [round, setRound] = useState(1);
  const [teamInput, setTeamInput] = useState("");
  const [managerInput, setManagerInput] = useState("");
  const [filters, setFilters] = useState({ team: "", manager: "" });
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<GeneralRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const seasonParam = Number(searchParams.get("temporada"));
    const roundParam = Number(searchParams.get("rodada"));
    if (Number.isInteger(seasonParam) && seasonParam > 0 && validRound(roundParam)) {
      setContext({ season: seasonParam, round: roundParam });
      setRound(roundParam);
      setContextError(false);
      return;
    }
    let active = true;
    setContextError(false);
    buscarDashboardComMetadados().then(({ data: dashboard }) => {
      if (!active) return;
      const currentRound = dashboard.mercadoAberto ? Math.max(1, dashboard.rodada - 1) : dashboard.rodada;
      setContext({ season: dashboard.mercado.temporada ?? new Date().getFullYear(), round: currentRound });
      setRound(currentRound);
    }).catch(() => { if (active) setContextError(true); });
    return () => { active = false; };
  }, [searchParams, contextAttempt]);

  useEffect(() => {
    if (!context) return;
    let active = true;
    setLoading(true);
    setError(false);
    generalRankingService.buscar(context.season, round, 20, { page, nomeTime: filters.team, nomeCartoleiro: filters.manager })
      .then((response) => { if (active) setData(response); })
      .catch(() => { if (active) { setData(null); setError(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [context, round, page, filters, attempt]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({ team: teamInput.trim(), manager: managerInput.trim() });
  };
  const totalPages = data?.paginacao?.totalPaginas ?? Math.ceil((data?.total ?? 0) / 20);

  return <main className={`page-shell ${styles.page}`}>
    <Link className={styles.back} href="/">← Dashboard</Link>
    <header className={styles.hero}><span>POINT FFC</span><h1>RANKING</h1><p>Acompanhe a classificação dos times</p></header>
    {contextError ? <div className={styles.feedback} role="alert"><p>Não foi possível carregar o ranking.</p><button type="button" onClick={() => setContextAttempt(value => value + 1)}>Tentar novamente</button></div>
      : !context ? <div className={styles.skeleton} role="status" aria-label="Carregando ranking" /> : <>
        <form className={styles.filters} onSubmit={applyFilters}>
          <label>Rodada<select value={round} onChange={(event) => { setRound(Number(event.target.value)); setPage(1); }}>{Array.from({ length: 38 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
          <label>Nome do time<input value={teamInput} onChange={event => setTeamInput(event.target.value)} placeholder="Buscar time" maxLength={100} /></label>
          <label>Cartoleiro<input value={managerInput} onChange={event => setManagerInput(event.target.value)} placeholder="Buscar cartoleiro" maxLength={100} /></label>
          <button type="submit">Buscar</button>
        </form>
        <section className={styles.results} aria-label="Classificação">
          <div className={styles.resultsHead}><h2>Rodada {round}</h2>{!loading && !error && <span>{data?.total ?? 0} times</span>}</div>
          {loading ? <div className={styles.skeleton} role="status" aria-label="Carregando ranking" />
            : error ? <div className={styles.feedback} role="alert"><p>Não foi possível carregar o ranking.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>
            : data?.ranking.length ? <ol className={styles.list}>{data.ranking.map(entry => <li key={entry.timeId}>
                <strong className={styles.position}>{entry.posicao}º</strong>
                <span className={styles.shield}>{entry.escudoUrl ? <img src={entry.escudoUrl} alt="" /> : <ImageOff size={18} aria-hidden="true" />}</span>
                <span className={styles.identity}><b>{entry.nomeTime}</b>{entry.capitao?.apelido && <span className={styles.captain}><b>C</b>{entry.capitao.apelido}</span>}<small>{entry.nomeCartoleiro}</small></span>
                <strong className={styles.points}>{points.format(entry.pontuacao)} <small>pts</small></strong>
              </li>)}</ol> : <p className={styles.empty}>A classificação ainda não está disponível.</p>}
          {!loading && !error && totalPages > 1 && <nav className={styles.pagination} aria-label="Páginas do ranking">
            <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1}>← Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Próxima →</button>
          </nav>}
        </section>
      </>}
  </main>;
}
