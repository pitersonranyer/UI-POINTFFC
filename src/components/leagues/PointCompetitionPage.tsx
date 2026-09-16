"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, Download, Gift, Home, Loader2, Plus, RefreshCw, Search, Shield, Trophy, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CartolaMarketStatus } from "@/components/dashboard/CartolaMarketStatus";
import { Dialog } from "@/components/ui/Dialog";
import { normalizeImportIds } from "@/components/teams/teamImport";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { ApiError } from "@/services/apiClient";
import { teamService } from "@/services/teamService";
import type { CartolaTeam } from "@/types/team";
import { blockMessages, pointLeagueService, type CompetitionSummary, type Entry, type RankingEntry } from "@/services/pointLeagueService";
import styles from "./PointCompetition.module.css";

type Tab = "Visão geral" | "Meus times" | "Ranking" | "Premiações";
const tabs: Tab[] = ["Visão geral", "Meus times", "Ranking", "Premiações"];
const tabIcons = { "Visão geral": Home, "Meus times": Shield, Ranking: Trophy, Premiações: Gift };
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const access = (kind: string, amount: number) => kind === "FREE" ? "Grátis" : kind === "PAGO" ? amount > 0 ? money(amount) : "Pago" : kind;
const date = (value: string | null) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Não informado";
const score = (value: number | null) => value === null ? "Sem pontuação" : value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const position = (value: number | null) => value === null ? "—" : `${value}º`;
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível carregar os dados.";
type EnrollmentFailure = { timeId: number; name: string; status: number; message: string; retryable: boolean };
function enrollmentFailure(error: unknown, timeId: number, name: string): EnrollmentFailure {
  const status = error instanceof ApiError ? error.status : 0;
  const raw = error instanceof Error ? error.message : "";
  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  if (status === 409 && normalized.includes("ja esta inscrito")) return { timeId, name, status, message: "Já inscrito", retryable: false };
  if (status === 409 && normalized.includes("limite")) return { timeId, name, status, message: "Limite de inscrições atingido", retryable: false };
  if (status === 409) return { timeId, name, status, message: "Inscrição indisponível para este time", retryable: false };
  if (status === 404) return { timeId, name, status, message: "Time não está vinculado à sua conta", retryable: false };
  return { timeId, name, status, message: "Não foi possível concluir a inscrição", retryable: status === 0 || status >= 500 };
}
function Entries({ entries, ownIds = new Set<number>(), ranking = false }: { entries: (Entry | RankingEntry)[]; ownIds?: Set<number>; ranking?: boolean }) {
  if (!entries.length) return <p className={styles.empty}>{ranking ? "Nenhum time inscrito nesta competição." : "Nenhum time encontrado."}</p>;
  return <div className={styles.entries}>{entries.map((entry) => { const own = ownIds.has(entry.id) || ("inscricaoId" in entry && ownIds.has(entry.inscricaoId)); return <article className={`${styles.entry} ${own ? styles.own : ""}`} key={entry.id ?? (entry as RankingEntry).inscricaoId}><strong className={styles.position}>{position(entry.posicao)}</strong>{entry.escudoUrl ? <img src={entry.escudoUrl} alt="" /> : <span className={styles.shieldPlaceholder}><Shield size={19} aria-hidden="true" /></span>}<div className={styles.teamName}><strong>{entry.nomeTime}{own && <span className={styles.ownBadge}>Seu time</span>}</strong>{ranking && "capitao" in entry && entry.capitao && <span className={styles.captain}><b>C</b>{entry.capitao.apelido}</span>}<small>{entry.nomeCartoleiro ?? "Cartoleiro não informado"}</small></div><span className={styles.score}>{entry.pontuacao === null ? ranking ? "—" : "Sem pontuação" : `${score(entry.pontuacao)} pts`}</span></article>; })}</div>;
}
export function PointCompetitionPage({ id }: { id: number }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { dashboard, loading: marketLoading, error: marketError, atualizar: refreshMarket } = useCartolaDashboard();
  const [summary, setSummary] = useState<CompetitionSummary | null>(null), [tab, setTab] = useState<Tab>("Visão geral");
  const [entries, setEntries] = useState<Entry[]>([]), [ranking, setRanking] = useState<RankingEntry[]>([]), [teams, setTeams] = useState<CartolaTeam[]>([]);
  const [loading, setLoading] = useState(true), [sectionLoading, setSectionLoading] = useState(false), [modal, setModal] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [sectionError, setSectionError] = useState(""), [feedback, setFeedback] = useState(""), [selected, setSelected] = useState<Set<number>>(new Set()), [teamQuery, setTeamQuery] = useState("");
  const [importing, setImporting] = useState(false), [importText, setImportText] = useState(""), [importFeedback, setImportFeedback] = useState("");
  const [enrollmentFailures, setEnrollmentFailures] = useState<EnrollmentFailure[]>([]), [progress, setProgress] = useState<{ current: number; total: number } | null>(null), [refreshWarning, setRefreshWarning] = useState("");
  const running = useRef(false);
  const loadSummary = useCallback(async () => setSummary(await pointLeagueService.summary(id, isAuthenticated)), [id, isAuthenticated]);
  useEffect(() => { if (authLoading) return; let active = true; setLoading(true); setError(""); pointLeagueService.summary(id, isAuthenticated).then((data) => { if (active) setSummary(data); }).catch((e) => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, isAuthenticated, authLoading]);
  const loadTab = useCallback(async (current: Tab) => { setSectionLoading(true); setSectionError(""); try { if (current === "Meus times" && isAuthenticated) setEntries(await pointLeagueService.myEntries(id)); if (current === "Ranking") setRanking((await pointLeagueService.ranking(id)).ranking); } catch (e) { setSectionError(message(e)); } finally { setSectionLoading(false); } }, [id, isAuthenticated]);
  useEffect(() => { if (!summary) return; void loadTab(tab); }, [tab, summary, loadTab]);
  const resetEnrollmentModal = () => { setSelected(new Set()); setTeamQuery(""); setImporting(false); setImportText(""); setImportFeedback(""); setEnrollmentFailures([]); setProgress(null); };
  const competition = summary?.competicao;
  const entryValue = competition?.valorInscricao ?? 0;
  const enrollmentTotal = selected.size * entryValue;
  const refreshTeams = async () => setTeams(await teamService.buscarMeusTimes());
  const openModal = async () => { if (!isAuthenticated) { router.push(`/login?next=${encodeURIComponent(`/competicoes?id=${id}`)}`); return; } if (!summary?.usuario?.podeInscrever) return; resetEnrollmentModal(); setFeedback(""); setRefreshWarning(""); setModal(true); setSectionError(""); try { await refreshTeams(); } catch (e) { setSectionError(message(e)); } };
  const registeredIds = new Set(summary?.minhasInscricoes?.map((entry) => entry.timeIdCartola).filter((value): value is number => value !== undefined) ?? []);
  const userLimit = summary?.usuario?.limiteTimesUsuario ?? competition?.limiteTimesUsuario ?? null;
  const remaining = userLimit === null ? Number.POSITIVE_INFINITY : Math.max(0, userLimit - (summary?.usuario?.quantidadeTimesInscritos ?? 0));
  const normalizedQuery = teamQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredTeams = teams.filter((team) => team.nome.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  const toggleTeam = (timeId: number) => setSelected((current) => { const next = new Set(current); if (next.has(timeId)) next.delete(timeId); else if (next.size < remaining && !registeredIds.has(timeId)) next.add(timeId); return next; });
  const selectAllTeams = () => setSelected((current) => { const next = new Set(current); for (const team of filteredTeams) { if (next.size >= remaining) break; if (!registeredIds.has(team.timeId)) next.add(team.timeId); } return next; });
  const selectImportedIds = () => { const ids = normalizeImportIds(importText).split(";").filter(Boolean).map(Number); if (!ids.length) { setImportFeedback("Informe ao menos um ID válido."); return; } const availableIds = new Set(teams.filter((team) => !registeredIds.has(team.timeId)).map((team) => team.timeId)); const matched = [...new Set(ids)].filter((timeId) => availableIds.has(timeId)); const selectedIds = matched.slice(0, Number.isFinite(remaining) ? remaining : matched.length); const unavailable = ids.filter((timeId) => !availableIds.has(timeId)).length; setSelected(new Set(selectedIds)); setImportFeedback(`${selectedIds.length} ${selectedIds.length === 1 ? "time selecionado" : "times selecionados"}${unavailable ? `. ${unavailable} não encontrado(s) ou indisponível(is) nesta competição.` : ""}${matched.length > selectedIds.length ? ` Limite de ${remaining} aplicado.` : ""}`); if (selectedIds.length) { setTeamQuery(""); setImporting(false); } };
  const enroll = async () => { const eligibleIds = new Set(teams.map((team) => team.timeId)); const ids = [...selected].filter((timeId) => eligibleIds.has(timeId) && !registeredIds.has(timeId)); if (running.current || busy || !ids.length || ids.length !== selected.size || ids.length > remaining || !summary?.usuario?.podeInscrever) return; running.current = true; setBusy(true); setSectionError(""); setRefreshWarning(""); setEnrollmentFailures([]); const names = new Map(teams.map((team) => [team.timeId, team.nome])); const failures: EnrollmentFailure[] = []; let successes = 0; try { for (let index = 0; index < ids.length; index += 1) { const teamId = ids[index]; setProgress({ current: index + 1, total: ids.length }); try { await pointLeagueService.enroll(id, teamId); successes += 1; setSelected((current) => { const next = new Set(current); next.delete(teamId); return next; }); } catch (cause) { failures.push(enrollmentFailure(cause, teamId, names.get(teamId) ?? `Time ${teamId}`)); } } const retryableIds = new Set(failures.filter((failure) => failure.retryable).map((failure) => failure.timeId)); setSelected(retryableIds); setEnrollmentFailures(failures); setFeedback(failures.length === 0 ? `${successes} ${successes === 1 ? "time inscrito" : "times inscritos"} com sucesso.` : successes > 0 ? `${successes} de ${ids.length} times inscritos. ${failures.length} ${failures.length === 1 ? "não pôde" : "não puderam"} ser inscrito${failures.length === 1 ? "" : "s"}.` : "Não foi possível inscrever os times selecionados."); let refreshFailed = false; try { await loadSummary(); } catch { refreshFailed = true; } try { await refreshTeams(); } catch { refreshFailed = true; } if (tab === "Meus times" || tab === "Ranking") { try { await loadTab(tab); } catch { refreshFailed = true; } } if (refreshFailed) setRefreshWarning("Inscrições concluídas, mas não foi possível atualizar os dados da tela."); if (!failures.length) { setModal(false); resetEnrollmentModal(); } } finally { setProgress(null); running.current = false; setBusy(false); } };
  const ownIds = new Set(summary?.minhasInscricoes?.map((item) => item.id) ?? []);
  const roundLabel = competition?.rodadaInicio === null ? null : competition?.rodadaFim && competition.rodadaFim !== competition.rodadaInicio ? `${competition.rodadaInicio}–${competition.rodadaFim}` : competition?.rodadaInicio;
  const heroName = competition && roundLabel !== null && roundLabel !== undefined && competition.nome === `${summary?.liga.nome} - Rodada ${roundLabel}` ? summary!.liga.nome : competition?.nome;
  const canEnroll = !isAuthenticated || Boolean(summary?.usuario?.podeInscrever);
  const blockReason = summary?.usuario && !summary.usuario.podeInscrever ? blockMessages[summary.usuario.motivoBloqueio ?? ""] ?? "Inscrição indisponível no momento." : null;
  const retry = async () => { setLoading(true); setError(""); try { await loadSummary(); } catch (cause) { setError(message(cause)); } finally { setLoading(false); } };
  return <main className={`page-shell ${styles.shell}`}>
    <Link href="/ligas/point-ffc" className={styles.back}>← POINT FFC</Link>
    {loading || authLoading ? <div className={styles.skeleton} role="status" aria-label="Carregando competição"><div className={styles.skeletonHero} /><div className={styles.skeletonTabs} /><div className={styles.skeletonPanel} /></div>
      : error ? <section role="alert" className={styles.error}><Trophy aria-hidden="true" /><div><h1>Não foi possível carregar a competição.</h1><p>{error}</p><button type="button" onClick={() => void retry()}>Tentar novamente</button></div></section>
      : summary && competition && <>
        <header className={styles.competitionHeader}>
          <div className={styles.titleRow}><div><h1>{heroName}</h1><p>{competition.descricao || "Competição oficial da rodada"}</p></div>{roundLabel !== null && roundLabel !== undefined && <span className={styles.roundBadge}>Rodada {roundLabel}</span>}</div>
          <div className={styles.headerMetrics}><div><strong>{access(competition.tipoAcesso, competition.valorInscricao)}</strong><small>Entrada</small></div><div><strong>{summary.inscritos.quantidade}</strong><small>Inscritos</small></div><div><strong>{competition.limiteTimesUsuario === null ? "Sem limite" : `Até ${competition.limiteTimesUsuario}`}</strong><small>Times por usuário</small></div></div>
        </header>
        {feedback && !modal && <p role="status" className={styles.success}>{feedback}</p>}
        {refreshWarning && <p role="alert" className={styles.refreshWarning}>{refreshWarning}</p>}
        <nav className={styles.tabs} aria-label="Seções da competição">{tabs.map((item) => { const Icon = tabIcons[item]; return <button type="button" key={item} className={tab === item ? styles.active : ""} onClick={() => setTab(item)}><Icon size={15} aria-hidden="true" />{item}</button>; })}</nav>
        {tab === "Visão geral" && <div className={styles.overview}>
          <section className={styles.marketEnrollment}>
            {dashboard ? <CartolaMarketStatus mercado={dashboard.mercado} aberto={dashboard.mercadoAberto} aoVivo={dashboard.bolaRolando} atualizar={refreshMarket} />
              : marketLoading ? <div className={styles.marketPlaceholder} role="status">Carregando mercado...</div>
                : <div className={styles.marketPlaceholder} role="alert">{marketError || "Não foi possível carregar o mercado."}</div>}
            <button className={styles.enrollmentCta} type="button" onClick={() => void openModal()} disabled={!canEnroll}><Plus size={18} aria-hidden="true" />Inscreva seu time<ArrowRight size={18} aria-hidden="true" /></button>
            {blockReason && <p className={styles.notice}>{blockReason}</p>}
          </section>
          <section className={styles.panel}><div className={styles.panelTitle}><Shield aria-hidden="true" /><h2>Sobre a competição</h2></div>
            <div className={styles.aboutList}>
              <div><Clock3 aria-hidden="true" /><span><small>Período de inscrições</small><strong>{competition.inicioInscricao || competition.fimInscricao ? `${date(competition.inicioInscricao)} — ${date(competition.fimInscricao)}` : "Não informado"}</strong></span></div>
              <div><CalendarDays aria-hidden="true" /><span><small>Período da competição</small><strong>{roundLabel !== null && roundLabel !== undefined ? `Rodada ${roundLabel}` : "Não informado"}</strong></span></div>
              <div><Trophy aria-hidden="true" /><span><small>Formato</small><strong>Rodada</strong></span></div>
              <div><Users aria-hidden="true" /><span><small>Limite de times por usuário</small><strong>{competition.limiteTimesUsuario === null ? "Sem limite" : `${competition.limiteTimesUsuario} times`}</strong></span></div>
              <div><Gift aria-hidden="true" /><span><small>Premiação</small><strong>Consulte a aba Premiações</strong></span></div>
            </div>
          </section>
        </div>}
        {tab === "Premiações" && <section className={styles.panel}><div className={styles.panelTitle}><Gift aria-hidden="true" /><h2>Premiações</h2></div>{summary.premiacao.length ? <div className={styles.prizeList}>{summary.premiacao.map((prize) => <p key={prize.ordem}>{prize.posicaoInicio}º{prize.posicaoFim !== prize.posicaoInicio && ` a ${prize.posicaoFim}º`} · {prize.tipoPremiacao}{prize.valor !== null && ` · ${prize.valor.toLocaleString("pt-BR")}`}{prize.percentual !== null && ` · ${prize.percentual}%`}</p>)}</div> : <div className={styles.prizeEmpty}><Gift aria-hidden="true" /><p>Premiação ainda não definida para esta competição.</p></div>}</section>}
        {tab === "Meus times" && !isAuthenticated ? <section className={styles.panel}><p>Entre para acompanhar seus times inscritos.</p><Link href="/login">Fazer login</Link></section> : null}
        {sectionError && <p role="alert" className={styles.error}>{sectionError}</p>}
        {sectionLoading && ["Meus times", "Ranking"].includes(tab) ? <p role="status" className={styles.sectionLoading}>Carregando...</p> : tab === "Meus times" && isAuthenticated ? <section className={styles.panel}><div className={styles.panelTitle}><Shield aria-hidden="true" /><h2>Meus times</h2></div>{entries.length ? <Entries entries={entries} /> : <p className={styles.empty}>Você ainda não inscreveu times nesta competição.</p>}</section> : tab === "Ranking" ? <section className={styles.panel}><div className={styles.heading}><div><h2>Ranking</h2>{roundLabel !== null && roundLabel !== undefined && <p>Rodada {roundLabel}</p>}</div><button type="button" onClick={() => void loadTab("Ranking")}><RefreshCw size={15} aria-hidden="true" />Atualizar</button></div><Entries entries={ranking} ownIds={ownIds} ranking /></section> : null}
        {modal && <Dialog title="Inscrever times" close={() => { if (!busy) { setModal(false); resetEnrollmentModal(); } }} wide busy={busy}>
          {importing ? <>
            <p className={styles.modalHelper}>Informe IDs para selecionar somente times que já estão vinculados à sua conta.</p>
            <textarea aria-label="IDs dos times" className={styles.importInput} value={importText} disabled={busy} onChange={(event) => { setImportText(event.target.value); setImportFeedback(""); }} placeholder="44566162;30157334;13933388" />
            {importFeedback && <p role="status" className={styles.importWarning}>{importFeedback}</p>}
            {sectionError && <p role="alert" className={styles.inlineError}>{sectionError}</p>}
            <div className={styles.idActions}><button type="button" className={styles.backToTeams} onClick={() => setImporting(false)} disabled={busy}>Voltar</button><button type="button" className={styles.primary} onClick={selectImportedIds} disabled={busy || !normalizeImportIds(importText)}>Selecionar times</button></div>
          </> : <>
            <div className={styles.modalLead}><div><strong>Meus times</strong><small>{Number.isFinite(remaining) ? `${remaining} ${remaining === 1 ? "vaga restante" : "vagas restantes"}` : "Sem limite de times"}</small></div><button type="button" onClick={() => { setImporting(true); setImportFeedback(""); setSectionError(""); }} disabled={busy}><Download size={15} />Selecionar por IDs</button></div>
            {importFeedback && <p role="status" className={styles.importWarning}>{importFeedback}</p>}
            <label className={styles.teamSearch}><Search size={17} aria-hidden="true" /><input type="search" value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} placeholder="Buscar pelo nome do time" aria-label="Buscar pelo nome do time" /></label>
            <div className={styles.selectionTools}><strong>{selected.size} {selected.size === 1 ? "time selecionado" : "times selecionados"}</strong><span><button type="button" onClick={selectAllTeams} disabled={busy || selected.size >= remaining}>Selecionar todos</button><button type="button" onClick={() => setSelected(new Set())} disabled={busy || !selected.size}>Desmarcar todos</button></span></div>
            {teams.length ? <div className={styles.choices}>{filteredTeams.map((team) => { const registered = registeredIds.has(team.timeId); const limitReached = !selected.has(team.timeId) && selected.size >= remaining; return <label key={team.timeId} className={`${registered ? styles.registered : ""} ${selected.has(team.timeId) ? styles.choiceSelected : ""}`}><input type="checkbox" checked={selected.has(team.timeId)} onChange={() => toggleTeam(team.timeId)} disabled={busy || registered || limitReached} aria-label={registered ? `${team.nome}: Já inscrito` : `Selecionar ${team.nome}`} />{team.escudoUrl ? <img src={team.escudoUrl} alt="" /> : <span className={styles.choiceShield}>{team.nome.slice(0, 2).toUpperCase()}</span>}<span><strong>{team.nome}</strong><small>{registered ? "Já inscrito" : team.nomeCartoleiro}</small></span></label>; })}{!filteredTeams.length && <p className={styles.noTeams}>Nenhum time encontrado.</p>}</div> : <p>Nenhum time vinculado. Cadastre seus times em Meus Times para continuar.</p>}
            {feedback && <p role="status" className={styles.batchFeedback}>{feedback}</p>}
            {enrollmentFailures.length > 0 && <ul className={styles.enrollmentFailures}>{enrollmentFailures.map((failure) => <li key={failure.timeId}><strong>{failure.name}</strong><span>{failure.message}</span></li>)}</ul>}
            {sectionError && <p role="alert" className={styles.inlineError}>{sectionError}</p>}
            <div className={styles.enrollmentFooter}><div className={styles.enrollmentSummary}><strong>{selected.size} {selected.size === 1 ? "time selecionado" : "times selecionados"}</strong><small>{Number.isFinite(remaining) ? `${Math.max(0, remaining - selected.size)} ${remaining - selected.size === 1 ? "vaga restante" : "vagas restantes"}` : "Sem limite de vagas"}</small></div><dl className={styles.enrollmentValue}><div><dt>Valor por time</dt><dd>{money(entryValue)}</dd></div><div><dt>Total da inscrição</dt><dd>{money(enrollmentTotal)}</dd></div></dl><button type="button" className={styles.primary} disabled={busy || !selected.size || selected.size > remaining} onClick={() => void enroll()}>{busy && progress ? <><Loader2 className={styles.spin} />Inscrevendo {progress.current} de {progress.total}...</> : <>Confirmar inscrição <span aria-hidden="true">•</span> {money(enrollmentTotal)}</>}</button></div>
          </>}
        </Dialog>}
      </>}
  </main>;
}
