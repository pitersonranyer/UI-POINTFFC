"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Shirt, WalletCards } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { formatWalletCurrency } from "@/lib/format";
import styles from "./ProfileDashboard.module.css";
import { AdminRoundActions } from "./AdminRoundActions";

export function ProfileDashboard() {
  const { user } = useAuth(); const { wallet, isLoading, error } = useWallet();
  if (!user) return null;
  return <div className="page-shell"><header className={styles.identity}>{user.fotoUrl ? <Image src={user.fotoUrl} alt={`Foto de ${user.nome || user.email}`} width={76} height={76} unoptimized referrerPolicy="no-referrer" /> : <span>{(user.nome || user.email).charAt(0).toUpperCase()}</span>}<div><p className="eyebrow">Seu perfil</p><h1 className="page-title">{user.nome || user.email.split("@")[0]}</h1><p>{user.email}</p></div></header><section className={styles.account}><div className={styles.heading}><h2>Minha conta</h2><p>Acesse e gerencie suas funcionalidades pessoais.</p></div><div className={styles.grid}><Link href="/meus-times" className={styles.card}><i><Shirt /></i><span><strong>Meus Times</strong><small>Gerencie seus times favoritos do Cartola.</small></span><ChevronRight /></Link><Link href="/carteira" className={styles.card}><i><WalletCards /></i><span><strong>Carteira</strong><small>Gerencie seu saldo e seus créditos.</small><b>{isLoading ? "Carregando saldo..." : error || !wallet ? "Saldo indisponível" : `Saldo: ${formatWalletCurrency(wallet.saldoDisponivel)}${wallet.status === "BLOQUEADA" ? " · Carteira bloqueada" : ""}`}</b></span><ChevronRight /></Link></div></section><AdminRoundActions /></div>;
}
