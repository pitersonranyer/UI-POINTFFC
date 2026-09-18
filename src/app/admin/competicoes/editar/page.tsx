"use client";
import { Suspense } from "react";
import { CompetitionForm } from "@/components/admin/CompetitionForm";
export default function Page() { return <Suspense fallback={<p role="status">Carregando formulário...</p>}><CompetitionForm mode="edit" /></Suspense>; }
