"use client";

import React from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { useGeneralRanking, type RankingWarning } from "@/hooks/useGeneralRanking";
import type { GeneralRankingResponse } from "@/types/general-ranking";
import styles from "./GeneralRanking.module.css";

const score = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const total = new Intl.NumberFormat("pt-BR");

export function GeneralRanking({ season, round }: { season: number; round: number }) {
  const state = useGeneralRanking(season, round);
  return <GeneralRankingView round={state.ranking?.rodada ?? round} data={state.ranking} loading={state.loading} error={state.error} warning={state.warning} retry={state.retry} retrying={state.retrying} firstRound={state.firstRound} />;
}

export function GeneralRankingView({ round, data, loading, error, warning = null, retry, retrying = false, firstRound = false }: { round: number; data: GeneralRankingResponse | null; loading: boolean; error: boolean; warning?: RankingWarning; retry?: () => void; retrying?: boolean; firstRound?: boolean }) {
  return <section className={styles.section} aria-labelledby="general-ranking-title"><header><div><h2 id="general-ranking-title">Ranking Geral</h2><p>Rodada {round}</p></div>{data && data.total > 0 && <span>{total.format(data.total)} times no ranking</span>}</header>
    {warning && !loading && <div className={styles.warning}><span>{warning === "partial" ? "Ranking carregado, mas alguns times não puderam ser atualizados." : "Não foi possível atualizar as pontuações. Exibindo os dados disponíveis."}</span>{warning === "update-failed" && retry && <button type="button" onClick={retry} disabled={retrying}>{retrying ? "Tentando..." : "Tentar novamente"}</button>}</div>}
    {loading ? <RankingSkeleton /> : error ? <div className={styles.feedback}><p>{firstRound ? "O Ranking Geral estará disponível após a conclusão da primeira rodada." : "Não foi possível carregar o Ranking Geral."}</p>{retry && <button type="button" onClick={retry} disabled={retrying}>{retrying ? "Tentando..." : "Tentar novamente"}</button>}</div> : data?.ranking.length ? <ol className={styles.list}>{data.ranking.map((entry) => <li className={entry.posicao <= 3 ? `${styles.podium} ${styles[`podium${entry.posicao}`]}` : ""} key={entry.timeId} data-time-id={entry.timeId}><Link href={`/time?timeId=${entry.timeId}`} aria-label={`Ver escalação de ${entry.nomeTime}`}><strong className={styles.position}>{entry.posicao}º</strong><span className={styles.shield}>{entry.escudoUrl ? <img src={entry.escudoUrl} alt="" /> : <ImageOff />}</span><span className={styles.identity}><b title={entry.nomeTime}>{entry.nomeTime}</b><small title={entry.nomeCartoleiro}>{entry.nomeCartoleiro}</small></span><strong className={styles.points}>{score.format(entry.pontuacao)} <small>pts</small></strong>{entry.status && entry.status !== "PARCIAL" && <small className={styles.status}>{entry.status.replaceAll("_", " ")}</small>}</Link></li>)}</ol> : <p className={styles.feedback}>{firstRound ? "O Ranking Geral estará disponível após a conclusão da primeira rodada." : "Ranking ainda não disponível para esta rodada"}</p>}
    <span className={styles.fullRanking} aria-disabled="true">Ver ranking completo →</span></section>;
}

function RankingSkeleton() { return <div className={styles.skeleton} aria-label="Carregando ranking geral">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div>; }
