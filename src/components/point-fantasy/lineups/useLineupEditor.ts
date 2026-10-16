"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { createFantasyLineup, deleteFantasyLineup, duplicateFantasyLineup, getFantasyLineup, lineupError, listMyFantasyLineups, loadLineupContext, updateFantasyLineup } from "@/services/pointFantasyLineupService";
import type { CreateLineupIdentity, FantasyLineup, LineupContext, LineupPickerSession, LineupSelection, LineupSlot, LineupSlotPlacements, MyFantasyLineups } from "@/types/pointFantasyLineup";
import { athleteInSlot, blockingReason, buildSlotPlacements, defaultPickerFilters, emptySelection, removeAthlete, selectIntoLineupSlot, selectionOf } from "./lineupPresentation";
import { normalizeTeamName } from "./teamIdentity";

type CreationIntent = { kind: "create"; selection: LineupSelection; identity: CreateLineupIdentity } | { kind: "duplicate"; id: number; version: number; identity: CreateLineupIdentity };
const intentParameters = (intent: CreationIntent) => JSON.stringify({ ...intent, identity:{ nomeBase:intent.identity.nomeBase } });

export function useLineupEditor(competitionId: number) {
  const [context, setContext] = useState<LineupContext | null>(null);
  const [drafts, setDrafts] = useState<FantasyLineup[]>([]);
  const [saved, setSaved] = useState<FantasyLineup | null>(null);
  const [identityState, setIdentityState] = useState<MyFantasyLineups | null>(null);
  const [nameAction, setNameAction] = useState<"create" | "duplicate" | null>(null);
  const pending = useRef<CreationIntent | null>(null);
  const rejectedIntent = useRef<CreationIntent | null>(null);
  const [pendingCreation, setPendingCreation] = useState(false);
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
    if (pending.current || running.current) return;
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
    if (!context || !current.slot || running.current || pending.current || conflict || serverBlocked || blockingReason(context, Date.now())) return;
    const next = selectIntoLineupSlot(current.value, context.athletes, current.slot, id, current.placements);
    if (!next) return;
    selectionCursor.current = { value:next.selection, slot:next.nextSlot, placements:next.placements };
    setValue(next.selection); setPlacements(next.placements); setSlot(next.nextSlot);
  }
  function sellAthlete(id: number) {
    if (running.current || pending.current || conflict || serverBlocked) return;
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
      .then(([nextContext, nextDrafts]) => { if (!controller.signal.aborted) { setContext(nextContext); setDrafts(nextDrafts.items); setIdentityState(nextDrafts); setLoading(false); } })
      .catch(err => { if (!controller.signal.aborted) { setError(lineupError(err)); setLoading(false); controller.abort(); } });
    return () => controller.abort();
  }, [competitionId, retry]);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty || running.current || pending.current) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const accept = useCallback((result: FantasyLineup) => {
    if (result.competicaoId !== competitionId) throw new Error("A escalação retornada pertence a outra competição.");
    setSaved(result); setSelection(selectionOf(result)); setSlot(null); setConflict(false);
    if (result.identidade) setIdentityState(previous => ({ items:previous?.items ?? [], estadoIdentidade:"DEFINIDA", identidade:result.identidade, rascunhosLegados:previous?.rascunhosLegados ?? 0 }));
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
    if (running.current || pending.current || !discardConfirmed()) return;
    rejectedIntent.current = null;
    setSaved(null); setValue(emptySelection()); setPlacements({}); setSlot(null); setError(""); setNotice(""); setConflict(false);
  }
  async function openDraft(id: number) {
    if (running.current || pending.current || !discardConfirmed()) return;
    rejectedIntent.current = null;
    await run(async () => { const result = await getFantasyLineup(id); if (active.current) accept(result); });
  }
  async function createIntent(kind: "create" | "duplicate", nomeBase?: string) {
    if (running.current || pending.current || conflict || serverBlocked || !identityState || !context || blockingReason(context, Date.now())) return;
    if (kind === "duplicate" && (!saved || dirty)) return;
    const name = nomeBase === undefined ? undefined : normalizeTeamName(nomeBase);
    if (name === null) { setError("Use de 2 a 60 caracteres: letras, números, espaços, ponto, apóstrofo ou hífen."); return; }
    if (identityState.estadoIdentidade !== "DEFINIDA" && name === undefined) { setNameAction(kind); return; }
    const identity = { chaveIdempotencia:"", ...(identityState.estadoIdentidade !== "DEFINIDA" ? { nomeBase:name! } : {}) };
    const intent: CreationIntent = kind === "duplicate" && saved
      ? { kind, id:saved.id, version:saved.versao, identity }
      : { kind:"create", selection:structuredClone(selectionOf(value)), identity };
    intent.identity.chaveIdempotencia = rejectedIntent.current && intentParameters(rejectedIntent.current) === intentParameters(intent)
      ? rejectedIntent.current.identity.chaveIdempotencia : crypto.randomUUID();
    pending.current = intent;
    await executeIntent(intent, false);
  }
  async function executeIntent(intent: CreationIntent, retrying: boolean) {
    await run(async () => {
      try {
        // A lost response may already have committed. Refresh before replaying the same intent.
        if (retrying) {
          const latest = await listMyFantasyLineups(competitionId, new AbortController().signal);
          if (!active.current) return;
          setIdentityState(latest); setDrafts(latest.items);
        }
        const result = intent.kind === "create"
          ? await createFantasyLineup(competitionId, intent.selection, intent.identity)
          : await duplicateFantasyLineup(intent.id, intent.version, intent.identity);
        if (active.current) {
          accept(result); pending.current = null; rejectedIntent.current = null; setPendingCreation(false); setNameAction(null);
          setNotice(intent.kind === "create" ? "Rascunho salvo no servidor." : "Novo rascunho independente criado no servidor.");
        }
      } catch (err) {
        if (!active.current) return;
        setError(lineupError(err));
        const definiteConflict = !retrying && err instanceof ApiError && err.status === 409 && /versao desatualizada|nome-base definitivo/i.test(err.message);
        const uncertain = !definiteConflict && (retrying || !(err instanceof ApiError) || err.status === 0 || err.status === 408 || err.status === 409 || err.status >= 500);
        if (uncertain) { setPendingCreation(true); }
        else { rejectedIntent.current = intent; pending.current = null; setPendingCreation(false); }
        if (definiteConflict) setConflict(true);
        if (err instanceof ApiError && [401,403].includes(err.status)) setServerBlocked(true);
      }
    });
  }
  async function retryCreation() { if (pending.current && !running.current && !serverBlocked) await executeIntent(pending.current, true); }
  async function save() {
    if (pending.current || conflict || serverBlocked || running.current) return;
    if (!saved) { await createIntent("create"); return; }
    await run(async () => {
      const result = await updateFantasyLineup(saved.id, saved.versao, selectionOf(value));
      if (active.current) { accept(result); setNotice("Rascunho salvo no servidor."); }
    });
  }
  async function duplicate() {
    if (!saved || dirty || conflict || serverBlocked) return;
    await createIntent("duplicate");
  }
  async function remove() {
    if (!saved || saved.status !== "RASCUNHO" || pending.current || conflict || serverBlocked || running.current || !window.confirm(`Excluir definitivamente ${saved.nomePublico ?? `o Time #${saved.id} (rascunho)`}${dirty ? " e descartar as alterações locais" : ""}?`)) return;
    await run(async () => {
      const result = await deleteFantasyLineup(saved.id, saved.versao);
      if (!result.excluida || result.id !== saved.id) throw new Error("O servidor não confirmou a exclusão.");
      if (active.current) {
        const remaining = drafts.filter(item => item.id !== result.id).sort((a,b) => a.id - b.id);
        setDrafts(remaining);
        const next = remaining[0] ?? null;
        setSaved(next);
        setSelection(next ? selectionOf(next) : emptySelection());
        setSlot(null); setPlacements({}); setConflict(false);
        setNotice(next ? `Rascunho excluído. Time #${next.id} selecionado.` : "Rascunho excluído. Você pode montar uma nova escalação.");
      }
    });
  }
  async function reload() {
    if (running.current || pending.current || !discardConfirmed()) return;
    await run(async () => {
      const [latestContext, latestDrafts, latest] = await Promise.all([loadLineupContext(competitionId, new AbortController().signal), listMyFantasyLineups(competitionId, new AbortController().signal), saved ? getFantasyLineup(saved.id) : Promise.resolve(null)]);
      if (active.current) { setContext(latestContext); setDrafts(latestDrafts.items); setIdentityState(latestDrafts); if (latest) accept(latest); else setConflict(false); setNotice("Versão atual recarregada do servidor."); }
    });
  }
  return { context, drafts, saved, value, setValue, slot, setSlot, openSlot, selectAthlete, sellAthlete, slotPlacements, pickerFilters, setPickerFilters, loading, busy, error, notice, conflict, serverBlocked, dirty, save, duplicate, remove, reload, newDraft, openDraft, identityState, nameAction, pendingCreation, retryCreation, confirmName:(name: string) => nameAction ? createIntent(nameAction, name) : Promise.resolve(), cancelName:() => { if (!running.current) setNameAction(null); }, retry:() => setRetry(n => n + 1) };
}
