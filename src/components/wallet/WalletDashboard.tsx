"use client";
import React, { useState } from "react";
import { AddBalanceModal } from "./AddBalanceModal";
import Link from "next/link";
import { ChevronRight, List, Plus, WalletCards } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatWalletCurrency } from "@/lib/format";
import styles from "./WalletDashboard.module.css";

export function WalletDashboard() {
  const { wallet, isLoading, error, refreshWallet } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const canDeposit = !isLoading && !error && wallet?.status === "ATIVA";
  return <div className="page-shell">
    <header className={styles.pageHeader}><div><p className="eyebrow">PointFFC</p><h1 className="page-title">Minha Carteira</h1><p className="page-subtitle">Consulte os saldos da sua carteira.</p></div></header>
    <section className={styles.balanceCard} aria-label="Resumo da carteira" aria-busy={isLoading}>
      <div className={styles.balanceTop}><span className={styles.walletIcon}><WalletCards /></span><div>
        <small>Saldo disponível</small>
        {isLoading ? <p role="status">Carregando saldo...</p> : error || !wallet ? <div role="alert"><p>{error || "Saldo indisponível."}</p><button className={styles.retry} onClick={() => void refreshWallet()}>Tentar novamente</button></div> : <strong>{formatWalletCurrency(wallet.saldoDisponivel)}</strong>}
      </div></div>
      <button type="button" disabled={!canDeposit} onClick={() => setModalOpen(true)}><Plus size={19} />Adicionar saldo</button>
      {!isLoading && !error && wallet && <div className={styles.summary}><div><div><span>Saldo bloqueado</span><strong>{formatWalletCurrency(wallet.saldoBloqueado)}</strong></div></div>{wallet.status === "BLOQUEADA" && <div role="status">Carteira bloqueada</div>}</div>}
    </section>
    <Link href="/carteira/extrato" className={styles.statementLink}><span><List /><span><strong>Extrato</strong><small>Movimentações disponíveis em uma próxima etapa.</small></span></span><ChevronRight /></Link>
    {modalOpen && <AddBalanceModal close={() => setModalOpen(false)} />}
  </div>;
}
