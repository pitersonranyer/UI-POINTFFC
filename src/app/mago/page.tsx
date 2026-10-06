import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada29 } from "@/data/mago/rodada29";

export const metadata = publicMetadata(
  `Dicas do Cartola — Rodada ${magoRodada29.rodada} | Mago do POINT`,
  `Explore a prévia editorial do Mago para a rodada ${magoRodada29.rodada}, com pelotões próprios, Top 5 SG, projeções de ataques e alertas de contexto para sua escalação.`,
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada29} />;
}
