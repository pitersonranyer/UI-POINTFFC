"use client";
import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { normalizeTeamName } from "./teamIdentity";
import styles from "./LineupBuilder.module.css";

export function FirstLineupSaveDialog({ busy, pending, conflict, error, onCancel, onSave, onRetry }: {
  busy: boolean; pending: boolean; conflict: boolean; error: string; onCancel: () => void; onSave: (name: string) => void; onRetry: () => void;
}) {
  const [name, setName] = useState("Meu Time");
  const [validation, setValidation] = useState("");
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || conflict) return;
    if (pending) { onRetry(); return; }
    const normalized = normalizeTeamName(name);
    if (!normalized) { setValidation("Use de 2 a 60 caracteres: letras, números, espaços, ponto, apóstrofo ou hífen."); return; }
    setValidation(""); onSave(normalized);
  }
  return <Dialog title="Dê um nome ao seu time" close={onCancel} busy={busy}>
    <form className={styles.identityForm} onSubmit={submit}>
      <label htmlFor="first-team-name">Nome do time</label>
      <input id="first-team-name" value={name} maxLength={120} disabled={busy || pending} aria-invalid={!!validation} aria-describedby="first-team-name-help" onChange={event => { setName(event.target.value); setValidation(""); }} />
      <output className={styles.identityPreview} aria-label="Prévia ilustrativa">#CÓDIGO · {normalizeTeamName(name) ?? name} 01</output>
      <p id="first-team-name-help">Prévia ilustrativa; o código público será gerado ao salvar. O nome-base será definitivo e identificará seus times na vitrine e no ranking.</p>
      {(validation || error) && <p role="alert" className={styles.alert}>{validation || error}</p>}
      {pending && <p role="status">A confirmação está pendente. Tente novamente para consultar seus times e confirmar a mesma operação.</p>}
      {conflict && <p role="status">Cancele e recarregue a versão atual para continuar. Suas escolhas foram preservadas.</p>}
      <div className={styles.identityFooter}>
        <button type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
        <button className={styles.primary} type="submit" disabled={busy || conflict}>{busy ? "Salvando…" : pending ? "Tentar novamente" : "Salvar rascunho"}</button>
      </div>
    </form>
  </Dialog>;
}
