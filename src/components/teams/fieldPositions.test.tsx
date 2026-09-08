import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CartolaTeamLineupAthlete } from "@/types/cartola";
import { getFieldPositions } from "./fieldPositions";
import { FieldLineup } from "./FieldLineup";

const player = (atleta_id: number, posicao_id: number): CartolaTeamLineupAthlete =>
  ({ atleta_id, posicao_id, apelido: `Atleta ${atleta_id}`, clube_id: 1, titularEfetivo: true });
const formation = (defense: number[], midfield: number, attack: number) =>
  [1, ...defense, ...Array<number>(midfield).fill(4), ...Array<number>(attack).fill(5), 6].map((position, index) => player(index + 1, position));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("slots do campinho", () => {
  it.each([
    [[3, 2, 2, 3], 3, 3, [2, 3, 3, 2]],
    [[3, 2, 2, 3], 4, 2, [2, 3, 3, 2]],
    [[3, 3, 3], 5, 2, [3, 3, 3]],
    [[3, 2, 3, 2, 3], 4, 1, [2, 3, 3, 3, 2]],
    [[3, 2, 3, 2, 3], 3, 2, [2, 3, 3, 3, 2]],
    [[3, 2, 3], 4, 3, [2, 3, 3]],
  ])("distribui defesa %j, %i meias e %i atacantes", (defense, midfield, attack, expected) => {
    const players = formation(defense as number[], midfield as number, attack as number);
    const rows = getFieldPositions(players);
    expect(rows.map((row) => row.players.length)).toEqual([attack, midfield, (defense as number[]).length, 1]);
    expect(rows[2].players.map((athlete) => athlete.posicao_id)).toEqual(expected);
    expect(rows.flatMap((row) => row.players)).toHaveLength(11);
    expect(rows.flatMap((row) => row.players).some((athlete) => athlete.posicao_id === 6)).toBe(false);
    expect(getFieldPositions(players)).toEqual(rows);
  });

  it.each([2, 3, 4, 5, 1])("mantém o substituto no slot original da posição %i", (position) => {
    const original = formation([3, 2, 2, 3], 3, 3);
    const outgoing = original.find((athlete) => athlete.posicao_id === position)!;
    const incoming = { ...player(99, position), capitaoEfetivo: true, pontuacaoContabilizada: 8.4 };
    const effective = [...original.filter((athlete) => athlete !== outgoing), incoming];
    const records = [{ ativa: true, titularSaiuId: outgoing.atleta_id, reservaEntrouId: 99, reservaLuxo: false, herdouCapitao: true }];
    const before = getFieldPositions(original).flatMap((row) => row.players);
    const after = getFieldPositions(effective, original, records).flatMap((row) => row.players);
    expect(after.map((athlete) => athlete.atleta_id)).toEqual(before.map((athlete) => athlete === outgoing ? 99 : athlete.atleta_id));
    expect(new Set(after.map((athlete) => athlete.atleta_id)).size).toBe(11);
    vi.stubGlobal("React", React);
    render(<FieldLineup players={effective} originalPlayers={original} reserves={[outgoing]} clubs={{}} records={records} />);
    const pitch = screen.getByLabelText("Escalação no campo");
    expect(within(pitch).queryByText(outgoing.apelido)).toBeNull();
    expect(within(pitch).getByText(incoming.apelido)).toBeTruthy();
    expect(within(pitch).getByTitle("Capitão")).toBeTruthy();
    expect(within(pitch).getByText("8,40 pts")).toBeTruthy();
    expect(screen.getAllByText(outgoing.apelido)).toHaveLength(1);
  });

  it("mantém a ordem recebida em cada função e não modifica arrays", () => {
    const players = [player(9, 5), player(2, 5), player(4, 5)];
    const original = [...players];
    expect(getFieldPositions(players)[0].players).toEqual(original);
    expect(players).toEqual(original);
    expect(getFieldPositions([...players, players[0]])[0].players).toHaveLength(3);
  });

  it.each([1, 2, 3, 4, 5])("distribui %i meias na mesma linha", (count) => {
    const players = Array.from({ length: count }, (_, index) => player(index, 4));
    expect(getFieldPositions(players)[1].players).toEqual(players);
  });
});
