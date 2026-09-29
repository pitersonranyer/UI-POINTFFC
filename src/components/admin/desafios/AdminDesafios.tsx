"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminDesafioService, type DesafioFilters, type DesafioPage } from "@/services/adminDesafioService";
import { Pagination } from "../CompetitionList";
import { desafioError, displayDate, statusLabels } from "./desafioForm";
import styles from "../Admin.module.css";
import css from "./Desafios.module.css";

export function AdminDesafios() {
  const [filters, setFilters] = useState<DesafioFilters>({ pagina: 1, limite: 20 });
  const [status, setStatus] = useState<DesafioFilters["status"]>("");
  const [access, setAccess] = useState<DesafioFilters["tipoAcesso"]>("");
  const [data, setData] = useState<DesafioPage | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    adminDesafioService.list(filters).then(result => { if (active) setData(result); }).catch(cause => { if (active) setError(desafioError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, retry]);
  return <>
    <header className={`${styles.pageHeader} ${styles.listHeader}`}><div><p>ADMINISTRAÇÃO</p><h1>Desafios</h1><span>Configure partidas e publique seus desafios.</span></div><Link href="/admin/desafios/novo">Novo Desafio</Link></header>
    <section className={styles.listPanel}>
      <form className={css.toolbar} onSubmit={event => { event.preventDefault(); setFilters({ pagina: 1, limite: 20, status, tipoAcesso: access }); }}>
        <label>Status<select value={status} onChange={event => setStatus(event.target.value as DesafioFilters["status"])}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Acesso<select value={access} onChange={event => setAccess(event.target.value as DesafioFilters["tipoAcesso"])}><option value="">Todos</option><option>FREE</option><option>PAGO</option></select></label>
        <button className={css.button} type="submit">Filtrar</button>
      </form>
      {loading ? <p role="status">Carregando desafios...</p> : error ? <div role="alert"><p>{error}</p><button className={css.button} onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : !data?.itens.length ? <p className={css.hint}>Nenhum desafio encontrado.</p> : <>
        <div role="list" className={css.list}>{data.itens.map(item => <article role="listitem" key={item.id} className={css.row}>
          <strong>{item.nome}</strong><span>{item.tipoAcesso}{item.tipoAcesso === "PAGO" && ` · ${Number(item.valorInscricao).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}</span>
          <span className={styles.status}>{statusLabels[item.status]}</span><small>{displayDate(item.dataInicio)} → {displayDate(item.dataFim)}</small>
          <Link className={styles.editLink} href={`/admin/desafios/editar?id=${item.id}`}>{item.status === "RASCUNHO" ? "Editar" : "Abrir"}</Link>
        </article>)}</div>
        <Pagination page={data.paginacao.pagina} totalPages={data.paginacao.totalPaginas} onChange={pagina => setFilters(current => ({ ...current, pagina }))} />
      </>}
    </section>
  </>;
}
