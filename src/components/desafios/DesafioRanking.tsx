"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { desafioService, desafioMessage, desafioStatus, type DesafioRanking as Ranking, type DesafioRankingItem } from "@/services/desafioService";
import { DesafioTabs } from "./DesafioTabs";
import styles from "./Desafios.module.css";

function Participant({ participant }: { participant: DesafioRankingItem["participante"] }) {
  const [failed, setFailed] = useState(false);
  return <>{participant.fotoUrl && !failed && <Image src={participant.fotoUrl} alt="" width={28} height={28} unoptimized onError={() => setFailed(true)} />}<span>{participant.nome || "Participante"}</span></>;
}

export function DesafioRanking({ id }: { id: number }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  const [data, setData] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    desafioService.ranking(id, page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      // If enrollment changes shrink the last page, ask for the new final page.
      if (page > Math.max(1, result.paginacao.totalPaginas)) { setPage(Math.max(1, result.paginacao.totalPaginas)); return; }
      setData(result);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof ApiError && cause.status === 404 ? "Ranking indisponível para este Desafio." : desafioMessage(cause));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, page, retry]);
  const ownId = !authLoading && isAuthenticated && user ? String(user.idUsuario) : null;
  return <div className="page-shell">
    <Link className={styles.back} href="/desafios">← Desafios</Link>
    <header className={styles.header}><div><p className="eyebrow">DESAFIO #{id}</p><h1 className="page-title">Ranking</h1></div><button className={styles.secondary} disabled={loading} onClick={() => setRetry(value => value + 1)}>Atualizar ranking</button></header>
    <DesafioTabs id={id} active="ranking" />
    {loading ? <p className={styles.feedback} role="status">Carregando ranking...</p> : error ? <div className={styles.error} role="alert"><p>{error}</p><button className={styles.secondary} onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : data && <>
      <div className={styles.rankingSummary} aria-label="Resumo do ranking"><span className={styles.badge}>{desafioStatus[data.status]}</span><span>{data.totalPartidasApuradas} de {data.totalPartidasValidas} partidas apuradas</span><span>{data.totalPartidasAnuladas} anuladas</span><span>Máximo: {data.pontuacaoMaxima} pts</span></div>
      {data.status === "ENCERRADO" && <p className={styles.feedback}>Desafio encerrado. Classificação conforme a última apuração.</p>}
      {!data.ranking.length ? <p className={styles.feedback}>Nenhum participante no ranking ainda.</p> : <>
        <table className={styles.rankingTable}>
          <caption>Classificação dos participantes · {data.paginacao.total} inscritos</caption>
          <thead><tr><th scope="col">Pos.</th><th scope="col">Participante</th><th scope="col">Pontos</th><th scope="col">Acertos</th></tr></thead>
          <tbody>{data.ranking.map(row => {
            const own = ownId !== null && String(row.participante.idUsuario) === ownId;
            // Preserve the backend's order and positions, including ties across pages.
            return <tr key={row.inscricaoId ?? `${row.participante.idUsuario}:${row.numero ?? 1}`} className={own ? styles.ownRank : undefined} aria-label={own ? "Sua classificação" : undefined}>
              <td>{row.posicao}</td><th scope="row"><div className={styles.rankingParticipant}><Participant participant={row.participante} />{(row.nome || row.numero !== undefined) && <span>· {row.nome || `Palpite ${row.numero}`}</span>}{own && <small>Você</small>}</div></th><td>{row.pontos}</td><td>{row.acertos}</td>
            </tr>;
          })}</tbody>
        </table>
        <p className={styles.rankingNote}>Somente inscrições ativas entram no ranking. Posições iguais indicam empate.</p>
      </>}
      {data.paginacao.totalPaginas > 1 && <nav className={styles.pagination} aria-label="Paginação do ranking"><button className={styles.secondary} disabled={data.paginacao.pagina <= 1} onClick={() => setPage(data.paginacao.pagina - 1)}>Anterior</button><span>Página {data.paginacao.pagina} de {data.paginacao.totalPaginas}</span><button className={styles.secondary} disabled={data.paginacao.pagina >= data.paginacao.totalPaginas} onClick={() => setPage(data.paginacao.pagina + 1)}>Próxima</button></nav>}
    </>}
  </div>;
}
