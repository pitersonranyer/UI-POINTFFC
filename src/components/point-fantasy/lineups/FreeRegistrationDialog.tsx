import React from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { FantasyLineup } from "@/types/pointFantasyLineup";
import { lineupRegistrationName } from "./freeLineupRegistration";
import styles from "./FreeRegistration.module.css";

export function FreeRegistrationDialog({ competitionName, teams, busy, retry, uncertain, disabled, error, onClose, onConfirm }: {
  competitionName: string; teams: FantasyLineup[]; busy: boolean; retry: boolean; uncertain: boolean; disabled: boolean; error: string;
  onClose: () => void; onConfirm: () => void;
}) {
  return <Dialog title="Inscrição gratuita" close={onClose} busy={busy}>
    <div className={styles.reviewBody}>
      <p className={styles.competition}>{competitionName}</p>
      <ul className={styles.reviewTeams}>{teams.map(team => <li key={team.id}>{lineupRegistrationName(team)}</li>)}</ul>
      <dl className={styles.totals}><dt>Escalações</dt><dd>{teams.length}</dd><dt>Valor total</dt><dd>R$ 0,00</dd></dl>
      <p className={styles.note}>Após confirmar, estes times ficam disponíveis somente para visualização.</p>
      {uncertain && <p className={styles.note}>A resposta não foi confirmada. Ao tentar novamente, seus dados serão atualizados e a mesma confirmação será reenviada.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={onClose}>Cancelar</button>
        <button type="button" className={styles.confirm} disabled={busy || disabled || !teams.length} onClick={onConfirm}>{busy ? "Confirmando…" : retry ? "Tentar novamente" : "Confirmar inscrição"}</button>
      </div>
    </div>
  </Dialog>;
}
