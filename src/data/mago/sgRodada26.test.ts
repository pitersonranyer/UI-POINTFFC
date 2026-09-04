import { describe, expect, it } from "vitest";
import { sgRodada26 } from "./sgRodada26";

describe("sgRodada26", () => {
  it("entrega a análise defensiva completa da rodada 26", () => {
    expect(sgRodada26.rodada).toBe(26);
    expect(sgRodada26.analises).toHaveLength(9);
    expect(sgRodada26.rankingFinal).toEqual(sgRodada26.analises.map((item) => item.clube));
    expect(sgRodada26.analises.every((item) => item.especialistas && item.texto.length > 0)).toBe(true);
  });

  it("separa maior xG do destaque ofensivo editorial", () => {
    expect(sgRodada26.melhoresAtaques).toHaveLength(6);
    expect(sgRodada26.melhoresAtaques[0]).toMatchObject({ clube: "Fluminense", xg: 1.62 });
    expect(sgRodada26.destaqueOfensivo.clube).toBe("Flamengo");
    expect(sgRodada26.resumoMago.destaqueOfensivo).toBe("Flamengo");
  });

  it("inclui os dez placares imaginários da rodada", () => {
    expect(sgRodada26.placaresRodada).toHaveLength(10);
  });
});
