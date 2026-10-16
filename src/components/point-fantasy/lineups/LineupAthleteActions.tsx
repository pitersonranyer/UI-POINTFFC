import React, { useEffect, useId, useRef } from "react";
import { categoryNames } from "@/types/pointFantasy";
import type { SlotRole } from "@/types/pointFantasyLineup";
import type { PointFantasyAthlete } from "@/types/pointFantasy";
import { positionLabels, statusLabel } from "./lineupPresentation";
import styles from "./LineupBuilder.module.css";

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
    return () => { element?.close?.(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={styles.athleteActions} aria-labelledby={titleId}
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const buttons = e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),summary");
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}
    onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={styles.actionContent}>
      <header><div><p className="eyebrow">{role === "reservas" ? "Banco de reservas" : role === "tecnico" ? "Comissão técnica" : "Titular"}</p><h2 id={titleId}>{athlete.apelido}</h2></div><button type="button" onClick={onClose} aria-label="Fechar ações">Fechar</button></header>
      {role === "titulares" && <button type="button" onClick={onCaptain}>{captain ? "Remover capitão" : "Tornar capitão"}</button>}
      {role === "reservas" && <button type="button" onClick={onPowerReserve}>{powerReserve ? "Remover Reserva Power" : "Ativar Reserva Power"}</button>}
      {canReplace && <button type="button" onClick={onReplace}>Trocar jogador</button>}
      <button type="button" className={styles.danger} onClick={onRemove}>Vender</button>
      <details className={styles.athleteInfo}><summary>Ver informações do atleta</summary><dl>
        <dt>Clube</dt><dd>{clubName ?? "Clube não informado"}</dd>
        <dt>Posição</dt><dd>{positionLabels[athlete.posicaoId] ?? "Posição não informada"}</dd>
        <dt>Situação no catálogo</dt><dd>{statusLabel(athlete.statusId)}</dd>
        {athlete.posicaoId !== 6 && <><dt>Categoria</dt><dd>{athlete.categoriaId ? categoryNames[athlete.categoriaId] ?? "Não informada" : "Não informada"}</dd></>}
        <dt>POINTCOINS</dt><dd>{athlete.pointcoins}</dd>
        <dt>Preço Cartola capturado</dt><dd>{athlete.precoCartola}</dd>
      </dl></details>
    </div>
  </dialog>;
}
