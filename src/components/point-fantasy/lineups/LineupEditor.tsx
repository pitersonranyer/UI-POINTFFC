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
import { formatMatchupDate, sortLineupMatchups } from "./lineupMatchups";
import styles from "./LineupBuilder.module.css";

export const formatFantasyDate = (date: string) => new Date(date).toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"short" });
export function LineupEditor({ competitionId, onBack }: { competitionId: number; onBack: () => void }) {
  const editor = useLineupEditor(competitionId);
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const matchups = sortLineupMatchups(competition.partidas ?? [], context.clubs);
  const byId = new Map(context.athletes.map(a => [a.id, a]));
  function back() { if (!busy && (!dirty || window.confirm("Descartar alterações não salvas e voltar às competições?"))) onBack(); }
  return <div className={styles.editor}>
    <button className={styles.back} type="button" disabled={busy} onClick={back}>← Competições</button>
    <section className={styles.competitionSummary} aria-label="Competição selecionada">
      <div className={styles.competitionHeadline}><div><h2>{competition.nome}</h2><p>{competition.temporada} · Rodada {competition.rodada}</p></div><button type="button" aria-expanded={detailsOpen} aria-controls="competition-details" onClick={() => setDetailsOpen(open => !open)}>{detailsOpen ? "Fechar detalhes" : "Detalhes"}</button></div>
      <div className={styles.competitionFacts}><span>{competition.partidas.length} {competition.partidas.length === 1 ? "partida" : "partidas"}</span><span>{context.athletes.length} atletas elegíveis</span><span>Bloqueio: {lockTime ? formatFantasyDate(lockTime) + " (Brasília)" : "Horário indisponível"}</span></div>
      <div className={styles.competitionDetails} id="competition-details" hidden={!detailsOpen}>
        <h3>Confrontos e horários</h3>
        {matchups.length ? <ul className={styles.matches}>{matchups.map(({ match, home, away }) => <li key={match.id}>{home?.dados.abreviacao || getClubUniform(match.clubeMandanteId).abbreviation} × {away?.dados.abreviacao || getClubUniform(match.clubeVisitanteId).abbreviation} · {formatMatchupDate(match.inicioPrevisto)}</li>)}</ul> : <p>Nenhuma partida informada pela competição.</p>}
        <dl className={styles.competitionMetadata}><dt>Participação</dt><dd>{competition.tipoAcesso === "FREE" ? "Gratuita" : Number(competition.valorInscricao).toLocaleString("pt-BR", { style:"currency", currency:"BRL" })}</dd><dt>Status</dt><dd>{competition.status}</dd><dt>Período de inscrição</dt><dd>{formatFantasyDate(competition.inicioInscricao)} – {formatFantasyDate(competition.fimInscricao)}</dd><dt>Limite de escalações</dt><dd>{competition.limiteEscalacoesUsuario ?? "Sem limite definido"}</dd></dl>
      </div>
    </section>
    {blocked && <div className={styles.alert} role="status">{reason ?? (user?.status !== "ATIVO" ? "Sua conta precisa estar ativa para editar." : "O servidor bloqueou as ações de escrita. A visualização foi preservada.")} O horário do servidor é a referência final.</div>}
    {editor.error && <div className={styles.alert} role="alert">{editor.error}</div>}
    {editor.conflict && <div className={styles.alert}><p>Suas alterações locais foram preservadas. Recarregue a versão atual para continuar; o descarte exige confirmação.</p><button type="button" disabled={busy} onClick={() => void editor.reload()}>Recarregar versão atual</button></div>}
    {editor.notice && <p role="status" className={styles.notice}>{editor.notice}</p>}
    <div className={styles.lineupControls}>
      <LineupTeamNavigation drafts={editor.drafts} currentId={saved?.id ?? null} busy={busy} canCreate={!blocked} canDuplicate={!disabled && !!saved && !dirty} dirty={dirty} onOpen={id => void editor.openDraft(id)} onNew={editor.newDraft} onDuplicate={() => void editor.duplicate()} />
      <div className={styles.toolbar}><label>Formação<select aria-label="Formação tática" value={value.formacao} disabled={disabled} onChange={e => { editor.setSlot(null); editor.setValue({ ...value, formacao:e.target.value as Formation }); }}>{Object.keys(formationCounts).map(f => <option key={f}>{f}</option>)}</select></label><strong className={styles.rosterValue}>PC$ {lineupValue(value, context.athletes)}</strong></div>
    </div>
    <div className={styles.workspace}><LineupPitch value={value} athletes={context.athletes} clubs={context.clubs} placements={editor.slotPlacements} disabled={disabled} onOpen={editor.openSlot} onRemove={slot => editor.setValue(replaceSlot(value, context.athletes, slot, null, editor.slotPlacements))} onCaptain={id => editor.setValue({ ...value, capitaoAtletaId:id })} onPowerReserve={id => editor.setValue({ ...value, reservaMagoAtletaId:id })} />
      <aside className={styles.summary} aria-label="Resumo da escalação">
        <h3>{saved ? `Rascunho #${saved.id} · v${saved.versao}` : "Novo rascunho"}</h3>
        <p className={styles.note}>Titulares: {value.titulares.length}/11 · Técnico: {value.tecnico === null ? "pendente" : "selecionado"} · Reservas: {value.reservas.length}/5</p>
        <dl className={styles.roleSummary}><dt>Capitão</dt><dd aria-label="Capitão escolhido">{byId.get(value.capitaoAtletaId ?? -1)?.apelido ?? "Não definido"}</dd><dt>Reserva Power</dt><dd aria-label="Reserva Power escolhido">{byId.get(value.reservaMagoAtletaId ?? -1)?.apelido ?? "Não definido"}</dd></dl>
        <p className={styles.note}>Toque em um titular para definir o capitão ou em um reserva para ativar o Reserva Power.</p>
        {warnings.length > 0 && <div className={styles.alert}><strong>Ajustes antes de salvar</strong><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul><p>A formação mudou sem remover atletas. Use os controles de remoção para ajustar os excedentes.</p></div>}
        {dirty || !saved ? <p className={styles.note}>Pendências serão conferidas ao salvar.</p> : saved.validacao.completa ? <p className={styles.notice}>Escalação completa — rascunho salvo</p> : <div><h4>Pendências do rascunho salvo</h4><ul className={styles.pending}>{saved.validacao.pendencias.map((p, i) => <li key={i}>{friendlyPending(p)}</li>)}</ul></div>}
        <div className={styles.saveActions}><button className={styles.primary} type="button" disabled={disabled || warnings.length > 0 || (!!saved && !dirty)} onClick={() => void editor.save()}>{busy ? "Aguarde…" : "Salvar rascunho"}</button><button className={styles.danger} type="button" disabled={disabled || !saved} onClick={() => void editor.remove()}>Excluir rascunho</button></div>
        <p className={styles.note}>Salvar rascunho não confirma inscrição.</p>
      </aside>
    </div>
    {editor.slot && !disabled && <LineupAthletePicker context={context} value={value} slot={editor.slot} mode={editor.slot.mode} filters={editor.pickerFilters} onFiltersChange={editor.setPickerFilters} onClose={() => editor.setSlot(null)} onSelect={athlete => editor.selectAthlete(athlete.id)} onSell={athlete => editor.sellAthlete(athlete.id)} />}
  </div>;
}
