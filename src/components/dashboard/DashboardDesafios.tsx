"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { desafioService, desafioDate, desafioStatus, type DesafioResumo } from "@/services/desafioService";
import { formatWalletCurrency } from "@/lib/format";
import shared from "@/components/desafios/Desafios.module.css";
import dashboard from "./Dashboard.module.css";
import styles from "./DashboardDesafios.module.css";

export function DashboardDesafios() {
  const [items, setItems] = useState<DesafioResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    desafioService.list(1, "", controller.signal).then(data => {
      if (!controller.signal.aborted) setItems(data.itens.slice(0, 3));
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  return <section className={dashboard.cardSection} aria-label="Desafios">
    <header className={dashboard.sectionHead}><h2>Desafios</h2><Link href="/desafios">Ver todos <ArrowRight size={14} /></Link></header>
    {loading ? <p className={styles.feedback} role="status">Carregando desafios...</p>
      : error ? <p className={styles.feedback}>Não foi possível carregar os Desafios. Consulte em Ver todos.</p>
      : !items.length ? <p className={styles.feedback}>Nenhum Desafio disponível no momento.</p>
      : <ul className={styles.list}>{items.map(item => <li key={item.id} className={styles.item}>
        <div className={styles.summary}>
          <h3>{item.nome}</h3>
          <div className={shared.badges}><span className={shared.badge}>{item.tipoAcesso === "FREE" ? "FREE" : formatWalletCurrency(item.valorInscricao)}</span><span className={shared.status}>{desafioStatus[item.status]}</span></div>
          <small>{item.status === "ABERTO" ? "Inscrições até " : "Até "}{desafioDate(item.status === "ABERTO" ? item.fimInscricao : item.dataFim)}</small>
        </div>
        <Link className={shared.button} href={`/desafios/detalhe?id=${item.id}`} aria-label={`Abrir ${item.nome}`}>Abrir</Link>
      </li>)}</ul>}
  </section>;
}
