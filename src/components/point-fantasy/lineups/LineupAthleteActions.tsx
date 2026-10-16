import React, { useEffect, useId, useRef } from "react";
import { ArrowLeftRight, Info, Trash2, X, Zap } from "lucide-react";
import { categoryNames } from "@/types/pointFantasy";
import type { SlotRole } from "@/types/pointFantasyLineup";
import type { PointFantasyAthlete } from "@/types/pointFantasy";
import { AthleteStatusIndicator } from "../athletes/AthleteStatusIndicator";
import { ClubJersey } from "../uniforms/ClubJersey";
import { positionLabels, statusLabel } from "./lineupPresentation";
import styles from "./LineupAthleteActions.module.css";

export function LineupAthleteActions({ athlete, clubName, role, captain, powerReserve, canReplace, onCaptain, onPowerReserve, onReplace, onRemove, onClose }: {
  athlete: PointFantasyAthlete; clubName?: string; role: SlotRole; captain: boolean; powerReserve: boolean; canReplace: boolean;
  onCaptain: () => void; onPowerReserve: () => void; onReplace: () => void; onRemove: () => void; onClose: () => void;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal?.();
    element?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { element?.close?.(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={styles.athleteActions} data-fantasy-athlete-actions={role} aria-labelledby={titleId} aria-modal="true"
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const buttons = e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),summary");
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}
    onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={styles.actionContent}>
      <header className={styles.actionHeader}>
        <span className={styles.actionJersey}><ClubJersey clubId={athlete.clubeIdExterno} size={42} decorative /><span className={styles.actionCondition}><AthleteStatusIndicator statusId={athlete.statusId} size={15} /></span></span>
        <div className={styles.actionIdentity}>
          <p>{positionLabels[athlete.posicaoId] ?? "Jogador"} · {role === "reservas" ? "Reserva" : role === "tecnico" ? "Comissão técnica" : "Titular"}</p>
          <div className={styles.actionName}><h2 id={titleId}>{athlete.apelido}</h2>
            {role === "titulares" && captain && <span className={`${styles.actionRoleSeal} ${styles.captainSeal}`} role="img" aria-label="Capitão ativo" title="Capitão">C</span>}
            {role === "reservas" && powerReserve && <span className={styles.actionRoleSeal} role="img" aria-label="Reserva Power ativo" title="Reserva Power"><Zap size={11} aria-hidden="true" /></span>}
          </div>
        </div>
        <button className={styles.actionClose} type="button" onClick={onClose} aria-label="Fechar ações"><X size={18} aria-hidden="true" /></button>
      </header>
      <div className={styles.actionList} role="group" aria-label="Ações do atleta">
      {role === "titulares" && <button className={`${styles.athleteActionRow} ${styles.specialAthleteAction} ${captain ? styles.activeAthleteRole : ""}`} type="button" onClick={onCaptain}><span className={styles.captainActionMark} aria-hidden="true">C</span><span>{captain ? "Remover capitão" : "Tornar capitão"}</span></button>}
      {role === "reservas" && <button className={`${styles.athleteActionRow} ${styles.specialAthleteAction} ${powerReserve ? styles.activeAthleteRole : ""}`} type="button" onClick={onPowerReserve}><Zap size={17} aria-hidden="true" /><span>{powerReserve ? "Remover Reserva Power" : "Ativar Reserva Power"}</span></button>}
      {canReplace && <button className={styles.athleteActionRow} type="button" onClick={onReplace}><ArrowLeftRight size={17} aria-hidden="true" /><span>Trocar jogador</span></button>}
      <details className={styles.athleteInfo}><summary className={styles.athleteActionRow}><Info size={17} aria-hidden="true" /><span>Informações do atleta</span></summary><dl>
        <dt>Clube</dt><dd>{clubName ?? "Clube não informado"}</dd>
        <dt>Posição</dt><dd>{positionLabels[athlete.posicaoId] ?? "Posição não informada"}</dd>
        <dt>Situação no catálogo</dt><dd>{statusLabel(athlete.statusId)}</dd>
        {athlete.posicaoId !== 6 && <><dt>Categoria</dt><dd>{athlete.categoriaId ? categoryNames[athlete.categoriaId] ?? "Não informada" : "Não informada"}</dd></>}
        <dt>PointCoins</dt><dd>PC$ {athlete.pointcoins}</dd>
        <dt>Preço Cartola capturado</dt><dd>{athlete.precoCartola}</dd>
      </dl></details>
      <button type="button" className={`${styles.athleteActionRow} ${styles.removeAthlete}`} onClick={onRemove}><Trash2 size={17} aria-hidden="true" /><span>Vender</span></button>
      </div>
    </div>
  </dialog>;
}
