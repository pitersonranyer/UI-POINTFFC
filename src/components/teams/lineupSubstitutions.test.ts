import { describe, expect, it } from "vitest";
import type { CartolaTeamLineupAthlete } from "@/types/cartola";
import { substitutionStatusByAthlete } from "./lineupSubstitutions";

const athlete = (atleta_id: number, posicao_id: number, entrou_em_campo: boolean): CartolaTeamLineupAthlete => ({
  atleta_id, posicao_id, entrou_em_campo, clube_id: 1, apelido: `Atleta ${atleta_id}`,
});

describe("substitutionStatusByAthlete", () => {
  it("não deduz substituições pela participação de atletas da mesma posição", () => {
    const status = substitutionStatusByAthlete([athlete(1, 4, false)], [athlete(2, 4, true)]);
    expect(status.size).toBe(0);
  });

  it("não confunde reserva pontuado sem titular substituído com uma troca", () => {
    const status = substitutionStatusByAthlete([athlete(1, 5, true)], [athlete(2, 5, true)]);
    expect(status.size).toBe(0);
  });

  it("não pareia atletas de posições diferentes", () => {
    const status = substitutionStatusByAthlete([athlete(1, 3, false)], [athlete(2, 2, true)]);
    expect(status.size).toBe(0);
  });
});
