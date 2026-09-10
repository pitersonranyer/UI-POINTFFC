"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { useWalletPixStatus } from "@/hooks/useWalletPixStatus";
import { Dialog } from "@/components/ui/Dialog";
import { walletService } from "@/services/walletService";
import { ApiError } from "@/services/apiClient";
import { formatWalletCurrency } from "@/lib/format";
import type { PixStatus, WalletPix } from "@/types/wallet";
import styles from "./AddBalanceModal.module.css";

export function normalizePixValue(raw: string): string | null {
  const match = /^(\d{1,10})(?:,(\d{1,2}))?$/.exec(raw.trim());
  if (!match) return null;
  const integer = match[1].replace(/^0+(?=\d)/, "");
  if (integer === "0") return null;
  return integer + "." + (match[2] ?? "").padEnd(2, "0");
}
const labels: Record<PixStatus, string> = {
  PENDENTE: "Aguardando pagamento", PROCESSANDO: "Pagamento em processamento",
  APROVADA: "Pagamento confirmado", REJEITADA: "Pagamento rejeitado",
  CANCELADA: "Pagamento cancelado", EXPIRADA: "Pix expirado", REEMBOLSADA: "Pagamento reembolsado",
};
function friendlyError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
    if (error.status === 403) return "Não foi possível autorizar esta operação.";
    if (error.status === 409) return "Esta tentativa já foi utilizada. Não foi possível gerar o Pix.";
  }
  return "Não foi possível gerar o Pix. Tente novamente.";
}

export function AddBalanceModal({ close }: { close(): void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [initialCharge, setCharge] = useState<WalletPix | null>(null);
  const { charge, pollError, balanceError, refreshing, retryBalance } = useWalletPixStatus(initialCharge);
  const [copyMessage, setCopyMessage] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  const attempt = useRef<{ valor: string; key: string } | null>(null);
  const running = useRef(false);
  const request = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);
  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (running.current || charge) return;
    const valor = attempt.current?.valor ?? normalizePixValue(value);
    if (!valor) { setError("Informe um valor a partir de R$ 1,00, com até duas casas decimais."); return; }
    running.current = true; setBusy(true); setError("");
    const controller = new AbortController();
    request.current = controller;
    try {
      attempt.current ??= { valor, key: crypto.randomUUID() };
      const result = await walletService.createPix(attempt.current.valor, attempt.current.key, controller.signal);
      if (!controller.signal.aborted) setCharge(result);
    } catch (cause) {
      if (!controller.signal.aborted) setError(friendlyError(cause));
    } finally {
      running.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  async function copy() {
    if (!charge?.pixCopiaCola) return;
    try {
      await navigator.clipboard.writeText(charge.pixCopiaCola);
      if (!mounted.current) return;
      setCopyMessage("Copiado!");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyMessage(""), 1800);
    } catch {
      if (mounted.current) setCopyMessage("Não foi possível copiar. Selecione e copie o código manualmente.");
    }
  }
  const expiration = charge?.expiracao ? new Date(charge.expiracao) : null;
  return <Dialog title={charge ? "Pix gerado" : "Adicionar saldo"} close={() => { if (!running.current) close(); }} busy={busy}>
    {!charge ? <form onSubmit={(event) => void generate(event)} className={styles.content}>
      <label htmlFor="wallet-pix-value">Valor da recarga</label>
      <div className={styles.input}><span>R$</span><input id="wallet-pix-value" inputMode="decimal" placeholder="10,00" value={value} disabled={busy || !!attempt.current} onChange={(event) => { setValue(event.target.value); setError(""); }} aria-describedby="wallet-pix-help" aria-invalid={!!error} /></div>
      <p id="wallet-pix-help" className={styles.help}>Valor mínimo: R$ 1,00.</p>
      {attempt.current && error && <p className={styles.help}>Tentar novamente mantém o valor e a mesma tentativa.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button className={styles.primary} disabled={busy} type="submit">{busy ? "Gerando Pix..." : attempt.current && error ? "Tentar novamente" : "Gerar Pix"}</button>
    </form> : <div className={styles.content}>
      <p className={styles.amount}><span>Valor</span><strong>{formatWalletCurrency(charge.valor)}</strong></p>
      {charge.status === "APROVADA" ? <div className={styles.success} role="status"><CheckCircle2 aria-hidden="true" /><strong>Pagamento confirmado</strong><span>Saldo adicionado à sua carteira</span></div> : <p className={styles.status} role="status">{labels[charge.status]}</p>}
      {balanceError && <div className={styles.help}><p>Pagamento confirmado. Não foi possível atualizar o saldo agora.</p><button type="button" className={styles.primary} disabled={refreshing} onClick={retryBalance}>{refreshing ? "Atualizando saldo..." : "Tentar atualizar saldo"}</button></div>}
      {charge.status !== "APROVADA" && <>
      {charge.qrCode && !qrFailed ? <Image className={styles.qr} src={`data:image/png;base64,${charge.qrCode}`} width={260} height={260} unoptimized alt="QR Code para pagamento Pix" onError={() => setQrFailed(true)} /> : <p className={styles.help}>QR Code indisponível no momento.</p>}
      {charge.pixCopiaCola ? <><label htmlFor="wallet-pix-code">Pix copia e cola</label><textarea id="wallet-pix-code" readOnly value={charge.pixCopiaCola} /><button type="button" className={styles.primary} onClick={() => void copy()}>Copiar código Pix</button></> : <p className={styles.help}>Código Pix indisponível no momento.</p>}
      {copyMessage && <p role="status">{copyMessage}</p>}
      {expiration && <p className={styles.help}>Expiração: {Number.isNaN(expiration.getTime()) ? "Não disponível" : expiration.toLocaleString("pt-BR")}</p>}
      </>}
      {pollError && <p className={styles.help} role="status">{pollError}</p>}
    </div>}
  </Dialog>;
}
