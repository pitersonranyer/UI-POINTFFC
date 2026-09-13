"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { useFutebolRodada } from "@/hooks/useFutebolRodada";
import type { FutebolJogo } from "@/types/futebol";
import { FutebolShield } from "./FutebolMatch";
import { futebolCompeticoes, type FutebolCompeticaoCodigo } from "@/data/futebolCompeticoes";
import styles from "./FutebolGamesPage.module.css";

function localDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function groupMatches(matches: FutebolJogo[]) {
  const groups = new Map<string, { date: Date | null; games: FutebolJogo[] }>();
  const sorted = [...matches].sort((a, b) => (localDate(a.dataHoraUtc)?.getTime() ?? Infinity) - (localDate(b.dataHoraUtc)?.getTime() ?? Infinity));
  for (const game of sorted) {
    const date = localDate(game.dataHoraUtc);
    const key = date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "a-definir";
    const group = groups.get(key) ?? { date, games: [] };
    group.games.push(game);
    groups.set(key, group);
  }
  return [...groups.entries()];
}

export function FutebolGamesPage({ initialCodigo = "BSA" }: { initialCodigo?: FutebolCompeticaoCodigo }) {
  const [codigo, setCodigo] = useState<FutebolCompeticaoCodigo>(initialCodigo);
  const { data, loading, error } = useFutebolRodada(true, codigo);
  const competicao = futebolCompeticoes.find(item => item.codigo === codigo)!;
  const currentData = data?.competicao.codigo === codigo ? data : null;
  const groups = currentData?.rodada != null ? groupMatches(currentData.jogos) : [];
  const liveCount = currentData?.rodada != null ? currentData.jogos.filter(game => game.status === "IN_PLAY").length : 0;

  return <div className={styles.shell}>
    <Link className={styles.back} href="/"><ArrowLeft size={14} /> Dashboard</Link>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>O palco da rodada</span><h1>Jogos<span>.</span></h1><p>Acompanhe os confrontos da rodada</p></div>
      <div className={styles.headerMark} aria-hidden="true"><CompetitionLogo key={codigo} codigo={codigo} nome={competicao.nome} url={competicao.logoUrl} /><span>{competicao.nome.toUpperCase()}</span></div>
    </header>

    <nav className={styles.competitionSelector} aria-label="Selecionar competição">{futebolCompeticoes.map(item => <button key={item.codigo} type="button" className={item.codigo === codigo ? styles.selectedCompetition : undefined} aria-pressed={item.codigo === codigo} onClick={() => { setCodigo(item.codigo); window.history.replaceState(null, "", item.codigo === "BSA" ? "/jogos" : `/jogos?competicao=${item.codigo}`); }}>{item.aba}</button>)}</nav>

    <section className={styles.competition} aria-label="Competição e rodada">
      <div className={styles.competitionIdentity}><CompetitionLogo key={codigo} codigo={codigo} nome={competicao.nome} url={competicao.logoUrl} /><div><small>COMPETIÇÃO</small><strong>{competicao.nome}</strong></div></div>
      <div className={styles.round}>{currentData?.rodada != null ? <><span>Rodada</span><strong>{String(currentData.rodada).padStart(2, "0")}</strong></> : <span>Rodada atual</span>}</div>
    </section>

    <div className={styles.agendaHeading}><div><CalendarDays size={16} /><h2>Agenda de jogos</h2></div>{liveCount > 0 ? <span className={styles.liveSummary}><i />{liveCount} {liveCount === 1 ? "jogo ao vivo" : "jogos ao vivo"}</span> : currentData && groups.length > 0 ? <span>{currentData.jogos.length} confrontos{currentData.temporada ? ` · ${currentData.temporada}` : ""}</span> : null}</div>

    {loading || (!currentData && !error) ? <div role="status" aria-label="Carregando jogos da rodada" className={styles.loading}><span>Preparando os confrontos da rodada...</span><div className={styles.grid}>{[0, 1, 2].map(item => <div className={styles.skeleton} key={item}><i /><div><i /><i /></div><i /></div>)}</div></div> : error ?
      <section className={styles.feedback} role="alert"><CalendarDays size={28} /><h2>Os jogos voltam em instantes</h2><p>Não foi possível carregar os jogos da rodada.</p><span>Tente acessar novamente em alguns instantes.</span></section> : !groups.length ?
      <section className={styles.feedback}><CalendarDays size={28} /><h2>A próxima rodada vem aí</h2><p>Nenhum jogo disponível no momento.</p></section> :
      <div className={styles.days}>{groups.map(([key, { date, games }]) => <section className={styles.day} key={key} aria-label={date ? date.toLocaleDateString("pt-BR", { dateStyle: "full" }) : "Data a definir"}>
        <header className={styles.dayHeading}><h3>{date ? <><span>{date.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "")}</span><i>•</i><span>{date.toLocaleDateString("pt-BR", { day: "2-digit" })} {date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></> : "Data a definir"}</h3><span>{games.length} {games.length === 1 ? "jogo" : "jogos"}</span></header>
        <div className={styles.grid}>{games.map(game => <GameCard key={game.id} game={game} codigo={codigo} />)}</div>
      </section>)}</div>}
    <footer className={styles.footer}><span className={styles.footerAccent} />Cada confronto, uma nova história.<ChevronRight size={12} /></footer>
  </div>;
}

function CompetitionLogo({ codigo, nome, url }: { codigo: FutebolCompeticaoCodigo; nome: string; url: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.competitionIcon}>{failed ? <b aria-label={`Logo de ${nome} indisponível`}>{codigo}</b> : <img src={url} alt={`Logo de ${nome}`} onError={() => setFailed(true)} />}</span>;
}

function GameCard({ game, codigo }: { game: FutebolJogo; codigo: FutebolCompeticaoCodigo }) {
  const live = game.status === "IN_PLAY";
  const future = game.status === "TIMED" || game.status === "SCHEDULED";
  const labels: Record<string, string> = { IN_PLAY: "Ao vivo", PAUSED: "Intervalo", FINISHED: "Encerrado", AWARDED: "Encerrado", POSTPONED: "Adiado", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };
  const score = ["IN_PLAY", "PAUSED", "FINISHED", "AWARDED", "SUSPENDED"].includes(game.status) && game.placar.mandante != null && game.placar.visitante != null;
  const date = localDate(game.dataHoraUtc);
  const venue = game.estadio || game.local;
  return <Link href={`/jogos?futebol=${game.id}${codigo === "BSA" ? "" : `&competicao=${codigo}`}`} className={`${styles.game} ${live ? styles.liveGame : ""}`} aria-label={`Ver confronto: ${game.mandante.nome} contra ${game.visitante.nome}`}>
    <div className={styles.schedule}><time dateTime={game.dataHoraUtc}>{date ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</time><span className={`${styles.status} ${live ? styles.liveStatus : ""}`}>{live && <i />}{future ? "Em breve" : labels[game.status] ?? "A definir"}</span></div>
    <div className={`${styles.team} ${styles.homeTeam}`}><strong>{game.mandante.nome}</strong><span className={styles.crest}><FutebolShield team={game.mandante} /></span></div>
    <div className={styles.score}>{score ? <span aria-label={`Placar ${game.placar.mandante} a ${game.placar.visitante}`}>{game.placar.mandante}<b>:</b>{game.placar.visitante}</span> : <span className={styles.versus}>×</span>}</div>
    <div className={`${styles.team} ${styles.awayTeam}`}><span className={styles.crest}><FutebolShield team={game.visitante} /></span><strong>{game.visitante.nome}</strong></div>
    <div className={styles.venue}>{venue && <><MapPin size={14} aria-hidden="true" /><span>{venue}</span></>}</div>
    <ChevronRight className={styles.gameArrow} size={18} aria-hidden="true" />
  </Link>;
}
