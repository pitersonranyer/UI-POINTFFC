"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CartolaClub, CartolaMatch, CartolaScoredAthletesResponse } from "@/types/cartola";
import { useState } from "react";
import { AthleteRow, AthleteDetails } from "../athletes/AthleteRanking";
import rankingStyles from "../athletes/AthleteScoresPage.module.css";
import styles from "./TopAthletes.module.css";
export function TopAthletes({data,round,season,live,loading,error,firstRound,clubs={},matches=[]}:{data:CartolaScoredAthletesResponse|null;round:number;season?:number;live:boolean;loading:boolean;error:string|null;firstRound:boolean;clubs?:Record<string,CartolaClub>;matches?:CartolaMatch[]}){
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const selected=selectedId?data?.atletas[selectedId]:undefined;
 const athletes=data?Object.entries(data.atletas).map(([id,athlete])=>({id,athlete})).sort((a,b)=>b.athlete.pontuacao-a.athlete.pontuacao).slice(0,5):[];
 return <section className={styles.section}><div className={styles.heading}><div><h2>Melhores da Rodada {round}</h2>{live&&<span className={styles.live}>● Ao vivo</span>}</div><Link href="/pontuacao-atletas">Ver todos <ArrowRight/></Link></div>
  {firstRound?<p className={styles.feedback}>Os destaques dos atletas aparecerão após a primeira rodada.</p>:loading&&!data?<div className={styles.skeleton} aria-label="Carregando melhores atletas"/>:error&&!data?<p className={styles.feedback}>Não foi possível carregar os melhores atletas.</p>:athletes.length?<ol className={rankingStyles.list}>{athletes.map(({id,athlete},index)=><AthleteRow key={id} athlete={athlete} club={athlete.clube_id?data?.clubes?.[String(athlete.clube_id)]:undefined} rank={index+1} onOpen={()=>setSelectedId(id)}/>)}</ol>:<p className={styles.feedback}>Ainda não há pontuações disponíveis.</p>}
  {error&&data&&<small className={styles.updateError}>Exibindo a última atualização disponível.</small>}
 {selected&&selectedId&&!firstRound&&<AthleteDetails key={selectedId} athleteId={selectedId} season={season} athlete={selected} club={selected.clube_id?data?.clubes?.[String(selected.clube_id)]:undefined} clubs={clubs} matches={matches} round={round} onClose={()=>setSelectedId(null)}/>}
 </section>;
}
