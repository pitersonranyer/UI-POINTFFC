"use client";
import { Suspense } from "react";
import { AwardsManager } from "@/components/admin/AwardsManager";
export default function Page() { return <Suspense fallback={<p role="status">Carregando premiações...</p>}><AwardsManager /></Suspense>; }
