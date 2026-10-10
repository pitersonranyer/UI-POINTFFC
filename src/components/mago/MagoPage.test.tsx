import React from "react";
import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MagoPage } from "./MagoPage";
import { magoRodada28 } from "@/data/mago/rodada28";
import { magoRodada29 } from "@/data/mago/rodada29";
import { metadata } from "@/app/mago/page";

afterEach(cleanup);

describe("Mago da rodada 29", () => {
  it("mantém a ordem editorial, os dois pelotões e os dados defensivos disponíveis", () => {
    const { container } = render(<MagoPage data={magoRodada29} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Rodada 29");
    const ranking = screen.getByRole("region", { name: "Top SG da rodada" });
    expect(within(ranking).getAllByRole("heading", { level: 3 }).map(node => node.textContent)).toEqual(["Vitória", "Athletico-PR", "Palmeiras", "Bragantino", "Internacional"]);
    const alternatives = screen.getByRole("region", { name: "Alternativas no radar" });
    expect(within(alternatives).getAllByRole("heading", { level: 3 }).map(node => node.textContent)).toEqual(["Fluminense", "Cruzeiro", "Flamengo", "Botafogo", "Santos"]);
    expect(screen.getByRole("region", { name: "Pelotões do Mago" })).toBeTruthy();
    expect(container.textContent).toContain("A classificação expressa a curadoria editorial do POINT FFC");
    expect(container.textContent).not.toMatch(/Rodada 28|rodada 28|R28|Pelotões dos Especialistas/);
    const inter = within(ranking).getAllByRole("article")[4];
    expect(inter.textContent).toContain("xGA do Internacional não foi fornecido");
    expect(within(inter).queryByText("xGA", { selector: "dt" })).toBeNull();
    expect(magoRodada29.indicadores).toHaveLength(20);
    expect(magoRodada29.indicadores?.filter(team => team.xga !== undefined)).toHaveLength(10);
  });

  it("explica o contexto do Flamengo, a volatilidade do Bragantino e o empate nos ataques", () => {
    render(<MagoPage data={magoRodada29} />);
    const flamengo = screen.getByRole("region", { name: "Flamengo" });
    expect(flamengo.textContent).toContain("5 vitórias nos últimos 6 jogos");
    expect(flamengo.textContent).toContain("boa opção defensiva");
    expect(flamengo.textContent).toContain("Os números gostam. O momento pede cautela.");
    expect(screen.getByRole("region", { name: "Bragantino" }).textContent).toContain("volatilidade");
    expect(screen.getByRole("region", { name: "Santos x Flamengo" }).textContent).toContain("não de derrota prevista");
    const attacks = screen.getByRole("region", { name: "Melhores ataques" });
    expect(within(attacks).getAllByRole("listitem")).toHaveLength(8);
    expect(attacks.textContent).toContain("Athletico-PR, Fluminense e Botafogo");
    expect(attacks.textContent).toContain("não uma previsão exata de gols");
    expect(screen.getByRole("region", { name: "Jogos da rodada" }).querySelectorAll("article")).toHaveLength(10);
    expect(screen.queryByRole("region", { name: "Placares do Mago" })).toBeNull();
    expect(magoRodada29.placares).toEqual([]);
  });

  it("atualiza metadata sem perder canonical e redes sociais", () => {
    expect(metadata.title).toContain("Rodada 30");
    expect(metadata.description).toContain("rodada 30");
    expect(JSON.stringify(metadata)).not.toMatch(/gato[\s_-]*mestre/i);
    expect(metadata.alternates?.canonical).toBe("https://pointffc.com.br/mago/");
    expect(metadata.openGraph).toBeTruthy(); expect(metadata.twitter).toBeTruthy();
  });
});

describe("Mago da rodada 28", () => {
  it("apresenta a escolha principal e mantém a ordem editorial dos cinco SGs", () => {
    render(<MagoPage data={magoRodada28} />);
    const pick = screen.getByRole("region", { name: "Flamengo" });
    expect(pick.textContent).toContain("37,79%");
    expect(pick.textContent).toContain("Confiança: MUITO ALTA");
    const ranking = screen.getByRole("region", { name: "Top SG da rodada" });
    expect(within(ranking).getAllByRole("heading", { level: 3 }).map(node => node.textContent)).toEqual(["Flamengo", "São Paulo", "Corinthians", "Atlético-MG", "Palmeiras"]);
    expect(within(ranking).getByText("0,92")).toBeTruthy();
  });

  it("identifica os quatro SGs projetados sem apresentar os placares como garantias", () => {
    render(<MagoPage data={magoRodada28} />);
    const predictions = screen.getByRole("region", { name: "Placares do Mago" });
    expect(within(predictions).getAllByRole("article")).toHaveLength(10);
    expect(within(predictions).getAllByText("Projeção com SG")).toHaveLength(7);
    expect(predictions.textContent).toContain("não garantias de resultado");
    expect(screen.getByRole("region", { name: "RB Bragantino" }).textContent).toContain("Evitar para SG");
    expect(screen.getByRole("region", { name: "Bahia" }).textContent).toContain("Risco muito alto");
    expect(screen.getByText(/Dados demonstrativos da rodada 28/)).toBeTruthy();
  });
});
