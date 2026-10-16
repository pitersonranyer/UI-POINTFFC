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
  const { search, clubs, categories, statuses, sort } = filters;
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const eligibleClubIds = new Set(context.athletes.filter(a => a.posicaoId === slot.position).map(a => a.clubeIdExterno));
  const eligibleClubs = context.clubs.filter(c => eligibleClubIds.has(c.id));
  const allStatuses = [...Object.keys(capturedStatuses), "unknown"];
  const filtered = context.athletes.filter(a => a.posicaoId === slot.position
    && normalize(a.apelido).includes(normalize(search.trim()))
    && (clubs === null || clubs.includes(String(a.clubeIdExterno)))
    && (slot.position === 6 || categories === null || categories.includes(String(a.categoriaId)))
    && statuses.includes(statusKey(a.statusId)))
    .sort((a,b) => (sort === "desc" ? b.pointcoins - a.pointcoins : a.pointcoins - b.pointcoins)
      || a.apelido.localeCompare(b.apelido, "pt-BR", { sensitivity:"base" }) || a.id - b.id);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  const safePage = Math.min(page, totalPages);
  function toggleStatus(id: string) { updateFilters({ statuses:statuses.includes(id) ? statuses.filter(s => s !== id) : [...statuses, id] }); }
  function toggleClub(id: number) {
    const current = clubs === null ? eligibleClubs.map(c => String(c.id)) : clubs;
    updateFilters({ clubs:current.includes(String(id)) ? current.filter(value => value !== String(id)) : [...current, String(id)] });
  }
  function toggleCategory(id: string) {
    const current = categories === null ? Object.keys(categoryNames) : categories;
    updateFilters({ categories:current.includes(id) ? current.filter(value => value !== id) : [...current, id] });
  }
  const activeFilterSummary = [
    statuses.length === allStatuses.length ? "Todas as situações" : statuses.length ? statuses.map(id => id === "unknown" ? "Sem situação" : capturedStatuses[Number(id)]).filter(Boolean).join(" + ") : "Nenhuma situação",
    clubs === null ? "Todos os clubes" : clubs.length ? `${clubs.length} ${clubs.length === 1 ? "clube" : "clubes"}` : "Nenhum clube",
    categories === null ? "Todas as categorias" : categories.length ? categories.map(id => categoryNames[Number(id)]).filter(Boolean).join(" + ") : "Nenhuma categoria",
    `PC$ ${sort === "desc" ? "↓" : "↑"}`,
  ].join(" · ");
  const activeFilterCount = Number(statuses.length !== defaultStatuses.length || !defaultStatuses.every(id => statuses.includes(id)))
    + Number(clubs !== null) + Number(categories !== null);
  return <dialog ref={dialog} className={styles.picker} aria-labelledby="picker-title" onCancel={e => { e.preventDefault(); onClose(); }}
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),summary")).filter(control => !control.closest("[hidden]"));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}>
    <header className={styles.pickerHeader}><h2 id="picker-title">Escolher {positionLabels[slot.position].toLocaleLowerCase("pt-BR")}</h2><div className={styles.actions}><span className={styles.pickerProgress} role="status" aria-live="polite" aria-atomic="true">{compactPosition[slot.position]} · {count}/{capacity}{mode === "replace" ? " · Troca" : ""}</span><button ref={conclude} type="button" onClick={onClose}>Concluir</button><button type="button" onClick={onClose} aria-label="Fechar seletor">Fechar</button></div></header>
    <div className={styles.pickerFilters}>
      <label className={styles.searchFilter}>Buscar atleta<input autoFocus type="search" value={search} onChange={e => updateFilters({ search:e.target.value })} placeholder="Nome do atleta" /></label>
      <div className={styles.compactFilters} aria-label="Barra de filtros e ordenação">
        <button type="button" aria-expanded={filtersOpen} aria-controls="picker-filter-panel" onClick={() => setFiltersOpen(open => !open)}>{`Filtros${activeFilterCount ? ` · ${activeFilterCount}` : ""}`}</button>
        <button type="button" aria-label={`Ordenar por PointCoins: PC$ ${sort === "desc" ? "↓, maior valor primeiro" : "↑, menor valor primeiro"}`} onClick={() => updateFilters({ sort:sort === "desc" ? "asc" : "desc" })}>PC$ {sort === "desc" ? "↓" : "↑"}</button>
      </div>
      <p className={styles.filterSummary} aria-live="polite">{activeFilterSummary}</p>
      <div className={styles.filterPanel} id="picker-filter-panel" role="region" aria-label="Filtros avançados" hidden={!filtersOpen}>
        <div className={styles.filterPanelHeader}><strong>Filtros</strong><button type="button" onClick={() => setFiltersOpen(false)}>Fechar painel</button></div>
        <fieldset className={styles.filterGroup}><legend>Situação</legend>
          <div className={styles.filterChoices}>{Object.entries(capturedStatuses).map(([id, label]) => <label key={id}><input type="checkbox" checked={statuses.includes(id)} onChange={() => toggleStatus(id)} />{label}</label>)}<label><input type="checkbox" checked={statuses.includes("unknown")} onChange={() => toggleStatus("unknown")} />Sem situação</label></div>
          <div className={styles.filterActions}><button type="button" onClick={() => updateFilters({ statuses:allStatuses })}>Todos</button><button type="button" onClick={() => updateFilters({ statuses:[] })}>Limpar</button><button type="button" onClick={() => updateFilters({ statuses:[...defaultStatuses] })}>Restaurar padrão</button></div>
        </fieldset>
        <fieldset className={styles.filterGroup}><legend>Clubes</legend>
          <div className={styles.filterChoices}>{eligibleClubs.map(c => <label key={c.id}><input type="checkbox" checked={clubs === null || clubs.includes(String(c.id))} onChange={() => toggleClub(c.id)} />{getClubUniform(c.id).name === "Clube não configurado" ? c.dados.nome : getClubUniform(c.id).name}</label>)}</div>
          <div className={styles.filterActions}><button type="button" onClick={() => updateFilters({ clubs:null })}>Todos</button><button type="button" onClick={() => updateFilters({ clubs:[] })}>Limpar</button></div>
        </fieldset>
        <fieldset className={styles.filterGroup} disabled={slot.position === 6}><legend>Categoria</legend>
          <div className={styles.filterChoices}>{Object.entries(categoryNames).map(([id, name]) => <label key={id}><input type="checkbox" checked={categories === null || categories.includes(id)} onChange={() => toggleCategory(id)} />{name}</label>)}</div>
          <div className={styles.filterActions}><button type="button" onClick={() => updateFilters({ categories:null })}>Todas</button><button type="button" onClick={() => updateFilters({ categories:[] })}>Limpar</button></div>
        </fieldset>
        <div className={styles.filterActions}><button type="button" onClick={() => updateFilters({ search:"", clubs:[], categories:[], statuses:[] })}>Limpar filtros</button><button type="button" onClick={() => { onFiltersChange(defaultPickerFilters()); setPage(1); }}>Restaurar filtros padrão</button></div>
      </div>
    </div>
    <ul ref={list} className={styles.pickerList} aria-label="Atletas elegíveis">{filtered.slice((safePage - 1) * 20, safePage * 20).map(a => {
      const selected = used.has(a.id);
      const invalidCategory = !selected && a.posicaoId !== 6 && (a.categoriaId === null || !categoryNames[a.categoriaId]);
      const tooHigh = !selected && ceiling !== null && (a.categoriaId ?? 0) > ceiling;
      const club = context.clubs.find(c => c.id === a.clubeIdExterno);
      return <li key={a.id} data-selected={selected || undefined}>
        <ClubJersey clubId={a.clubeIdExterno} size={46} decorative />
        <div><strong>{a.apelido}</strong><span><ClubShield clubId={a.clubeIdExterno} size={16} decorative />{club?.dados.abreviacao ?? "Clube"} · {positionLabels[a.posicaoId]}</span><small>{a.posicaoId !== 6 && `${a.categoriaId ? categoryNames[a.categoriaId] ?? "Categoria inválida" : "Sem categoria"} · `}PC$ {a.pointcoins}</small><span className={styles.situation}>{statusLabel(a.statusId)}</span>{selected && <small className={styles.selectedLabel}>Escalado</small>}{tooHigh && <small className={styles.invalid}>Categoria superior à permitida para este reserva</small>}</div>
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
  </dialog>;
}
