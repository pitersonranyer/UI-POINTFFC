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
import { FreeRegistrationPanel } from "./FreeRegistrationPanel";
import { FreeRegistrationDialog } from "./FreeRegistrationDialog";
import { TeamCrest } from "./TeamCrest";
import { CompetitionRanking } from "../ranking/CompetitionRanking";
import { CompetitionTabs } from "../ranking/CompetitionTabs";
import { FirstLineupSaveDialog } from "./FirstLineupSaveDialog";
import { formatMatchupDate, sortLineupMatchups } from "./lineupMatchups";
import leagueStyles from "../../leagues/PointCompetition.module.css";
import styles from "./LineupBuilder.module.css";

export const formatFantasyDate = (date: string) => new Date(date).toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"short" });
export function LineupEditor({ competitionId, onBack, integrated = false }: { competitionId: number; onBack: () => void; integrated?: boolean }) {
  const editor = useLineupEditor(competitionId, integrated);
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now);
  const [tab, setTab] = useState("Meus times");
  const [editing, setEditing] = useState(!integrated);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const { context, value, saved, dirty, busy } = editor;
  if (editor.loading) return <p className={styles.empty} role="status">Carregando competição, atletas elegíveis e seus times…</p>;
  if (!context) return <div className={styles.empty} role="alert"><p>{editor.error}</p><button onClick={editor.retry}>Tentar novamente</button><button onClick={onBack}>Voltar às competições</button></div>;
  const reason = blockingReason(context, now);
  const blocked = !!reason || editor.serverBlocked || user?.status !== "ATIVO";
  const registered = saved?.status === "INSCRITA";
  const writeDisabled = busy || blocked || editor.conflict || editor.pendingCreation || editor.registrationLocked;
  const disabled = writeDisabled || editor.integratedPending || (registered && (!integrated || context.competition.tipoAcesso !== "FREE"));
  const warnings = selectionWarnings(value, context.athletes);
  const competition = context.competition;
  const lockTimes = [...competition.partidas.map(m => Date.parse(m.inicioPrevisto)), ...(competition.fechamentoDefinitivoEm ? [Date.parse(competition.fechamentoDefinitivoEm)] : [])].filter(Number.isFinite);
  const lockTime = lockTimes.length ? new Date(Math.min(...lockTimes)).toISOString() : null;
  const matchups = sortLineupMatchups(competition.partidas ?? [], context.clubs);
  const byId = new Map(context.athletes.map(a => [a.id, a]));
  const lineupLimit = competition.limiteEscalacoesUsuario;
  const atLineupLimit = lineupLimit !== null && editor.drafts.length >= lineupLimit;
  const showNavigation = editor.drafts.length > 0 || editor.identityState?.estadoIdentidade === "DEFINIDA";
  function back() { if (!busy && !editor.pendingCreation && !editor.registrationLocked && (!dirty || window.confirm("Descartar alterações não salvas e voltar às competições?"))) onBack(); }
  return <div className={styles.editor}>
    <button className={styles.back} type="button" disabled={busy || editor.pendingCreation || editor.registrationLocked} onClick={back}>← Competições</button>
    <section className={`${leagueStyles.competitionHeader} ${styles.fantasyCompetitionHeader}`} aria-label="Competição selecionada">
      <div className={leagueStyles.titleRow}><div><h1>{competition.nome}</h1><p>Temporada {competition.temporada}</p></div><span className={leagueStyles.roundBadge}>Rodada {competition.rodada}</span></div>
      <div className={`${leagueStyles.headerMetrics} ${styles.fantasyHeaderMetrics}`}>
        <div><strong>{competition.tipoAcesso === "FREE" ? "Gratuita" : `Paga · ${Number(competition.valorInscricao).toLocaleString("pt-BR", { style:"currency", currency:"BRL" })}`}</strong><small>Participação</small></div>
        <div><strong>{competition.status}</strong><small>Status</small></div>
        <div><strong>{formatFantasyDate(competition.fimInscricao)}</strong><small>Inscrições até (Brasília)</small></div>
      </div>
      <button className={styles.detailsToggle} type="button" aria-expanded={detailsOpen} aria-controls="competition-details" onClick={() => setDetailsOpen(open => !open)}>{detailsOpen ? "Fechar" : "Detalhes"}</button>
      <div className={styles.competitionDetails} id="competition-details" hidden={!detailsOpen}>
        <h3>Confrontos e horários</h3>
        {matchups.length ? <ul className={styles.matches}>{matchups.map(({ match, home, away }) => <li key={match.id}>{home?.dados.abreviacao || getClubUniform(match.clubeMandanteId).abbreviation} × {away?.dados.abreviacao || getClubUniform(match.clubeVisitanteId).abbreviation} · {formatMatchupDate(match.inicioPrevisto)}</li>)}</ul> : <p>Nenhuma partida informada pela competição.</p>}
        <dl className={styles.competitionMetadata}><dt>Período de inscrição</dt><dd>{formatFantasyDate(competition.inicioInscricao)} – {formatFantasyDate(competition.fimInscricao)} (Brasília)</dd><dt>Bloqueio</dt><dd>{lockTime ? formatFantasyDate(lockTime) + " (Brasília)" : "Horário indisponível"}</dd><dt>Confrontos</dt><dd>{competition.partidas.length} {competition.partidas.length === 1 ? "confronto" : "confrontos"}</dd><dt>Atletas elegíveis</dt><dd>{context.athletes.length} · {context.clubs.length} clubes</dd><dt>Limite de escalações</dt><dd>{lineupLimit ?? "Sem limite definido"}</dd></dl>
      </div>
    </section>
    {blocked && <div className={`${leagueStyles.refreshWarning} ${styles.deadlineNotice}`} role="status">{reason ?? (user?.status !== "ATIVO" ? "Sua conta precisa estar ativa para editar." : "O servidor bloqueou as ações de escrita. A visualização foi preservada.")} O horário do servidor é a referência final.</div>}
    {editor.error && !editor.nameAction && <div className={styles.alert} role="alert">{editor.error}</div>}
    {editor.pendingCreation && !editor.nameAction && <div className={styles.alert}><p>A confirmação está pendente. Consulte seus times e confirme a mesma operação antes de continuar.</p><button type="button" disabled={busy || blocked} onClick={() => void editor.retryCreation()}>Tentar novamente</button></div>}
    {editor.conflict && <div className={styles.alert}><p>Suas alterações locais foram preservadas. Recarregue a versão atual para continuar; o descarte exige confirmação.</p><button type="button" disabled={busy} onClick={() => void editor.reload()}>Recarregar versão atual</button></div>}
    {editor.notice && <p role="status" className={styles.notice}>{editor.notice}</p>}
    {integrated && <>
      <CompetitionTabs tab={tab} onChange={setTab} />
      <section role="tabpanel" id="journey-panel" aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}>
      {tab === "Ranking" ? <CompetitionRanking competitionId={competitionId}/> : tab === "Premiação" ? <p className={styles.note}>Funcionalidade disponível em breve.</p> : !editing ? <>
        <div className={styles.myTeamsToolbar}><h2>Meus times</h2><button className={leagueStyles.participationCta} type="button" disabled={writeDisabled || atLineupLimit} onClick={() => { if (editor.newDraft()) setEditing(true); }}>+ Novo time</button></div>
        {!editor.drafts.length ? <div className={styles.empty}><p>A rodada está chegando! Seu próximo craque pode estar entre os menos badalados. Monte sua seleção, aposte na estratégia e entre na disputa!</p><button className={styles.primary} disabled={writeDisabled || atLineupLimit} onClick={() => setEditing(true)}>⚽ Bora escalar!</button></div> : <>
          <ul className={`${leagueStyles.entries} ${styles.myTeams}`}>{editor.drafts.map(team => {
            const teamName = team.nomePublico ?? `Time #${team.id}`;
            return <li key={team.id} className={`${leagueStyles.entry} ${styles.myTeamEntry}`}>
              <span className={styles.myTeamCrest}><TeamCrest team={team}/></span>
              <div className={`${leagueStyles.teamName} ${styles.myTeamIdentity}`}><strong title={teamName}>{teamName}</strong><small>{team.formacao}<span className={`${leagueStyles.participationStatus} ${styles.teamStatus}`}>{team.status === "INSCRITA" ? "Inscrito" : "Em montagem"}</span></small></div>
              <div className={`${leagueStyles.secondaryActions} ${styles.myTeamActions}`}>
                <button type="button" disabled={busy} onClick={() => { void editor.openDraft(team.id).then(opened => { if (opened) setEditing(true); }); }}>{blocked ? "Visualizar" : "Editar"}</button>
                {team.status === "RASCUNHO" && editor.identityState?.estadoIdentidade === "DEFINIDA" && <button type="button" disabled={writeDisabled || editor.integratedPending || atLineupLimit} onClick={() => void editor.duplicateListed(team)}>Duplicar</button>}
              </div>
            </li>;
          })}</ul>
        </>}
      </> : <button type="button" disabled={busy || editor.pendingCreation || editor.integratedPending} onClick={() => { if (editor.newDraft()) setEditing(false); }}>← Meus times</button>}
      </section>
    </>}
    {(!integrated || (editing && tab === "Meus times")) && <>
    {integrated && <div className={styles.teamHeading}><TeamCrest team={saved}/>{!saved && editor.identityState?.estadoIdentidade !== "DEFINIDA" ? <div><label>Nome do time<input aria-label="Nome do time" value={editor.teamName} disabled={busy || editor.pendingCreation} maxLength={60} onChange={e => editor.setTeamName(e.target.value)}/></label><button disabled={busy || editor.pendingCreation} onClick={() => { const names = ["Tropa do Mago", "Seleção Dourada", "Craques do Point"]; editor.setTeamName(names[(names.indexOf(editor.teamName) + 1) % names.length]); }}>Outra sugestão</button><p className={styles.note}>O nome-base será definido no primeiro salvamento.</p></div> : <strong>{saved?.nomePublico ?? editor.identityState?.identidade?.nomeBase}</strong>}</div>}
    <div className={styles.lineupControls}>
      {showNavigation && <LineupTeamNavigation publicLabels={integrated} drafts={editor.drafts} currentId={saved?.id ?? null} readOnly={registered && !integrated} busy={busy || editor.pendingCreation || editor.registrationLocked || editor.integratedPending} canCreate={!writeDisabled && !atLineupLimit} canDuplicate={!disabled && saved?.status === "RASCUNHO" && !dirty && !atLineupLimit} dirty={dirty} limit={lineupLimit} onOpen={id => void editor.openDraft(id)} onNew={editor.newDraft} onDuplicate={() => void editor.duplicate()} canDelete={!disabled && saved?.status === "RASCUNHO"} onDelete={integrated ? undefined : () => void editor.remove()} />}
      {atLineupLimit && <p role="status" className={styles.limitNotice}>Limite de times da competição atingido ({editor.drafts.length}/{lineupLimit}).</p>}
      {!integrated && <FreeRegistrationPanel context={context} lineups={editor.drafts} selected={editor.registrationIds} currentId={saved?.id ?? null} dirty={dirty} disabled={editor.serverBlocked || user?.status !== "ATIVO" || editor.pendingCreation || ((blocked || editor.conflict) && !editor.registrationRetry)} busy={busy} locked={editor.registrationLocked} refreshRequired={editor.registrationRefreshRequired} retry={editor.registrationRetry} error={editor.registrationReview ? "" : editor.registrationError} now={now} onToggle={editor.toggleRegistration} onReview={editor.reviewRegistration} />}
      <div className={styles.toolbar}>
        <label>Formação<select aria-label="Formação tática" value={value.formacao} disabled={disabled} onChange={e => { editor.setSlot(null); editor.setValue({ ...value, formacao:e.target.value as Formation }); }}>{Object.keys(formationCounts).map(f => <option key={f}>{f}</option>)}</select></label>
        <strong className={styles.rosterValue}>PC$ {lineupValue(value, context.athletes)}</strong>
        <span className={styles.draftStatus} role="status">{busy ? "Atualizando…" : registered ? "Inscrita" : dirty ? "Alterações não salvas" : saved ? (integrated ? "Em montagem" : "Rascunho salvo") : (integrated ? "Novo time" : "Novo rascunho")}</span>
      </div>
    </div>
    <div className={styles.workspace}><div><LineupPitch value={value} athletes={context.athletes} clubs={context.clubs} placements={editor.slotPlacements} disabled={disabled} onOpen={editor.openSlot} onRemove={slot => editor.setValue(replaceSlot(value, context.athletes, slot, null, editor.slotPlacements))} onCaptain={id => editor.setValue({ ...value, capitaoAtletaId:id })} onPowerReserve={id => editor.setValue({ ...value, reservaMagoAtletaId:id })} />
      {integrated && <button className={styles.primary} style={{width:"100%", marginTop:16}} disabled={writeDisabled || (registered && context.competition.tipoAcesso !== "FREE") || warnings.length > 0} onClick={() => void editor.save()}>{busy ? "Salvando…" : "Salvar time"}</button>}</div>
      <aside className={styles.summary} aria-label="Resumo da escalação">
        <h3>{registered ? `Inscrita · ${saved.nomePublico ?? `Time #${saved.id}`}` : saved ? `${integrated ? "Time" : "Rascunho"} #${saved.id} · v${saved.versao}` : integrated ? "Novo time" : "Novo rascunho"}</h3>
        <p className={styles.note}>Titulares: {value.titulares.length}/11 · Técnico: {value.tecnico === null ? "pendente" : "selecionado"} · Reservas: {value.reservas.length}/5</p>
        <dl className={styles.roleSummary}><dt>Capitão</dt><dd aria-label="Capitão escolhido">{byId.get(value.capitaoAtletaId ?? -1)?.apelido ?? "Não definido"}</dd><dt>Reserva Power</dt><dd aria-label="Reserva Power escolhido">{byId.get(value.reservaMagoAtletaId ?? -1)?.apelido ?? "Não definido"}</dd></dl>
        {!registered && <p className={styles.note}>Toque em um titular para definir o capitão ou em um reserva para ativar o Reserva Power.</p>}
        {warnings.length > 0 && <div className={styles.alert}><strong>Ajustes antes de salvar</strong><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul><p>A formação mudou sem remover atletas. Use os controles de remoção para ajustar os excedentes.</p></div>}
        {registered ? <p className={styles.notice}>Inscrita{saved.confirmadaEm ? ` em ${formatFantasyDate(saved.confirmadaEm)} (Brasília)` : ""}</p> : dirty || !saved ? <p className={styles.note}>Pendências serão conferidas ao salvar.</p> : saved.validacao.completa ? <p className={styles.notice}>{integrated ? "Elenco completo. Em montagem." : "Escalação completa — rascunho salvo"}</p> : <div><h4>Pendências do time salvo</h4><ul className={styles.pending}>{saved.validacao.pendencias.map((p, i) => <li key={i}>{friendlyPending(p)}</li>)}</ul></div>}
        {!integrated && !registered && <p className={styles.note}>Salvar rascunho não confirma inscrição.</p>}
      </aside>
    </div>
    {!integrated && !registered && <div className={styles.saveActions}>
      <button className={styles.primary} type="button" disabled={disabled || warnings.length > 0 || (!!saved && !dirty)} onClick={() => void editor.save()}>{busy ? "Salvando…" : "Salvar rascunho"}</button>
    </div>}
    </>}
    {editor.registrationReview && <FreeRegistrationDialog competitionName={editor.registrationCompetitionName} teams={editor.registrationTeams} busy={busy} retry={editor.registrationRetry} uncertain={editor.registrationLocked} disabled={editor.serverBlocked || user?.status !== "ATIVO" || (blocked && !editor.registrationRetry)} error={editor.registrationError} onClose={editor.closeRegistration} onConfirm={() => void editor.confirmRegistration()} />}
    {editor.nameAction && <FirstLineupSaveDialog busy={busy} pending={editor.pendingCreation} conflict={editor.conflict} error={editor.error} onCancel={editor.cancelName} onSave={name => void editor.confirmName(name)} onRetry={() => void editor.retryCreation()} />}
    {editor.slot && !disabled && <LineupAthletePicker context={context} value={value} slot={editor.slot} mode={editor.slot.mode} filters={editor.pickerFilters} onFiltersChange={editor.setPickerFilters} onClose={() => editor.setSlot(null)} onSelect={athlete => editor.selectAthlete(athlete.id)} onSell={athlete => editor.sellAthlete(athlete.id)} />}
  </div>;
}
