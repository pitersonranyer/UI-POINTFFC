"use client";

import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { CARTOLA_SEASON } from "@/config/cartola";
import { generalRankingService } from "@/services/generalRankingService";
import type { GeneralRankingResponse } from "@/types/general-ranking";
import styles from "./GeneralRanking.module.css";

const score = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const total = new Intl.NumberFormat("pt-BR");

export function GeneralRanking({ round }: { round: number }) {
  const [data, setData] = useState<GeneralRankingResponse | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true); setError(false);
    void (async () => {
      try { const response = await generalRankingService.buscar(CARTOLA_SEASON, round); if (active) setData(response); }
      catch { if (active) { setData(null); setError(true); } }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [round]);
  return <GeneralRankingView round={round} data={data} loading={loading} error={error} />;
}

export function GeneralRankingView({ round, data, loading, error }: { round: number; data: GeneralRankingResponse | null; loading: boolean; error: boolean }) {
  return <section className={styles.section} aria-labelledby="general-ranking-title"><header><div><h2 id="general-ranking-title">Ranking Geral</h2><p>Rodada {round}</p></div>{data && data.total > 0 && <span>{total.format(data.total)} times no ranking</span>}</header>
    {loading ? <RankingSkeleton /> : error ? <p className={styles.feedback}>Ranking indisponível no momento</p> : data?.ranking.length ? <ol className={styles.list}>{data.ranking.map((entry) => <li className={entry.posicao <= 3 ? `${styles.podium} ${styles[`podium${entry.posicao}`]}` : ""} key={entry.timeId} data-time-id={entry.timeId}><strong className={styles.position}>{entry.posicao}º</strong><span className={styles.shield}>{entry.escudoUrl ? <img src={entry.escudoUrl} alt="" /> : <ImageOff />}</span><span className={styles.identity}><b title={entry.nomeTime}>{entry.nomeTime}</b><small title={entry.nomeCartoleiro}>{entry.nomeCartoleiro}</small></span><strong className={styles.points}>{score.format(entry.pontuacao)} <small>pts</small></strong>{entry.status && entry.status !== "PARCIAL" && <small className={styles.status}>{entry.status.replaceAll("_", " ")}</small>}</li>)}</ol> : <p className={styles.feedback}>Ranking ainda não disponível para esta rodada</p>}
    <span className={styles.fullRanking} aria-disabled="true">Ver ranking completo →</span></section>;
}

function RankingSkeleton() { return <div className={styles.skeleton} aria-label="Carregando ranking geral">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div>; }
