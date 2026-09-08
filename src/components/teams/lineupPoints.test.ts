import { expect, it } from "vitest";
import { lineupPoints } from "./lineupPoints";

it.each([true, false])("distingue ausência de participação e zero, contrato efetivo=%s", (effective) => {
  const player = { atleta_id: 1, clube_id: 1, posicao_id: 5, apelido: "Atleta", pontos_num: 0, pontuacaoContabilizada: 0 };
  expect(lineupPoints({ ...player, entrou_em_campo: false }, effective)).toBe("-- pts");
  expect(lineupPoints({ ...player, entrou_em_campo: true }, effective)).toBe("0,00 pts");
  expect(lineupPoints(player, effective)).toBe("-- pts");
  expect(lineupPoints({ ...player, entrou_em_campo: null }, effective)).toBe("-- pts");
  expect(lineupPoints({ ...player, entrou_em_campo: true, pontos_num: -2, pontuacaoContabilizada: -3 }, effective)).toBe(effective ? "-3,00 pts" : "-2,00 pts");
  expect(lineupPoints({ ...player, pontos_num: null, pontuacaoContabilizada: null }, effective)).toBe("-- pts");
});
