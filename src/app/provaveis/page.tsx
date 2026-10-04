import { publicMetadata } from "@/lib/seo";
import { ProbableTeams } from "@/components/probables/ProbableTeams";

export const metadata = publicMetadata("Prováveis do Cartola | Escalações da Rodada | POINT FFC", "Consulte os jogadores prováveis do Cartola por clube para a rodada. Confira também os atletas em dúvida, suspensos e contundidos conforme os status do mercado.", "/provaveis/");

export default function ProbablesPage() {
  return (
    <div className="page-shell">
      <p className="eyebrow">Mercado do Cartola</p>
      <h1 className="page-title">Prováveis do Cartola</h1>
      <p className="page-subtitle">Escolha um clube para consultar os jogadores prováveis da rodada e os atletas em dúvida, suspensos ou contundidos, conforme os status do mercado do Cartola.</p>
      <ProbableTeams />
    </div>
  );
}
