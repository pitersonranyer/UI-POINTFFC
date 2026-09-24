"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, CircleDot, Crown, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { pointLeagueService, type Competition, type CompetitionCard, type CompetitionSummary, type PointLeague } from "@/services/pointLeagueService";
import styles from "./PointLeague.module.css";

const statusLabels: Record<string, string> = {
  RASCUNHO: "Rascunho", INSCRICOES_ABERTAS: "Inscrições abertas",
  INSCRICOES_ENCERRADAS: "Em andamento", EM_ANDAMENTO: "Em andamento",
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
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PointLeaguePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [league, setLeague] = useState<PointLeague | null>(null);
  const [competitions, setCompetitions] = useState<CompetitionCard[]>([]);
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
  useEffect(() => {
    if (loading || error || authLoading) return;
    let active = true, refreshing = false;
    const refresh = async () => {
      if (document.visibilityState === "hidden" || refreshing) return;
      refreshing = true;
      try {
        const list = await pointLeagueService.competitions();
        if (active) setCompetitions(list);
      } catch { /* Mantem os ultimos dados confirmados; tenta novamente no proximo ciclo. */ }
      finally { refreshing = false; }
    };
    const timer = window.setInterval(() => void refresh(), 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [loading, error, authLoading]);

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
            const isLive = item.status === "INSCRICOES_ENCERRADAS" || item.status === "EM_ANDAMENTO";
            const action = isLive ? "Ver parciais" : item.status === "ENCERRADA" ? "Ver resultado" : null;
            const limit = summary?.usuario ? summary.usuario.limiteTimesUsuario : item.limiteTimesUsuario;
            const prize = item.premiacaoEmDisputa == null ? null : Number(item.premiacaoEmDisputa);
            const showPrize = prize !== null && Number.isFinite(prize) && (item.tipoAcesso === "PAGO" || prize > 0);
            const name = competitionDisplayName(item);
            const registrationDeadline = deadline(item.fimInscricao);
            return <Link href={`/competicoes?id=${item.id}${action ? "&aba=ranking" : ""}`} className={styles.card} aria-label={`${action ?? "Abrir competição"} ${name}`} key={item.id}>
              <div className={styles.cardHeading}>
                <div className={styles.cardIdentity}>
                  <Image src="/brand/pointffc-logo.png" alt="POINT FFC" width={2172} height={724} unoptimized className={styles.cardLogo} />
                  {name.toUpperCase() !== "POINT FFC" && <h3>{name}</h3>}
                  <p>Competição oficial da rodada</p>
                </div>
                <span className={`${styles.status} ${isOpen ? styles.open : isLive ? styles.live : ""}`}>
                  <span className={styles.statusLabel}><i aria-hidden="true" />{competitionStatusLabel(item.status)}</span>
                  {action && <><span className={styles.statusSeparator} aria-hidden="true">|</span><span className={styles.statusAction}>{action}</span></>}
                </span>
                <ChevronRight className={styles.chevron} aria-hidden="true" />
              </div>
              {showPrize && <div className={styles.prizeBand}><span>Premiação em disputa</span><strong>{money(prize!)}</strong></div>}
              <div className={styles.metrics}>
                <div><span><small>Entrada</small><strong>{item.tipoAcesso === "FREE" ? "GRÁTIS" : money(item.valorInscricao)}</strong>{item.tipoAcesso === "PAGO" && <em>por time</em>}</span></div>
                <div><span><small>Inscritos</small><strong>{item.quantidadeInscritos ?? summary?.inscritos.quantidade ?? "—"}</strong></span></div>
                <div><span><small>Inscrições até</small><strong>{registrationDeadline ? `Até ${registrationDeadline.date}` : "Não informado"}</strong>{registrationDeadline && <em>{registrationDeadline.time}</em>}</span></div>
                <div><span><small>Limite</small><strong>{limit == null ? "Sem limite" : `${limit} ${limit === 1 ? "time" : "times"}`}</strong><em>por usuário</em></span></div>
              </div>
            </Link>;
          })}</div> : <div className={styles.empty}><Trophy aria-hidden="true" /><div><h3>Nenhuma competição disponível nesta rodada.</h3><p>Assim que uma nova disputa for aberta, ela aparecerá aqui.</p></div></div>}
        </section>
      </>}
  </main>;
}
