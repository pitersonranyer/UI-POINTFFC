import React from "react";
import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MagoPage } from "./MagoPage";
import { magoRodada28 } from "@/data/mago/rodada28";

afterEach(cleanup);

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
