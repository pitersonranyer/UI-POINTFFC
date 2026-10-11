import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

it("ordena os cinco destaques, usa scouts textuais e compartilha o painel acessível", () => {
  vi.stubGlobal("React", React);
  const atletas = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [String(index + 1), {
    apelido: `Atleta ${index + 1}`, pontuacao: index + 0.75, posicao_id: 5,
    entrou_em_campo: true, scout: { G: 2, A: 1, SG: 1, CA: 1, CV: 1, DE: 5, FF: 0 },
  }]));
  render(<TopAthletes data={{ atletas }} round={27} live={false} loading={false} error={null} firstRound={false} />);
  const rows = screen.getAllByRole("button", { name: /Ver detalhes de/ });
  expect(rows).toHaveLength(5);
  expect(rows.map(row => row.getAttribute("aria-label"))).toEqual([8, 7, 6, 5, 4].map(id => `Ver detalhes de Atleta ${id}, ATA, ${id - 1},75 pontos`));
  expect(within(rows[0]).getByText("2 G")).toBeTruthy();
  expect(within(rows[0]).getByText("1 A")).toBeTruthy();
  expect(within(rows[0]).getByText("SG")).toBeTruthy();
  expect(within(rows[0]).getByText("+3")).toBeTruthy();
  expect(rows[0].textContent).not.toMatch(/[⚽👟🟨🟥]/u);
  expect(within(rows[0]).queryByText("0 FF")).toBeNull();
  rows[0].focus();
  document.body.style.overflow = "auto";
  fireEvent.click(rows[0]);
  const dialog = screen.getByRole("dialog", { name: "Atleta 8" });
  expect(within(dialog).getByText("Atleta • Rodada 27")).toBeTruthy();
  expect(within(dialog).getByText("7,75")).toBeTruthy();
  expect(within(dialog).getByText("CA")).toBeTruthy();
  expect(within(dialog).getByText("CV")).toBeTruthy();
  expect(within(dialog).getByText("DE")).toBeTruthy();
  expect(within(dialog).getByText("Já entrou em campo")).toBeTruthy();
  expect(document.body.style.overflow).toBe("hidden");
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fechar detalhes" }));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.style.overflow).toBe("auto");
  expect(document.activeElement).toBe(rows[0]);
  fireEvent.click(rows[1]);
  fireEvent.click(screen.getByRole("button", { name: "Fechar detalhes" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(rows[2]);
  fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
  expect(screen.queryByRole("dialog")).toBeNull();
  document.body.style.overflow = "";
});

it("mantém os dados selecionados atualizados e trata informações opcionais ausentes", () => {
  vi.stubGlobal("React", React);
  const props = { round: 28, live: false, loading: false, error: null, firstRound: false };
  const athlete = { apelido: "Sem opcionais", pontuacao: -2.5, posicao_id: 99 };
  const view = render(<TopAthletes {...props} data={{ atletas: { "1": athlete } }} />);
  fireEvent.click(screen.getByRole("button", { name: /Ver detalhes de/ }));
  expect(screen.getByText("Nenhum scout disponível para este atleta nesta rodada.")).toBeTruthy();
  expect(screen.getByText(/Clube não informado/, { selector: "p" })).toBeTruthy();
  view.rerender(<TopAthletes {...props} data={{ atletas: { "1": { ...athlete, pontuacao: 3.25 } } }} />);
  expect(within(screen.getByRole("dialog")).getByText("3,25")).toBeTruthy();
});
