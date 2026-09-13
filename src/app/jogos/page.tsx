"use client";

import { useSearchParams } from "next/navigation";
import { MatchDetailsPage } from "@/components/matches/MatchDetailsPage";
import { FutebolGamesPage } from "@/components/matches/FutebolGamesPage";
import { codigoCompeticao } from "@/data/futebolCompeticoes";

export default function MatchRoute() {
  const searchParams = useSearchParams();
  if (!searchParams.has("partida") && !searchParams.has("futebol")) return <FutebolGamesPage initialCodigo={codigoCompeticao(searchParams.get("competicao"))} />;
  return <MatchDetailsPage matchId={Number(searchParams.get("partida"))} futebolId={searchParams.has("futebol") ? Number(searchParams.get("futebol")) : undefined} codigo={codigoCompeticao(searchParams.get("competicao"))} />;
}
