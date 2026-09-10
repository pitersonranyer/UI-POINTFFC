"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./WalletStatement.module.css";

export function WalletStatement() {
  return <div className="page-shell"><Link href="/carteira" className={styles.back}><ArrowLeft />Voltar para a Carteira</Link><header className={styles.header}><p className="eyebrow">Carteira</p><h1 className="page-title">Extrato</h1></header><section className={styles.statement} aria-label="Movimentações da carteira"><div className={styles.empty}>A consulta de movimentações estará disponível em breve.</div></section></div>;
}
