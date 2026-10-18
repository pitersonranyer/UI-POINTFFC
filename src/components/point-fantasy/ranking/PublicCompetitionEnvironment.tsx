"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/services/apiClient";
import { lineupError } from "@/services/pointFantasyLineupService";
import { getLoginHref } from "@/lib/postAuthRedirect";
import type { CompetitionDetail } from "@/types/pointFantasyLineup";
import { CompetitionTabs } from "./CompetitionTabs";
import { CompetitionRanking } from "./CompetitionRanking";
import { CompetitionLineupAction, publicCreationBlockReason } from "../lineups/CompetitionLineupAction";
import leagueStyles from "../../leagues/PointCompetition.module.css";
import styles from "../lineups/LineupBuilder.module.css";

// Public read-only environment: never requests private lineups or athlete/editor context.
export function PublicCompetitionEnvironment({ competitionId }: { competitionId: number }) {
  const [tab, setTab] = useState("Meus times");
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<CompetitionDetail>(`/point-fantasy/competicoes/${competitionId}`, { signal:controller.signal })
      .then(result => { if (!controller.signal.aborted) { if (result.id !== competitionId) throw new Error("Competição indisponível."); setCompetition(result); } })
      .catch(err => { if (!controller.signal.aborted) setError(lineupError(err)); });
    return () => controller.abort();
  }, [competitionId, retry]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const formatDate = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"short" });
  return <div className={styles.editor}>
    {competition ? <section className={`${leagueStyles.competitionHeader} ${styles.fantasyCompetitionHeader}`} aria-label="Competição selecionada">
      <div className={leagueStyles.titleRow}><div><h1>{competition.nome}</h1><p>Temporada {competition.temporada}</p></div><span className={leagueStyles.roundBadge}>Rodada {competition.rodada}</span></div>
      <div className={`${leagueStyles.headerMetrics} ${styles.fantasyHeaderMetrics}`}>
        <div><strong>{competition.tipoAcesso === "FREE" ? "Gratuita" : `Paga · ${Number(competition.valorInscricao).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`}</strong><small>Participação</small></div>
        <div><strong>{competition.status}</strong><small>Status</small></div>
        <div><strong>{formatDate(competition.fimInscricao)}</strong><small>Inscrições até (Brasília)</small></div>
      </div>
    </section> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setRetry(value => value + 1); }}>Tentar novamente</button></div> : <p role="status">Carregando competição…</p>}
    {competition && <CompetitionLineupAction competition={competition} href={getLoginHref(`/point-fantasy?competicao=${competitionId}`)} disabledReason={publicCreationBlockReason(competition, now)} />}
    <CompetitionTabs tab={tab} onChange={setTab}/>
    <section role="tabpanel" id="journey-panel" aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}>
      {tab === "Ranking" ? <CompetitionRanking competitionId={competitionId}/> : tab === "Premiação" ? <p className={styles.note}>Funcionalidade disponível em breve.</p> : <div className={styles.empty}><h2>Entre para montar sua escalação</h2><p>Use sua conta POINT FFC para salvar e retomar times.</p><Link className={styles.login} href={getLoginHref(`/point-fantasy?competicao=${competitionId}`)}>Entrar na minha conta</Link> <Link href="/point-fantasy/atletas/">Consultar catálogo público</Link></div>}
    </section>
  </div>;
}
