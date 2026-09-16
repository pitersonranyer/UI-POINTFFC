"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { FutebolMatches } from "@/components/matches/FutebolMatches";
import { JogosHoje } from "./JogosHoje";
import shared from "@/components/matches/FutebolMatches.module.css";
import styles from "./JogosHoje.module.css";

export function DashboardGames() {
  const [today, setToday] = useState(true);
  return <section className={shared.card} aria-label="Acompanhe os jogos">
    <header><h2>Acompanhe os jogos</h2><Link className={shared.viewAll} href="/jogos">Ver todos <ArrowRight size={14} /></Link></header>
    <div className={styles.tabs} role="group" aria-label="Selecionar jogos">
      <button type="button" aria-pressed={today} onClick={() => setToday(true)}>Hoje</button>
      <button type="button" aria-pressed={!today} onClick={() => setToday(false)}>Brasileirão</button>
    </div>
    {today ? <JogosHoje embedded /> : <FutebolMatches embedded />}
  </section>;
}
