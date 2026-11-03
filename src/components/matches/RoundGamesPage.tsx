"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff, RefreshCw } from "lucide-react";
import { createAgendaLoader, UnsupportedAgendaSeason } from "@/services/agendaService";
import type { Agenda, AgendaMatch, AgendaTeam } from "@/types/agenda";
import styles from "./RoundGamesPage.module.css";

const season = 2026;
const timezone = "America/Sao_Paulo";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
const statuses: Record<string, { label: string; tone: string; score?: boolean }> = {
  AGENDADA: { label: "Agendada", tone: "scheduled" }, PRE_JOGO: { label: "Pré-jogo", tone: "scheduled" },
  EM_ANDAMENTO: { label: "Ao vivo", tone: "live", score: true }, INTERVALO: { label: "Intervalo", tone: "live", score: true },
  ENCERRADA: { label: "Encerrada", tone: "finished", score: true }, ADIADA: { label: "Adiada", tone: "postponed" }, CANCELADA: { label: "Cancelada", tone: "cancelled" },
  INTERROMPIDA: { label: "Interrompida", tone: "postponed", score: true }, ABANDONADA: { label: "Abandonada", tone: "cancelled", score: true },
  RESULTADO_ADMINISTRATIVO: { label: "Resultado administrativo", tone: "finished", score: true },
};
function matchDate(game: AgendaMatch) { return game.dataHora && !Number.isNaN(Date.parse(game.dataHora)) ? new Date(game.dataHora) : null; }
export function agendaGroups(matches: AgendaMatch[]) {
  const sorted = [...matches].sort((a, b) => (matchDate(a)?.getTime() ?? Infinity) - (matchDate(b)?.getTime() ?? Infinity));
  const groups = new Map<string, { date: Date | null; matches: AgendaMatch[] }>();
  for (const game of sorted) {
    const date = matchDate(game);
    const parts = date ? dateParts.formatToParts(date) : [];
    const part = (type: string) => parts.find(item => item.type === type)?.value;
    const key = date ? `${part("year")}-${part("month")}-${part("day")}` : "unknown";
    if (!groups.has(key)) groups.set(key, { date, matches: [] });
    groups.get(key)!.matches.push(game);
  }
  return [...groups].map(([key, group]) => ({ key, ...group }));
}

export function RoundGamesPage() {
  const loader = useMemo(() => createAgendaLoader(season), []);
  const [round, setRound] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data: Agenda | null; loading: boolean; error: Error | null }>({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    setState(previous => ({ ...previous, loading: true, error: null }));
    loader(round).then(data => { if (active) setState({ data, loading: false, error: null }); }, error => { if (active) setState(previous => ({ ...previous, loading: false, error: error instanceof Error ? error : new Error("Não foi possível carregar a agenda.") })); });
    return () => { active = false; };
  }, [loader, round, attempt]);
  const selected = round ?? state.data?.rodada;
  const roundLabel = selected && state.data ? `Rodada ${selected} de ${state.data.totalRodadas}` : state.error ? "Rodada indisponível" : "Selecionando rodada...";
  const changing = !state.error && (state.loading || (round != null && state.data?.rodada !== round));
  const groups = state.data && !changing && !state.error ? agendaGroups(state.data.partidas) : [];
  return <main className={styles.shell}>
    <Link className={styles.back} href="/"><ArrowLeft aria-hidden="true" />Dashboard</Link>
    <header className={styles.header}><p className="eyebrow">POINT FFC</p><h1>Agenda do Brasileirão</h1><p>Campeonato Brasileiro Série A — {season}</p></header>
    <nav className={styles.roundNav} aria-label="Navegação entre rodadas"><button type="button" aria-label="Rodada anterior" disabled={changing || !selected || selected <= 1} onClick={() => setRound(selected! - 1)}><ChevronLeft aria-hidden="true" /></button><strong aria-live="polite">{roundLabel}</strong><button type="button" aria-label="Próxima rodada" disabled={changing || !selected || !state.data || selected >= state.data.totalRodadas} onClick={() => setRound(selected! + 1)}><ChevronRight aria-hidden="true" /></button></nav>
    <p className={styles.timezone}>Horários de Brasília</p>
    <section aria-label={selected ? `Jogos da rodada ${selected}` : "Jogos do Brasileirão"} aria-busy={changing}>
      {changing ? <div className={styles.feedback} role="status"><RefreshCw className={styles.spinner} aria-hidden="true" />{state.data ? `Carregando rodada ${selected}...` : "Carregando agenda..."}</div> : state.error ? <div className={styles.feedback} role="alert"><h2>{state.error instanceof UnsupportedAgendaSeason ? "Temporada indisponível" : "Não foi possível carregar a agenda"}</h2><p>{state.error.message}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : !groups.length ? <div className={styles.feedback}>Nenhuma partida disponível para esta rodada.</div> : groups.map(group => <section className={styles.dateGroup} key={group.key}><h2>{group.date ? <time dateTime={group.key}>{dateFormat.format(group.date)}</time> : "Data não informada"}</h2><ul>{group.matches.map((game, index) => <li key={`${game.fixtureId}-${index}`}><AgendaGame game={game} /></li>)}</ul></section>)}
    </section>
  </main>;
}

function AgendaGame({ game }: { game: AgendaMatch }) {
  const status = statuses[game.status ?? ""] ?? { label: "Status indisponível", tone: "unknown" };
  const date = matchDate(game);
  const validFixture = Number.isSafeInteger(game.fixtureId) && game.fixtureId > 0;
  const content = <><Team club={game.mandante} side="home" /><span className={styles.center}>{status.score ? <strong aria-label="Placar">{game.placar.mandante ?? "—"} × {game.placar.visitante ?? "—"}</strong> : status.tone === "scheduled" || status.tone === "unknown" ? date ? <time dateTime={game.dataHora!}>{timeFormat.format(date)}</time> : <strong className={styles.unavailable}>Horário indisponível</strong> : <strong>—</strong>}<span className={styles.status} data-tone={status.tone}>{status.label}</span>{!validFixture && <small>Central indisponível</small>}</span><Team club={game.visitante} side="away" /></>;
  // The generic route is exported for every fixture; dynamic routes only include
  // IDs known at build time. Use the public Futebol V2 fixture ID exclusively.
  return validFixture ? <Link className={styles.game} href={`/fantasy/partidas/?fixtureId=${game.fixtureId}`} prefetch={false}>{content}</Link> : <div className={styles.game}>{content}</div>;
}

function Team({ club, side }: { club: AgendaTeam; side: "home" | "away" }) {
  const [failed, setFailed] = useState<string | null>(null);
  const name = club.nome ?? (side === "home" ? "Mandante não informado" : "Visitante não informado");
  return <span className={`${styles.team} ${side === "home" ? styles.home : ""}`}>{club.escudo && failed !== club.escudo ? <img src={club.escudo} alt={`Escudo do ${name}`} onError={() => setFailed(club.escudo)} loading="lazy" /> : <span className={styles.missingShield} role="img" aria-label="Escudo indisponível"><ImageOff aria-hidden="true" /></span>}<strong>{name}</strong></span>;
}
