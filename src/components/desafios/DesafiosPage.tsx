"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { desafioService, desafioDate, desafioMessage, desafioStatus, type DesafiosPagina } from "@/services/desafioService";
import { formatWalletCurrency } from "@/lib/format";
import styles from "./Desafios.module.css";

export function DesafiosPage() {
  const [page, setPage] = useState(1), [access, setAccess] = useState("");
  const [data, setData] = useState<DesafiosPagina | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    desafioService.list(page, access, controller.signal).then(result => { if (!controller.signal.aborted) setData(result); }).catch(cause => { if (!controller.signal.aborted) setError(desafioMessage(cause)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, access, retry]);
  return <div className="page-shell">
    <header className={styles.header}><div><p className="eyebrow">POINT FFC</p><h1 className="page-title">Desafios</h1><p>Escolha os resultados e participe.</p></div><select aria-label="Tipo de acesso" value={access} onChange={event => { setAccess(event.target.value); setPage(1); }}><option value="">Todos</option><option value="FREE">FREE</option><option value="PAGO">Pagos</option></select></header>
    {loading ? <p role="status" className={styles.feedback}>Carregando desafios...</p> : error ? <div role="alert" className={styles.error}><p>{error}</p><button className={styles.secondary} onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : !data?.itens.length ? <p className={styles.feedback}>Nenhum Desafio disponível no momento.</p> : <>
      <ul className={styles.list}>{data.itens.map(item => <li key={item.id} className={styles.item}><div><h2>{item.nome}</h2><div className={styles.badges}><span className={styles.badge}>{item.tipoAcesso === "FREE" ? "FREE" : formatWalletCurrency(item.valorInscricao)}</span><span className={styles.status}>{desafioStatus[item.status]}</span></div><small>{desafioDate(item.dataInicio)} — {desafioDate(item.dataFim)}</small></div><Link className={styles.button} href={`/desafios/detalhe?id=${item.id}`} aria-label={`Abrir ${item.nome}`}>Abrir</Link></li>)}</ul>
      {data.paginacao.totalPaginas > 1 && <nav className={styles.pagination} aria-label="Paginação de Desafios"><button className={styles.secondary} disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>{data.paginacao.pagina} / {data.paginacao.totalPaginas}</span><button className={styles.secondary} disabled={page >= data.paginacao.totalPaginas} onClick={() => setPage(value => value + 1)}>Próxima</button></nav>}
    </>}
  </div>;
}
