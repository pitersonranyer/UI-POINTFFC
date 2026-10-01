import { Suspense } from "react";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Ranking | POINT FFC", "Consulte a classificação dos times e acompanhe a disputa por pontos no POINT FFC.", "/ranking/");
import { FullRankingPage } from "@/components/ranking/FullRankingPage";

export default function RankingRoute() {
  return <Suspense fallback={<main className="page-shell"><p role="status">Carregando ranking...</p></main>}><FullRankingPage /></Suspense>;
}
