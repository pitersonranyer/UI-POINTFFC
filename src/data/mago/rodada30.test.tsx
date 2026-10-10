import React from "react";
import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { magoRodada30 as data } from "./rodada30";
import { MagoPage } from "@/components/mago/MagoPage";
import { MagoDashboardCard } from "@/components/dashboard/MagoDashboardCard";

afterEach(cleanup);

it("preserva os indicadores fornecidos, a ausência de xGA e a ordem editorial", () => {
  expect(data.indicadores?.map(t => [t.clube, t.xgRodada, t.xgTotal, t.gols, t.sg])).toEqual([
    ["Flamengo",1.83,43.7,55,39.29], ["Vasco",1.81,44.4,36,36.54], ["São Paulo",1.76,35.3,33,40.51], ["Bahia",1.76,42.3,43,35.71], ["Bragantino",1.60,34.4,34,33.75], ["Atlético-MG",1.50,34.6,37,26.09], ["Botafogo",1.50,37.9,42,25.21], ["Grêmio",1.47,33.4,31,26.92], ["Coritiba",1.37,29.8,37,22.31], ["Palmeiras",1.36,41.9,47,40.93], ["Athletico-PR",1.35,46.6,43,25.70], ["Chapecoense",1.35,27.4,29,25.72], ["Internacional",1.33,37.5,32,22.76], ["Santos",1.32,33.4,43,22.03], ["Cruzeiro",1.09,41.3,44,20.57], ["Mirassol",1.04,36.9,34,17.09], ["Remo",1.01,34.8,33,16.55], ["Fluminense",.91,39.3,44,16.00], ["Corinthians",.90,33.1,30,25.73], ["Vitória",.89,29.8,32,17.68],
  ]);
  expect(data.indicadores?.filter(t => t.xga !== undefined).map(t => [t.clube,t.xga,t.golsSofridos])).toEqual([
    ["Flamengo",9.24,10], ["São Paulo",11.67,12], ["Bahia",12.22,14], ["Bragantino",12.15,15], ["Grêmio",24.10,16], ["Palmeiras",10.32,9], ["Cruzeiro",24.55,24], ["Remo",24.63,28], ["Fluminense",25.69,22], ["Vitória",26.37,30],
  ]);
  expect(data.topSg.map(t => t.clube)).toEqual(["Palmeiras","São Paulo","Flamengo","Vasco","Bahia"]);
  expect(data.alternativas.map(t => t.clube)).toEqual(["Bragantino","Grêmio","Atlético-MG","Athletico-PR","Botafogo"]);
  expect(data.editorial?.estrategia.reduce((sum,t) => sum+t.quantidade,0)).toBe(30);
});

it("mostra os dez placares e horários no HTML, com fonte e limites estatísticos", () => {
  render(<MagoPage data={data} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Rodada 30");
  expect(document.body.textContent).not.toMatch(/gato[\s_-]*mestre/i);
  const predictions = screen.getByRole("region", { name: "Placar Imaginário do Mago" });
  const cards = within(predictions).getAllByRole("article");
  expect(cards.map(card => card.textContent?.replace(/\s+/g," ").trim())).toEqual([
    "Projeção com SGSábado, 10/10 · 18hVasco2 x 0Remo", "Projeção com SGSábado, 10/10 · 21hSão Paulo2 x 0Vitória", "Placar projetadoDomingo, 11/10 · 16hAtlético-MG2 x 1Santos", "Projeção com SGDomingo, 11/10 · 17h30Flamengo2 x 0Fluminense", "Projeção com SGDomingo, 11/10 · 17h30Palmeiras2 x 0Corinthians", "Placar projetadoDomingo, 11/10 · 17h30Grêmio1 x 1Internacional", "Projeção com SGDomingo, 11/10 · 19h30Bahia2 x 0Mirassol", "Placar projetadoSegunda-feira, 12/10 · 16hCoritiba1 x 1Botafogo", "Placar projetadoSegunda-feira, 12/10 · 19h30Chapecoense1 x 1Athletico-PR", "Placar projetadoSegunda-feira, 12/10 · 21hRB Bragantino2 x 1Cruzeiro",
  ]);
  expect(predictions.textContent).toContain("nem placares exatos calculados");
  expect(screen.getByRole("region", { name: "Indicadores da R30" }).textContent).toContain("Probabilidade de SG: chance de não sofrer gols");
  expect(screen.getByRole("region", { name: "O Mago está de olho" }).textContent).toContain("às 18h");
});

it("resume a R30 no Dashboard com Palmeiras, São Paulo, Flamengo e alerta de escalações", () => {
  render(<MagoDashboardCard data={data} />);
  const card = screen.getByRole("region", { name: "Mago do Point Fantasy" });
  expect(card.textContent).toContain("Rodada 30");
  expect(card.textContent).not.toMatch(/gato[\s_-]*mestre/i);
  expect(card.textContent).toContain("Curadoria editorial: POINT FFC");
  expect(within(card).getByRole("article", { name: "1 de 4: SG do Mago" }).textContent).toContain("Palmeiras40,93%");
  expect(within(card).getAllByRole("listitem").slice(0,3).map(t => t.textContent)).toEqual(["Palmeiras40,93%","São Paulo40,51%","Flamengo39,29%"]);
  expect(card.textContent).toContain("Escalações sob observação");
  expect(within(card).getByRole("link", { name: /Ver análise completa/ }).getAttribute("href")).toBe("/mago");
});
