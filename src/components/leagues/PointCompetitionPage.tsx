"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Clock3, Crown, Download, Gift, Home, Loader2, Plus, RefreshCw, Search, Shield, Trophy, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog } from "@/components/ui/Dialog";
import { TeamOwnershipNotice } from "@/components/teams/TeamOwnershipNotice";
import { normalizeImportIds } from "@/components/teams/teamImport";
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
function Entries({ entries, ownIds = new Set<number>(), ranking = false }: { entries: (Entry | RankingEntry)[]; ownIds?: Set<number>; ranking?: boolean }) {
  if (!entries.length) return <p className={styles.empty}>{ranking ? "Nenhum time inscrito nesta competição." : "Nenhum time encontrado."}</p>;
  return <div className={styles.entries}>{entries.map((entry) => { const own = ownIds.has(entry.id) || ("inscricaoId" in entry && ownIds.has(entry.inscricaoId)); return <article className={`${styles.entry} ${own ? styles.own : ""}`} key={entry.id ?? (entry as RankingEntry).inscricaoId}><strong className={styles.position}>{position(entry.posicao)}</strong>{entry.escudoUrl ? <img src={entry.escudoUrl} alt="" /> : <span className={styles.shieldPlaceholder}><Shield size={19} aria-hidden="true" /></span>}<div className={styles.teamName}><strong>{entry.nomeTime}{own && <span className={styles.ownBadge}>Seu time</span>}</strong>{ranking && "capitao" in entry && entry.capitao && <span className={styles.captain}><b>C</b>{entry.capitao.apelido}</span>}<small>{entry.nomeCartoleiro ?? "Cartoleiro não informado"}</small></div><span className={styles.score}>{entry.pontuacao === null ? ranking ? "—" : "Sem pontuação" : `${score(entry.pontuacao)} pts`}</span></article>; })}</div>;
}
export function PointCompetitionPage({ id }: { id: number }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<CompetitionSummary | null>(null), [tab, setTab] = useState<Tab>("Visão geral");
  const [entries, setEntries] = useState<Entry[]>([]), [ranking, setRanking] = useState<RankingEntry[]>([]), [teams, setTeams] = useState<CartolaTeam[]>([]);
  const [loading, setLoading] = useState(true), [sectionLoading, setSectionLoading] = useState(false), [modal, setModal] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [sectionError, setSectionError] = useState(""), [feedback, setFeedback] = useState(""), [selected, setSelected] = useState<Set<number>>(new Set());
  const [ownershipAccepted, setOwnershipAccepted] = useState(false), [importing, setImporting] = useState(false), [importText, setImportText] = useState(""), [importPreview, setImportPreview] = useState<CartolaTeam[] | null>(null), [importNotFound, setImportNotFound] = useState<number[]>([]), [importRetry, setImportRetry] = useState<number[]>([]);
  const running = useRef(false);
  const loadSummary = useCallback(async () => setSummary(await pointLeagueService.summary(id, isAuthenticated)), [id, isAuthenticated]);
  useEffect(() => { if (authLoading) return; let active = true; setLoading(true); setError(""); pointLeagueService.summary(id, isAuthenticated).then((data) => { if (active) setSummary(data); }).catch((e) => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, isAuthenticated, authLoading]);
  const loadTab = useCallback(async (current: Tab) => { setSectionLoading(true); setSectionError(""); try { if (current === "Meus times" && isAuthenticated) setEntries(await pointLeagueService.myEntries(id)); if (current === "Ranking") setRanking((await pointLeagueService.ranking(id)).ranking); } catch (e) { setSectionError(message(e)); } finally { setSectionLoading(false); } }, [id, isAuthenticated]);
  useEffect(() => { if (!summary) return; void loadTab(tab); }, [tab, summary, loadTab]);
  const resetEnrollmentModal = () => { setSelected(new Set()); setOwnershipAccepted(false); setImporting(false); setImportText(""); setImportPreview(null); setImportNotFound([]); setImportRetry([]); };
  const competition = summary?.competicao;
  const refreshTeams = async () => setTeams(await teamService.buscarMeusTimes());
  const openModal = async () => { if (!isAuthenticated) { router.push(`/login?next=${encodeURIComponent(`/competicoes?id=${id}`)}`); return; } if (!summary?.usuario?.podeInscrever) return; resetEnrollmentModal(); setModal(true); setSectionError(""); try { await refreshTeams(); } catch (e) { setSectionError(message(e)); } };
  const registeredIds = new Set(summary?.minhasInscricoes?.map((entry) => entry.timeIdCartola).filter((value): value is number => value !== undefined) ?? []);
  const userLimit = summary?.usuario?.limiteTimesUsuario ?? competition?.limiteTimesUsuario ?? null;
  const remaining = userLimit === null ? Number.POSITIVE_INFINITY : Math.max(0, userLimit - (summary?.usuario?.quantidadeTimesInscritos ?? 0));
  const toggleTeam = (timeId: number) => setSelected((current) => { const next = new Set(current); if (next.has(timeId)) next.delete(timeId); else if (next.size < remaining && !registeredIds.has(timeId)) next.add(timeId); return next; });
  const findImport = async () => { const ids = normalizeImportIds(importText); if (running.current || !ids) return; running.current = true; setBusy(true); setSectionError(""); try { const result = await teamService.buscarTimesPorIds(ids); setImportPreview(result.times); setImportNotFound(result.naoEncontrados); setImportRetry(result.tentarNovamente); } catch (e) { setSectionError(message(e)); } finally { running.current = false; setBusy(false); } };
  const importTeams = async () => { if (running.current || !ownershipAccepted || !importPreview?.length) return; running.current = true; setBusy(true); setSectionError(""); try { await teamService.importarMeusTimes(importPreview); await refreshTeams(); setImporting(false); setImportText(""); setImportPreview(null); setOwnershipAccepted(false); setFeedback("Times adicionados aos Meus Times. Selecione-os para inscrever."); } catch (e) { setSectionError(message(e)); } finally { running.current = false; setBusy(false); } };
  const enroll = async () => { if (running.current || busy || !ownershipAccepted || !selected.size || selected.size > remaining || !summary?.usuario?.podeInscrever) return; running.current = true; setBusy(true); setSectionError(""); const ids = [...selected]; try { const results = await Promise.allSettled(ids.map((teamId) => pointLeagueService.enroll(id, teamId))); const successes = results.filter((result) => result.status === "fulfilled").length; const failures = results.length - successes; setFeedback(`${successes} ${successes === 1 ? "time inscrito" : "times inscritos"} com sucesso.${failures ? ` ${failures} ${failures === 1 ? "time não pôde" : "times não puderam"} ser inscrito${failures === 1 ? "" : "s"}.` : ""}`); await loadSummary(); await refreshTeams(); if (!failures) { setModal(false); resetEnrollmentModal(); } else { setSelected(new Set()); setOwnershipAccepted(false); } if (tab === "Meus times" || tab === "Ranking") await loadTab(tab); } catch (e) { setSectionError(message(e)); } finally { running.current = false; setBusy(false); } };
  const ownIds = new Set(summary?.minhasInscricoes?.map((item) => item.id) ?? []);
  const roundLabel = competition?.rodadaInicio === null ? null : competition?.rodadaFim && competition.rodadaFim !== competition.rodadaInicio ? `${competition.rodadaInicio}–${competition.rodadaFim}` : competition?.rodadaInicio;
  const heroName = competition && roundLabel !== null && roundLabel !== undefined && competition.nome === `${summary?.liga.nome} - Rodada ${roundLabel}` ? summary!.liga.nome : competition?.nome;
  const enrolled = summary?.usuario?.quantidadeTimesInscritos ?? 0;
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
        {feedback && <p role="status" className={styles.success}>{feedback}</p>}
        <nav className={styles.tabs} aria-label="Seções da competição">{tabs.map((item) => { const Icon = tabIcons[item]; return <button type="button" key={item} className={tab === item ? styles.active : ""} onClick={() => setTab(item)}><Icon size={15} aria-hidden="true" />{item}</button>; })}</nav>
        {tab === "Visão geral" && <div className={styles.overview}>
          <section className={styles.panel}><div className={styles.panelTitle}><Crown aria-hidden="true" /><h2>Sua participação</h2></div>
            {isAuthenticated && enrolled > 0 ? <>
              <strong className={styles.participationCount}>{enrolled} {enrolled === 1 ? "time inscrito" : "times inscritos"}</strong>
              <div className={styles.participationStats}><div><small>Melhor posição</small><strong>{summary.usuario?.melhorPosicaoUsuario === null || summary.usuario?.melhorPosicaoUsuario === undefined ? "—" : position(summary.usuario.melhorPosicaoUsuario)}</strong></div><div><small>Melhor pontuação</small><strong>{summary.usuario?.melhorPontuacaoUsuario === null || summary.usuario?.melhorPontuacaoUsuario === undefined ? "—" : `${score(summary.usuario.melhorPontuacaoUsuario)} pts`}</strong></div></div>
              <div className={styles.secondaryActions}>{canEnroll && <button type="button" onClick={() => void openModal()}><Plus size={14} aria-hidden="true" />Inscrever mais times</button>}<button type="button" onClick={() => setTab("Meus times")}>Ver meus times</button><button type="button" onClick={() => setTab("Ranking")}>Ver ranking</button></div>
            </> : <>
              <button className={styles.participationCta} type="button" onClick={() => void openModal()} disabled={!canEnroll}><Plus size={16} aria-hidden="true" />{isAuthenticated ? "Inscrever meu time" : "Entrar para inscrever time"}<ArrowRight size={16} aria-hidden="true" /></button>
              {blockReason && <p className={styles.notice}>{blockReason}</p>}
            </>}
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
            <button type="button" className={styles.backToTeams} onClick={() => { setImporting(false); setImportPreview(null); setOwnershipAccepted(false); }} disabled={busy}>← Meus times</button>
            <p className={styles.modalHelper}>Informe um ou vários IDs do Cartola. Importar adiciona aos Meus Times, mas não inscreve na competição.</p>
            {!importPreview ? <textarea aria-label="IDs dos times" className={styles.importInput} value={importText} disabled={busy} onChange={(event) => setImportText(event.target.value)} placeholder="44566162;30157334;13933388" /> : <div className={styles.importPreview}><strong>{importPreview.length} {importPreview.length === 1 ? "time encontrado" : "times encontrados"}</strong>{importPreview.map((team) => <div key={team.timeId}>{team.escudoUrl && <img src={team.escudoUrl} alt="" />}<span><b>{team.nome}</b><small>{team.nomeCartoleiro} · ID {team.timeId}</small></span><Check aria-hidden="true" /></div>)}</div>}
            {importNotFound.length > 0 && <p className={styles.importWarning}>Não encontrados: {importNotFound.join("; ")}</p>}
            {importRetry.length > 0 && <p className={styles.importWarning}>Tente novamente: {importRetry.join("; ")}</p>}
            {importPreview && <TeamOwnershipNotice plural={importPreview.length > 1} checked={ownershipAccepted} disabled={busy} onChange={setOwnershipAccepted} />}
            {sectionError && <p role="alert" className={styles.inlineError}>{sectionError}</p>}
            <div className={styles.actions}><button type="button" onClick={() => setImporting(false)} disabled={busy}>Cancelar</button>{!importPreview ? <button type="button" className={styles.primary} onClick={() => void findImport()} disabled={busy || !normalizeImportIds(importText)}>{busy ? <Loader2 className={styles.spin} /> : <Search />}Buscar times</button> : <button type="button" className={styles.primary} onClick={() => void importTeams()} disabled={busy || !ownershipAccepted || !importPreview.length}>{busy ? <Loader2 className={styles.spin} /> : <Download />}Importar times</button>}</div>
          </> : <>
            <div className={styles.modalLead}><div><strong>Meus times</strong><small>{Number.isFinite(remaining) ? `${remaining} ${remaining === 1 ? "vaga restante" : "vagas restantes"}` : "Sem limite de times"}</small></div><button type="button" onClick={() => { setImporting(true); setOwnershipAccepted(false); setSectionError(""); }} disabled={busy}><Download size={15} />Importar times</button></div>
            {teams.length ? <div className={styles.choices}>{teams.map((team) => { const registered = registeredIds.has(team.timeId); const limitReached = !selected.has(team.timeId) && selected.size >= remaining; return <label key={team.timeId} className={registered ? styles.registered : ""}><input type="checkbox" checked={selected.has(team.timeId)} onChange={() => toggleTeam(team.timeId)} disabled={busy || registered || limitReached} aria-label={registered ? `${team.nome}: Já inscrito` : `Selecionar ${team.nome}`} />{team.escudoUrl && <img src={team.escudoUrl} alt="" />}<span><strong>{team.nome}</strong><small>{registered ? "Já inscrito" : team.nomeCartoleiro}</small></span></label>; })}</div> : <p>Nenhum time vinculado. Importe seus times do Cartola para continuar.</p>}
            <p className={styles.selectionCount}>{selected.size} {selected.size === 1 ? "time selecionado" : "times selecionados"}</p>
            <TeamOwnershipNotice plural={selected.size !== 1} checked={ownershipAccepted} disabled={busy} onChange={setOwnershipAccepted} />
            {sectionError && <p role="alert" className={styles.inlineError}>{sectionError}</p>}
            <div className={styles.actions}><button type="button" onClick={() => { setModal(false); resetEnrollmentModal(); }} disabled={busy}>Cancelar</button><button type="button" className={styles.primary} disabled={busy || !selected.size || selected.size > remaining || !ownershipAccepted} onClick={() => void enroll()}>{busy ? <><Loader2 className={styles.spin} />Inscrevendo...</> : selected.size === 1 ? "Inscrever time" : `Inscrever ${selected.size} times`}</button></div>
          </>}
        </Dialog>}
      </>}
  </main>;
}
