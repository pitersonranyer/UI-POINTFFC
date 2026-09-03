"use client";

import Link from "next/link";
import { ArrowLeft, ImageOff, MapPin, RefreshCw } from "lucide-react";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { escudoClube, nomeClube, obterClube, statusPartida } from "@/lib/cartola";
import type { CartolaClub, CartolaScoredAthlete } from "@/types/cartola";
import styles from "./MatchDetailsPage.module.css";

const positions = [
  { id: 1, label: "Goleiros" }, { id: 2, label: "Laterais" }, { id: 3, label: "Zagueiros" },
  { id: 4, label: "Meias" }, { id: 5, label: "Atacantes" }, { id: 6, label: "Técnicos" },
];
const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const positiveScouts = new Set(["G", "A", "SG", "DS", "FS", "FD", "FF", "FT", "DE", "DP", "PS"]);
const negativeScouts = new Set(["GC", "CA", "CV", "FC", "I", "GS", "PC", "PP", "PE"]);

export function MatchDetailsPage({ matchId }: { matchId: number }) {
  const { dashboard, loading, error, atualizar, athletes, athletesLoading } = useCartolaDashboard();
  if (loading && !dashboard) return <main className={styles.shell}><div className={styles.loading}>Carregando jogo...</div></main>;
  const match = dashboard?.partidas.find(item => item.partida_id === matchId);
  if (!dashboard || !match) return <main className={styles.shell}><Link className={styles.back} href="/"><ArrowLeft /> Voltar aos jogos</Link><div className={styles.empty}><h1>Jogo não encontrado</h1><p>{error ?? "A partida pode não pertencer à rodada atual."}</p></div></main>;

  const home = obterClube(dashboard.clubes, match.clube_casa_id);
  const away = obterClube(dashboard.clubes, match.clube_visitante_id);
  const allAthletes = athletes && !dashboard.mercadoAberto ? Object.values(athletes.atletas) : [];
  const active = (athlete: CartolaScoredAthlete) => athlete.entrou_em_campo !== false || athlete.pontuacao !== 0 || Object.keys(athlete.scout ?? {}).length > 0;
  const homeAthletes = allAthletes.filter(item => item.clube_id === match.clube_casa_id && active(item));
  const awayAthletes = allAthletes.filter(item => item.clube_id === match.clube_visitante_id && active(item));
  const total = (items: CartolaScoredAthlete[]) => items.reduce((sum, item) => sum + item.pontuacao, 0);
  const status = statusPartida(match);
  const scored = match.placar_oficial_mandante != null && match.placar_oficial_visitante != null;

  return <main className={styles.shell}>
    <div className={styles.toolbar}><Link className={styles.back} href="/"><ArrowLeft /> Jogos</Link><button type="button" onClick={atualizar}><RefreshCw /> Atualizar</button></div>
    <section className={styles.scoreboard}>
      <Team club={home} id={match.clube_casa_id} total={total(homeAthletes)} />
      <div className={styles.score}><small>{status?.live ? "Ao vivo" : "Jogo"}</small><strong>{scored ? `${match.placar_oficial_mandante} × ${match.placar_oficial_visitante}` : "– × –"}</strong>{status && <b className={status.live ? styles.live : styles.finished}>{status.label}</b>}<span><MapPin /> {match.local || "Local a definir"}</span></div>
      <Team club={away} id={match.clube_visitante_id} total={total(awayAthletes)} />
    </section>

    {athletesLoading && !athletes ? <div className={styles.loading}>Carregando atletas...</div> :
      homeAthletes.length || awayAthletes.length ? <section className={styles.comparison}>{positions.map(position => {
        const homePlayers = homeAthletes.filter(item => item.posicao_id === position.id).sort((a, b) => b.pontuacao - a.pontuacao);
        const awayPlayers = awayAthletes.filter(item => item.posicao_id === position.id).sort((a, b) => b.pontuacao - a.pontuacao);
        if (!homePlayers.length && !awayPlayers.length) return null;
        return <div className={styles.position} key={position.id}><h2>{position.label}</h2><div className={styles.sides}><PlayerList athletes={homePlayers} /><PlayerList athletes={awayPlayers} /></div></div>;
      })}</section> : <div className={styles.empty}><h2>Atletas ainda não disponíveis</h2><p>Os jogadores aparecerão quando a pontuação da partida for publicada.</p></div>}
  </main>;
}

function Team({ club, id, total }: { club: CartolaClub; id: number; total: number }) {
  const shield = escudoClube(club), name = nomeClube(club, id);
  return <div className={styles.team}>{shield ? <img src={shield} alt={`Escudo do ${club.nome ?? name}`} /> : <span><ImageOff /></span>}<strong>{name}</strong><small>{points.format(total)} pts</small></div>;
}
function PlayerList({ athletes }: { athletes: CartolaScoredAthlete[] }) {
  return <div className={styles.players}>{athletes.length ? athletes.map((athlete, index) => <article key={`${athlete.apelido}-${index}`}><div><strong>{athlete.apelido}</strong><EventBadges athlete={athlete} /></div><b className={athlete.pontuacao < 0 ? styles.negative : ""}>{points.format(athlete.pontuacao)}</b><Scouts athlete={athlete} /></article>) : <p className={styles.noPlayers}>Sem atleta pontuado</p>}</div>;
}
function EventBadges({ athlete }: { athlete: CartolaScoredAthlete }) {
  const scout = athlete.scout ?? {};
  return <span className={styles.events}>{scout.G > 0 && <span title="Gol">⚽</span>}{scout.A > 0 && <span title="Assistência">👟</span>}{scout.SG > 0 && <span className={styles.sgBonus} title="5 pontos por saldo de gols">5</span>}{scout.CA > 0 && <span title="Cartão amarelo">🟨</span>}{scout.CV > 0 && <span title="Cartão vermelho">🟥</span>}</span>;
}
function Scouts({ athlete }: { athlete: CartolaScoredAthlete }) {
  const entries = Object.entries(athlete.scout ?? {}).filter(([, value]) => value > 0);
  if (!entries.length) return null;
  return <small className={styles.scouts}>{entries.map(([key, value], index) => <span className={negativeScouts.has(key) ? styles.scoutNegative : positiveScouts.has(key) ? styles.scoutPositive : ""} key={key}>{index > 0 && ", "}{value > 1 ? value : ""}{key}</span>)}</small>;
}
