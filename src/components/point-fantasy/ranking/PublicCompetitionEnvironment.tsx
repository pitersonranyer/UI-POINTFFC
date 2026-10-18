"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/services/apiClient";
import { lineupError } from "@/services/pointFantasyLineupService";
import { getLoginHref } from "@/lib/postAuthRedirect";
import type { CompetitionDetail } from "@/types/pointFantasyLineup";
import { CompetitionTabs } from "./CompetitionTabs";
import { CompetitionRanking } from "./CompetitionRanking";
import { CompetitionLineupAction, competitionLineupPrice, publicCreationBlockReason } from "../lineups/CompetitionLineupAction";
import { formatFantasyDate } from "../lineups/LineupEditor";
import leagueStyles from "../../leagues/PointCompetition.module.css";
import styles from "../lineups/LineupBuilder.module.css";

// Public read-only environment: never requests private lineups or athlete/editor context.
export function PublicCompetitionEnvironment({ competitionId, onBack }: { competitionId: number; onBack: () => void }) {
  const [tab, setTab] = useState("Meus times");
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const fee = competition ? competitionLineupPrice(competition) : null;
  const lockTimes = [...(competition?.partidas ?? []).map(match => Date.parse(match.inicioPrevisto)), ...(competition?.fechamentoDefinitivoEm ? [Date.parse(competition.fechamentoDefinitivoEm)] : [])].filter(Number.isFinite);
  const lockTime = lockTimes.length ? new Date(Math.min(...lockTimes)).toISOString() : null;
  return <div className={`${styles.editor} ${styles.competitionOverview}`}>
    <div className={styles.competitionTopline}><button className={styles.competitionBack} type="button" onClick={onBack}>← Competições</button>{competition && <span className={`${leagueStyles.roundBadge} ${styles.lightRoundBadge}`}>Rodada {competition.rodada}</span>}</div>
    {competition ? <section className={styles.compactCompetitionHeader} aria-label="Competição selecionada">
      <h1 title={competition.nome}>{competition.nome}</h1>
      <p className={styles.competitionSummary}><span>{competition.temporada}</span><span>{competition.tipoAcesso === "FREE" ? "Grátis" : fee ? `Paga · ${fee}` : "Paga · valor indisponível"}</span><span>Inscrições até {formatFantasyDate(competition.fimInscricao)}</span></p>
      <button className={styles.detailsToggle} type="button" aria-expanded={detailsOpen} aria-controls="public-competition-details" onClick={() => setDetailsOpen(open => !open)}>{detailsOpen ? "Ocultar detalhes ▴" : "Ver detalhes ▾"}</button>
      <div className={styles.competitionDetails} id="public-competition-details" hidden={!detailsOpen}>
        <h3>Informações da competição</h3>
        <dl className={styles.competitionMetadata}><dt>Status</dt><dd>{competition.status}</dd><dt>Temporada</dt><dd>{competition.temporada}</dd><dt>Rodada</dt><dd>{competition.rodada}</dd><dt>Modalidade</dt><dd>{competition.tipoAcesso === "FREE" ? "FREE · Grátis" : `PAGO · ${fee ?? "valor indisponível"}`}</dd><dt>Período de inscrição</dt><dd>{formatFantasyDate(competition.inicioInscricao)} – {formatFantasyDate(competition.fimInscricao)} (Brasília)</dd><dt>Bloqueio</dt><dd>{lockTime ? formatFantasyDate(lockTime) + " (Brasília)" : "Horário indisponível"}</dd><dt>Confrontos</dt><dd>{competition.partidas.length} {competition.partidas.length === 1 ? "confronto" : "confrontos"}</dd><dt>Limite de escalações</dt><dd>{competition.limiteEscalacoesUsuario ?? "Sem limite definido"}</dd></dl>
      </div>
    </section> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setRetry(value => value + 1); }}>Tentar novamente</button></div> : <p role="status">Carregando competição…</p>}
    {competition && <CompetitionLineupAction competition={competition} href={getLoginHref(`/point-fantasy?competicao=${competitionId}`)} disabledReason={publicCreationBlockReason(competition, now)} />}
    <CompetitionTabs tab={tab} onChange={setTab}/>
    <section role="tabpanel" id="journey-panel" aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}>
      {tab === "Ranking" ? <CompetitionRanking competitionId={competitionId}/> : tab === "Premiação" ? <p className={styles.note}>Funcionalidade disponível em breve.</p> : <div className={styles.empty}><h2>Entre para montar sua escalação</h2><p>Use sua conta POINT FFC para salvar e retomar times.</p><Link className={styles.login} href={getLoginHref(`/point-fantasy?competicao=${competitionId}`)}>Entrar na minha conta</Link> <Link href="/point-fantasy/atletas/">Consultar catálogo público</Link></div>}
    </section>
  </div>;
}
