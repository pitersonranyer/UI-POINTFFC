"use client";

import { useSearchParams } from "next/navigation";
import { MatchDetailsPage } from "@/components/matches/MatchDetailsPage";
import { FutebolGamesPage } from "@/components/matches/FutebolGamesPage";

export default function MatchRoute() {
  const searchParams = useSearchParams();
  if (!searchParams.has("partida") && !searchParams.has("futebol")) return <FutebolGamesPage />;
  return <MatchDetailsPage matchId={Number(searchParams.get("partida"))} futebolId={searchParams.has("futebol") ? Number(searchParams.get("futebol")) : undefined} />;
}
