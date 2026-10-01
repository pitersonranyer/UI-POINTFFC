import { publicMetadata } from "@/lib/seo";
import { ProbableTeams } from "@/components/probables/ProbableTeams";

export const metadata = publicMetadata("Prováveis | POINT FFC", "Confira os jogadores prováveis, dúvidas e desfalques de cada clube.", "/provaveis/");

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
