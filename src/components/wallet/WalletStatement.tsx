"use client";
import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency } from "@/lib/format";
import type { WalletTransaction } from "@/types/wallet";
import styles from "./WalletStatement.module.css";

function dateLabel(date: string) { const value = new Date(date); const today = new Date(); return value.toDateString() === today.toDateString() ? `Hoje, ${value.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : value.toLocaleDateString("pt-BR"); }
function typeLabel(transaction: WalletTransaction) { return { PIX_CREDITO: "Crédito PIX", INSCRICAO: "Inscrição", PREMIACAO: "Premiação", ESTORNO: "Estorno" }[transaction.type]; }

export function WalletStatement() {
  const { transactions, isLoading, error } = useWallet();
  if (isLoading) return <div className={styles.loading} role="status">Carregando extrato...</div>;
  return <div className="page-shell"><Link href="/carteira" className={styles.back}><ArrowLeft />Voltar para a Carteira</Link><header className={styles.header}><p className="eyebrow">Carteira</p><h1 className="page-title">Extrato</h1><p className="page-subtitle">Todas as movimentações da sua carteira.</p></header>{error && <div className={styles.error} role="alert">{error}</div>}<section className={styles.statement} aria-label="Movimentações da carteira">{transactions.length === 0 ? <div className={styles.empty}>Nenhuma movimentação encontrada.</div> : transactions.map((transaction) => { const incoming = transaction.amount >= 0; return <article className={styles.transaction} key={transaction.id}><span className={incoming ? styles.incomingIcon : styles.outgoingIcon}>{incoming ? <ArrowDownLeft /> : <ArrowUpRight />}</span><div className={styles.info}><strong>{transaction.description}</strong><small>{dateLabel(transaction.createdAt)} · {typeLabel(transaction)} · {transaction.status.charAt(0) + transaction.status.slice(1).toLowerCase()}</small></div><strong className={incoming ? styles.incoming : styles.outgoing}>{incoming ? "+" : "−"} {formatCurrency(Math.abs(transaction.amount))}</strong></article>; })}</section></div>;
}
