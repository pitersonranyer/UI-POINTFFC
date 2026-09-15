import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TopAthletes } from "./TopAthletes";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("mostra somente cinco atletas e mantém o link para todos", () => {
  vi.stubGlobal("React", React);
  const atletas = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [String(index + 1), { apelido: `Atleta ${index + 1}`, pontuacao: 80 - index, posicao_id: 4 }]));
  render(<TopAthletes data={{ atletas }} round={27} live={false} loading={false} error={null} firstRound={false} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
  expect(screen.getByText("Atleta 1")).toBeTruthy();
  expect(screen.queryByText("Atleta 6")).toBeNull();
  expect(screen.getByRole("link", { name: "Ver todos" }).getAttribute("href")).toBe("/pontuacao-atletas");
});
