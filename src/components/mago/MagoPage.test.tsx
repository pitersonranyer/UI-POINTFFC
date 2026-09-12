import React from "react";
import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MagoPage } from "./MagoPage";
import { magoRodada27 } from "@/data/mago/rodada27";

afterEach(cleanup);

describe("Mago da rodada 27", () => {
  it("apresenta a escolha principal e mantém a ordem editorial dos cinco SGs", () => {
    render(<MagoPage data={magoRodada27} />);
    const pick = screen.getByRole("region", { name: "Flamengo" });
    expect(pick.textContent).toContain("42,66%");
    expect(pick.textContent).toContain("Confiança: MUITO ALTA");
    const ranking = screen.getByRole("region", { name: "Top SG da rodada" });
    expect(within(ranking).getAllByRole("heading", { level: 3 }).map(node => node.textContent)).toEqual(["Flamengo", "Bahia", "Palmeiras", "Mirassol", "Grêmio"]);
    expect(within(ranking).getAllByText("Não informado")).toHaveLength(3);
    expect(within(ranking).getByText("1,27")).toBeTruthy();
  });

  it("identifica os quatro SGs projetados sem apresentar os placares como garantias", () => {
    render(<MagoPage data={magoRodada27} />);
    const predictions = screen.getByRole("region", { name: "Placares do Mago" });
    expect(within(predictions).getAllByRole("article")).toHaveLength(9);
    expect(within(predictions).getAllByText("Projeção com SG")).toHaveLength(4);
    expect(predictions.textContent).toContain("não garantias de resultado");
    expect(screen.getByRole("region", { name: "Bragantino" }).textContent).toContain("Evitar para SG");
    expect(screen.getByText(/Dados demonstrativos da rodada 27/)).toBeTruthy();
  });
});
