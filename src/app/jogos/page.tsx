"use client";

import { useSearchParams } from "next/navigation";
import { MatchDetailsPage } from "@/components/matches/MatchDetailsPage";

export default function MatchRoute() {
  const searchParams = useSearchParams();
  return <MatchDetailsPage matchId={Number(searchParams.get("partida"))} futebolId={searchParams.has("futebol") ? Number(searchParams.get("futebol")) : undefined} />;
}
