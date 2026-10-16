import React from "react";
import Link from "next/link";
import { noIndexMetadata } from "@/lib/seo";
import { FantasyLineupBuilder } from "@/components/point-fantasy/lineups/FantasyLineupBuilder";
import styles from "@/components/point-fantasy/lineups/LineupBuilder.module.css";

export const metadata = { ...noIndexMetadata, title:"Monte sua escalação | POINT FFC FANTASY" };
export default function FantasyLineupPage() {
  return <div className={`page-shell ${styles.builder}`}><header className={styles.hero}><p className="eyebrow">Monte sua estratégia</p><h1>POINT FFC FANTASY</h1><p>A estratégia escala. Ative o Reserva Power!</p><Link href="/point-fantasy/atletas/">Catálogo de atletas →</Link></header><FantasyLineupBuilder /></div>;
}
