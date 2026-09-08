"use client";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, List, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { buscarDashboard, buscarEscalacaoTime, buscarPontuacaoEscalacao } from "@/services/cartola/cartola.service";
import { rodadaDeEscalacao } from "@/lib/cartola";
import { partialScoreService } from "@/services/partialScoreService";
import type { CartolaDashboardResponse, CartolaTeamLineupResponse } from "@/types/cartola";
import { FieldLineup } from "./FieldLineup";
import { ListLineup } from "./ListLineup";
import styles from "./TeamDetail.module.css";

import { effectiveLineup } from "./lineupSubstitutions";

type View = "field" | "list";
const score = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function TeamDetailPage({ timeId }: { timeId: number }) {
  const [team, setTeam] = useState<CartolaTeamLineupResponse | null>(null), [dashboard, setDashboard] = useState<CartolaDashboardResponse | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [view, setView] = useState<View>("field");
  const [scoreError, setScoreError] = useState(false);
  const [roundPoints, setRoundPoints] = useState<number | null>(null);
  useEffect(() => { const saved = localStorage.getItem("fantasypoint_team_view"); if (saved === "field" || saved === "list") setView(saved); }, []);
  const load = useCallback(async () => {
    setLoading(true); setError(""); setScoreError(false); setRoundPoints(null);
    try {
      const [nextDashboard, nextTeam] = await Promise.all([buscarDashboard(), buscarEscalacaoTime(timeId)]);
      const round = nextTeam.time.rodada_time_id ?? nextTeam.rodada_atual ?? rodadaDeEscalacao(nextDashboard.rodada, nextDashboard.mercadoAberto);
      setDashboard(nextDashboard);
      if (nextTeam.substituicoes !== undefined) {
        setTeam(nextTeam);
        setRoundPoints(nextTeam.pontos ?? null);
        return;
      }
      const [lineupResult, partialResult] = await Promise.allSettled([
        buscarPontuacaoEscalacao(nextTeam, round),
        partialScoreService.buscarParcialTime(nextDashboard.mercado.temporada ?? new Date().getFullYear(), round, timeId),
      ]);
      if (lineupResult.status === "fulfilled") setTeam(lineupResult.value);
      else { setTeam(nextTeam); setScoreError(true); }
      if (partialResult.status === "fulfilled") setRoundPoints(partialResult.value?.pontuacao ?? null);
    } catch { setError("Não foi possível carregar a escalação deste time."); }
    finally { setLoading(false); }
  }, [timeId]);
  useEffect(() => { void load(); }, [load]);
  const changeView = (next: View) => { setView(next); localStorage.setItem("fantasypoint_team_view", next); };
  if (loading) return <main className={styles.shell}><div className={styles.loading} role="status"><RefreshCw /><strong>Aguarde, carregando a escalação...</strong><span>Nosso servidor pode levar alguns segundos para iniciar.</span></div></main>;
  if (error || !team || !dashboard) return <main className={styles.shell}><Link href="/" className={styles.back}><ArrowLeft />Voltar ao Ranking Geral</Link><div className={styles.error}><p>{error || "Escalação não disponível para esta rodada."}</p><button type="button" onClick={() => void load()}>Tentar novamente</button></div></main>;
  const expectedRound = rodadaDeEscalacao(dashboard.rodada, dashboard.mercadoAberto), lineupRound = team.time.rodada_time_id ?? team.rodada_atual ?? expectedRound;
  const { players, reserves } = effectiveLineup(team), formation = tacticalFormation(players);
  return <main className={styles.shell}><Link href="/" className={styles.back}><ArrowLeft />Voltar ao Ranking Geral</Link><header className={styles.teamHeader}>{team.time.url_escudo_png ? <img src={team.time.url_escudo_png} alt={`Escudo do ${team.time.nome}`} /> : <span>{team.time.nome.slice(0, 2).toUpperCase()}</span>}<div><p>Detalhe do time</p><h1>{team.time.nome}</h1>{team.time.nome_cartola && <small>{team.time.nome_cartola}</small>}</div><dl>
      <div><dt>Valor do time</dt><dd>{team.patrimonio != null ? `C$ ${score.format(team.patrimonio)}` : "--"}</dd></div>
      <div><dt>Pontuação</dt><dd>{roundPoints != null ? `${score.format(roundPoints)} pts` : "-- pts"}</dd></div>
      <div><dt>Já jogaram</dt><dd title="Titulares e técnico que já participaram na rodada">{team.jogadores_jogaram ?? "--"}/{players.length}</dd></div>
    </dl></header>
    <section className={styles.lineupHeader}><div><p className="eyebrow">Escalação utilizada</p><h2>Escalação da rodada {lineupRound}</h2><small>{dashboard.mercadoAberto ? `O mercado está aberto. Exibindo a escalação da rodada anterior.` : `Mercado fechado. Exibindo a escalação da rodada atual.`}</small>{formation && <b>Esquema {formation}</b>}</div><div className={styles.toggle} aria-label="Visualização da escalação"><button type="button" className={view === "field" ? styles.active : ""} onClick={() => changeView("field")}><LayoutGrid />Campo</button><button type="button" className={view === "list" ? styles.active : ""} onClick={() => changeView("list")}><List />Lista</button></div></section>
    {scoreError && <div className={styles.error} role="status"><p>Não foi possível atualizar a pontuação dos atletas.</p><button type="button" onClick={() => void load()}>Tentar novamente</button></div>}
    {!players.length ? <div className={styles.empty}>Escalação não disponível para esta rodada.</div> : view === "field" ? <FieldLineup originalPlayers={team.atletas} players={players} reserves={reserves} clubs={dashboard.clubes} captainId={team.capitao_id} luxuryReserveId={team.reserva_luxo_id} records={team.substituicoes}/> : <ListLineup players={players} reserves={reserves} clubs={dashboard.clubes} captainId={team.capitao_id} luxuryReserveId={team.reserva_luxo_id} records={team.substituicoes}/>}
  </main>;
}
function tacticalFormation(players: CartolaTeamLineupResponse["atletas"]) { const defense = players.filter((p) => p.posicao_id === 2 || p.posicao_id === 3).length, midfield = players.filter((p) => p.posicao_id === 4).length, attack = players.filter((p) => p.posicao_id === 5).length; return defense && midfield && attack ? `${defense}-${midfield}-${attack}` : ""; }
