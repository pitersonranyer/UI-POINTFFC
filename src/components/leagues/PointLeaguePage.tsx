"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, CircleDot, Crown, Gift, Trophy, UserRound, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { pointLeagueService, type Competition, type CompetitionSummary, type PointLeague } from "@/services/pointLeagueService";
import styles from "./PointLeague.module.css";

const statusLabels: Record<string, string> = {
  RASCUNHO: "Rascunho", INSCRICOES_ABERTAS: "Inscrições abertas",
  INSCRICOES_ENCERRADAS: "Inscrições encerradas", EM_ANDAMENTO: "Em andamento",
  ENCERRADA: "Encerrada", CANCELADA: "Cancelada",
};
export const competitionDisplayName = (item: Competition) => {
  if (item.rodadaInicio === null || (item.rodadaFim !== null && item.rodadaFim !== item.rodadaInicio)) return item.nome;
  const suffix = new RegExp(`\\s*-\\s*Rodada\\s+${item.rodadaInicio}\\s*$`, "i");
  return suffix.test(item.nome) ? item.nome.replace(suffix, "").trim() : item.nome;
};
export const competitionStatusLabel = (status: string) => statusLabels[status]
  ?? status.toLowerCase().split("_").filter(Boolean).map((part, index) => index ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const deadline = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return { date: parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), time: parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
};
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

  return <main className={`page-shell ${styles.shell}`}>
    <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
    {loading || authLoading ? <div role="status" aria-label="Carregando liga" className={styles.skeletonPage}><div className={styles.skeletonHero} /><div className={styles.skeletonTabs} /><div className={styles.skeletonCard} /></div>
      : error ? <section className={styles.error} role="alert"><Trophy aria-hidden="true" /><div><h1>Não foi possível carregar as competições.</h1><p>{error}</p><button type="button" onClick={() => void load()}>Tentar novamente</button></div></section>
      : league && <>
        <header className={styles.hero}>
          <div className={styles.heroCopy}><span className={styles.official}><Crown size={14} aria-hidden="true" /> Liga oficial</span><h1>{league.nome}</h1><p>Compita rodada a rodada e acompanhe sua posição.</p>{league.descricao && <small>{league.descricao}</small>}</div>
          <div className={styles.heroArt} aria-hidden="true"><span className={styles.heroRing}>{league.imagemUrl ? <img src={league.imagemUrl} alt="" /> : <Trophy />}</span></div>
        </header>
        <nav className={styles.tabs} aria-label="Modalidades"><span className={styles.active}><CircleDot size={16} aria-hidden="true" /> Rodada</span>{["Mensal", "Turno", "Geral"].map((name) => <span className={styles.disabled} key={name} aria-disabled="true"><strong>{name}</strong><small>Em breve</small></span>)}</nav>
        <section className={styles.competitions}>
          <div className={styles.sectionHeader}><div className={styles.sectionTitle}><span><Trophy aria-hidden="true" /></span><div><h2>Competições da rodada</h2><p>Escolha uma competição, inscreva seu time e entre na disputa!</p></div></div>{currentRound && <span className={styles.roundIndicator}>Rodada {currentRound}</span>}</div>
          {competitions.length ? <div className={styles.grid}>{competitions.map((item) => {
            const summary = summaries[item.id];
            const isOpen = item.status === "INSCRICOES_ABERTAS";
            const limit = summary?.usuario?.limiteTimesUsuario ?? item.limiteTimesUsuario;
            const registrationDeadline = deadline(item.fimInscricao);
            return <Link href={`/competicoes?id=${item.id}`} className={styles.card} aria-label={`Abrir competição ${competitionDisplayName(item)}`} key={item.id}>
              <div className={styles.cardHeading}><span className={styles.cardIcon}><Trophy aria-hidden="true" /></span><div className={styles.cardIdentity}><h3>{competitionDisplayName(item)}</h3><p>{item.descricao || "Competição oficial da rodada"}</p></div><span className={`${styles.status} ${isOpen ? styles.open : ""}`}><i />{competitionStatusLabel(item.status)}</span><ChevronRight className={styles.chevron} aria-hidden="true" /></div>
              <div className={styles.metrics}>
                <div><Gift aria-hidden="true" /><span><small>Entrada</small><strong>{item.tipoAcesso === "FREE" ? "GRÁTIS" : item.valorInscricao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>{item.tipoAcesso === "PAGO" && <em>por time</em>}</span></div>
                <div><Users aria-hidden="true" /><span><small>Inscritos</small><strong>{summary?.inscritos.quantidade ?? item.quantidadeInscritos ?? "—"}</strong></span></div>
                <div><CalendarDays aria-hidden="true" /><span><small>Inscrições até</small><strong>{registrationDeadline ? `Até ${registrationDeadline.date}` : "Não informado"}</strong>{registrationDeadline && <em>{registrationDeadline.time}</em>}</span></div>
                <div><UserRound aria-hidden="true" /><span><small>Limite</small><strong>{limit == null ? "Sem limite" : `Até ${limit}`}</strong><em>times por usuário</em></span></div>
              </div>
            </Link>;
          })}</div> : <div className={styles.empty}><Trophy aria-hidden="true" /><div><h3>Nenhuma competição disponível nesta rodada.</h3><p>Assim que uma nova disputa for aberta, ela aparecerá aqui.</p></div></div>}
        </section>
      </>}
  </main>;
}
