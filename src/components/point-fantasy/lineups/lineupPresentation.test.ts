import { describe, expect, it } from "vitest";
import { blockingReason, defaultStatuses, emptySelection, formationCounts, friendlyPending, lineupValue, removeAthlete, replaceSlot, reserveCeiling, reserveCounts, selectionWarnings, statusKey, statusLabel } from "./lineupPresentation";
import { completeTestSelection, testAthlete, testContext } from "./lineupTestFixtures";
import type { Formation } from "@/types/pointFantasyLineup";
describe("Lineup presentation", () => {
  it.each(Object.keys(formationCounts) as Formation[])("matches the exact %s composition and five reserves", formation => {
    const expected = { "4-3-3":[1,2,2,3,3], "4-4-2":[1,2,2,4,2], "3-5-2":[1,0,3,5,2], "3-4-3":[1,0,3,4,3], "4-5-1":[1,2,2,5,1], "5-3-2":[1,2,3,3,2], "5-4-1":[1,2,3,4,1] };
    expect(Object.values(formationCounts[formation])).toEqual(expected[formation]);
    expect(Object.values(formationCounts[formation]).reduce((a,b) => a+b)).toBe(11);
    expect(Object.values(reserveCounts(formation)).reduce((a,b) => a+b)).toBe(5);
    expect(reserveCounts(formation)[3]).toBe(formation.startsWith("3") ? 2 : 1);
    const { context, selection } = completeTestSelection(formation);
    expect(selectionWarnings(selection, context.athletes)).toEqual([]);
    expect(lineupValue(selection, context.athletes)).toBe(330);
  });
  it("uses internal IDs, prevents duplicates and clears roles on removal", () => {
    const a = testAthlete(1); const b = testAthlete(2, 6); const slot = { role:"titulares" as const, position:1, index:0 };
    const initial = replaceSlot(emptySelection(), [a,b], slot, a);
    expect(initial.titulares).toEqual([1]); expect(initial.titulares).not.toContain(a.atletaIdExterno);
    expect(replaceSlot(initial, [a,b], { ...slot, role:"reservas" }, a)).toBe(initial);
    expect(replaceSlot(initial, [a,b], slot, b)).toBe(initial);
    expect(replaceSlot(initial, [a,b], slot, testAthlete(999))).toBe(initial);
    expect(replaceSlot({ ...initial, capitaoAtletaId:1 }, [a,b], slot, null).capitaoAtletaId).toBeNull();
    expect(replaceSlot({ ...emptySelection(), reservas:[1], reservaMagoAtletaId:1 }, [a], { ...slot, role:"reservas" }, null).reservaMagoAtletaId).toBeNull();
  });
  it("sells a selected athlete from any role and clears dependent titles", () => {
    const value = { ...emptySelection(), titulares:[1], reservas:[2], tecnico:3, capitaoAtletaId:1, reservaMagoAtletaId:2 };
    expect(removeAthlete(value, 1)).toMatchObject({ titulares:[], reservas:[2], tecnico:3, capitaoAtletaId:null, reservaMagoAtletaId:2 });
    expect(removeAthlete(value, 2)).toMatchObject({ titulares:[1], reservas:[], tecnico:3, capitaoAtletaId:1, reservaMagoAtletaId:null });
    expect(removeAthlete(value, 3)).toMatchObject({ titulares:[1], reservas:[2], tecnico:null, capitaoAtletaId:1, reservaMagoAtletaId:2 });
  });
  it.each([[3,2,2],[3,1,1],[3,3,3]])("sets reserve ceiling from all starters: %i/%i", (first, second, ceiling) => {
    const athletes = [testAthlete(1, 3, { categoriaId:first }), testAthlete(2, 3, { categoriaId:second }), testAthlete(3, 3, { categoriaId:3 })];
    const value = { ...emptySelection(), titulares:[1,2], reservas:[3] };
    expect(reserveCeiling(value, athletes, 3)).toBe(ceiling);
    expect(selectionWarnings(value, athletes).length).toBe(ceiling < 3 ? 1 : 0);
    expect(reserveCeiling(emptySelection(), athletes, 3)).toBeNull();
  });
  it("preserves incompatible players on formation change and shows excess", () => {
    const { context, selection } = completeTestSelection("4-3-3");
    const updated = { ...selection, formacao:"3-5-2" as const };
    expect(selectionWarnings(updated, context.athletes).join(" ")).toContain("excedentes");
    expect(updated.titulares).toEqual(selection.titulares);
  });
  it("only sums received pointcoins", () => {
    expect(lineupValue({ ...emptySelection(), titulares:[1], tecnico:2 }, [testAthlete(1,1,{ pointcoins:77 }),testAthlete(2,6,{ pointcoins:13 })])).toBe(90);
  });
  it("confirms known statuses, treats null/unknown explicitly, defaults to probable and doubt", () => {
    expect(defaultStatuses).toEqual(["7","2"]); expect(statusLabel(6)).toBe("Nulo"); expect(statusLabel(5)).toBe("Contundido");
    expect(statusKey(999)).toBe("unknown"); expect(statusKey(null as unknown as number)).toBe("unknown"); expect(statusLabel(999)).toContain("desconhecida");
  });
  it("blocks exactly at kickoff without reopening presumed delayed games", () => {
    const c = testContext(); const kickoff = Date.parse(c.competition.partidas[0].inicioPrevisto);
    c.competition.fimInscricao = "2100-01-01T00:00:00Z";
    expect(blockingReason(c, kickoff - 1)).toBeNull(); expect(blockingReason(c, kickoff)).toContain("bloqueada");
    c.competition.partidas[0].status = "ADIADA"; expect(blockingReason(c, Date.parse("2026-10-15"))).toBeTruthy();
  });
  it.each(["status", "catalog", "not-open", "closed", "started", "invalid-date", "no-matches"])("blocks unavailable competition: %s", mode => {
    const c = testContext(); const now = Date.parse("2026-10-15");
    if (mode === "status") c.competition.status = "RASCUNHO";
    if (mode === "catalog") c.catalog.status = "CAPTURADO";
    if (mode === "not-open") c.competition.inicioInscricao = "2099-01-01";
    if (mode === "closed") c.competition.fechamentoDefinitivoEm = "2026-10-14";
    if (mode === "started") c.competition.partidas[0].inicioReal = "2026-10-14";
    if (mode === "invalid-date") c.competition.partidas[0].inicioPrevisto = "invalid";
    if (mode === "no-matches") c.competition.partidas = [];
    expect(blockingReason(c, now)).toBeTruthy();
  });
  it("translates server pending text without inventing completion", () => {
    expect(friendlyPending("Completar titulares da posicao 1")).toContain("Goleiro");
    expect(friendlyPending("Nova regra do servidor")).toBe("Nova regra do servidor");
  });
});
