"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { adminDesafioService as service, type AdminDesafio, type DesafioPartida } from "@/services/adminDesafioService";
import { dateLabels, desafioError, emptyForm, formPayload, fromDesafio, statusLabels, type DesafioFormState } from "./desafioForm";
import { DesafioPartidas } from "./DesafioPartidas";
import styles from "../Admin.module.css";
import css from "./Desafios.module.css";

export function DesafioEditor({ mode }: { mode: "create" | "edit" }) {
  const params = useSearchParams(), router = useRouter();
  const id = mode === "edit" ? Number(params.get("id")) : null;
  const validId = id !== null && Number.isInteger(id) && id > 0 && id <= 4294967295;
  const [source, setSource] = useState<AdminDesafio | null>(null);
  const [form, setForm] = useState<DesafioFormState>(emptyForm);
  const [matches, setMatches] = useState<DesafioPartida[]>([]);
  const [loading, setLoading] = useState(mode === "edit"), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [blocked, setBlocked] = useState(false), [retry, setRetry] = useState(0);
  const lock = useRef(false);
  const editable = !blocked && (mode === "create" || source?.status === "RASCUNHO");
  const dirty = !!source && JSON.stringify(form) !== JSON.stringify(fromDesafio(source));
  const accept = useCallback((item: AdminDesafio) => { setSource(item); setForm(fromDesafio(item)); }, []);
  useEffect(() => {
    if (mode === "create") return;
    let active = true;
    setLoading(true); setError(""); setBlocked(false); setSource(null);
    if (!validId) { setError("Desafio não encontrado: ID inválido."); setLoading(false); return; }
    Promise.all([service.get(id!), service.matches(id!)]).then(([item, selected]) => { if (active) { accept(item); setMatches(selected); } }).catch(cause => { if (active) setError(desafioError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, validId, mode, accept, retry]);

  async function failure(cause: unknown) {
    setError(desafioError(cause));
    if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setBlocked(true);
    if (cause instanceof ApiError && cause.status === 409 && validId) {
      // Reconcile status/composition after concurrent changes; keep unsaved draft fields.
      setBlocked(true);
      try {
        const [item, selected] = await Promise.all([service.get(id!), service.matches(id!)]);
        setSource(item); setMatches(selected);
        if (item.status !== "RASCUNHO") setForm(fromDesafio(item));
        setBlocked(false);
      } catch { setError(`${desafioError(cause)} Não foi possível atualizar o estado. Recarregue antes de continuar.`); }
    }
  }
  async function run(operation: () => Promise<void>) {
    if (lock.current || blocked) return;
    lock.current = true; setBusy(true); setError(""); setSuccess("");
    try { await operation(); } catch (cause) { await failure(cause); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editable || lock.current) return;
    let payload;
    try { payload = formPayload(form); } catch (cause) { setError((cause as Error).message); return; }
    await run(async () => {
      if (mode === "create") {
        const created = await service.create(payload);
        setBlocked(true);
        router.replace(`/admin/desafios/editar?id=${created.id}&criado=1`);
      } else if (validId) {
        accept(await service.update(id!, payload));
        setSuccess("Alterações salvas com sucesso.");
      }
    });
  }
  async function mutate(action: "add" | "remove" | "reorder", ids: number[]) {
    if (!editable || !validId) return;
    await run(async () => {
      if (action === "add") {
        const added = await service.addMatch(id!, ids[0]);
        setMatches(current => [...current, added].sort((a, b) => a.ordem - b.ordem));
      } else setMatches(await (action === "remove" ? service.removeMatch(id!, ids[0]) : service.reorder(id!, ids)));
      setSuccess(action === "add" ? "Partida adicionada." : action === "remove" ? "Partida removida." : "Ordem das partidas salva.");
    });
  }
  async function transition(action: "publish" | "cancel") {
    if (!source || busy || blocked) return;
    if (action === "publish" && (!editable || dirty || !matches.length)) return;
    if (!window.confirm(action === "publish" ? `Publicar “${source.nome}”? Após a publicação, os dados e as partidas não poderão ser editados.` : `Cancelar “${source.nome}”? Esta ação não cancela inscrições nem realiza estornos.`)) return;
    await run(async () => {
      accept(await service[action](source.id));
      setSuccess(action === "publish" ? "Desafio publicado com sucesso. Edição e composição bloqueadas." : "Desafio cancelado com sucesso.");
      // Publication can refresh official kick-off times in the stored snapshots.
      if (action === "publish") {
        try { setMatches(await service.matches(source.id)); }
        catch { setError("Desafio publicado, mas não foi possível atualizar os horários das partidas. Recarregue a tela."); }
      }
    });
  }
  const update = <K extends keyof DesafioFormState>(key: K, value: DesafioFormState[K]) => { setForm(current => ({ ...current, [key]: value })); setSuccess(""); };
  if (loading) return <p className={styles.formLoading} role="status">Carregando Desafio e partidas...</p>;
  if (mode === "edit" && !source) return <div className={styles.formLoading}><p role="alert">{error}</p>{validId && <button className={css.button} onClick={() => setRetry(value => value + 1)}>Tentar novamente</button>}<Link href="/admin/desafios">Voltar para Desafios</Link></div>;
  return <>
    <header className={`${styles.pageHeader} ${styles.listHeader}`}><div><p>DESAFIOS</p><h1>{mode === "create" ? "Novo Desafio" : source?.nome}</h1>{source && <span>Status: {statusLabels[source.status]}</span>}</div><Link href="/admin/desafios">Voltar para Desafios</Link></header>
    {mode === "edit" && params.get("criado") === "1" && <p className={`${styles.formSuccess} ${css.notice}`}>Desafio criado. Selecione as partidas abaixo para publicar.</p>}
    {error && <p className={`${styles.formError} ${css.notice}`} role="alert">{error}</p>}
    {success && <p className={`${styles.formSuccess} ${css.notice}`} role="status">{success}</p>}
    {blocked && mode === "edit" && <button className={css.button} disabled={busy} onClick={() => setRetry(value => value + 1)}>Recarregar Desafio</button>}
    {!editable && source && <p className={styles.readonlyNotice}>Edição e composição disponíveis somente em rascunho.</p>}
    <form className={styles.competitionForm} onSubmit={save}>
      <fieldset className={styles.formSection} disabled={!editable || busy}><legend>Configuração</legend><div className={styles.formGrid}>
        <label className={styles.wideField}>Nome<input required maxLength={255} value={form.nome} onChange={event => update("nome", event.target.value)} /></label>
        <label className={styles.wideField}>Descrição<textarea rows={2} value={form.descricao} onChange={event => update("descricao", event.target.value)} /></label>
        <label>Acesso<select value={form.tipoAcesso} onChange={event => { const value = event.target.value as DesafioFormState["tipoAcesso"]; update("tipoAcesso", value); if (value === "FREE") update("valorInscricao", "0.00"); }}><option>FREE</option><option>PAGO</option></select></label>
        <label>Valor da inscrição (R$)<input inputMode="decimal" required value={form.valorInscricao} disabled={form.tipoAcesso === "FREE"} onChange={event => update("valorInscricao", event.target.value)} /></label>
        {(Object.entries(dateLabels) as [keyof typeof dateLabels, string][]).map(([key, label]) => <label key={key}>{label}<input type="datetime-local" step="0.001" required value={form[key]} onChange={event => update(key, event.target.value)} /></label>)}
        <label>Limite de participantes<input type="number" min="1" max="4294967295" step="1" placeholder="Sem limite" value={form.limiteParticipantes} onChange={event => update("limiteParticipantes", event.target.value)} /></label>
        <p className={css.hint}>Datas e horários no fuso do seu dispositivo. As inscrições devem terminar até o início do Desafio.</p>
      </div></fieldset>
      {editable && <div className={styles.formActions}><button type="submit" disabled={busy}>{busy ? "Aguarde..." : mode === "create" ? "Criar e selecionar partidas" : "Salvar alterações"}</button></div>}
    </form>
    {source && <DesafioPartidas key={source.id} matches={matches} editable={editable} busy={busy} initialDate={source.dataInicio} mutate={mutate} />}
    {source && (source.status === "RASCUNHO" || source.status === "ABERTO") && <>
      {dirty && editable && <p className={css.hint}>Salve as alterações antes de publicar.</p>}
      <div className={styles.formActions}><button type="button" disabled={busy || blocked} onClick={() => void transition("cancel")}>Cancelar Desafio</button>{source.status === "RASCUNHO" && <button type="button" disabled={busy || blocked || dirty || !matches.length} onClick={() => void transition("publish")}>{busy ? "Aguarde..." : "Publicar Desafio"}</button>}</div>
    </>}
  </>;
}
