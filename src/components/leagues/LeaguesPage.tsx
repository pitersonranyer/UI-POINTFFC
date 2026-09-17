"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Trophy } from "lucide-react";
import { ApiError } from "@/services/apiClient";
import { pointLeagueService, type PointLeague } from "@/services/pointLeagueService";
import styles from "./LeaguesPage.module.css";

export function LeaguesPage() {
  const [league, setLeague] = useState<PointLeague | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setUnavailable(false);
    try {
      const data = await pointLeagueService.league();
      if (!data) setUnavailable(true); else setLeague(data);
    } catch (cause) {
      setLeague(null);
      if (cause instanceof ApiError && cause.status === 404) setUnavailable(true);
      else setError(cause instanceof Error ? cause.message : "Não foi possível carregar a liga.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <main className={`page-shell ${styles.shell}`}>
    <header className={styles.header}>
      <p className="eyebrow">Ligas</p><h1 className="page-title">Encontre sua próxima disputa</h1>
      <p className="page-subtitle">Participe das ligas do POINT FFC e acompanhe diferentes formatos de competição.</p>
    </header>
    {loading ? <section className={styles.skeleton} role="status" aria-label="Carregando ligas"><span /><span /><span /><span /></section>
      : error ? <section className={styles.state} role="alert"><Trophy aria-hidden="true" /><div><h2>Não foi possível carregar a POINT FFC.</h2><p>{error}</p><button type="button" onClick={() => void load()}>Tentar novamente</button></div></section>
      : unavailable || !league ? <section className={styles.state}><Shield aria-hidden="true" /><div><h2>Liga indisponível</h2><p>A POINT FFC não está disponível neste momento.</p></div></section>
      : <article className={styles.card}>
        <div className={styles.art} aria-hidden="true"><span>{league.imagemUrl ? <Image src={league.imagemUrl} alt="" width={112} height={112} unoptimized /> : <Shield />}</span></div>
        <div className={styles.content}>
          <span className={styles.official}>Liga oficial</span><h2>{league.nome}</h2>
          <p className={styles.tagline}>Liga oficial do Point Fantasy Football Club</p>
          <p className={styles.description}>Disputas para diferentes formatos e períodos.<br />Acompanhe rankings e concorra a premiações.</p>
          {league.modalidades?.length > 0 && <div className={styles.modalities} aria-label="Modalidades disponíveis"><h3>Modalidades disponíveis</h3><div>{league.modalidades.map((item) => <span key={item.codigo}>{item.nome}</span>)}</div></div>}
          <Link className={styles.cta} href="/ligas/point-ffc">Ver competições <ArrowRight aria-hidden="true" /></Link>
        </div>
      </article>}
    {!loading && !error && league && <aside className={styles.soon}><Trophy aria-hidden="true" /><div><strong>Novas ligas em breve</strong><p>Estamos preparando novas ligas e formatos de disputa para você.</p></div></aside>}
  </main>;
}
