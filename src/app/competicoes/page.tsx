"use client";
import { useSearchParams } from "next/navigation";
import { PointCompetitionPage } from "@/components/leagues/PointCompetitionPage";
export default function Page() { const id = Number(useSearchParams().get("id")); return Number.isSafeInteger(id) && id > 0 ? <PointCompetitionPage id={id} /> : <main className="page-shell"><p role="alert">Competição inválida.</p></main>; }
