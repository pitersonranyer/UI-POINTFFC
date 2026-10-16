"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { createFantasyLineup, deleteFantasyLineup, duplicateFantasyLineup, getFantasyLineup, lineupError, listMyFantasyLineups, loadLineupContext, updateFantasyLineup } from "@/services/pointFantasyLineupService";
import type { FantasyLineup, LineupContext, LineupPickerSession, LineupSelection, LineupSlot, LineupSlotPlacements } from "@/types/pointFantasyLineup";
import { athleteInSlot, blockingReason, buildSlotPlacements, defaultPickerFilters, emptySelection, removeAthlete, selectIntoLineupSlot, selectionOf } from "./lineupPresentation";

export function useLineupEditor(competitionId: number) {
  const [context, setContext] = useState<LineupContext | null>(null);
  const [drafts, setDrafts] = useState<FantasyLineup[]>([]);
  const [saved, setSaved] = useState<FantasyLineup | null>(null);
  const [value, setSelection] = useState<LineupSelection>(emptySelection);
  const [slot, setSlot] = useState<LineupPickerSession | null>(null);
  const [placements, setPlacements] = useState<LineupSlotPlacements>({});
  const [pickerFilters, setPickerFilters] = useState(defaultPickerFilters);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false); const [serverBlocked, setServerBlocked] = useState(false);
  const [retry, setRetry] = useState(0);
  const active = useRef(false); const running = useRef(false);
  const slotPlacements = useMemo(() => buildSlotPlacements(value, context?.athletes ?? [], placements), [value, context, placements]);
  const selectionCursor = useRef({ value, slot, placements:slotPlacements });
  selectionCursor.current = { value, slot, placements:slotPlacements };
  function setValue(next: LineupSelection) {
    setPlacements(selectionCursor.current.placements);
    setSelection(next);
  }
  function openSlot(next: LineupSlot) {
    const session: LineupPickerSession = { ...next, mode:athleteInSlot(value, context?.athletes ?? [], next, slotPlacements) ? "replace" : "fill" };
    selectionCursor.current.slot = session;
    setSlot(session);
  }
  function selectAthlete(id: number) {
    const current = selectionCursor.current;
    if (!context || !current.slot || running.current || conflict || serverBlocked || blockingReason(context, Date.now())) return;
    const next = selectIntoLineupSlot(current.value, context.athletes, current.slot, id, current.placements);
    if (!next) return;
    selectionCursor.current = { value:next.selection, slot:next.nextSlot, placements:next.placements };
    setValue(next.selection); setPlacements(next.placements); setSlot(next.nextSlot);
  }
  function sellAthlete(id: number) {
    if (running.current || conflict || serverBlocked) return;
    const current = selectionCursor.current;
    const nextValue = removeAthlete(current.value, id);
    const activeAthlete = context && current.slot ? athleteInSlot(current.value, context.athletes, current.slot, current.placements) : undefined;
    const nextSlot = current.slot && activeAthlete?.id === id ? { ...current.slot, mode:"fill" as const } : current.slot;
    const nextPlacements = buildSlotPlacements(nextValue, context?.athletes ?? [], current.placements);
    selectionCursor.current = { value:nextValue, slot:nextSlot, placements:nextPlacements };
    setSelection(nextValue); setPlacements(nextPlacements); setSlot(nextSlot);
  }
  const dirty = JSON.stringify(value) !== JSON.stringify(saved ? selectionOf(saved) : emptySelection());
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    Promise.all([loadLineupContext(competitionId, controller.signal), listMyFantasyLineups(competitionId, controller.signal)])
      .then(([nextContext, nextDrafts]) => { if (!controller.signal.aborted) { setContext(nextContext); setDrafts(nextDrafts); setLoading(false); } })
      .catch(err => { if (!controller.signal.aborted) { setError(lineupError(err)); setLoading(false); controller.abort(); } });
    return () => controller.abort();
  }, [competitionId, retry]);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty || running.current) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const accept = useCallback((result: FantasyLineup) => {
    if (result.competicaoId !== competitionId) throw new Error("A escalação retornada pertence a outra competição.");
    setSaved(result); setValue(selectionOf(result)); setSlot(null); setConflict(false);
    setDrafts(items => [result, ...items.filter(item => item.id !== result.id)]);
  }, [competitionId]);
  async function run(action: () => Promise<void>) {
    if (running.current) return;
    running.current = true; setBusy(true); setError(""); setNotice(""); setSlot(null);
    try { await action(); }
    catch (err) {
      if (!active.current) return;
      setError(lineupError(err));
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
        if (/bloquead|primeira partida|competicao indisponivel/i.test(err.message)) setServerBlocked(true);
      }
      if (err instanceof ApiError && [401,403].includes(err.status)) setServerBlocked(true);
    } finally { running.current = false; if (active.current) setBusy(false); }
  }
  function discardConfirmed() { return !dirty || window.confirm("Há alterações não salvas. Deseja descartá-las e continuar?"); }
  function newDraft() {
    if (running.current || !discardConfirmed()) return;
    setSaved(null); setValue(emptySelection()); setPlacements({}); setSlot(null); setError(""); setNotice(""); setConflict(false);
  }
  async function openDraft(id: number) {
    if (running.current || !discardConfirmed()) return;
    await run(async () => { const result = await getFantasyLineup(id); if (active.current) accept(result); });
  }
  async function save() {
    if (conflict || serverBlocked) return;
    await run(async () => {
      const result = saved ? await updateFantasyLineup(saved.id, saved.versao, selectionOf(value)) : await createFantasyLineup(competitionId, selectionOf(value));
      if (active.current) { accept(result); setNotice("Rascunho salvo no servidor."); }
    });
  }
  async function duplicate() {
    if (!saved || dirty || conflict || serverBlocked) return;
    await run(async () => { const result = await duplicateFantasyLineup(saved.id, saved.versao); if (active.current) { accept(result); setNotice("Novo rascunho independente criado no servidor."); } });
  }
  async function remove() {
    if (!saved || conflict || serverBlocked || running.current || !window.confirm(`Excluir definitivamente o rascunho #${saved.id}${dirty ? " e descartar as alterações locais" : ""}?`)) return;
    await run(async () => {
      const result = await deleteFantasyLineup(saved.id, saved.versao);
      if (!result.excluida || result.id !== saved.id) throw new Error("O servidor não confirmou a exclusão.");
      if (active.current) { setDrafts(items => items.filter(item => item.id !== result.id)); setSaved(null); setValue(emptySelection()); setNotice("Rascunho excluído."); }
    });
  }
  async function reload() {
    if (running.current || !discardConfirmed()) return;
    await run(async () => {
      const [latestContext, latestDrafts, latest] = await Promise.all([loadLineupContext(competitionId, new AbortController().signal), listMyFantasyLineups(competitionId, new AbortController().signal), saved ? getFantasyLineup(saved.id) : Promise.resolve(null)]);
      if (active.current) { setContext(latestContext); setDrafts(latestDrafts); if (latest) accept(latest); else setConflict(false); setNotice("Versão atual recarregada do servidor."); }
    });
  }
  return { context, drafts, saved, value, setValue, slot, setSlot, openSlot, selectAthlete, sellAthlete, slotPlacements, pickerFilters, setPickerFilters, loading, busy, error, notice, conflict, serverBlocked, dirty, save, duplicate, remove, reload, newDraft, openDraft, retry:() => setRetry(n => n + 1) };
}
