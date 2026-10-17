"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { confirmFreeFantasyLineups, createFantasyLineup, deleteFantasyLineup, duplicateFantasyLineup, getFantasyLineup, lineupError, listMyFantasyLineups, loadLineupContext, updateFantasyLineup } from "@/services/pointFantasyLineupService";
import type { CreateLineupIdentity, FantasyLineup, FreeLineupRegistrationRequest, LineupContext, LineupPickerSession, LineupSelection, LineupSlot, LineupSlotPlacements, MyFantasyLineups } from "@/types/pointFantasyLineup";
import { athleteInSlot, blockingReason, buildSlotPlacements, defaultPickerFilters, emptySelection, removeAthlete, selectIntoLineupSlot, selectionOf } from "./lineupPresentation";
import { normalizeTeamName } from "./teamIdentity";
import { canRegisterLineup, freeRegistrationReason, registrationSelectionIssue } from "./freeLineupRegistration";

type CreationIntent = { kind: "create"; selection: LineupSelection; identity: CreateLineupIdentity } | { kind: "duplicate"; id: number; version: number; identity: CreateLineupIdentity };
const intentParameters = (intent: CreationIntent) => JSON.stringify({ ...intent, identity:{ nomeBase:intent.identity.nomeBase } });
type RegistrationIntent = { request: FreeLineupRegistrationRequest; teams: FantasyLineup[]; competitionName: string };

export function useLineupEditor(competitionId: number, integrated = false) {
  const [teamName, setTeamName] = useState("Tropa do Mago");
  const integratedIntent = useRef<FreeLineupRegistrationRequest | null>(null);
  const [integratedPending, setIntegratedPending] = useState(false);
  const [context, setContext] = useState<LineupContext | null>(null);
  const [drafts, setDrafts] = useState<FantasyLineup[]>([]);
  const [saved, setSaved] = useState<FantasyLineup | null>(null);
  const [identityState, setIdentityState] = useState<MyFantasyLineups | null>(null);
  const [nameAction, setNameAction] = useState<"create" | "duplicate" | null>(null);
  const pending = useRef<CreationIntent | null>(null);
  const rejectedIntent = useRef<CreationIntent | null>(null);
  const [pendingCreation, setPendingCreation] = useState(false);
  const [registrationIds, setRegistrationIds] = useState<number[]>([]);
  const [registrationReview, setRegistrationReview] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [registrationLocked, setRegistrationLocked] = useState(false);
  const [registrationRefreshRequired, setRegistrationRefreshRequired] = useState(false);
  const registrationIntent = useRef<RegistrationIntent | null>(null);
  const registrationLock = useRef(false);
  const registrationMustRefresh = useRef(false);
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
    if (integratedPending || pending.current || running.current || registrationLock.current || (saved && saved.status !== "RASCUNHO" && !(integrated && context?.competition.tipoAcesso === "FREE"))) return;
    setPlacements(selectionCursor.current.placements);
    setSelection(next);
  }
  function openSlot(next: LineupSlot) {
    if (integratedPending || registrationLock.current || (saved && saved.status !== "RASCUNHO" && !(integrated && context?.competition.tipoAcesso === "FREE"))) return;
    const session: LineupPickerSession = { ...next, mode:athleteInSlot(value, context?.athletes ?? [], next, slotPlacements) ? "replace" : "fill" };
    selectionCursor.current.slot = session;
    setSlot(session);
  }
  function selectAthlete(id: number) {
    const current = selectionCursor.current;
    if (!context || !current.slot || running.current || pending.current || registrationLock.current || (saved && saved.status !== "RASCUNHO" && !(integrated && context?.competition.tipoAcesso === "FREE")) || conflict || serverBlocked || blockingReason(context, Date.now())) return;
    const next = selectIntoLineupSlot(current.value, context.athletes, current.slot, id, current.placements);
    if (!next) return;
    selectionCursor.current = { value:next.selection, slot:next.nextSlot, placements:next.placements };
    setValue(next.selection); setPlacements(next.placements); setSlot(next.nextSlot);
  }
  function sellAthlete(id: number) {
    if (running.current || pending.current || registrationLock.current || (saved && saved.status !== "RASCUNHO" && !(integrated && context?.competition.tipoAcesso === "FREE")) || conflict || serverBlocked) return;
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
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty || running.current || pending.current || registrationLock.current) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const accept = useCallback((result: FantasyLineup) => {
    if (result.competicaoId !== competitionId) throw new Error("A escalação retornada pertence a outra competição.");
    setSaved(result); setSelection(selectionOf(result)); setSlot(null); setConflict(false);
    if (integrated) {
      let unresolved = false;
      try { unresolved = result.status !== "INSCRITA" && !!window.localStorage.getItem(`point-fantasy:registration:v1:${competitionId}:${result.id}`); } catch { /* Saving reports unavailable persistence before submitting. */ }
      setIntegratedPending(unresolved);
    }
    if (result.identidade) setIdentityState(previous => ({ items:previous?.items ?? [], estadoIdentidade:"DEFINIDA", identidade:result.identidade, rascunhosLegados:previous?.rascunhosLegados ?? 0 }));
    setDrafts(items => [result, ...items.filter(item => item.id !== result.id)]);
  }, [competitionId, integrated]);
  async function run(action: () => Promise<void>) {
    if (running.current) return;
    running.current = true; setBusy(true); setError(""); setNotice(""); setSlot(null);
    try { await action(); }
    catch (err) {
      if (!active.current) return;
      setError(lineupError(err));
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
        if (saved) { try { const latest = await getFantasyLineup(saved.id); if (active.current) setDrafts(items => items.map(item => item.id === latest.id ? latest : item)); } catch { /* Explicit reload remains available. */ } }
        if (/bloquead|primeira partida|competicao indisponivel/i.test(err.message)) setServerBlocked(true);
      }
      if (err instanceof ApiError && [401,403].includes(err.status)) setServerBlocked(true);
    } finally { running.current = false; if (active.current) setBusy(false); }
  }
  function discardConfirmed() { return !dirty || window.confirm("Há alterações não salvas. Deseja descartá-las e continuar?"); }
  function newDraft() {
    if (integratedPending || running.current || pending.current || registrationLock.current || !discardConfirmed()) return false;
    rejectedIntent.current = null;
    setSaved(null); setSelection(emptySelection()); setPlacements({}); setSlot(null); setError(""); setNotice(""); setConflict(false);
    return true;
  }
  async function openDraft(id: number) {
    if (integratedPending || running.current || pending.current || registrationLock.current || !discardConfirmed()) return false;
    rejectedIntent.current = null;
    let opened = false;
    await run(async () => { const result = await getFantasyLineup(id); if (active.current) { accept(result); opened = true; } });
    return opened;
  }
  async function createIntent(kind: "create" | "duplicate", nomeBase?: string, source = saved) {
    if (running.current || pending.current || registrationLock.current || conflict || serverBlocked || !identityState || !context || blockingReason(context, Date.now())) return;
    if (kind === "duplicate" && (!source || source.status !== "RASCUNHO" || dirty)) return;
    const name = nomeBase === undefined ? (integrated && identityState.estadoIdentidade !== "DEFINIDA" ? normalizeTeamName(teamName) : undefined) : normalizeTeamName(nomeBase);
    if (name === null) { setError("Use de 2 a 60 caracteres: letras, números, espaços, ponto, apóstrofo ou hífen."); return; }
    if (!integrated && identityState.estadoIdentidade !== "DEFINIDA" && name === undefined) { setNameAction(kind); return; }
    const identity = { chaveIdempotencia:"", ...(identityState.estadoIdentidade !== "DEFINIDA" ? { nomeBase:name! } : {}) };
    const intent: CreationIntent = kind === "duplicate" && source
      ? { kind, id:source.id, version:source.versao, identity }
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
          setNotice(integrated ? "Time salvo. Em montagem." : intent.kind === "create" ? "Rascunho salvo no servidor." : "Novo rascunho independente criado no servidor."); if (integrated && intent.kind === "create") await finishIntegratedSave(result);
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
  async function finishIntegratedSave(team: FantasyLineup) {
    if (!context) return;
    if (team.status === "INSCRITA") { setNotice("Time salvo. Inscrição preservada."); return; }
    if (context.competition.tipoAcesso !== "FREE") { setNotice("Time salvo. A participação paga depende de confirmação específica."); return; }
    if (!team.validacao.completa) return;
    const unavailable = freeRegistrationReason(context, Date.now());
    if (unavailable) { setError(`Time salvo. ${unavailable}`); return; }
    const storageKey = `point-fantasy:registration:v1:${competitionId}:${team.id}`;
    try {
      const stored = window.localStorage.getItem(storageKey);
      const request = integratedIntent.current?.escalacaoIds[0] === team.id ? integratedIntent.current : { escalacaoIds:[team.id], chaveIdempotencia:stored || crypto.randomUUID() };
      integratedIntent.current = request;
      window.localStorage.setItem(storageKey, request.chaveIdempotencia);
      const latest = await getFantasyLineup(team.id);
      if (latest.status !== "INSCRITA") {
        if (!latest.validacao.completa) throw new Error("O time ainda possui pendências. Recarregue a versão atual.");
        await confirmFreeFantasyLineups(competitionId, request);
      }
      const refreshed = latest.status === "INSCRITA" ? latest : await getFantasyLineup(team.id);
      if (refreshed.status !== "INSCRITA") throw new Error("A confirmação ainda não foi recuperada. Tente novamente.");
      accept(refreshed);
      integratedIntent.current = null;
      setIntegratedPending(false);
      window.localStorage.removeItem(storageKey);
      setNotice("Time salvo e inscrito!");
    } catch (err) {
      setIntegratedPending(true);
      setNotice("");
      setError(`Time salvo. Não foi possível concluir a inscrição. Tente salvar novamente. ${lineupError(err)}`);
      if (err instanceof ApiError && [401,403].includes(err.status)) setServerBlocked(true);
      if (err instanceof ApiError && err.status === 409) {
        try { const latest = await getFantasyLineup(team.id); setDrafts(items => items.map(item => item.id === latest.id ? latest : item)); } catch { /* Safe retry keeps the operation key. */ }
      }
    }
  }
  async function save() {
    if (integrated && (!context || blockingReason(context, Date.now()))) return;
    if (pending.current || registrationLock.current || conflict || serverBlocked || running.current || (saved && saved.status !== "RASCUNHO" && !(integrated && context?.competition.tipoAcesso === "FREE"))) return;
    if (!saved) { await createIntent("create"); return; }
    if (integrated && (!dirty || integratedPending)) { await run(() => finishIntegratedSave(saved)); return; }
    await run(async () => {
      const result = await updateFantasyLineup(saved.id, saved.versao, selectionOf(value));
      if (active.current) { accept(result); setNotice(integrated ? "Time salvo. Em montagem." : "Rascunho salvo no servidor."); if (integrated) await finishIntegratedSave(result); }
    });
  }
  async function duplicate() {
    if (!saved || saved.status !== "RASCUNHO" || registrationLock.current || dirty || conflict || serverBlocked) return;
    await createIntent("duplicate");
  }
  async function remove() {
    if (!saved || saved.status !== "RASCUNHO" || pending.current || registrationLock.current || conflict || serverBlocked || running.current || !window.confirm(`Excluir definitivamente ${saved.nomePublico ?? `o Time #${saved.id} (rascunho)`}${dirty ? " e descartar as alterações locais" : ""}?`)) return;
    await run(async () => {
      const result = await deleteFantasyLineup(saved.id, saved.versao);
      if (!result.excluida || result.id !== saved.id) throw new Error("O servidor não confirmou a exclusão.");
      if (active.current) {
        const remaining = drafts.filter(item => item.id !== result.id).sort((a,b) => a.id - b.id);
        setDrafts(remaining);
        setRegistrationIds(ids => ids.filter(id => id !== result.id));
        const next = remaining[0] ?? null;
        setSaved(next);
        setSelection(next ? selectionOf(next) : emptySelection());
        setSlot(null); setPlacements({}); setConflict(false);
        setNotice(next ? `Rascunho excluído. Time #${next.id} selecionado.` : "Rascunho excluído. Você pode montar uma nova escalação.");
      }
    });
  }
  async function reload() {
    if (running.current || pending.current || registrationLock.current || !discardConfirmed()) return;
    await run(async () => {
      const [latestContext, latestDrafts, latest] = await Promise.all([loadLineupContext(competitionId, new AbortController().signal), listMyFantasyLineups(competitionId, new AbortController().signal), saved ? getFantasyLineup(saved.id) : Promise.resolve(null)]);
      if (active.current) { setContext(latestContext); setDrafts(latestDrafts.items); setIdentityState(latestDrafts); if (latest) accept(latest); else setConflict(false); setNotice("Versão atual recarregada do servidor."); }
    });
  }

  function toggleRegistration(id: number) {
    if (running.current || pending.current || registrationLock.current || registrationMustRefresh.current) return;
    const team = drafts.find(item => item.id === id);
    setRegistrationError("");
    setRegistrationIds(ids => ids.includes(id) ? ids.filter(item => item !== id)
      : team && canRegisterLineup(team) && !(dirty && saved?.id === id) && ids.length < 100 ? [...ids, id] : ids);
  }
  function reviewRegistration() {
    if (running.current || pending.current || serverBlocked || (conflict && !registrationIntent.current) || !context || context.competition.tipoAcesso !== "FREE") return;
    if (!registrationIntent.current) {
      const issue = freeRegistrationReason(context, Date.now()) ?? registrationSelectionIssue(drafts, registrationIds, saved?.id ?? null, dirty, context.competition.limiteEscalacoesUsuario);
      if (issue) { setRegistrationError(issue); return; }
    }
    setSlot(null); setRegistrationReview(true);
  }
  function closeRegistration() {
    if (running.current) return;
    setRegistrationReview(false);
    // A lost response may already have confirmed. Closing must not abandon that key.
    if (!registrationLock.current && !registrationMustRefresh.current) {
      registrationIntent.current = null; setRegistrationError("");
      setRegistrationIds(ids => ids.filter(id => drafts.some(team => team.id === id && canRegisterLineup(team))));
    }
  }
  async function refreshRegistrationData(refreshContext = true) {
    const signal = AbortSignal.timeout(30000);
    const [latest, latestContext] = await Promise.all([
      listMyFantasyLineups(competitionId, signal),
      refreshContext ? loadLineupContext(competitionId, signal) : Promise.resolve(null),
    ]);
    if (!active.current) return;
    setDrafts(latest.items); setIdentityState(latest);
    if (latestContext) setContext(latestContext);
    if (saved) {
      const current = latest.items.find(item => item.id === saved.id);
      if (current && !dirty) { setSaved(current); setSelection(selectionOf(current)); }
      else if (!current || (current.versao !== saved.versao || current.status !== saved.status)) {
        // Keep local choices until the existing explicit reload/discard confirmation.
        if (current) setSaved(previous => previous ? { ...previous, status:current.status, confirmadaEm:current.confirmadaEm, nomePublico:current.nomePublico } : previous);
        setConflict(true);
      }
    }
    registrationMustRefresh.current = false; setRegistrationRefreshRequired(false);
  }
  async function confirmRegistration() {
    if (running.current || pending.current || serverBlocked || !registrationReview || !context || context.competition.tipoAcesso !== "FREE") return;
    let intent = registrationIntent.current;
    const retrying = !!intent;
    if (!intent) {
      const issue = freeRegistrationReason(context, Date.now()) ?? registrationSelectionIssue(drafts, registrationIds, saved?.id ?? null, dirty, context.competition.limiteEscalacoesUsuario);
      if (issue || conflict) { setRegistrationError(issue ?? "Recarregue a versão atual antes de inscrever."); return; }
      intent = { request:{ escalacaoIds:[...registrationIds].sort((a,b) => a-b), chaveIdempotencia:crypto.randomUUID() }, teams:drafts.filter(team => registrationIds.includes(team.id)), competitionName:context.competition.nome };
      registrationIntent.current = intent;
    }
    const operation = intent;
    await run(async () => {
      setRegistrationError("");
      let sent = false;
      try {
        if (retrying || registrationMustRefresh.current) await refreshRegistrationData();
        if (!active.current) return;
        sent = true;
        const result = await confirmFreeFantasyLineups(competitionId, operation.request);
        if (!active.current) return;
        const confirmed = new Map(result.escalacoes.map(team => [team.id, team]));
        // The receipt has no selection/version. Merge only actual returned state and identity.
        setDrafts(items => items.map(team => confirmed.has(team.id) ? { ...team, ...confirmed.get(team.id)! } : team));
        setSaved(team => team && confirmed.has(team.id) ? { ...team, ...confirmed.get(team.id)! } : team);
        setRegistrationIds(ids => ids.filter(id => !confirmed.has(id)));
        registrationIntent.current = null; registrationLock.current = false; registrationMustRefresh.current = false;
        setRegistrationLocked(false); setRegistrationRefreshRequired(false); setRegistrationReview(false);
        setNotice(`${result.quantidadeConfirmada} ${result.quantidadeConfirmada === 1 ? "escalação inscrita" : "escalações inscritas"} com sucesso. Total: R$ 0,00.`);
        try { await refreshRegistrationData(false); }
        catch { if (active.current) setNotice("Inscrição confirmada. Não foi possível atualizar a lista completa; recarregue os dados para conferir as versões atuais."); }
      } catch (err) {
        if (!active.current) return;
        setRegistrationError(lineupError(err));
        const uncertain = registrationLock.current || (sent && (!(err instanceof ApiError) || err.status === 0 || err.status === 408 || err.status >= 500));
        registrationLock.current = uncertain; setRegistrationLocked(uncertain);
        registrationMustRefresh.current = !sent || uncertain || (err instanceof ApiError && err.status === 409);
        setRegistrationRefreshRequired(registrationMustRefresh.current);
        if (err instanceof ApiError && [401,403].includes(err.status)) setServerBlocked(true);
        if (err instanceof ApiError && err.status === 409) {
          try { await refreshRegistrationData(); }
          catch { if (active.current) setRegistrationError(`${lineupError(err)} Não foi possível atualizar os times. A atualização será exigida antes de reenviar.`); }
        }
      }
    });
  }
  const registrationTeams = registrationIntent.current?.teams ?? drafts.filter(team => registrationIds.includes(team.id));
  return { duplicateListed:(team: FantasyLineup) => createIntent("duplicate", undefined, team), integratedPending, teamName, setTeamName, context, drafts, saved, value, setValue, slot, setSlot, openSlot, selectAthlete, sellAthlete, slotPlacements, pickerFilters, setPickerFilters, loading, busy, error, notice, conflict, serverBlocked, dirty, save, duplicate, remove, reload, newDraft, openDraft, identityState, nameAction, pendingCreation, retryCreation, confirmName:(name: string) => nameAction ? createIntent(nameAction, name) : Promise.resolve(), cancelName:() => { if (!running.current) setNameAction(null); }, retry:() => setRetry(n => n + 1), registrationIds, toggleRegistration, registrationReview, reviewRegistration, closeRegistration, confirmRegistration, registrationError, registrationLocked, registrationRefreshRequired, registrationRetry:!!registrationIntent.current, registrationTeams, registrationCompetitionName:registrationIntent.current?.competitionName ?? context?.competition.nome ?? "" };
}
