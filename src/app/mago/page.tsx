import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada30 } from "@/data/mago/rodada30";

export const metadata = publicMetadata(
  `Dicas do Cartola — Rodada ${magoRodada30.rodada} | Mago do POINT`,
  `Explore a rodada ${magoRodada30.rodada} de 2026: Palmeiras como escolha inicial, São Paulo e Flamengo em destaque, probabilidades de SG e alertas de escalação.`,
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada30} />;
}
