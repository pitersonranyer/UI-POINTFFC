import React, { useMemo } from "react";
import type { FantasyLineup } from "@/types/pointFantasyLineup";
import styles from "./LineupBuilder.module.css";

export function LineupTeamNavigation({ drafts, currentId, busy, canCreate, canDuplicate, dirty, onOpen, onNew, onDuplicate }: {
  drafts: FantasyLineup[]; currentId: number | null; busy: boolean; canCreate: boolean; canDuplicate: boolean; dirty: boolean;
  onOpen: (id: number) => void; onNew: () => void; onDuplicate: () => void;
}) {
  // The real ID is the stable team identity, independent of page, edits or deletion.
  const ordered = useMemo(() => [...drafts].sort((a,b) => a.id - b.id), [drafts]);
  const currentIndex = ordered.findIndex(d => d.id === currentId);
  return <nav className={styles.teamNavigation} aria-label="Meus times">
    <div className={styles.teamPicker}><label>Time em edição<select value={currentIndex >= 0 ? currentId! : ""} disabled={busy || !ordered.length} onChange={e => { if (e.target.value && Number(e.target.value) !== currentId) onOpen(Number(e.target.value)); }}>
      <option value="">{currentId === null ? "Novo time · não salvo" : "Selecione um time"}</option>
      {ordered.map(d => <option key={d.id} value={d.id}>Time {d.id}</option>)}
    </select></label>{currentId !== null
      ? <button type="button" disabled={busy || !canDuplicate} onClick={onDuplicate}>Criar variação</button>
      : <button type="button" disabled={busy || !canCreate} onClick={onNew}>+ Novo time</button>}
    </div>
    {currentId !== null && dirty && <p className={styles.note}>Salve as alterações antes de criar uma variação.</p>}
    <p className={styles.note}>{ordered.length} {ordered.length === 1 ? "time salvo" : "times salvos"}</p>
  </nav>;
}
