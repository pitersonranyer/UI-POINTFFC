import React from "react";
import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { magoRodada31 as data, rankingSg31 } from "./rodada31";
import { magoRodada30 } from "./rodada30";
import { MagoDashboardCard } from "@/components/dashboard/MagoDashboardCard";
import CurrentPage, { metadata } from "@/app/mago/page";

afterEach(cleanup);

it("registra os nove confrontos e palpites pré-jogo sem jogos excluídos", () => {
  expect(data.placares.map(g => [g.mandante,g.visitante,g.golsMandante,g.golsVisitante])).toEqual([
    ["Botafogo","Chapecoense",2,0],["Atlético-MG","Coritiba",2,0],["Athletico-PR","Palmeiras",1,1],
    ["São Paulo","Vasco",2,0],["Fluminense","Santos",2,1],["Grêmio","Cruzeiro",1,1],
    ["Bahia","Flamengo",1,1],["Remo","Bragantino",2,1],["Corinthians","Vitória",2,0],
  ]);
  expect(data.jogos?.map(g => [g.mandante,g.visitante])).toEqual(data.placares.map(g => [g.mandante,g.visitante]));
  expect(data.jogos?.map(g => g.horario)).toEqual(["18h00","18h30","19h30","21h00","16h00","16h00","18h30","19h30","20h00"]);
  expect(rankingSg31.map(t => [t.clube,t.sg])).toEqual([
    ["Corinthians",41.44],["Atlético-MG",33.98],["Botafogo",33.84],["São Paulo",32.84],["Bahia",30.79],
    ["Fluminense",30.55],["Athletico-PR",28.70],["Palmeiras",26.09],["Flamengo",24.63],["Remo",22.98],
    ["Vasco",22.26],["Coritiba",20.55],["Grêmio",19.93],["Vitória",19.09],["Santos",18.63],["Cruzeiro",17.59],["Chapecoense",16.89],["Bragantino",16.08],
  ]);
  expect(data.topSg.map(t => t.clube)).toEqual(["Corinthians","Atlético-MG","Botafogo","São Paulo","Fluminense"]);
  expect(data.alternativas.map(t => t.clube)).toEqual(["Bahia","Athletico-PR","Palmeiras","Flamengo","Remo"]);
  expect(data.ataques.map(t => [t.clube,t.xg])).toEqual([["Remo",1.8],["Botafogo",1.78],["Grêmio",1.73],["Fluminense",1.68],["Corinthians",1.65]]);
});

it("publica somente a análise R31 e separa o histórico compacto", () => {
  render(<CurrentPage />);
  expect(screen.getByRole("heading",{level:1}).textContent).toContain("Rodada 31");
  expect(within(screen.getByRole("region",{name:"Placar Imaginário do Mago"})).getAllByRole("article")).toHaveLength(9);
  const history=screen.getByRole("region",{name:"Histórico de desempenho anterior"});
  expect(history.textContent).toContain("15/20 tendências corretas · 75%");
  expect(history.textContent).toContain("3 placares exatos");
  history.remove();
  expect(document.body.textContent).not.toMatch(/R30|Rodada 30|30 times|10\/10|Mirassol|Internacional|demonstrativos|Arquivo da prévia/);
  expect(document.body.textContent).toContain("não uma previsão estatística independente");
  expect(JSON.stringify(metadata)).toContain("Rodada 31");
  expect(JSON.stringify(metadata)).not.toContain("Fechamento");
  expect(magoRodada30.rodada).toBe(30);
  expect(magoRodada30.placares).toHaveLength(10);
  expect(magoRodada30.fechamento?.indicadores.tendenciasCorretas).toBe(8);
});

it("mostra a R31 no Dashboard sem chamada de fechamento", () => {
  render(<MagoDashboardCard data={data} />);
  expect(screen.getByText("Rodada 31")).toBeTruthy();
  expect(screen.getByRole("article",{name:"1 de 4: SG do Mago"}).textContent).toContain("Corinthians41,44%");
  expect(screen.getByRole("article",{name:"2 de 4: Melhores ataques"}).textContent).toContain("Remo1,80 xG");
  expect(screen.getByRole("link",{name:/Ver análise completa/}).getAttribute("href")).toMatch(/^\/mago\/?$/);
  expect(document.body.textContent).not.toContain("Ver fechamento");
});
