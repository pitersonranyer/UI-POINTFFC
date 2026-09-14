"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, Crown, Gift, Home, Plus, RefreshCw, Shield, Trophy, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog } from "@/components/ui/Dialog";
import { teamService } from "@/services/teamService";
import type { CartolaTeam } from "@/types/team";
import { blockMessages, pointLeagueService, type CompetitionSummary, type Entry, type RankingEntry } from "@/services/pointLeagueService";
import styles from "./PointCompetition.module.css";

type Tab = "Visão geral" | "Meus times" | "Ranking" | "Premiação";
const tabs: Tab[] = ["Visão geral", "Meus times", "Ranking", "Premiação"];
const tabIcons = { "Visão geral": Home, "Meus times": Shield, Ranking: Trophy, "Premiação": Gift };
const statusLabels: Record<string, string> = { RASCUNHO: "Rascunho", INSCRICOES_ABERTAS: "Inscrições abertas", INSCRICOES_ENCERRADAS: "Inscrições encerradas", EM_ANDAMENTO: "Em andamento", ENCERRADA: "Encerrada", CANCELADA: "Cancelada" };
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
  const [entries, setEntries] = useState<Entry[]>([]), [ranking, setRanking] = useState<RankingEntry[]>([]), [rankingLoaded, setRankingLoaded] = useState(false), [teams, setTeams] = useState<CartolaTeam[]>([]);
  const [loading, setLoading] = useState(true), [sectionLoading, setSectionLoading] = useState(false), [modal, setModal] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [sectionError, setSectionError] = useState(""), [feedback, setFeedback] = useState(""), [selected, setSelected] = useState<number | null>(null);
  const loadSummary = useCallback(async () => setSummary(await pointLeagueService.summary(id, isAuthenticated)), [id, isAuthenticated]);
  useEffect(() => { if (authLoading) return; let active = true; setLoading(true); setError(""); pointLeagueService.summary(id, isAuthenticated).then((data) => { if (active) setSummary(data); }).catch((e) => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, isAuthenticated, authLoading]);
  const loadTab = useCallback(async (current: Tab) => { setSectionLoading(true); setSectionError(""); try { if (current === "Meus times" && isAuthenticated) setEntries(await pointLeagueService.myEntries(id)); if (current === "Ranking") { setRanking((await pointLeagueService.ranking(id)).ranking); setRankingLoaded(true); } } catch (e) { setSectionError(message(e)); } finally { setSectionLoading(false); } }, [id, isAuthenticated]);
  useEffect(() => { if (!summary) return; void loadTab(tab); }, [tab, summary, loadTab]);
  const openModal = async () => { if (!isAuthenticated) { router.push(`/login?next=${encodeURIComponent(`/competicoes?id=${id}`)}`); return; } if (!summary?.usuario?.podeInscrever) return; setModal(true); setSectionError(""); try { setTeams(await teamService.buscarMeusTimes()); } catch (e) { setSectionError(message(e)); } };
  const enroll = async () => { if (selected === null || busy || !summary?.usuario?.podeInscrever) return; setBusy(true); setSectionError(""); try { await pointLeagueService.enroll(id, selected); setModal(false); setSelected(null); setFeedback("Time inscrito com sucesso!"); await loadSummary(); if (tab === "Meus times" || tab === "Ranking") await loadTab(tab); } catch (e) { setSectionError(message(e)); } finally { setBusy(false); } };
  const ownIds = new Set(summary?.minhasInscricoes?.map((item) => item.id) ?? []);
const competition = summary?.competicao;
  const statusLabel = competition ? statusLabels[competition.status] ?? competition.status.replaceAll("_", " ").toLowerCase() : "";
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
        <header className={styles.hero}>
          <div className={styles.heroArt} aria-hidden="true"><Trophy /></div>
          <div className={styles.heroContent}>
            <div className={styles.heroTop}><span className={styles.roundBadge}>{roundLabel !== null && roundLabel !== undefined ? `Rodada ${roundLabel}` : "Competição"}</span><span className={`${styles.statusBadge} ${competition.status === "INSCRICOES_ABERTAS" ? styles.statusOpen : ""}`}><i />{statusLabel}</span></div>
            <h1>{heroName}</h1><p className={styles.heroDescription}>{competition.descricao || "Competição oficial da rodada"}</p>
            <div className={styles.heroMetrics}><div><strong>{access(competition.tipoAcesso, competition.valorInscricao)}</strong><small>Entrada</small></div><div><strong>{summary.inscritos.quantidade}</strong><small>Inscritos</small></div>{competition.limiteTimesUsuario !== null && <div><strong>até {competition.limiteTimesUsuario}</strong><small>Times por usuário</small></div>}</div>
            <button className={styles.heroCta} type="button" onClick={() => void openModal()} disabled={!canEnroll}><Plus size={18} aria-hidden="true" />{isAuthenticated ? "Inscrever meu time" : "Entre para inscrever time"}<ArrowRight size={18} aria-hidden="true" /></button>
            {blockReason && <p className={styles.heroNotice}>{blockReason}</p>}
          </div>
        </header>
        {feedback && <p role="status" className={styles.success}>{feedback}</p>}
        <nav className={styles.tabs} aria-label="Seções da competição">{tabs.map((item) => { const Icon = tabIcons[item]; return <button type="button" key={item} className={tab === item ? styles.active : ""} onClick={() => setTab(item)}><Icon size={15} aria-hidden="true" />{item}</button>; })}</nav>
        {tab === "Visão geral" && <div className={styles.overview}>
          <section className={styles.panel}><div className={styles.panelTitle}><Crown aria-hidden="true" /><h2>Sua participação</h2></div>
            {isAuthenticated && enrolled > 0 ? <>
              <strong className={styles.participationCount}>{enrolled} {enrolled === 1 ? "time inscrito" : "times inscritos"}</strong>
              <div className={styles.participationStats}><div><small>Melhor posição</small><strong>{summary.usuario?.melhorPosicaoUsuario === null || summary.usuario?.melhorPosicaoUsuario === undefined ? "—" : position(summary.usuario.melhorPosicaoUsuario)}</strong></div><div><small>Melhor pontuação</small><strong>{summary.usuario?.melhorPontuacaoUsuario === null || summary.usuario?.melhorPontuacaoUsuario === undefined ? "—" : `${score(summary.usuario.melhorPontuacaoUsuario)} pts`}</strong></div></div>
              <div className={styles.secondaryActions}><button type="button" onClick={() => setTab("Meus times")}>Ver meus times</button><button type="button" onClick={() => setTab("Ranking")}>Ver ranking</button></div>
            </> : <>
              <span className={styles.participationStatus}>{isAuthenticated ? "Ainda não inscrito" : "Entre para participar"}</span>
              <h3>{isAuthenticated ? "Você ainda não está participando." : "Acompanhe seus times nesta competição."}</h3>
              <p>{isAuthenticated ? "Escolha um dos seus times e entre na disputa!" : "Faça login para inscrever um time e acompanhar sua posição."}</p>
              <button className={styles.participationCta} type="button" onClick={() => void openModal()} disabled={!canEnroll}><Plus size={16} aria-hidden="true" />{isAuthenticated ? "Inscrever meu time" : "Entre para inscrever time"}<ArrowRight size={16} aria-hidden="true" /></button>
              {blockReason && <p className={styles.notice}>{blockReason}</p>}
            </>}
          </section>
          <section className={styles.panel}><div className={styles.panelTitle}><Shield aria-hidden="true" /><h2>Sobre a competição</h2></div>
            <div className={styles.aboutGrid}>
              {roundLabel !== null && roundLabel !== undefined && <div><CalendarDays aria-hidden="true" /><span><small>Rodada</small><strong>{roundLabel}</strong></span></div>}
              {competition.fimInscricao && <div><Clock3 aria-hidden="true" /><span><small>Inscrições até</small><strong>{date(competition.fimInscricao)}</strong></span></div>}
              <div><Trophy aria-hidden="true" /><span><small>Entrada</small><strong>{access(competition.tipoAcesso, competition.valorInscricao)}</strong></span></div>
              {competition.limiteTimesUsuario !== null && <div><Users aria-hidden="true" /><span><small>Limite por usuário</small><strong>{competition.limiteTimesUsuario} times</strong></span></div>}
            </div>
          </section>
          <section className={styles.rankingPreview}><div className={styles.heading}><div><h2>Classificação parcial</h2><p>Acompanhe a disputa da rodada.</p></div><button type="button" onClick={() => setTab("Ranking")}>Ver ranking completo <ArrowRight size={15} aria-hidden="true" /></button></div>
            {rankingLoaded && ranking.length ? <Entries entries={ranking.slice(0, 5)} ownIds={ownIds} ranking /> : <p className={styles.previewEmpty}>{rankingLoaded ? "Nenhum time inscrito nesta competição." : "Abra o ranking para acompanhar a classificação."}</p>}
          </section>
        </div>}
        {tab === "Premiação" && <section className={styles.panel}><div className={styles.panelTitle}><Gift aria-hidden="true" /><h2>Premiação</h2></div>{summary.premiacao.length ? <div className={styles.prizeList}>{summary.premiacao.map((prize) => <p key={prize.ordem}>{prize.posicaoInicio}º{prize.posicaoFim !== prize.posicaoInicio && ` a ${prize.posicaoFim}º`} · {prize.tipoPremiacao}{prize.valor !== null && ` · ${prize.valor.toLocaleString("pt-BR")}`}{prize.percentual !== null && ` · ${prize.percentual}%`}</p>)}</div> : <div className={styles.prizeEmpty}><Gift aria-hidden="true" /><p>Premiação ainda não definida para esta competição.</p></div>}</section>}
        {tab === "Meus times" && !isAuthenticated ? <section className={styles.panel}><p>Entre para acompanhar seus times inscritos.</p><Link href="/login">Fazer login</Link></section> : null}
        {sectionError && <p role="alert" className={styles.error}>{sectionError}</p>}
        {sectionLoading && ["Meus times", "Ranking"].includes(tab) ? <p role="status" className={styles.sectionLoading}>Carregando...</p> : tab === "Meus times" && isAuthenticated ? <section className={styles.panel}><div className={styles.panelTitle}><Shield aria-hidden="true" /><h2>Meus times</h2></div>{entries.length ? <Entries entries={entries} /> : <p className={styles.empty}>Você ainda não inscreveu times nesta competição.</p>}</section> : tab === "Ranking" ? <section className={styles.panel}><div className={styles.heading}><div><h2>Ranking</h2>{roundLabel !== null && roundLabel !== undefined && <p>Rodada {roundLabel}</p>}</div><button type="button" onClick={() => void loadTab("Ranking")}><RefreshCw size={15} aria-hidden="true" />Atualizar</button></div><Entries entries={ranking} ownIds={ownIds} ranking /></section> : null}
        {modal && <Dialog title="Inscrever time" close={() => !busy && setModal(false)} busy={busy}><p>Selecione um dos seus times em Meus Times.</p>{teams.length ? <div className={styles.choices}>{teams.map((team) => <label key={team.timeId}><input type="radio" name="team" checked={selected === team.timeId} onChange={() => setSelected(team.timeId)} disabled={busy || summary.minhasInscricoes?.some((entry) => entry.timeIdCartola === team.timeId)} />{team.escudoUrl && <img src={team.escudoUrl} alt="" />}{team.nome}</label>)}</div> : <p>Nenhum time vinculado. <Link href="/meus-times">Adicionar em Meus Times</Link></p>}<div className={styles.actions}><button type="button" onClick={() => setModal(false)} disabled={busy}>Cancelar</button><button type="button" className={styles.primary} disabled={busy || selected === null} onClick={() => void enroll()}>{busy ? "Inscrevendo..." : "Confirmar inscrição FREE"}</button></div></Dialog>}
      </>}
  </main>;
}
