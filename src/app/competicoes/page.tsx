"use client";
import { useSearchParams } from "next/navigation";
import { PointCompetitionPage } from "@/components/leagues/PointCompetitionPage";
export default function Page() { const params = useSearchParams(); const id = Number(params.get("id")); return Number.isSafeInteger(id) && id > 0 ? <PointCompetitionPage key={`${id}-${params.get("aba")}`} id={id} initialTab={params.get("aba") === "ranking" ? "Ranking" : "Visão geral"} /> : <main className="page-shell"><p role="alert">Competição inválida.</p></main>; }
