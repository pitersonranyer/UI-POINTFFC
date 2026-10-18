import React, { useMemo } from "react";
import type { FantasyLineup } from "@/types/pointFantasyLineup";
import styles from "./LineupBuilder.module.css";

export function LineupTeamNavigation({ drafts, currentId, busy, canCreate, canDuplicate, dirty, limit = null, onOpen, onNew, onDuplicate, canDelete = false, readOnly = false, publicLabels = false, compact = false, onDelete }: {
  drafts: FantasyLineup[]; currentId: number | null; busy: boolean; canCreate: boolean; canDuplicate: boolean; dirty: boolean; limit?: number | null;
  publicLabels?: boolean; readOnly?: boolean; canDelete?: boolean; compact?: boolean; onDelete?: () => void;
  onOpen: (id: number) => void; onNew: () => void; onDuplicate: () => void;
}) {
  // The real ID is the stable team identity, independent of page, edits or deletion.
  const ordered = useMemo(() => [...drafts].sort((a,b) => a.id - b.id), [drafts]);
  const currentIndex = ordered.findIndex(d => d.id === currentId);
  return <nav className={styles.teamNavigation} aria-label="Meus times" data-compact={compact || undefined}>
    <div className={styles.teamSwitcher}>
    <button type="button" aria-label="Time anterior" disabled={busy || currentIndex <= 0} onClick={() => onOpen(ordered[currentIndex - 1].id)}>‹</button>
    <label className={styles.teamSelect}><span className={styles.srOnly}>Time em edição</span><select value={currentIndex >= 0 ? currentId! : ""} disabled={busy || !ordered.length} onChange={e => { if (e.target.value && Number(e.target.value) !== currentId) onOpen(Number(e.target.value)); }}>
      <option value="">{currentId === null ? "Novo time · não salvo" : "Selecione um time"}</option>
      {ordered.map(d => <option key={d.id} value={d.id}>{d.nomePublico ?? `Time #${d.id} · ${publicLabels ? "Em montagem" : "Rascunho antigo"}`}{d.status === "INSCRITA" ? " · Inscrita" : ""}</option>)}
    </select></label>
    <button type="button" aria-label="Próximo time" disabled={busy || !ordered.length || currentIndex === ordered.length - 1} onClick={() => onOpen(ordered[currentIndex + 1].id)}>›</button>
    </div>
      <div className={styles.teamActions}>
        <button type="button" aria-label={compact ? "Novo time" : undefined} title={compact ? "Novo time" : undefined} disabled={busy || !canCreate} onClick={onNew}>{compact ? "Novo" : "+ Novo time"}</button>
        {currentId !== null && !readOnly && <button type="button" aria-label="Duplicar time" disabled={busy || !canDuplicate} onClick={onDuplicate}>Duplicar</button>}
        {currentId !== null && !readOnly && onDelete && <button className={styles.danger} type="button" aria-label="Excluir rascunho" disabled={busy || !canDelete} onClick={onDelete}>Excluir</button>}
      </div>
    {currentId !== null && dirty && <p className={styles.note}>Salve as alterações antes de duplicar.</p>}
    {limit !== null && <span className={styles.teamCount}>{ordered.length}/{limit} times</span>}
  </nav>;
}
