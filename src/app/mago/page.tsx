import type { Metadata } from "next";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada28 } from "@/data/mago/rodada28";

export const metadata: Metadata = {
  title: "Mago do Point Fantasy | Inteligência para a sua rodada",
  description: "Análise do Mago para a rodada 27: melhores SGs, ataques e placares projetados.",
};

export default function Page() {
  return <MagoPage data={magoRodada28} />;
}
