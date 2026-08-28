"use client";
import Link from "next/link";
import { ArrowRight, ImageOff, Sparkles } from "lucide-react";
import type { CartolaClub, CartolaScoredAthlete, CartolaScoredAthletesResponse } from "@/types/cartola";
import { escudoClube, nomeClube } from "@/lib/cartola";
import styles from "./TopAthletes.module.css";
const positions:Record<number,string>={1:"GOL",2:"LAT",3:"ZAG",4:"MEI",5:"ATA",6:"TEC"};
const points=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
export function TopAthletes({data,round,live,loading,error,firstRound}:{data:CartolaScoredAthletesResponse|null;round:number;live:boolean;loading:boolean;error:string|null;firstRound:boolean}){
 const athletes=data?Object.entries(data.atletas).map(([id,athlete])=>({id,athlete})).sort((a,b)=>b.athlete.pontuacao-a.athlete.pontuacao).slice(0,15):[];
 return <section className={styles.section}><div className={styles.heading}><div><h2>Melhores da Rodada {round}</h2>{live&&<span className={styles.live}>● Ao vivo</span>}</div><Link href="/pontuacao-atletas">Ver todos <ArrowRight/></Link></div>
  {firstRound?<p className={styles.feedback}>Os destaques dos atletas aparecerão após a primeira rodada.</p>:loading&&!data?<div className={styles.skeleton} aria-label="Carregando melhores atletas"/>:error&&!data?<p className={styles.feedback}>Não foi possível carregar os melhores atletas.</p>:athletes.length?<ol className={styles.list}>{athletes.map(({id,athlete},index)=><AthleteRow key={id} athlete={athlete} club={athlete.clube_id?data?.clubes?.[String(athlete.clube_id)]:undefined} rank={index+1}/>)}</ol>:<p className={styles.feedback}>Ainda não há pontuações disponíveis.</p>}
  {error&&data&&<small className={styles.updateError}>Exibindo a última atualização disponível.</small>}
 </section>;
}
function AthleteRow({athlete,club,rank}:{athlete:CartolaScoredAthlete;club?:CartolaClub;rank:number}){const photo=athlete.foto?.replace("FORMATO","140x140");const clubName=club&&athlete.clube_id?nomeClube(club,athlete.clube_id):null;const shield=club?escudoClube(club):null;return <li><strong className={styles.rank}>{rank}º</strong><span className={styles.photo}>{photo?<img src={photo} alt={`Foto de ${athlete.apelido}`} onError={event=>{event.currentTarget.style.display="none";event.currentTarget.nextElementSibling?.removeAttribute("hidden");}}/>:null}<i hidden={Boolean(photo)}><ImageOff/></i></span><span className={styles.identity}><b>{athlete.apelido}</b><small><em>{positions[athlete.posicao_id]??"--"}</em>{shield&&<img src={shield} alt={`Escudo do ${club?.nome??clubName}`}/>} {clubName}</small></span>{athlete.isMagoPick&&<span className={styles.mago}><Sparkles/> Dica do Mago</span>}<strong className={styles.points}>{points.format(athlete.pontuacao)} <small>pts</small></strong></li>}
