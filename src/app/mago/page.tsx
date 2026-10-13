import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada30 } from "@/data/mago/rodada30";

export const metadata = publicMetadata(
  `O Mago presta contas — Rodada ${magoRodada30.rodada} | POINT FFC`,
  `Fechamento da Rodada ${magoRodada30.rodada}: 80% de acerto nas tendências, três placares exatos e análise do desempenho defensivo.`,
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada30} />;
}
