"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { lineupError, listFantasyCompetitions } from "@/services/pointFantasyLineupService";
import type { FantasyCompetition } from "@/types/pointFantasyLineup";
import { getLoginHref } from "@/lib/postAuthRedirect";
import { PublicCompetitionEnvironment } from "../ranking/PublicCompetitionEnvironment";
import { LineupEditor } from "./LineupEditor";
import styles from "./LineupBuilder.module.css";

function CompetitionChooser() {
  const [competitions, setCompetitions] = useState<FantasyCompetition[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    listFantasyCompetitions(controller.signal).then(items => { if (!controller.signal.aborted) { setCompetitions(items.filter(c => c.status === "PUBLICADA")); setLoading(false); } }).catch(err => { if (!controller.signal.aborted) { setError(lineupError(err)); setLoading(false); } });
    return () => controller.abort();
  }, [retry]);
  if (selected !== null) return <LineupEditor integrated key={selected} competitionId={selected} onBack={() => setSelected(null)} />;
  if (loading) return <p role="status" className={styles.empty}>Carregando competições…</p>;
  if (error) return <div role="alert" className={styles.empty}><p>{error}</p><button type="button" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></div>;
  return <section className={styles.competitionList}><h2>Escolha uma competição</h2><p className={styles.note}>Monte seu elenco e retome seus times.</p>{!competitions.length ? <p role="status">Nenhuma competição publicada disponível.</p> : <ul>{competitions.map(c => <li key={c.id}><div><strong>{c.nome}</strong><span>{c.temporada} · Rodada {c.rodada} · {c.tipoAcesso === "FREE" ? "Gratuita" : "Participação paga"}</span></div><button type="button" onClick={() => setSelected(c.id)}>Participar</button></li>)}</ul>}</section>;
}
export function FantasyLineupBuilder({ competitionId, onBack }: { competitionId?: number; onBack?: () => void } = {}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <p role="status" className={styles.empty}>Verificando sua sessão…</p>;
  if (!isAuthenticated && competitionId !== undefined) return <PublicCompetitionEnvironment key={competitionId} competitionId={competitionId} onBack={onBack ?? (() => {})} />;
  if (!isAuthenticated) return <div className={styles.empty}><h2>Entre para montar sua escalação</h2><p>Use sua conta POINT FFC para salvar e retomar times.</p><Link className={styles.login} href={getLoginHref(competitionId ? `/point-fantasy?competicao=${competitionId}` : "/point-fantasy")}>Entrar na minha conta</Link> <Link href="/point-fantasy/atletas/">Consultar catálogo público</Link></div>;
  if (competitionId !== undefined) return <LineupEditor integrated key={`${user?.idUsuario}-${competitionId}`} competitionId={competitionId} onBack={onBack ?? (() => {})} />;
  return <CompetitionChooser key={user?.idUsuario} />;
}
