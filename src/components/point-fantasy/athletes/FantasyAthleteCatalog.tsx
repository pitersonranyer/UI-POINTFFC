"use client";
import React, { useEffect, useMemo, useState } from "react";
import { filterFantasyAthletes, loadFantasyCatalog, loadFantasyPages, sortFantasyCatalogs } from "@/services/pointFantasyService";
import { emptyAthleteFilters } from "@/types/pointFantasy";
import type { AthleteFilters, FantasyCatalogData, PointFantasyCatalog } from "@/types/pointFantasy";
import { FantasyAthleteFilters } from "./FantasyAthleteFilters";
import { FantasyAthleteRow } from "./FantasyAthleteRow";
import styles from "./FantasyAthleteCatalog.module.css";

const pageSize = 30;
export function FantasyAthleteCatalog() {
  const [catalogs, setCatalogs] = useState<PointFantasyCatalog[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [data, setData] = useState<(FantasyCatalogData & { catalogId: number }) | null>(null);
  const [filters, setFilters] = useState<AthleteFilters>({ ...emptyAthleteFilters });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setCatalogs([]); setSelected(null); setData(null);
    loadFantasyPages<PointFantasyCatalog>("/point-fantasy/catalogos", controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        const sorted = sortFantasyCatalogs(items);
        setCatalogs(sorted); setSelected(sorted[0]?.id ?? null);
        if (!sorted.length) setLoading(false);
      }).catch(err => { if (!controller.signal.aborted) { setError(err instanceof Error ? err.message : "Não foi possível carregar os catálogos."); setLoading(false); } });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    if (selected === null) return;
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null); setFilters({ ...emptyAthleteFilters }); setPage(1);
    loadFantasyCatalog(selected, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData({ ...result, catalogId: selected }); })
      .catch(err => { if (!controller.signal.aborted) { setError(err instanceof Error ? err.message : "Não foi possível carregar os atletas."); controller.abort(); setLoading(false); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selected]);
  // The ID guard also hides old data in the render before the effect cleans up.
  const current = data?.catalogId === selected ? data : null;
  const filtered = useMemo(() => filterFantasyAthletes(current?.athletes ?? [], filters), [current, filters]);
  const catalog = catalogs.find(c => c.id === selected);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  function changeFilters(next: AthleteFilters) { setFilters(next); setPage(1); }
  return <section className={styles.catalog} aria-label="Catálogo de atletas">
    <div className={styles.catalogHeader}><div><p className="eyebrow">Conheça o elenco</p><h2>Catálogo de atletas</h2></div>
      {catalogs.length > 0 && <label>Catálogo<select value={selected ?? ""} onChange={e => { setSelected(Number(e.target.value)); setPage(1); }}>
        {catalogs.map(c => <option key={c.id} value={c.id}>{c.temporada} · Rodada {c.rodada} · Versão {c.versao}</option>)}
      </select></label>}
    </div>
    {catalog && <div className={styles.metadata}><span>Temporada <strong>{catalog.temporada}</strong></span><span>Rodada <strong>{catalog.rodada}</strong></span><span>Versão <strong>{catalog.versao}</strong></span><span>{catalog.status === "CAPTURADO" ? "Capturado · ainda não congelado" : catalog.status === "CONGELADO" ? "Congelado" : catalog.status}</span>{current && <><span><strong>{current.athletes.length}</strong> atletas</span><span><strong>{current.clubs.length}</strong> clubes</span></>}</div>}
    {error ? <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></div>
      : loading || (selected !== null && !current) ? <p className={styles.state} role="status">Carregando o catálogo completo…</p>
      : !catalog ? <p className={styles.state} role="status">Nenhum catálogo disponível no momento.</p>
      : current && <>
        <FantasyAthleteFilters value={filters} onChange={changeFilters} clubs={current.clubs} positions={current.positions} />
        <p className={styles.results} role="status">{filtered.length} {filtered.length === 1 ? "atleta encontrado" : "atletas encontrados"}{filtered.length > 0 && ` · ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)}`}</p>
        {filtered.length === 0 ? <p className={styles.state}>Nenhum atleta corresponde aos filtros selecionados.</p> : <ul className={styles.list} aria-label="Atletas">{visible.map(a => <FantasyAthleteRow key={a.id} athlete={a} club={current.clubs.find(c => c.id === a.clubeIdExterno)} position={current.positions.find(p => p.id === a.posicaoId)} />)}</ul>}
        {pages > 1 && <nav className={styles.pagination} aria-label="Paginação dos atletas"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span aria-live="polite">Página {page} de {pages}</span><button disabled={page === pages} onClick={() => setPage(p => p + 1)}>Próxima</button></nav>}
      </>}
    <p className={styles.note}>POINTCOINS são valores virtuais dos atletas e não representam saldo financeiro. Camisetas e escudos são ilustrações próprias do POINT FFC.</p>
  </section>;
}
