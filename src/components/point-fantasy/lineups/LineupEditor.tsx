"use client";
import React, { useEffect, useState } from "react";
import type { Formation } from "@/types/pointFantasyLineup";
import { useAuth } from "@/contexts/AuthContext";
import { getClubUniform } from "../uniforms/clubUniforms";
import { blockingReason, formationCounts, friendlyPending, lineupValue, replaceSlot, selectionWarnings } from "./lineupPresentation";
import { LineupPitch } from "./LineupPitch";
import { LineupAthletePicker } from "./LineupAthletePicker";
import { useLineupEditor } from "./useLineupEditor";
import { LineupTeamNavigation } from "./LineupTeamNavigation";
import styles from "./LineupBuilder.module.css";

export const formatFantasyDate = (date: string) => new Date(date).toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"short" });
export function LineupEditor({ competitionId, onBack }: { competitionId: number; onBack: () => void }) {
  const editor = useLineupEditor(competitionId);
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const { context, value, saved, dirty, busy } = editor;
  if (editor.loading) return <p className={styles.empty} role="status">Carregando competição, atletas elegíveis e seus rascunhos…</p>;
  if (!context) return <div className={styles.empty} role="alert"><p>{editor.error}</p><button onClick={editor.retry}>Tentar novamente</button><button onClick={onBack}>Voltar às competições</button></div>;
  const reason = blockingReason(context, now);
  const blocked = !!reason || editor.serverBlocked || user?.status !== "ATIVO";
  const disabled = busy || blocked || editor.conflict;
  const warnings = selectionWarnings(value, context.athletes);
  const competition = context.competition;
  const lockTimes = [...competition.partidas.map(m => Date.parse(m.inicioPrevisto)), ...(competition.fechamentoDefinitivoEm ? [Date.parse(competition.fechamentoDefinitivoEm)] : [])].filter(Number.isFinite);
  const lockTime = lockTimes.length ? new Date(Math.min(...lockTimes)).toISOString() : null;
  const byId = new Map(context.athletes.map(a => [a.id, a]));
  function back() { if (!busy && (!dirty || window.confirm("Descartar alterações não salvas e voltar às competições?"))) onBack(); }
  return <div className={styles.editor}>
    <button className={styles.back} type="button" disabled={busy} onClick={back}>← Competições</button>
    <section className={styles.competitionSummary} aria-label="Competição selecionada"><h2>{competition.nome}</h2><div className={styles.facts}><span>{competition.temporada} · Rodada {competition.rodada}</span><span>{context.athletes.length} atletas elegíveis · {context.clubs.length} clubes</span><span>Participação: {competition.tipoAcesso === "FREE" ? "Gratuita" : Number(competition.valorInscricao).toLocaleString("pt-BR", { style:"currency", currency:"BRL" })} · apenas informativo</span><span>Bloqueio previsto: {lockTime ? formatFantasyDate(lockTime) + " (Brasília)" : "Horário indisponível"}</span></div><ul className={styles.matches}>{competition.partidas.map(m => <li key={m.id}>{getClubUniform(m.clubeMandanteId).abbreviation} × {getClubUniform(m.clubeVisitanteId).abbreviation} · {formatFantasyDate(m.inicioPrevisto)}</li>)}</ul></section>
    {blocked && <div className={styles.alert} role="status">{reason ?? (user?.status !== "ATIVO" ? "Sua conta precisa estar ativa para editar." : "O servidor bloqueou as ações de escrita. A visualização foi preservada.")} O horário do servidor é a referência final.</div>}
    {editor.error && <div className={styles.alert} role="alert">{editor.error}</div>}
    {editor.conflict && <div className={styles.alert}><p>Suas alterações locais foram preservadas. Recarregue a versão atual para continuar; o descarte exige confirmação.</p><button type="button" disabled={busy} onClick={() => void editor.reload()}>Recarregar versão atual</button></div>}
    {editor.notice && <p role="status" className={styles.notice}>{editor.notice}</p>}
    <div className={styles.toolbar}><label>Formação tática<select value={value.formacao} disabled={disabled} onChange={e => { editor.setSlot(null); editor.setValue({ ...value, formacao:e.target.value as Formation }); }}>{Object.keys(formationCounts).map(f => <option key={f}>{f}</option>)}</select></label><div><strong>Valor do elenco: PC$ {lineupValue(value, context.athletes)}</strong><small>PointCoins são valores virtuais, sem teto de orçamento.</small></div></div>
    <LineupTeamNavigation drafts={editor.drafts} currentId={saved?.id ?? null} busy={busy} canCreate={!blocked} canDuplicate={!disabled && !!saved && !dirty} dirty={dirty} onOpen={id => void editor.openDraft(id)} onNew={editor.newDraft} onDuplicate={() => void editor.duplicate()} />
    <div className={styles.workspace}><LineupPitch value={value} athletes={context.athletes} clubs={context.clubs} placements={editor.slotPlacements} disabled={disabled} onOpen={editor.openSlot} onRemove={slot => editor.setValue(replaceSlot(value, context.athletes, slot, null, editor.slotPlacements))} onCaptain={id => editor.setValue({ ...value, capitaoAtletaId:id })} onPowerReserve={id => editor.setValue({ ...value, reservaMagoAtletaId:id })} />
      <aside className={styles.summary} aria-label="Resumo da escalação">
        <h3>{saved ? `Rascunho #${saved.id} · v${saved.versao}` : "Novo rascunho"}</h3>
        <p className={styles.note}>Titulares: {value.titulares.length}/11 · Técnico: {value.tecnico === null ? "pendente" : "selecionado"} · Reservas: {value.reservas.length}/5</p>
        <dl className={styles.roleSummary}><dt>Capitão</dt><dd aria-label="Capitão escolhido">{byId.get(value.capitaoAtletaId ?? -1)?.apelido ?? "Não definido"}</dd><dt>Reserva Power</dt><dd aria-label="Reserva Power escolhido">{byId.get(value.reservaMagoAtletaId ?? -1)?.apelido ?? "Não definido"}</dd></dl>
        <p className={styles.note}>Toque em um titular para definir o capitão ou em um reserva para ativar o Reserva Power.</p>
        {warnings.length > 0 && <div className={styles.alert}><strong>Ajustes antes de salvar</strong><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul><p>A formação mudou sem remover atletas. Use os controles de remoção para ajustar os excedentes.</p></div>}
        {dirty || !saved ? <p className={styles.note}>Alterações ainda não validadas. Salve o rascunho para consultar as pendências do servidor.</p> : saved.validacao.completa ? <p className={styles.notice}>Escalação completa — rascunho salvo</p> : <div><h4>Pendências do rascunho salvo</h4><ul className={styles.pending}>{saved.validacao.pendencias.map((p, i) => <li key={i}>{friendlyPending(p)}</li>)}</ul></div>}
        <div className={styles.saveActions}><button className={styles.primary} type="button" disabled={disabled || warnings.length > 0 || (!!saved && !dirty)} onClick={() => void editor.save()}>{busy ? "Aguarde…" : "Salvar rascunho"}</button><button className={styles.danger} type="button" disabled={disabled || !saved} onClick={() => void editor.remove()}>Excluir rascunho</button></div>
        <p className={styles.note}>Salvar não confirma inscrição nem garante participação. PointCoins não são saldo financeiro.</p>
      </aside>
    </div>
    {editor.slot && !disabled && <LineupAthletePicker context={context} value={value} slot={editor.slot} mode={editor.slot.mode} filters={editor.pickerFilters} onFiltersChange={editor.setPickerFilters} onClose={() => editor.setSlot(null)} onSelect={athlete => editor.selectAthlete(athlete.id)} onSell={athlete => editor.sellAthlete(athlete.id)} />}
  </div>;
}
