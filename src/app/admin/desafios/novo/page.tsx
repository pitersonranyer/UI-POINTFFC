import { Suspense } from "react";
import { DesafioEditor } from "@/components/admin/desafios/DesafioEditor";
export default function Page() { return <Suspense fallback={<p role="status">Carregando formulário...</p>}><DesafioEditor mode="create" /></Suspense>; }
