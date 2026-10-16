import React from "react";
import type { FantasyLineup, LineupContext } from "@/types/pointFantasyLineup";
import { canRegisterLineup, freeRegistrationReason, lineupRegistrationName, registrationSelectionIssue } from "./freeLineupRegistration";
import styles from "./FreeRegistration.module.css";

export function FreeRegistrationPanel({ context, lineups, selected, currentId, dirty, disabled, busy, locked, refreshRequired, retry, error, now, onToggle, onReview }: {
  context: LineupContext; lineups: FantasyLineup[]; selected: number[]; currentId: number | null; dirty: boolean;
  disabled: boolean; busy: boolean; locked: boolean; refreshRequired: boolean; retry: boolean; error: string; now: number;
  onToggle: (id: number) => void; onReview: () => void;
}) {
  if (context.competition.tipoAcesso !== "FREE") return <p className={styles.note}>Inscrição indisponível para competições pagas nesta fase.</p>;
  if (!lineups.length && !retry) return null;
  const reason = freeRegistrationReason(context, now);
  const issue = registrationSelectionIssue(lineups, selected, currentId, dirty, context.competition.limiteEscalacoesUsuario);
  return <section className={styles.registration} aria-label="Inscrição gratuita">
    <details open={retry || undefined}>
      <summary>Inscrever times <span>{selected.length ? `${selected.length} selecionado${selected.length === 1 ? "" : "s"}` : "FREE"}</span></summary>
      <div className={styles.teamList}>
        {lineups.map(team => {
          const checked = selected.includes(team.id);
          const unsaved = team.id === currentId && dirty;
          const ineligible = !canRegisterLineup(team) || unsaved;
          const registered = team.status === "INSCRITA";
          return <label key={team.id} className={styles.team}>
            <input type="checkbox" checked={checked} disabled={busy || locked || refreshRequired || disabled || (!checked && (ineligible || selected.length >= 100)) || registered} onChange={() => onToggle(team.id)} aria-label={`Selecionar ${lineupRegistrationName(team)}`} />
            <span><strong>{lineupRegistrationName(team)}</strong><small>{registered ? "Inscrita" : unsaved ? "Salve as alterações antes de inscrever" : team.validacao.completa ? "Rascunho completo" : "Escalação incompleta"}</small></span>
          </label>;
        })}
      </div>
      {reason && <p className={styles.note}>{reason}</p>}
      {!reason && issue && selected.length > 0 && !retry && <p className={styles.note}>{issue}</p>}
      {locked && <p className={styles.note}>A confirmação está pendente. Retome a mesma operação antes de alterar os times.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="button" className={styles.review} disabled={busy || disabled || (!retry && (!!reason || !!issue || refreshRequired))} onClick={onReview}>{retry ? "Retomar confirmação" : "Revisar inscrição"}</button>
    </details>
  </section>;
}
