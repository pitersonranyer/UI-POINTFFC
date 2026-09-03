import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TeamPartialScore } from "@/types/partial-score";
import { PartialScore } from "./PartialScore";

const partial = (overrides: Partial<TeamPartialScore> = {}): TeamPartialScore => ({
  timeId: 1, nomeTime: "Time A", nomeCartoleiro: "Pessoa", escudoUrl: "", pontuacao: 75.2,
  status: "PARCIAL", atualizadoEm: "2026-08-31T12:00:00Z", ...overrides,
});

afterEach(cleanup);

describe("PartialScore", () => {
  it("formata a pontuacao parcial com duas casas em pt-BR", () => {
    render(<PartialScore partial={partial()} loading={false} />);
    expect(screen.getByText("75,20 pts")).toBeTruthy();
    expect(screen.getByText("Parcial")).toBeTruthy();
  });

  it("mostra apenas o placeholder durante o loading", () => {
    render(<PartialScore loading />);
    expect(screen.getByText("--,-- pts")).toBeTruthy();
  });

  it("mostra aguardando sem transformar null em zero", () => {
    render(<PartialScore partial={partial({ status: "AGUARDANDO", pontuacao: null })} loading={false} />);
    expect(screen.getByText("-- pts")).toBeTruthy();
    expect(screen.getByText("Aguardando parcial")).toBeTruthy();
    expect(screen.queryByText("0,00 pts")).toBeNull();
  });

  it.each([partial({ status: "NAO_ENCONTRADO", pontuacao: null }), undefined])("mostra indisponivel para nao encontrado ou erro", (value) => {
    render(<PartialScore partial={value} loading={false} unavailable={!value} />);
    expect(screen.getByText("Parcial indisponível")).toBeTruthy();
  });
});
