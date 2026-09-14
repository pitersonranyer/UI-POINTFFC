"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pointLeagueService, type Competition, type PointLeague } from "@/services/pointLeagueService";
import styles from "./PointLeague.module.css";

const date = (value: string | null) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Não informado";
export function PointLeaguePage() {
  const [league, setLeague] = useState<PointLeague | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; Promise.all([pointLeagueService.league(), pointLeagueService.competitions()]).then(([leagueData, list]) => { if (active) { setLeague(leagueData); setCompetitions(list); } }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar a liga."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <main className={`page-shell ${styles.shell}`}><Link href="/dashboard" className={styles.back}>← Dashboard</Link>
    {loading ? <p role="status">Carregando liga...</p> : error ? <p role="alert" className={styles.error}>{error}</p> : league && <>
      <header className={styles.hero}>{league.imagemUrl && <img src={league.imagemUrl} alt="Logo da POINT FFC" />}<div><p className="eyebrow">Liga oficial</p><h1>{league.nome}</h1><p>{league.descricao}</p></div></header>
      <nav className={styles.tabs} aria-label="Modalidades"><span className={styles.active}>Rodada</span>{["Mensal", "Turno", "Geral"].map((name) => <span className={styles.disabled} key={name} aria-disabled="true">{name} · Em breve</span>)}</nav>
      <section><h2>Competições da rodada</h2>{competitions.length ? <div className={styles.grid}>{competitions.map((item) => <article className={styles.card} key={item.id}><div className={styles.cardTop}><strong>{item.nome}</strong><span>{item.status}</span></div><p>Rodada {item.rodadaInicio ?? "—"}{item.rodadaFim && item.rodadaFim !== item.rodadaInicio ? `–${item.rodadaFim}` : ""} · {item.tipoAcesso === "FREE" ? "FREE" : item.tipoAcesso}</p><p>Inscritos: {item.quantidadeInscritos ?? "Não informado"}</p><p>Inscrições: {date(item.inicioInscricao)} até {date(item.fimInscricao)}</p><Link href={`/competicoes?id=${item.id}`}>Ver competição →</Link></article>)}</div> : <p className={styles.empty}>Nenhuma competição da rodada disponível.</p>}</section>
    </>}
  </main>;
}
