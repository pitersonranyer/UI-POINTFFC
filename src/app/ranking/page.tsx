import { Suspense } from "react";
import { FullRankingPage } from "@/components/ranking/FullRankingPage";

export default function RankingRoute() {
  return <Suspense fallback={<main className="page-shell"><p role="status">Carregando ranking...</p></main>}><FullRankingPage /></Suspense>;
}
