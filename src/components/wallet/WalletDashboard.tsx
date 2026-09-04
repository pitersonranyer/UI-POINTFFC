"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, ChevronRight, Copy, List, Plus, RotateCcw, WalletCards, X } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency } from "@/lib/format";
import styles from "./WalletDashboard.module.css";

const QUICK_VALUES = [10, 20, 50, 100];
const moneyInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits ? (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
};
export function WalletDashboard() {
  const { wallet, activeCharge, isLoading, error, createPixDeposit, simulatePixPayment, clearActiveCharge, resetMock } = useWallet();
  const [modalOpen, setModalOpen] = useState(false); const [value, setValue] = useState(""); const [formError, setFormError] = useState("");
  const [working, setWorking] = useState(false); const [qrCode, setQrCode] = useState(""); const [copied, setCopied] = useState(false); const [success, setSuccess] = useState("");
  useEffect(() => { if (!activeCharge) { setQrCode(""); return; } QRCode.toDataURL(activeCharge.qrCodeValue, { width: 260, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQrCode).catch(() => setFormError("Não foi possível gerar o QR Code.")); }, [activeCharge]);
  useEffect(() => { if (!modalOpen) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setModalOpen(false); clearActiveCharge(); } }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [modalOpen, clearActiveCharge]);

  const openModal = () => { setValue(""); setFormError(""); setSuccess(""); clearActiveCharge(); setModalOpen(true); };
  const closeModal = () => { if (working) return; setModalOpen(false); clearActiveCharge(); };
  const generate = async () => { const parsed = Number(value.replace(/\./g, "").replace(",", ".")); if (!Number.isFinite(parsed) || parsed <= 0) { setFormError("Informe um valor maior que zero."); return; } setWorking(true); setFormError(""); try { await createPixDeposit(parsed); } catch (reason) { setFormError(reason instanceof Error ? reason.message : "Não foi possível gerar o PIX."); } finally { setWorking(false); } };
  const pay = async () => { if (!activeCharge || activeCharge.status !== "AGUARDANDO_PAGAMENTO") return; setWorking(true); setFormError(""); try { await simulatePixPayment(activeCharge.id); setSuccess(`${formatCurrency(activeCharge.value)} foram adicionados à sua carteira.`); } catch (reason) { setFormError(reason instanceof Error ? reason.message : "Não foi possível simular o pagamento."); } finally { setWorking(false); } };
  const copy = async () => { if (!activeCharge) return; try { await navigator.clipboard.writeText(activeCharge.pixCopyPaste); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setFormError("Não foi possível copiar. Selecione o código manualmente."); } };

  if (isLoading) return <div className={styles.loading} role="status"><span />Carregando sua carteira...</div>;
  return <div className="page-shell">
    <header className={styles.pageHeader}><div><p className="eyebrow">Seu saldo no Fantasy Point</p><h1 className="page-title">Carteira</h1><p className="page-subtitle">Créditos e movimentações para você entrar no jogo.</p></div><span className={styles.demo}>PIX simulado</span></header>
    {error && <div className={styles.error} role="alert">{error}</div>}
    <section className={styles.balanceCard} aria-label="Resumo da carteira"><div className={styles.balanceTop}><span className={styles.walletIcon}><WalletCards /></span><div><small>Saldo disponível</small><strong>{formatCurrency(wallet?.balance ?? 0)}</strong></div></div><button type="button" onClick={openModal}><Plus size={19} />Adicionar saldo</button></section>
    <Link href="/carteira/extrato" className={styles.statementLink}><span><List /><span><strong>Extrato</strong><small>Consulte todas as movimentações da sua carteira.</small></span></span><ChevronRight /></Link>
    {process.env.NODE_ENV === "development" && <button className={styles.reset} type="button" onClick={() => void resetMock()}><RotateCcw size={14} />Resetar carteira de demonstração</button>}
    {modalOpen && <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title"><button className={styles.close} type="button" onClick={closeModal} aria-label="Fechar"><X /></button>
      {!activeCharge ? <><span className={styles.modalIcon}><WalletCards /></span><h2 id="wallet-modal-title">Adicionar saldo</h2><p>Escolha quanto deseja adicionar à sua carteira.</p><div className={styles.quickValues}>{QUICK_VALUES.map((quick) => <button type="button" key={quick} className={value === quick.toFixed(2).replace(".", ",") ? styles.selected : ""} onClick={() => { setValue(quick.toFixed(2).replace(".", ",")); setFormError(""); }}>R$ {quick}</button>)}</div><label className={styles.valueLabel}>Outro valor<span><b>R$</b><input inputMode="decimal" placeholder="0,00" value={value} onChange={(event) => { setValue(moneyInput(event.target.value)); setFormError(""); }} autoFocus /></span></label>{formError && <p className={styles.formError} role="alert">{formError}</p>}<button className={styles.primary} type="button" onClick={() => void generate()} disabled={working}>{working ? "Gerando..." : "Gerar PIX"}</button></> : <><div className={styles.pixHeader}>{activeCharge.status === "PAGO" ? <span className={styles.successIcon}><Check /></span> : <span className={styles.modalIcon}><WalletCards /></span>}<div><small>{activeCharge.status === "PAGO" ? "Pagamento confirmado" : "PIX gerado"}</small><h2 id="wallet-modal-title">{formatCurrency(activeCharge.value)}</h2></div></div><span className={activeCharge.status === "PAGO" ? styles.paid : styles.pending}>{activeCharge.status === "PAGO" ? "Pagamento confirmado" : "Aguardando pagamento"}</span>{activeCharge.status !== "PAGO" && qrCode && <Image className={styles.qr} src={qrCode} width={260} height={260} alt="QR Code do PIX simulado" unoptimized />}<div className={styles.txid}>TXID <strong>{activeCharge.txid}</strong></div><label className={styles.codeLabel}>PIX Copia e Cola<textarea readOnly value={activeCharge.pixCopyPaste} /></label><button className={styles.copy} type="button" onClick={() => void copy()}>{copied ? <Check /> : <Copy />}{copied ? "Código copiado" : "Copiar código"}</button>{formError && <p className={styles.formError} role="alert">{formError}</p>}{success && <div className={styles.successMessage}><strong>Pagamento confirmado!</strong>{success}</div>}{process.env.NODE_ENV === "development" && activeCharge.status === "AGUARDANDO_PAGAMENTO" && <button className={styles.primary} type="button" onClick={() => void pay()} disabled={working}>{working ? "Confirmando..." : "Simular pagamento PIX"}</button>}</>}
    </section></div>}
  </div>;
}
