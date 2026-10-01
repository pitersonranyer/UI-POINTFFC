import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada28 } from "@/data/mago/rodada28";

export const metadata = publicMetadata(
  "Mago do Point Fantasy | Inteligência para a sua rodada",
  `Análise do Mago para a rodada ${magoRodada28.rodada}: melhores SGs, ataques e placares projetados.`,
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada28} />;
}
