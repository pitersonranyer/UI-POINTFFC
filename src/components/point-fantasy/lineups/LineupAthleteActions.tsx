import React, { useEffect, useId, useRef } from "react";
import type { PointFantasyAthlete } from "@/types/pointFantasy";
import type { SlotRole } from "@/types/pointFantasyLineup";
import styles from "./LineupBuilder.module.css";

export function LineupAthleteActions({ athlete, role, captain, mago, canReplace, onCaptain, onMago, onReplace, onRemove, onClose }: {
  athlete: PointFantasyAthlete; role: SlotRole; captain: boolean; mago: boolean; canReplace: boolean;
  onCaptain: () => void; onMago: () => void; onReplace: () => void; onRemove: () => void; onClose: () => void;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal?.();
    return () => { element?.close?.(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={styles.athleteActions} aria-labelledby={titleId}
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}
    onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={styles.actionContent}>
      <header><h2 id={titleId}>Ações de {athlete.apelido}</h2><button type="button" onClick={onClose} aria-label="Fechar ações">Fechar</button></header>
      {role === "titulares" && <button type="button" onClick={onCaptain}>{captain ? "Remover capitão" : "Tornar capitão"}</button>}
      {role === "reservas" && <button type="button" onClick={onMago}>{mago ? "Remover título de Reserva do Mago" : "Tornar Reserva do Mago"}</button>}
      {canReplace && <button type="button" onClick={onReplace}>Trocar atleta</button>}
      <button type="button" className={styles.danger} onClick={onRemove}>Remover atleta</button>
    </div>
  </dialog>;
}
