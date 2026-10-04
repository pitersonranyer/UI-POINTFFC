import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada28 } from "@/data/mago/rodada28";

export const metadata = publicMetadata(
  `Dicas do Cartola — Rodada ${magoRodada28.rodada} | Mago do POINT`,
  `Explore a prévia editorial do Mago para a rodada ${magoRodada28.rodada}, com dicas do Cartola, análises de SG, ataques e placares projetados em dados demonstrativos.`,
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada28} />;
}
