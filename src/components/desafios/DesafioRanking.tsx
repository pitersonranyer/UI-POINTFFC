"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { desafioService, desafioMessage, desafioStatus, type DesafioRanking as Ranking, type DesafioRankingItem } from "@/services/desafioService";
import { DesafioTabs } from "./DesafioTabs";
import { rankingPollingInterval, useDesafioPolling } from "./useDesafioPolling";
import styles from "./Desafios.module.css";

function Participant({ participant }: { participant: DesafioRankingItem["participante"] }) {
  const [failed, setFailed] = useState(false);
  return <><span className={styles.rankAvatar} aria-hidden="true">{participant.fotoUrl && !failed ? <Image src={participant.fotoUrl} alt="" width={36} height={36} unoptimized onError={() => setFailed(true)} /> : (participant.nome?.trim().slice(0, 1) || "P").toUpperCase()}</span><span>{participant.nome || "Participante"}</span></>;
}

export function DesafioRanking({ id }: { id: number }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Ranking | null>(null);
  const [name, setName] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setName("");
    void desafioService.detail(id, false, controller.signal).then(detail => {
      if (!controller.signal.aborted) setName(detail.nome);
    }).catch(() => { /* The public ranking remains available without detail. */ });
    return () => controller.abort();
  }, [id]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const read = useRef<AbortController | null>(null);
  const refresh = useCallback(async (background = false) => {
    if (read.current && !read.current.signal.aborted) return;
    const controller = new AbortController();
    read.current = controller;
    if (!background) setLoading(true);
    setError("");
    try {
      const result = await desafioService.ranking(id, page, controller.signal);
      if (controller.signal.aborted) return;
      // If enrollment changes shrink the last page, ask for the new final page.
      if (page > Math.max(1, result.paginacao.totalPaginas)) { setPage(Math.max(1, result.paginacao.totalPaginas)); return; }
      setData(result);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof ApiError && cause.status === 404 ? "Ranking indisponível para este Desafio." : desafioMessage(cause));
    } finally {
      if (read.current === controller) read.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [id, page]);
  useEffect(() => {
    void refresh();
    return () => read.current?.abort();
  }, [refresh]);
  useDesafioPolling(() => refresh(true), rankingPollingInterval(data));
  const ownId = !authLoading && isAuthenticated && user ? String(user.idUsuario) : null;
  const progress = data && data.totalPartidasValidas > 0 ? Math.min(100, Math.max(0, data.totalPartidasApuradas / data.totalPartidasValidas * 100)) : 0;
  return <div className={`page-shell ${styles.rankingPage}`}>
    <Link className={styles.back} href="/desafios">← Desafios</Link>
    <header className={styles.rankHeader}><div><p>RANKING · DESAFIOS</p><h1>{name || `Desafio #${id}`}</h1></div><button className={styles.rankRefresh} aria-label="Atualizar ranking" title="Atualizar ranking" disabled={loading} onClick={() => void refresh()}><RefreshCw size={18} aria-hidden="true" /></button></header>
    <DesafioTabs id={id} active="ranking" />
    {loading ? <p className={styles.feedback} role="status">Carregando ranking...</p> : error ? <div className={styles.error} role="alert"><p>{error}</p><button className={styles.secondary} onClick={() => void refresh()}>Tentar novamente</button></div> : data && <>
      <div className={styles.rankSummary} aria-label="Resumo do ranking"><div><span className={styles.badge}>{desafioStatus[data.status]}</span><span>{data.totalPartidasApuradas} de {data.totalPartidasValidas} partidas apuradas</span></div><div className={styles.rankProgress} role="progressbar" aria-label="Progresso da apuração" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${data.totalPartidasApuradas} de ${data.totalPartidasValidas} partidas apuradas`}><span style={{ width: `${progress}%` }} /></div><p>{data.totalPartidasAnuladas} anuladas <span>Máximo: {data.pontuacaoMaxima} pts</span></p></div>
      {data.status === "ENCERRADO" && <p className={styles.feedback}>Desafio encerrado. Classificação conforme a última apuração.</p>}
      {!data.ranking.length ? <p className={styles.feedback}>Nenhum participante no ranking ainda.</p> : <>
        <table className={styles.rankList}>
          <caption>Classificação dos participantes · {data.paginacao.total} inscritos</caption>
          <thead><tr><th scope="col">Pos.</th><th scope="col">Participante</th><th scope="col">Pontos</th><th scope="col">Acertos</th></tr></thead>
          <tbody>{data.ranking.map(row => {
            const own = ownId !== null && String(row.participante.idUsuario) === ownId;
            // Preserve the backend's order and positions, including ties across pages.
            return <tr key={row.inscricaoId ?? `${row.participante.idUsuario}:${row.numero ?? 1}`} className={own ? styles.ownRank : undefined} aria-label={own ? "Sua classificação" : undefined}>
              <td className={styles.rankPosition}>{row.posicao}</td><th scope="row"><div className={styles.rankParticipant}><Participant participant={row.participante} /><span className={styles.rankPick}>{row.nome || `Palpite ${row.numero ?? 1}`}{own && <small>Você</small>}</span></div></th><td className={styles.rankPoints}><strong>{row.pontos}</strong><span>pts</span></td><td className={styles.rankHits}>{row.acertos} {row.acertos === 1 ? "acerto" : "acertos"}</td>
            </tr>;
          })}</tbody>
        </table>
        <p className={styles.rankingNote}>Somente inscrições ativas entram no ranking. Posições iguais indicam empate.</p>
      </>}
      {data.paginacao.totalPaginas > 1 && <nav className={styles.pagination} aria-label="Paginação do ranking"><button className={styles.secondary} disabled={data.paginacao.pagina <= 1} onClick={() => setPage(data.paginacao.pagina - 1)}>Anterior</button><span>Página {data.paginacao.pagina} de {data.paginacao.totalPaginas}</span><button className={styles.secondary} disabled={data.paginacao.pagina >= data.paginacao.totalPaginas} onClick={() => setPage(data.paginacao.pagina + 1)}>Próxima</button></nav>}
    </>}
  </div>;
}
