"use client";
import { useSearchParams } from "next/navigation";
import { TeamDetailPage } from "@/components/teams/TeamDetailPage";
export default function TeamDetailRoute() { const params = useSearchParams(); return <TeamDetailPage timeId={Number(params.get("timeId"))} />; }
