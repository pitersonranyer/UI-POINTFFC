import { expect, it } from "vitest";
import type { FantasyEvent, FantasyLineup } from "@/types/fantasy";
import formation321 from "./__fixtures__/formation-321.json";
import events321 from "./__fixtures__/formation-events-321.json";
import { formationEventMap, formationEventTime, mergeFormationEvents } from "./FormationEvents";

const teams = formation321 as FantasyLineup;
const incident = (overrides: Partial<FantasyEvent> = {}): FantasyEvent => ({
  tipo: "GOL", periodo: "segundo-tempo", tempo: { minuto: 45, acrescimo: 2, exibicao: null },
  equipe: teams.mandante, jogador: teams.mandante.titulares[0], assistencia: null,
  jogadorSai: null, jogadorEntra: null, comissaoTecnica: null, comentarios: null,
  origem: { tipo: "GOL", detalhe: "normal" }, ...overrides,
});

it("associates goal, yellow, red and substitution by player and club IDs", () => {
  const player = teams.mandante.titulares[0];
  const events = [incident(), incident({ tipo: "CARTAO_AMARELO" }), incident({ tipo: "CARTAO_VERMELHO" }), incident({ tipo: "SUBSTITUICAO", jogador: null, jogadorSai: player, jogadorEntra: teams.mandante.reservas[0] })];
  const map = formationEventMap(events, teams);
  expect(map.mandante.get(player.idExterno!)?.map(item => item.kind)).toEqual(["goal", "yellow", "red", "substitution"]);
  expect(map.mandante.get(teams.mandante.reservas[0].idExterno!)?.[0].direction).toBe("in");
  expect(map.mandante.get(player.idExterno!)?.at(-1)?.direction).toBe("out");
  expect(map.visitante.size).toBe(0);
});

it("omits missing IDs, mismatched clubs, ambiguous squads and name-only matches", () => {
  const player = teams.mandante.titulares[0];
  const unknown = [
    incident({ jogador: { idExterno: null, nome: player.nome } }),
    incident({ jogador: { idExterno: 999999, nome: player.nome } }),
    incident({ equipe: teams.visitante }),
    incident({ equipe: { ...teams.mandante, idExterno: null } }),
    incident({ tipo: "CARTAO_AMARELO", jogador: null, comissaoTecnica: { idExterno: 238, nome: "Marcão" } }),
  ];
  expect(formationEventMap(unknown, teams).mandante.size).toBe(0);
  expect(formationEventMap([incident()], { ...teams, mandante: { ...teams.mandante, reservas: [player] } }).mandante.size).toBe(0);
});

it.each(["own_goal", "Own Goal", "gol contra"])("marks %s as an own goal even when credited to the opposing club", detail => {
  const event = incident({ equipe: teams.visitante, origem: { tipo: "GOL", detalhe: detail } });
  const map = formationEventMap([event], teams);
  expect(map.mandante.get(event.jogador!.idExterno!)?.[0].kind).toBe("ownGoal");
  expect(map.visitante.size).toBe(0);
});

it("recognizes explicit GOL_CONTRA and refuses an ambiguous own-goal scorer", () => {
  expect(formationEventMap([incident({ tipo: "GOL_CONTRA" })], teams).mandante.values().next().value?.[0].kind).toBe("ownGoal");
  const duplicate = { ...teams, visitante: { ...teams.visitante, reservas: [teams.mandante.titulares[0]] } };
  expect(formationEventMap([incident({ tipo: "GOL_CONTRA" })], duplicate).mandante.size).toBe(0);
});

it("deduplicates substitutions across responses but retains separate goals and preserves clocks", () => {
  const events = events321 as FantasyEvent[];
  expect(mergeFormationEvents(events, teams.substituicoes)).toHaveLength(events.length);
  expect(mergeFormationEvents([incident(), incident()], [])).toHaveLength(2);
  expect(formationEventTime(incident())).toBe("45+2'");
  expect(formationEventTime(incident({ tempo: { minuto: 0, acrescimo: null, exibicao: null } }))).toBe("0'");
  expect(formationEventTime(incident({ tempo: { minuto: null, acrescimo: null, exibicao: null } }))).toBe("Minuto não informado");
});
