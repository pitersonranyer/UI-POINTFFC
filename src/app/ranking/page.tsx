import { Suspense } from "react";
import Link from "next/link";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Ranking de Times do POINT FFC | Classificação da Rodada", "Consulte o ranking de times do POINT FFC por rodada. Veja pontuações e posições e encontre times pelo nome ou pelo cartoleiro.", "/ranking/");
import { FullRankingPage } from "@/components/ranking/FullRankingPage";
import styles from "@/components/ranking/FullRankingPage.module.css";

export default function RankingRoute() {
  return <main className={`page-shell ${styles.page}`}>
    <Link className={styles.back} href="/">← Dashboard</Link>
    <header className={styles.hero}><span>POINT FFC</span><h1>Ranking de Times do POINT FFC</h1><p>Consulte a classificação dos times no POINT FFC por rodada, com posições e pontuações. Busque pelo nome do time ou do cartoleiro.</p></header>
    <Suspense fallback={<p role="status">Carregando ranking...</p>}><FullRankingPage /></Suspense>
  </main>;
}
