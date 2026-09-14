"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleDot, Clock3, Crown, Shield, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { pointLeagueService, type Competition, type CompetitionSummary, type PointLeague } from "@/services/pointLeagueService";
import styles from "./PointLeague.module.css";

const statusLabels: Record<string, string> = {
  RASCUNHO: "Rascunho", INSCRICOES_ABERTAS: "Inscrições abertas",
  INSCRICOES_ENCERRADAS: "Inscrições encerradas", EM_ANDAMENTO: "Em andamento",
  ENCERRADA: "Encerrada", CANCELADA: "Cancelada",
};
const date = (value: string) => new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(", ", " • ");
const round = (item: Competition) => item.rodadaInicio === null ? null : item.rodadaFim && item.rodadaFim !== item.rodadaInicio ? `${item.rodadaInicio}–${item.rodadaFim}` : String(item.rodadaInicio);

export function PointLeaguePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [league, setLeague] = useState<PointLeague | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [summaries, setSummaries] = useState<Record<number, CompetitionSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setSummaries({});
    try {
      const [leagueData, list] = await Promise.all([pointLeagueService.league(), pointLeagueService.competitions()]);
      setLeague(leagueData); setCompetitions(list);
      void Promise.allSettled(list.map(async (item) => {
        const summary = await pointLeagueService.summary(item.id, isAuthenticated);
        setSummaries((current) => ({ ...current, [item.id]: summary }));
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as competições.");
    } finally { setLoading(false); }
  }, [isAuthenticated]);
  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const rounds = [...new Set(competitions.map(round).filter((value): value is string => value !== null))];
  const currentRound = rounds.length === 1 ? rounds[0] : null;
  const allFree = competitions.length > 0 && competitions.every((item) => item.tipoAcesso === "FREE");

  return <main className={`page-shell ${styles.shell}`}>
    <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
    {loading || authLoading ? <div role="status" aria-label="Carregando liga" className={styles.skeletonPage}><div className={styles.skeletonHero} /><div className={styles.skeletonTabs} /><div className={styles.skeletonSummary} /><div className={styles.skeletonCard} /></div>
      : error ? <section className={styles.error} role="alert"><Trophy aria-hidden="true" /><div><h1>Não foi possível carregar as competições.</h1><p>{error}</p><button type="button" onClick={() => void load()}>Tentar novamente</button></div></section>
      : league && <>
        <header className={styles.hero}>
          <div className={styles.heroCopy}><span className={styles.official}><Crown size={14} aria-hidden="true" /> Liga oficial</span><h1>{league.nome}</h1><p>Compita rodada a rodada e acompanhe sua posição.</p>{league.descricao && <small>{league.descricao}</small>}</div>
          <div className={styles.heroArt} aria-hidden="true"><span className={styles.heroRing}>{league.imagemUrl ? <img src={league.imagemUrl} alt="" /> : <Trophy />}</span></div>
        </header>
        <nav className={styles.tabs} aria-label="Modalidades"><span className={styles.active}><CircleDot size={16} aria-hidden="true" /> Rodada</span>{["Mensal", "Turno", "Geral"].map((name) => <span className={styles.disabled} key={name} aria-disabled="true"><strong>{name}</strong><small>Em breve</small></span>)}</nav>
        {(currentRound || allFree || competitions.length > 0) && <section className={styles.summaryStrip} aria-label="Resumo da modalidade">
          {currentRound && <div><CalendarDays aria-hidden="true" /><span><small>Rodada</small><strong>{currentRound}</strong></span></div>}
          {competitions.length > 0 && <div><Shield aria-hidden="true" /><span><small>Formato</small><strong>Rodada</strong></span></div>}
          {allFree && <div><Trophy aria-hidden="true" /><span><small>Entrada</small><strong>Grátis</strong></span></div>}
        </section>}
        <section className={styles.competitions}>
          <div className={styles.sectionTitle}><span><Trophy aria-hidden="true" /></span><div><h2>Competições da rodada</h2><p>Escolha uma competição, inscreva seu time e entre na disputa!</p></div></div>
          {competitions.length ? <div className={styles.grid}>{competitions.map((item) => {
            const summary = summaries[item.id];
            const isOpen = item.status === "INSCRICOES_ABERTAS";
            const label = statusLabels[item.status] ?? item.status.replaceAll("_", " ").toLowerCase();
            const registered = summary?.usuario?.quantidadeTimesInscritos;
            const limit = summary?.usuario?.limiteTimesUsuario ?? item.limiteTimesUsuario;
            return <article className={styles.card} key={item.id}>
              <div className={styles.cardDecoration} aria-hidden="true"><Trophy /></div>
              <div className={styles.cardContent}>
                <div className={styles.cardTop}><span className={styles.roundBadge}>{round(item) ? `Rodada ${round(item)}` : "Rodada"}</span><span className={`${styles.status} ${isOpen ? styles.open : ""}`}><i />{label}</span></div>
                <h3>{item.nome}</h3><p className={styles.description}>{item.descricao || "Competição oficial da rodada"}</p>
                <div className={styles.metrics}><div><small>Entrada</small><strong>{item.tipoAcesso === "FREE" ? "Grátis" : item.tipoAcesso}</strong></div>{summary && <div><small>Inscritos</small><strong>{summary.inscritos.quantidade}</strong></div>}{isAuthenticated && registered !== undefined && <div><small>Seus times</small><strong>{registered}{limit !== null && limit !== undefined ? ` / ${limit}` : ""}</strong></div>}</div>
                <div className={styles.cardFooter}><div className={styles.deadline}><Clock3 size={15} aria-hidden="true" />{item.fimInscricao ? `Inscrições até ${date(item.fimInscricao)}` : item.inicioInscricao ? `Inscrições a partir de ${date(item.inicioInscricao)}` : "Período de inscrição não informado"}</div><Link href={`/competicoes?id=${item.id}`} className={styles.cta}>Ver competição <ArrowRight size={17} aria-hidden="true" /></Link></div>
              </div>
            </article>;
          })}</div> : <div className={styles.empty}><Trophy aria-hidden="true" /><div><h3>Nenhuma competição disponível nesta rodada.</h3><p>Assim que uma nova disputa for aberta, ela aparecerá aqui.</p></div></div>}
        </section>
      </>}
  </main>;
}
