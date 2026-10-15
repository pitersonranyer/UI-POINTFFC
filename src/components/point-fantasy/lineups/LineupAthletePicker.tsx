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
export function LineupAthletePicker({ context, value, slot, mode = "fill", filters, onFiltersChange, onSelect, onClose }: { context: LineupContext; value: LineupSelection; slot: LineupSlot; mode?: "fill" | "replace"; filters: LineupPickerFilters; onFiltersChange: (filters: LineupPickerFilters) => void; onSelect: (athlete: PointFantasyAthlete) => void; onClose: () => void }) {
  const { search, club, category, statuses } = filters;
  const [page, setPage] = useState(1);
  function updateFilters(next: Partial<LineupPickerFilters>) { onFiltersChange({ ...filters, ...next }); setPage(1); }
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const conclude = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    const choices = list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    const next = choices?.[Math.min(pendingFocus.current, choices.length - 1)];
    (next ?? conclude.current)?.focus({ preventScroll:true });
    pendingFocus.current = null;
  });
  const capacity = slotCapacity(value, slot);
  const count = slot.role === "tecnico" ? Number(value.tecnico !== null) : positionalAthletes(value, context.athletes, slot.role, slot.position).length;
  const groupLabels: Record<number, string> = { 1:"Goleiros", 2:"Laterais", 3:"Zagueiros", 4:"Meias", 5:"Atacantes", 6:"Técnico" };
  const ceiling = slot.role === "reservas" ? reserveCeiling(value, context.athletes, slot.position) : null;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal?.();
    return () => { element?.close?.(); previous?.focus(); };
  }, []);
  const used = useMemo(() => new Set(selectedIds(value)), [value]);
  const filtered = context.athletes.filter(a => a.posicaoId === slot.position && !used.has(a.id)
    && normalize(a.apelido).includes(normalize(search.trim())) && (!club || a.clubeIdExterno === Number(club))
    && (slot.position === 6 || !category || a.categoriaId === Number(category)) && statuses.includes(statusKey(a.statusId)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  const safePage = Math.min(page, totalPages);
  function toggleStatus(id: string) { updateFilters({ statuses:statuses.includes(id) ? statuses.filter(s => s !== id) : [...statuses, id] }); }
  return <dialog ref={dialog} className={styles.picker} aria-labelledby="picker-title" onCancel={e => { e.preventDefault(); onClose(); }}
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const controls = e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled)");
      const first = controls[0]; const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}>
    <header className={styles.pickerHeader}><div><p className="eyebrow">{slot.role === "reservas" ? "Banco de reservas" : slot.role === "tecnico" ? "Comissão técnica" : "Titulares"}</p><h2 id="picker-title">Escolher {positionLabels[slot.position]}</h2></div><div className={styles.actions}><button ref={conclude} type="button" onClick={onClose}>Concluir</button><button type="button" onClick={onClose} aria-label="Fechar seletor">Fechar</button></div></header>
    <p className={styles.pickerProgress} role="status" aria-live="polite" aria-atomic="true">{groupLabels[slot.position]}: {count} de {capacity}. {mode === "replace" ? "Substituição individual." : `Selecionando vaga ${slot.index + 1}. ${capacity - count === 1 ? "Só falta uma vaga." : ""}`}</p>
    <p className={styles.note}>Situação capturada no catálogo, sem atualização em tempo real.</p>
    <div className={styles.pickerFilters}>
      <label>Buscar atleta<input autoFocus type="search" value={search} onChange={e => updateFilters({ search:e.target.value })} placeholder="Nome/apelido no catálogo" /></label>
      <label>Clube<select value={club} onChange={e => updateFilters({ club:e.target.value })}><option value="">Todos os clubes</option>{context.clubs.map(c => <option key={c.id} value={c.id}>{getClubUniform(c.id).name === "Clube não configurado" ? c.dados.nome : getClubUniform(c.id).name}</option>)}</select></label>
      <label>Posição<select value={slot.position} disabled><option value={slot.position}>{positionLabels[slot.position]}</option></select></label>
      <label>Categoria<select value={category} disabled={slot.position === 6} onChange={e => updateFilters({ category:e.target.value })}><option value="">Todas as categorias</option>{Object.entries(categoryNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </div>
    <fieldset className={styles.statuses}><legend>Situação no catálogo</legend>{Object.entries(capturedStatuses).map(([id, label]) => <label key={id}><input type="checkbox" checked={statuses.includes(id)} onChange={() => toggleStatus(id)} />{label}</label>)}<label><input type="checkbox" checked={statuses.includes("unknown")} onChange={() => toggleStatus("unknown")} />Desconhecida / sem situação</label><div><button type="button" onClick={() => updateFilters({ statuses:[...Object.keys(capturedStatuses), "unknown"] })}>Selecionar todas</button><button type="button" onClick={() => updateFilters({ statuses:[] })}>Limpar situações</button><button type="button" onClick={() => updateFilters({ statuses:[...defaultStatuses] })}>Restaurar Provável + Dúvida</button></div></fieldset>
    <div className={styles.actions}><button type="button" onClick={() => { onFiltersChange({ search:"", club:"", category:"", statuses:[...Object.keys(capturedStatuses), "unknown"] }); setPage(1); }}>Limpar filtros</button><button type="button" onClick={() => { onFiltersChange(defaultPickerFilters()); setPage(1); }}>Restaurar filtros padrão</button></div>
    {slot.position === 6 && category && <p className={styles.note}>Técnicos não têm categoria. Sua preferência será mantida para os jogadores.</p>}
    {slot.role === "reservas" && <p className={styles.note}>{ceiling === null ? "Categoria do reserva aguarda a seleção dos titulares desta posição." : `Reserva permitido até ${categoryNames[ceiling]}. Referência: menor categoria dos titulares desta posição.`}</p>}
    <p className={styles.note} role="status">{statuses.length ? `${filtered.length} atletas elegíveis encontrados` : "Nenhuma situação selecionada. Restaure Provável + Dúvida para ver atletas."}</p>
    <ul ref={list} className={styles.pickerList} aria-label="Atletas elegíveis">{filtered.slice((safePage - 1) * 20, safePage * 20).map(a => {
      const invalidCategory = a.posicaoId !== 6 && (a.categoriaId === null || !categoryNames[a.categoriaId]);
      const tooHigh = ceiling !== null && (a.categoriaId ?? 0) > ceiling;
      return <li key={a.id}><ClubJersey clubId={a.clubeIdExterno} size={46} decorative /><div><strong>{a.apelido}</strong><span><ClubShield clubId={a.clubeIdExterno} size={16} decorative />{context.clubs.find(c => c.id === a.clubeIdExterno)?.dados.abreviacao} · {positionLabels[a.posicaoId]}</span><small>{a.posicaoId !== 6 && `${a.categoriaId ? categoryNames[a.categoriaId] ?? "Categoria inválida" : "Sem categoria"} · `}{a.pointcoins} POINTCOINS</small><span className={styles.situation}>{statusLabel(a.statusId)}</span>{tooHigh && <small className={styles.invalid}>Categoria superior à permitida para este reserva</small>}</div><button type="button" disabled={tooHigh || invalidCategory} onClick={e => {
        const choices = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        pendingFocus.current = Math.max(0, choices.indexOf(e.currentTarget));
        onSelect(a);
      }} aria-label={`Selecionar ${a.apelido}`}>Selecionar</button></li>;
    })}</ul>
    {statuses.length > 0 && filtered.length === 0 && <p className={styles.empty}>Nenhum atleta corresponde aos filtros desta posição.</p>}
    {totalPages > 1 && <nav className={styles.actions} aria-label="Paginação do seletor"><button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Anterior</button><span>Página {safePage} de {totalPages}</span><button type="button" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Próxima</button></nav>}
  </dialog>;
}
