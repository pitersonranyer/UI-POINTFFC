import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TeamDetailRoute from "./page";

const state = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock("@/components/teams/TeamDetailPage", () => ({ TeamDetailPage: ({ timeId, rodada }: { timeId: number; rodada?: number }) => <output>{JSON.stringify({ timeId, rodada })}</output> }));
beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each([
  ["timeId=456&rodada=27", { timeId: 456, rodada: 27 }],
  ["timeId=456", { timeId: 456 }],
])("encaminha os parâmetros de %s", (query, expected) => {
  state.query = query as string;
  render(<TeamDetailRoute />);
  expect(JSON.parse(screen.getByRole("status").textContent!)).toEqual(expected);
});
