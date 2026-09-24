"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { pointLeagueService, type Competition } from "@/services/pointLeagueService";
import styles from "./FeaturedLeagueCard.module.css";

function leagueStatus(competitions: Competition[]) {
  const now = Date.now();
  const open = competitions.some(item => item.status === "INSCRICOES_ABERTAS"
    && (item.inicioInscricao === null || Date.parse(item.inicioInscricao) <= now)
    && (item.fimInscricao === null || Date.parse(item.fimInscricao) >= now));
  if (open) return "Competições abertas";
  if (competitions.some(item => item.status === "INSCRICOES_ENCERRADAS" || item.status === "EM_ANDAMENTO")) return "Competições em andamento";
  return null;
}

export function FeaturedLeagueCard({ name, round }: { name: string; round: number }) {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    let active = true, running = false;
    const refresh = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const competitions = await pointLeagueService.competitions();
        if (active) setStatus(leagueStatus(competitions));
      } catch { if (active) setStatus(null); }
      finally { running = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [round]);

  return <section className={styles.card} aria-label="Liga em destaque">
    <div className={styles.identity}>
      <span className={styles.eyebrow}>Liga em destaque</span>
      <h2 className={styles.logo}><Image src="/brand/pointffc-logo.png" alt={name} width={2172} height={724} unoptimized /></h2>
      <p className={styles.description}>Fantasy da rodada do Brasileirão</p>
      <p className={`${styles.status} ${status ? styles.confirmed : ""}`}>
        {status && <span aria-hidden="true" />}{status ?? `Competições da rodada ${round}`}
      </p>
    </div>
    <div className={styles.actions}>
      <div className={styles.round} aria-label={`Rodada ${round}`}><span>Rodada</span><strong>{round}</strong></div>
      <Link href="/ligas/point-ffc" className={styles.cta} aria-label="Ver liga">Ver liga <span aria-hidden="true">→</span></Link>
    </div>
  </section>;
}
