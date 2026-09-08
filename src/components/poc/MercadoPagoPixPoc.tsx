"use client";

import Image from "next/image";
import React, { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { useMercadoPagoPix } from "@/hooks/useMercadoPagoPix";
import { formatCurrency } from "@/lib/format";
import { mercadoPagoPocService } from "@/services/mercadoPagoPocService";
import { PIX_STATUS_LABELS } from "@/types/mercado-pago-poc";
import styles from "./MercadoPagoPixPoc.module.css";

function dateLabel(raw?: string | null) {
  if (!raw) return "Não informada";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("pt-BR");
}

export function MercadoPagoPixPoc() {
  const { charge, creating, error, pollError, create } = useMercadoPagoPix();
  const [value, setValue] = useState("");
  const [validation, setValidation] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [health, setHealth] = useState("Verificando conectividade...");
  useEffect(() => {
    const controller = new AbortController();
    mercadoPagoPocService.health(controller.signal)
      .then(() => { if (!controller.signal.aborted) setHealth("API acessível"); })
      .catch(() => { if (!controller.signal.aborted) setHealth("Aviso: não foi possível verificar a conectividade com a API. Você ainda pode tentar gerar o PIX."); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (creating) return;
    const parsed = Number(value.trim().replace(",", "."));
    if (!value.trim()) { setValidation("Informe o valor."); return; }
    if (!Number.isFinite(parsed) || parsed <= 0) { setValidation("Informe um valor maior que zero."); return; }
    if (Math.abs(parsed * 100 - Math.round(parsed * 100)) > 0.000001) { setValidation("Informe um valor com até duas casas decimais."); return; }
    setValidation("");
    setCopyMessage("");
    await create(parsed);
  }

  async function copy() {
    if (!charge?.pix?.copiaCola) return;
    try {
      await navigator.clipboard.writeText(charge.pix.copiaCola);
      setCopyMessage("Código PIX copiado");
    } catch {
      setCopyMessage("Não foi possível copiar. Selecione e copie o código manualmente.");
    }
  }

  const approved = charge?.status === "APROVADO";
  return <div className="page-shell">
    <section className={styles.card} aria-labelledby="pix-title">
      <header className={styles.header}>
        <span className={styles.badge}>POC / Teste</span>
        <p className="eyebrow">PointFFC · Mercado Pago</p>
        <h1 id="pix-title" className="page-title">Adicionar saldo via PIX</h1>
        <p className="page-subtitle">POC de integração Mercado Pago</p>
        <p className={styles.notice}>Ambiente de teste da integração. Este fluxo não adiciona saldo à carteira nem realiza inscrições.</p>
      </header>
      <form onSubmit={(event) => void submit(event)} noValidate aria-busy={creating}>
        <label className={styles.label} htmlFor="pix-value">Valor em reais</label>
        <div className={styles.input}><span>R$</span><input id="pix-value" inputMode="decimal" placeholder="0,00" value={value} disabled={creating} aria-invalid={!!validation} aria-describedby={validation ? "pix-validation" : undefined} onChange={(event) => { setValue(event.target.value); setValidation(""); }} /></div>
        <div className={styles.quick}>{[10, 20, 50, 100].map((amount) => <button key={amount} type="button" disabled={creating} onClick={() => { setValue(amount.toFixed(2).replace(".", ",")); setValidation(""); }}>R$ {amount}</button>)}</div>
        {validation && <p id="pix-validation" className={styles.error} role="alert">{validation}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.primary} disabled={creating} type="submit">{creating ? <Loader2 className={styles.spin} size={20} aria-hidden="true" /> : <QrCode size={20} aria-hidden="true" />}{creating ? "Gerando PIX..." : "Gerar PIX"}</button>
      </form>
      {charge && <section className={`${styles.result} ${approved ? styles.approved : ""}`} aria-label="Cobrança PIX">
        <strong className={styles.amount}>{formatCurrency(charge.valor)}</strong>
        <p className={styles.status} role="status">{approved && <CheckCircle2 size={22} aria-hidden="true" />}{PIX_STATUS_LABELS[charge.status]}</p>
        {charge.pix?.qrCodeBase64 ? <Image className={styles.qr} src={`data:image/png;base64,${charge.pix.qrCodeBase64}`} width={260} height={260} unoptimized alt="QR Code para pagamento PIX" /> : <p className={styles.waiting}>Gerando QR Code...</p>}
        <label className={styles.label} htmlFor="pix-code">PIX Copia e Cola</label>
        <textarea id="pix-code" className={styles.code} readOnly value={charge.pix?.copiaCola ?? ""} placeholder="Aguardando código PIX..." />
        <button className={styles.secondary} type="button" disabled={!charge.pix?.copiaCola} onClick={() => void copy()}><Copy size={18} aria-hidden="true" />Copiar código PIX</button>
        {copyMessage && <p role="status">{copyMessage}</p>}
        <p className={styles.expiration}>Expiração: {dateLabel(charge.pix?.expiracao)}</p>
        {pollError && <p className={styles.error} role="alert">{pollError}</p>}
        <details className={styles.technical}><summary>Dados técnicos da POC</summary><dl>
          <dt>id interno</dt><dd>{charge.id}</dd>
          <dt>idExterno</dt><dd>{charge.idExterno || "Não informado"}</dd>
          <dt>atualizadoEm</dt><dd>{charge.atualizadoEm || "Não informado"}</dd>
        </dl></details>
      </section>}
      <p className={styles.health} role="status">{health}</p>
    </section>
  </div>;
}
