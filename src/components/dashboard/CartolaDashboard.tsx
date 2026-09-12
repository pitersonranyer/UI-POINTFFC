"use client";
import Link from "next/link";
import { ArrowRight, RefreshCw, Shield, Trophy, Users } from "lucide-react";
import { magoRodada27 } from "@/data/mago/rodada27";
import { MagoDashboardCard } from "./MagoDashboardCard";
import { leagueService } from "@/services/leagueService";
import { formatCurrency } from "@/lib/format";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { CartolaMarketStatus } from "./CartolaMarketStatus";
import { TopAthletes } from "./TopAthletes";
import { FutebolMatches } from "@/components/matches/FutebolMatches";
import { GeneralRanking } from "./GeneralRanking";
import styles from "./Dashboard.module.css";
export function CartolaDashboard(){
 const {dashboard,loading,error,stale,atualizar,athletes,athletesLoading,athletesError,statisticsMatches}=useCartolaDashboard(); const featured=leagueService.getFeatured();const leagues=leagueService.getOpen().filter(item=>!item.featured).slice(0,3);
 if(!dashboard&&loading)return <div className={styles.shell}><div className={styles.pageTitle}><h1>Dashboard</h1></div><div className={styles.dashboardLoading} role="status" aria-live="polite"><RefreshCw/><strong>Aguarde, carregando os dados da rodada...</strong><span>Nosso servidor pode levar alguns segundos para iniciar.</span></div></div>;
 if(!dashboard)return <div className={styles.shell}><div className={styles.pageTitle}><h1>Dashboard</h1></div><section className={styles.loadError}><p>Não foi possível atualizar os dados da rodada.</p><button type="button" onClick={atualizar}>Tentar novamente</button></section></div>;
 const round=dashboard.rodada;const rankingRound=dashboard.mercadoAberto?Math.max(1,round-1):round;const statsRound=dashboard.mercadoAberto?Math.max(1,round-1):round;const statsMatches=statisticsMatches??[];const scoredMatches=statsMatches.filter(match=>match.placar_oficial_mandante!=null&&match.placar_oficial_visitante!=null);const confirmedGoals=scoredMatches.reduce((total,match)=>total+match.placar_oficial_mandante!+match.placar_oficial_visitante!,0);const realRoundStatistics=[{label:"Jogos",value:String(statsMatches.length)},{label:"Com placar",value:String(scoredMatches.length)},{label:"Gols confirmados",value:String(confirmedGoals)},{label:"Média de gols",value:scoredMatches.length?(confirmedGoals/scoredMatches.length).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:2}):"—"}];
 return <div className={styles.shell}><div className={styles.pageTitle}><h1>Dashboard</h1><span>Rodada {round}</span></div>
 {featured&&<section className={styles.feature}><div><small>Liga destaque</small><div className={styles.featureIdentity}><span><Trophy/></span><div><h2>{featured.name}</h2><p>Rodada {round}</p></div></div></div><div className={styles.featurePrize}><small>Premiação</small><strong>{formatCurrency(featured.prizePool)}</strong><Link href={`/ligas/${featured.id}`}>Ver liga</Link></div></section>}
 {stale&&<p className={styles.staleNotice}>Dados temporariamente desatualizados.</p>}{error&&<p className={styles.refreshError}>Não foi possível buscar a atualização mais recente.</p>}
 <CartolaMarketStatus mercado={dashboard.mercado} aberto={dashboard.mercadoAberto} aoVivo={dashboard.bolaRolando} atualizar={atualizar}/>
 <FutebolMatches />
 <MagoDashboardCard data={magoRodada27} />
 <section className={styles.leagues}><div className={styles.sectionHead}><h2>{dashboard.mercadoAberto?"Ligas disponíveis para jogar":"Ligas em andamento"}</h2><Link href="/ligas">Ver todas <ArrowRight/></Link></div><div className={styles.leagueGrid}>{leagues.map(league=><article className={styles.league} key={league.id}><div className={styles.leagueIdentity}><span><Shield/></span><div><h3>{league.name}</h3><small>Rodada {round}</small></div></div><dl><div><dt>Premiação</dt><dd>{formatCurrency(league.prizePool)}</dd></div><div><dt>Entrada</dt><dd>{formatCurrency(league.entryFee)}</dd></div><div><dt>Participantes</dt><dd>{league.currentParticipants}</dd></div></dl><Link href={`/ligas/${league.id}`}>{dashboard.mercadoAberto?"Jogar":"Acompanhar"}</Link></article>)}</div></section>
 <GeneralRanking season={dashboard.mercado.temporada ?? new Date().getFullYear()} round={rankingRound} marketOpen={dashboard.mercadoAberto}/>
 <TopAthletes data={athletes} round={dashboard.mercadoAberto?Math.max(1,round-1):round} live={!dashboard.mercadoAberto&&dashboard.bolaRolando} loading={athletesLoading} error={athletesError} firstRound={dashboard.mercadoAberto&&round===1}/>
 <section className={styles.statsSection}><div className={styles.sectionHead}><h2>Estatísticas da rodada {statsRound}</h2><Link href="/central-da-rodada">Ver mais <ArrowRight/></Link></div><div className={styles.stats}>{realRoundStatistics.map((x,i)=><article key={x.label}>{i===0?<Trophy/>:<Users/>}<div><strong>{x.value}</strong><small>{x.label}</small></div></article>)}</div></section></div>;
}
