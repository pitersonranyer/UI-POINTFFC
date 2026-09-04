"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ImageOff, MapPin, RefreshCw } from "lucide-react";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { escudoClube, formatarPartida, nomeClube, obterClube, ordenarPartidas, statusPartida } from "@/lib/cartola";
import type { CartolaClub } from "@/types/cartola";
import styles from "./RoundGamesPage.module.css";

export function RoundGamesPage() {
  const { dashboard, loading, error, atualizar } = useCartolaDashboard();
  if (loading && !dashboard) return <main className={styles.shell}><div className={styles.loading} role="status"><RefreshCw />Aguarde, carregando os jogos da rodada...</div></main>;
  if (!dashboard) return <main className={styles.shell}><Link className={styles.back} href="/"><ArrowLeft />Dashboard</Link><div className={styles.feedback}><p>{error ?? "Não foi possível carregar os jogos da rodada."}</p><button type="button" onClick={atualizar}>Tentar novamente</button></div></main>;

  const matches = ordenarPartidas(dashboard.partidas);
  return <main className={styles.shell}>
    <div className={styles.toolbar}><Link className={styles.back} href="/"><ArrowLeft />Dashboard</Link><button type="button" onClick={atualizar}><RefreshCw />Atualizar</button></div>
    <header className={styles.header}><div><p className="eyebrow">Brasileirão</p><h1>Jogos da rodada {dashboard.rodada}</h1><p>Confira todas as partidas, horários e locais da rodada.</p></div><span><CalendarDays />{matches.length} jogos</span></header>
    {matches.length ? <section className={styles.grid} aria-label={`Jogos da rodada ${dashboard.rodada}`}>{matches.map((game) => {
      const home = obterClube(dashboard.clubes, game.clube_casa_id), away = obterClube(dashboard.clubes, game.clube_visitante_id);
      const schedule = formatarPartida(game), status = statusPartida(game), scored = game.placar_oficial_mandante != null && game.placar_oficial_visitante != null;
      return <Link className={styles.game} href={`/jogos?partida=${game.partida_id}`} key={game.partida_id}><div className={styles.schedule}><strong>{schedule.data}</strong><span>{schedule.hora}</span>{status && <b className={status.live ? styles.live : styles.finished}>{status.label}</b>}</div><div className={styles.matchup}><Team club={home} id={game.clube_casa_id}/><strong className={styles.score}>{scored ? `${game.placar_oficial_mandante} × ${game.placar_oficial_visitante}` : "×"}</strong><Team club={away} id={game.clube_visitante_id}/></div><div className={styles.footer}><span><MapPin />{game.local || "Local a definir"}</span><span>Ver detalhes <ArrowRight /></span></div></Link>;
    })}</section> : <div className={styles.feedback}>Nenhum jogo disponível para esta rodada.</div>}
  </main>;
}

function Team({ club, id }: { club: CartolaClub; id: number }) {
  const shield = escudoClube(club), name = nomeClube(club, id);
  return <div className={styles.team}>{shield ? <img src={shield} alt={`Escudo do ${club.nome ?? name}`} /> : <span><ImageOff /></span>}<strong>{name}</strong></div>;
}
