"use client";
import { LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fechamentoEm } from "@/lib/cartola";
import type { CartolaMarketStatus as Market } from "@/types/cartola";
import styles from "./Dashboard.module.css";
const parts = (target: number | null) => { const d = Math.max(0, (target ?? Date.now()) - Date.now()); return [Math.floor(d/86400000),Math.floor(d/3600000)%24,Math.floor(d/60000)%60,Math.floor(d/1000)%60]; };
export function CartolaMarketStatus({ mercado, aberto, aoVivo, atualizar }: { mercado: Market; aberto: boolean; aoVivo: boolean; atualizar: () => void }) {
  const target=fechamentoEm(mercado); const [time,setTime]=useState(()=>parts(target)); const refreshed=useRef(false); const labels=["dias","horas","min","seg"];
  useEffect(()=>{refreshed.current=false;const update=()=>{setTime(parts(target));if(target&&Date.now()>=target&&!refreshed.current){refreshed.current=true;atualizar();}};update();const timer=window.setInterval(update,1000);return()=>window.clearInterval(timer);},[target,atualizar]);
  return <section className={styles.market}><div className={styles.marketHead}><div className={styles.marketTitle}>{aberto?<UnlockKeyhole/>:<LockKeyhole/>}<div><small>Mercado</small><strong>{aberto?"Aberto":"Fechado"} <i/></strong></div></div>{!aberto&&aoVivo&&<b className={styles.live}>● Ao vivo</b>}</div>{aberto?<>{target?<><span className={styles.closes}>Fecha em</span><div className={styles.timer}>{time.map((value,index)=><div key={labels[index]}><strong>{String(value).padStart(2,"0")}</strong><small>{labels[index]}</small></div>)}</div></>:<span className={styles.closes}>Fechamento a definir</span>}<p>O mercado fecha 1 minuto antes do primeiro jogo.</p></>:<p>O mercado está fechado para a rodada. Acompanhe os jogos e placares.</p>}</section>;
}
