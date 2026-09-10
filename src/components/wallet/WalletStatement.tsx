"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { walletService } from "@/services/walletService";
import { formatWalletCurrency } from "@/lib/format";
import type { WalletStatementItem, WalletStatementResponse } from "@/types/wallet";
import styles from "./WalletStatement.module.css";

export function WalletStatement() {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<WalletStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const next = await walletService.getWalletStatement(page, 20, controller.signal);
        if (!controller.signal.aborted) setResult(next);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [page, attempt]);
  function changePage(next: number) { setLoading(true); setError(false); setPage(next); }
  return <div className="page-shell">
    <Link href="/carteira" className={styles.back}><ArrowLeft />Voltar para a Carteira</Link>
    <header className={styles.header}><p className="eyebrow">Carteira</p><h1 className="page-title">Extrato da Carteira</h1><p className="page-subtitle">Acompanhe todas as movimentações da sua carteira.</p></header>
    <section className={styles.statement} aria-label="Movimentações da carteira" aria-busy={loading}>
      {loading ? <div className={styles.loading} role="status">Carregando extrato...</div> : error ? <div className={styles.empty}><p role="alert">Não foi possível carregar seu extrato.</p><button className={styles.retry} onClick={() => { setLoading(true); setAttempt((current) => current + 1); }}>Tentar novamente</button></div> : result && (
        result.items.length === 0 ? <div className={styles.empty}><strong>{result.total === 0 ? "Nenhuma movimentação ainda" : "Nenhuma movimentação nesta página"}</strong>{result.total === 0 && <p>Suas recargas e outras movimentações aparecerão aqui.</p>}</div> :
          result.items.map((item) => <article key={item.id} className={styles.entry}>
            <div className={styles.info}><strong>{description(item)}</strong><small><time dateTime={item.criadoEm}>{dateLabel(item.criadoEm)}</time></small></div>
            <strong className={item.tipo === "CREDITO" ? styles.incoming : item.tipo === "DEBITO" ? styles.outgoing : styles.amount}>{item.tipo === "CREDITO" ? "+ " : item.tipo === "DEBITO" ? "- " : ""}{formatWalletCurrency(item.valor)}</strong>
            <p className={styles.balance}>Saldo após movimentação: {formatWalletCurrency(item.saldoPosterior)}</p>
          </article>)
      )}
    </section>
    {result && result.totalPages > 1 && <nav className={styles.pagination} aria-label="Paginação do extrato">
      <button disabled={loading || page <= 1} onClick={() => changePage(page - 1)}>Anterior</button>
      <span>Página {page} de {result.totalPages}</span>
      <button disabled={loading || page >= result.totalPages} onClick={() => changePage(page + 1)}>Próxima</button>
    </nav>}
  </div>;
}

function description(item: WalletStatementItem) {
  if (item.tipo === "CREDITO" && item.origem === "RECARGA_PIX") return "Recarga via Pix";
  return item.descricao?.trim() || "Movimentação da carteira";
}
function dateLabel(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}
