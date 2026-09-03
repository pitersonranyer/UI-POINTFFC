"use client";
import Link from "next/link";
import { ArrowLeft, ImageOff, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { escudoClube, nomeClube } from "@/lib/cartola";
import type { CartolaClub, CartolaScoredAthlete } from "@/types/cartola";
import styles from "./AthleteScoresPage.module.css";
import paginationStyles from "./Pagination.module.css";

const positionNames:Record<number,string>={1:"GOL",2:"LAT",3:"ZAG",4:"MEI",5:"ATA",6:"TEC"};
const scoreFormat=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const PAGE_SIZE=30;

export function AthleteScoresPage(){
 const {dashboard,loading,error,atualizar,athletes,athletesLoading,athletesError}=useCartolaDashboard();
 const [page,setPage]=useState(1); const rankingRef=useRef<HTMLElement>(null);
 useEffect(()=>{setPage(1)},[athletes]);
 if(loading&&!dashboard)return <main className={styles.shell}><div className={styles.loading}><RefreshCw/> Carregando pontuações...</div></main>;
 if(!dashboard)return <main className={styles.shell}><div className={styles.error}><p>Não foi possível carregar as informações da rodada.</p><button onClick={atualizar}>Tentar novamente</button></div></main>;
 const firstRound=dashboard.mercadoAberto&&dashboard.rodada===1;
 const displayedRound=dashboard.mercadoAberto?Math.max(1,dashboard.rodada-1):dashboard.rodada;
 const ranking=athletes?Object.entries(athletes.atletas).map(([id,athlete])=>({id,athlete})).sort((a,b)=>b.athlete.pontuacao-a.athlete.pontuacao):[];
 const totalPages=Math.max(1,Math.ceil(ranking.length/PAGE_SIZE)); const visibleRanking=ranking.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 const changePage=(next:number)=>{setPage(Math.min(totalPages,Math.max(1,next)));rankingRef.current?.scrollIntoView({behavior:"smooth",block:"start"});};
 return <main className={styles.shell}>
  <Link className={styles.back} href="/"><ArrowLeft/> Voltar ao Dashboard</Link>
  <section className={styles.hero}><div><span className={styles.eyebrow}>Brasileirão • Rodada {displayedRound}</span><h1>Pontuação dos atletas</h1><p>{dashboard.mercadoAberto?`Destaques consolidados da rodada ${displayedRound}.`:`Acompanhe a pontuação da rodada ${displayedRound}.`}</p></div><div className={styles.roundInfo}><Trophy/><span><small>Atletas pontuados</small><strong>{athletes?.total_atletas??ranking.length}</strong></span></div></section>
  <div className={styles.statusBar}><span className={dashboard.mercadoAberto?styles.open:styles.closed}>Mercado {dashboard.mercadoAberto?"aberto":"fechado"}</span>{!dashboard.mercadoAberto&&dashboard.bolaRolando&&<b>● Ao vivo</b>}<small>Exibindo rodada {displayedRound}</small></div>
  <section className={styles.ranking} ref={rankingRef}><header><div><h2>Classificação da rodada</h2><p>Ordenada pela maior pontuação</p></div><button type="button" onClick={atualizar} aria-label="Atualizar pontuações"><RefreshCw/> Atualizar</button></header>
   {firstRound?<p className={styles.feedback}>Os destaques dos atletas aparecerão após a primeira rodada.</p>:athletesLoading&&!athletes?<div className={styles.skeleton}/>:athletesError&&!athletes?<div className={styles.feedback}><p>Não foi possível carregar a pontuação dos atletas.</p><button onClick={atualizar}>Tentar novamente</button></div>:ranking.length?<><ol className={styles.list}>{visibleRanking.map(({id,athlete},index)=><Athlete key={id} athlete={athlete} club={athlete.clube_id?athletes?.clubes?.[String(athlete.clube_id)]:undefined} rank={(page-1)*PAGE_SIZE+index+1}/>)}</ol>{totalPages>1&&<Pagination page={page} total={totalPages} onChange={changePage}/>}</>:<p className={styles.feedback}>Ainda não existem atletas pontuados nesta rodada.</p>}
   {(athletesError||error)&&athletes&&<small className={styles.updateError}>Não foi possível obter a atualização mais recente. Exibindo os últimos dados válidos.</small>}
  </section>
 </main>;
}

function Pagination({page,total,onChange}:{page:number;total:number;onChange:(page:number)=>void}){const pages=Array.from({length:total},(_,index)=>index+1).filter(value=>value===1||value===total||Math.abs(value-page)<=1);return <nav className={paginationStyles.pagination} aria-label="Páginas do ranking"><button disabled={page===1} onClick={()=>onChange(page-1)}>Anterior</button><div>{pages.map((value,index)=><span key={value}>{index>0&&value-pages[index-1]>1&&<i>…</i>}<button className={value===page?paginationStyles.current:""} aria-current={value===page?"page":undefined} onClick={()=>onChange(value)}>{value}</button></span>)}</div><button disabled={page===total} onClick={()=>onChange(page+1)}>Próxima</button></nav>}

function Athlete({athlete,club,rank}:{athlete:CartolaScoredAthlete;club?:CartolaClub;rank:number}){
 const clubName=club&&athlete.clube_id?nomeClube(club,athlete.clube_id):null;const shield=club?escudoClube(club):null;
 return <li><strong className={styles.rank}>{rank}º</strong><span className={styles.photo}>{shield&&<img src={shield} alt={`Escudo do ${club?.nome??clubName}`} onError={event=>{event.currentTarget.style.display="none";event.currentTarget.nextElementSibling?.removeAttribute("hidden");}}/>}<i hidden={Boolean(shield)}><ImageOff/></i></span><span className={styles.identity}><span style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}><b style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{athlete.apelido}</b><EventBadges athlete={athlete}/></span><small><em>{positionNames[athlete.posicao_id]??"--"}</em><span style={{paddingLeft:6,borderLeft:"1px solid #d9dedb"}}>{clubName??"Sem clube"}</span></small></span>{athlete.isMagoPick&&<span className={styles.mago}><Sparkles/> Dica do Mago</span>}<span style={{minWidth:72,textAlign:"right"}}><strong className={`${styles.points} ${athlete.pontuacao<0?styles.negative:""}`}>{scoreFormat.format(athlete.pontuacao)} <small>pts</small></strong><ScoutSummary athlete={athlete}/></span></li>;
}
function EventBadges({athlete}:{athlete:CartolaScoredAthlete}){const scout=athlete.scout??{};const items=[{key:"G",icon:"⚽",label:"gol"},{key:"A",icon:"👟",label:"assistência"},{key:"SG",icon:"5",label:"saldo de gols",bonus:true},{key:"GC",icon:"⚽",label:"gol contra",negative:true},{key:"CA",icon:"🟨",label:"cartão amarelo"},{key:"CV",icon:"🟥",label:"cartão vermelho"}].map(item=>({...item,count:scout[item.key]??0})).filter(item=>item.count>0);if(!items.length)return null;return <span style={{display:"inline-flex",alignItems:"center",flexShrink:0,gap:4,fontSize:13,fontStyle:"normal"}}>{items.map(item=><span key={item.key} title={item.bonus?"5 pontos por saldo de gols":`${item.count} ${item.label}`} aria-label={item.bonus?"5 pontos por saldo de gols":`${item.count} ${item.label}`} style={item.bonus?{display:"inline-grid",placeItems:"center",minWidth:17,height:17,padding:"0 2px",borderRadius:3,color:"#fff",background:"#16a34a",fontSize:11,fontWeight:900}:item.negative?{display:"inline-grid",placeItems:"center",width:19,height:19,border:"1px solid #dc2626",borderRadius:"50%",background:"#fff",fontSize:11}:undefined}>{item.icon}{!item.bonus&&item.count>1&&<b style={{fontSize:9}}>{item.count}</b>}</span>)}</span>}
function ScoutSummary({athlete}:{athlete:CartolaScoredAthlete}){const scout=athlete.scout??{};const items=["G","A","SG","GC","CA","CV"].map(key=>({key,count:scout[key]??0})).filter(item=>item.count>0);if(!items.length)return null;return <small style={{display:"block",marginTop:4,color:"#16a34a",fontSize:10,fontWeight:800,whiteSpace:"nowrap"}}>{items.map((item,index)=><span key={item.key} style={item.key==="GC"||item.key==="CA"||item.key==="CV"?{color:"#dc2626"}:undefined}>{index>0&&", "}{item.count>1?item.count:""}{item.key}</span>)}</small>}
