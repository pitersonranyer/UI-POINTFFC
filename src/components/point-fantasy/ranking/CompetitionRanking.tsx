"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLoginHref } from "@/lib/postAuthRedirect";
import { ApiError } from "@/services/apiClient";
import { getFantasyCompetitionRanking } from "@/services/pointFantasyRankingService";
import type { FantasyCompetitionRanking } from "@/types/pointFantasyRanking";
import { TeamCrest } from "../lineups/TeamCrest";
import leagueStyles from "../../leagues/PointCompetition.module.css";
import styles from "./CompetitionRanking.module.css";

function rankingError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sua sessão expirou ou é inválida. Entre novamente para continuar.";
    if ([403,404].includes(error.status)) return "Esta competição está indisponível ou você não tem acesso ao ranking.";
    if (error.status === 0) return "Não foi possível conectar ao ranking. Verifique sua conexão e tente novamente.";
  }
  return error instanceof Error ? error.message : "Não foi possível carregar o ranking. Tente novamente.";
}

// Keyed by competition and session: personalized rows never survive a change of viewer.
export function CompetitionRanking({ competitionId }: { competitionId: number }) {
  const { isAuthenticated, isLoading, user, accessToken } = useAuth();
  if (isLoading) return <p role="status">Verificando sua sessão…</p>;
  return <RankingPages key={`${competitionId}:${isAuthenticated ? user?.idUsuario : "anonimo"}`} competitionId={competitionId} authenticated={!!isAuthenticated} session={accessToken} />;
}

function RankingPages({ competitionId, authenticated, session }: { competitionId: number; authenticated: boolean; session: string | null }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  return <RankingPage key={`${page}:${revision}:${session ?? "anonymous"}`} competitionId={competitionId} page={page} authenticated={authenticated} onPage={setPage} onRetry={() => setRevision(value => value + 1)} />;
}

function RankingPage({ competitionId, page, authenticated, onPage, onRetry }: { competitionId: number; page: number; authenticated: boolean; onPage: (page: number) => void; onRetry: () => void }) {
  const [data, setData] = useState<FantasyCompetitionRanking | null>(null);
  const [error, setError] = useState("");
  const [sessionError, setSessionError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const timer = window.setTimeout(() => controller.abort(), 30000);
    getFantasyCompetitionRanking(competitionId, page, controller.signal)
      .then(result => { if (current) setData(result); })
      .catch(err => { if (current) { setError(rankingError(err)); setSessionError(err instanceof ApiError && err.status === 401); } })
      .finally(() => window.clearTimeout(timer));
    return () => { current = false; window.clearTimeout(timer); controller.abort(); };
  }, [competitionId, page]);

  if (error) return <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={onRetry}>Tentar novamente</button>{sessionError && <Link href={getLoginHref(`/point-fantasy?competicao=${competitionId}`)}>Entrar na minha conta</Link>}</div>;
  if (!data) return <p className={styles.state} role="status">Carregando ranking…</p>;
  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return <div className={`${leagueStyles.panel} ${styles.ranking}`}>
    <header className={`${leagueStyles.heading} ${styles.header}`}><div><h2>Ranking</h2><p>{data.total.toLocaleString("pt-BR")} {data.total === 1 ? "time inscrito" : "times inscritos"}</p></div><button type="button" onClick={onRetry}><RefreshCw size={15} aria-hidden="true"/>Atualizar</button></header>
    {data.total === 0 && data.estadoPontuacao === "NAO_INICIADA" && <p className={styles.message}>A competição ainda não começou. Confira os times que já estão na disputa!</p>}
    {data.total === 0 && data.estadoPontuacao === "INDISPONIVEL" && <p className={styles.message}>A pontuação do POINT FFC Fantasy ainda não está disponível.</p>}
    {!data.items.length ? <p role="status" className={styles.state}>{data.total === 0 ? "Nenhum time inscrito nesta competição." : "Não há times nesta página. Volte à página anterior."}</p> : <ul className={`${leagueStyles.entries} ${styles.list}`} aria-label="Times inscritos">
      {data.items.map(team => {
        const mine = authenticated && team.meuTime === true;
        return <li key={team.escalacaoId} className={`${leagueStyles.entry} ${styles.row} ${mine ? leagueStyles.own : ""}`}>
          <strong className={`${leagueStyles.position} ${styles.position}`} aria-label={team.posicao === null ? "Posição não disponível" : `Posição ${team.posicao}`}>{team.posicao ?? "—"}</strong>
          <TeamCrest team={{ id:team.escalacaoId, competicaoId:competitionId, identidade:team.identidade, sequencial:team.identidade?.sequencial ?? null }} />
          <div className={`${leagueStyles.teamName} ${styles.identity}`}><strong><span className={styles.name} title={team.nomePublico ?? `Time #${team.escalacaoId}`}>{team.nomePublico ?? `Time #${team.escalacaoId}`}</span>{mine && <span className={`${leagueStyles.ownBadge} ${styles.badge}`}>Seu time</span>}</strong>{team.formacao && <small>{team.formacao}</small>}</div>
          <span className={`${leagueStyles.score} ${styles.score}`} aria-label={team.pontuacao === null ? "Pontuação não disponível" : `Pontuação ${team.pontuacao.toLocaleString("pt-BR")}`}>{team.pontuacao === null ? "—" : team.pontuacao.toLocaleString("pt-BR", { maximumFractionDigits:20 })}</span>
        </li>;
      })}
    </ul>}
    {(pages > 1 || page > 1) && <nav className={styles.pagination} aria-label="Páginas do ranking"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button><span role="status">Página {page} de {pages}</span><button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima</button></nav>}
  </div>;
}
