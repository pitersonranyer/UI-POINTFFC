import { Suspense } from "react";
import { DesafioDetailPage } from "@/components/desafios/DesafioDetailPage";
export default function Page() { return <Suspense fallback={<p className="page-shell" role="status">Carregando Desafio...</p>}><DesafioDetailPage /></Suspense>; }
