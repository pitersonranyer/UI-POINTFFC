import { describe, expect, it } from "vitest";
import { formatMatchupDate, sortLineupMatchups } from "./lineupMatchups";
import type { FantasyMatch } from "@/types/pointFantasyLineup";
import type { FantasyReference } from "@/types/pointFantasy";

const clubs: FantasyReference[] = [
  { id:262, dados:{ nome:"Flamengo", abreviacao:"FLA" } },
  { id:263, dados:{ nome:"Botafogo", abreviacao:"BOT" } },
];
const match = (id: number, inicioPrevisto: string): FantasyMatch => ({ id, competicaoId:8, partidaIdExterno:id, clubeMandanteId:262, clubeVisitanteId:263, inicioPrevisto, inicioReal:null, status:"AGENDADA" });

describe("lineup matchups", () => {
  it("orders available kickoffs chronologically and leaves incomplete times last", () => {
    const result = sortLineupMatchups([match(1,"invalid"),match(3,"2099-10-17T21:00:00-03:00"),match(2,"2099-10-17T18:00:00-03:00")],clubs);
    expect(result.map(item => item.match.id)).toEqual([2,3,1]);
    expect(result[0].home?.id).toBe(262);
    expect(result[0].away?.id).toBe(263);
    expect(result[2].timestamp).toBeNull();
  });

  it("formats valid Brazil kickoff times and describes missing times", () => {
    expect(formatMatchupDate("2099-10-17T18:00:00-03:00")).toContain("17/10");
    expect(formatMatchupDate("not-a-date")).toBe("Horário indisponível");
  });

  it("keeps clubs unavailable when a fixture reference is incomplete", () => {
    const incomplete = { ...match(1,"invalid"), clubeVisitanteId:999 };
    const [result] = sortLineupMatchups([incomplete],clubs);
    expect(result.home?.id).toBe(262);
    expect(result.away).toBeNull();
  });
});
