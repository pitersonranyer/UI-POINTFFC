import type { Metadata } from "next";
import { ProbableTeams } from "@/components/probables/ProbableTeams";

export const metadata: Metadata = {
  title: "Prováveis | POINT FFC",
  description: "Confira os jogadores prováveis, dúvidas e desfalques de cada clube.",
};

export default function ProbablesPage() {
  return (
    <div className="page-shell">
      <p className="eyebrow">Mercado do Cartola</p>
      <h1 className="page-title">Prováveis da rodada</h1>
      <p className="page-subtitle">Escolha um clube para visualizar os atletas disponíveis e a situação do elenco.</p>
      <ProbableTeams />
    </div>
  );
}
