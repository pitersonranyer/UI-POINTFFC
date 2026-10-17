import React from "react";
import { publicMetadata } from "@/lib/seo";
import { MagoPage } from "@/components/mago/MagoPage";
import { magoRodada31 } from "@/data/mago/rodada31";

export const metadata = publicMetadata(
  `Mago do POINT — Rodada ${magoRodada31.rodada} | POINT FFC`,
  `Análise da Rodada ${magoRodada31.rodada}: nove jogos, ranking de SG, pelotões, Top 5 xG e Placar Imaginário. Projeções pré-jogo do POINT FFC.`,
  "/mago/",
);

export default function Page() {
  return <MagoPage data={magoRodada31} />;
}
