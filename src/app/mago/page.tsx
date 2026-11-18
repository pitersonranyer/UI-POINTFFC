import React from "react";
import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada35 } from "@/data/mago/rodada35";

export const metadata = publicMetadata(
  "Mago POINT FFC — Rodada 35 | POINT FFC",
  "Análise editorial da Rodada 35: favoritos ao SG, alternativas, projeção ofensiva, Radar Fora da Caixa e Placar Imaginário do Mago.",
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada35} />;
}
