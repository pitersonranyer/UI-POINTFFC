import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { categoryNames } from "@/types/pointFantasy";
import type { LineupContext, LineupPickerFilters, LineupSelection, LineupSlot } from "@/types/pointFantasyLineup";
import type { PointFantasyAthlete } from "@/types/pointFantasy";
import { ClubJersey } from "../uniforms/ClubJersey";
import { ClubShield } from "../uniforms/ClubShield";
import { getClubUniform } from "../uniforms/clubUniforms";
import { capturedStatuses, defaultPickerFilters, defaultStatuses, positionalAthletes, positionLabels, reserveCeiling, selectedIds, slotCapacity, statusKey, statusLabel } from "./lineupPresentation";
import styles from "./LineupBuilder.module.css";

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
const compactPosition: Record<number, string> = { 1:"GOL", 2:"LAT", 3:"ZAG", 4:"MEI", 5:"ATA", 6:"TEC" };
export function LineupAthletePicker({ context, value, slot, mode = "fill", filters, onFiltersChange, onSelect, onSell, onClose }: { context: LineupContext; value: LineupSelection; slot: LineupSlot; mode?: "fill" | "replace"; filters: LineupPickerFilters; onFiltersChange: (filters: LineupPickerFilters) => void; onSelect: (athlete: PointFantasyAthlete) => void; onSell: (athlete: PointFantasyAthlete) => void; onClose: () => void }) {
  const { search, club, category, statuses } = filters;
  const [page, setPage] = useState(1);
  const [showSituations, setShowSituations] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  function updateFilters(next: Partial<LineupPickerFilters>) { onFiltersChange({ ...filters, ...next }); setPage(1); }
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const conclude = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    const rows = Array.from(list.current?.children ?? []);
    const choices = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button[aria-label^="Comprar"]:not(:disabled)') ?? []);
    const next = choices.find(button => rows.indexOf(button.closest("li")!) > pendingFocus.current!) ?? choices[0];
    (next ?? conclude.current)?.focus({ preventScroll:true });
    pendingFocus.current = null;
  });
  const capacity = slotCapacity(value, slot);
  const count = slot.role === "tecnico" ? Number(value.tecnico !== null) : positionalAthletes(value, context.athletes, slot.role, slot.position).length;
  const ceiling = slot.role === "reservas" ? reserveCeiling(value, context.athletes, slot.position) : null;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal?.();
    return () => { element?.close?.(); previous?.focus(); };
  }, []);
  const used = useMemo(() => new Set(selectedIds(value)), [value]);
  const filtered = context.athletes.filter(a => a.posicaoId === slot.position
    && normalize(a.apelido).includes(normalize(search.trim())) && (!club || a.clubeIdExterno === Number(club))
    && (slot.position === 6 || !category || a.categoriaId === Number(category)) && statuses.includes(statusKey(a.statusId)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  const safePage = Math.min(page, totalPages);
  function toggleStatus(id: string) { updateFilters({ statuses:statuses.includes(id) ? statuses.filter(s => s !== id) : [...statuses, id] }); }
  const allStatuses = [...Object.keys(capturedStatuses), "unknown"];
  return <dialog ref={dialog} className={styles.picker} aria-labelledby="picker-title" onCancel={e => { e.preventDefault(); onClose(); }}
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const controls = e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),summary");
      const first = controls[0]; const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}>
    <header className={styles.pickerHeader}><div><p className="eyebrow">{slot.role === "reservas" ? "Banco de reservas" : slot.role === "tecnico" ? "Comissão técnica" : "Titulares"}</p><h2 id="picker-title">Escolher {positionLabels[slot.position]}</h2></div><div className={styles.actions}><button ref={conclude} type="button" onClick={onClose}>Concluir</button><button type="button" onClick={onClose} aria-label="Fechar seletor">Fechar</button></div></header>
    <p className={styles.pickerProgress} role="status" aria-live="polite" aria-atomic="true">{compactPosition[slot.position]} · {count}/{capacity}{mode === "replace" ? " · Troca" : ""}</p>
    <p className={styles.note}>Ação esportiva · sem cobrança · situação do catálogo.</p>
    <div className={styles.pickerFilters}>
      <label className={styles.searchFilter}>Buscar atleta<input autoFocus type="search" value={search} onChange={e => updateFilters({ search:e.target.value })} placeholder="Nome do atleta" /></label>
      <div className={styles.compactFilters} aria-label="Filtros rápidos">
        <button type="button" aria-expanded={showSituations} aria-controls="picker-situations" onClick={() => setShowSituations(open => !open)}>Situação{statuses.length ? ` · ${statuses.length}` : " · 0"}</button>
        <label>Clube<select aria-label="Clube" value={club} onChange={e => updateFilters({ club:e.target.value })}><option value="">Todos</option>{context.clubs.map(c => <option key={c.id} value={c.id}>{getClubUniform(c.id).name === "Clube não configurado" ? c.dados.nome : getClubUniform(c.id).name}</option>)}</select></label>
        <label>Categoria<select aria-label="Categoria" value={category} disabled={slot.position === 6} onChange={e => updateFilters({ category:e.target.value })}><option value="">Todas</option>{Object.entries(categoryNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      </div>
      <fieldset className={styles.situationPopover} id="picker-situations" hidden={!showSituations}><legend>Situação no catálogo</legend>{Object.entries(capturedStatuses).map(([id, label]) => <label key={id}><input type="checkbox" checked={statuses.includes(id)} onChange={() => toggleStatus(id)} />{label}</label>)}<label><input type="checkbox" checked={statuses.includes("unknown")} onChange={() => toggleStatus("unknown")} />Sem situação</label></fieldset>
    </div>
    <ul ref={list} className={styles.pickerList} aria-label="Atletas elegíveis">{filtered.slice((safePage - 1) * 20, safePage * 20).map(a => {
      const selected = used.has(a.id);
      const invalidCategory = !selected && a.posicaoId !== 6 && (a.categoriaId === null || !categoryNames[a.categoriaId]);
      const tooHigh = !selected && ceiling !== null && (a.categoriaId ?? 0) > ceiling;
      const club = context.clubs.find(c => c.id === a.clubeIdExterno);
      return <li key={a.id} data-selected={selected || undefined}>
        <ClubJersey clubId={a.clubeIdExterno} size={46} decorative />
        <div><strong>{a.apelido}</strong><span><ClubShield clubId={a.clubeIdExterno} size={16} decorative />{club?.dados.abreviacao ?? "Clube"} · {positionLabels[a.posicaoId]}</span><small>{a.posicaoId !== 6 && `${a.categoriaId ? categoryNames[a.categoriaId] ?? "Categoria inválida" : "Sem categoria"} · `}{a.pointcoins} POINTCOINS</small><span className={styles.situation}>{statusLabel(a.statusId)}</span>{selected && <small className={styles.selectedLabel}>Escalado</small>}{tooHigh && <small className={styles.invalid}>Categoria superior à permitida para este reserva</small>}</div>
        {selected
          ? <button type="button" className={styles.sellButton} onClick={() => onSell(a)} aria-label={`Vender ${a.apelido}`}>Vender</button>
          : <button type="button" disabled={tooHigh || invalidCategory} onClick={e => {
            pendingFocus.current = Array.from(list.current?.children ?? []).indexOf(e.currentTarget.closest("li")!);
            onSelect(a);
          }} aria-label={`Comprar ${a.apelido}`}>Comprar</button>}
      </li>;
    })}</ul>
    {filtered.length === 0 && <p className={styles.empty}>Nenhum atleta para esta posição e filtros.</p>}
    {totalPages > 1 && <nav className={styles.actions} aria-label="Paginação do seletor"><button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Anterior</button><span>Página {safePage} de {totalPages}</span><button type="button" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Próxima</button></nav>}
    <details className={styles.advancedFilters} open={showAdvanced} onToggle={e => setShowAdvanced(e.currentTarget.open)}><summary>Filtros avançados</summary>
      <fieldset className={styles.statuses}><legend>Gerenciar filtros de situação</legend>
        <div><button type="button" onClick={() => updateFilters({ statuses:allStatuses })}>Selecionar todas</button><button type="button" onClick={() => updateFilters({ statuses:[] })}>Limpar situações</button><button type="button" onClick={() => updateFilters({ statuses:[...defaultStatuses] })}>Restaurar Provável + Dúvida</button></div>
        <div><button type="button" onClick={() => { onFiltersChange({ search:"", club:"", category:"", statuses:allStatuses }); setPage(1); }}>Limpar filtros</button><button type="button" onClick={() => { onFiltersChange(defaultPickerFilters()); setPage(1); }}>Restaurar filtros padrão</button></div>
      </fieldset>
    </details>
  </dialog>;
}
