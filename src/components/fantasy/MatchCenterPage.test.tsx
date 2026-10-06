import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MatchCenterPage } from "./MatchCenterPage";
import { FantasyFieldLineup } from "./FantasyFieldLineup";
import { lineupExamples, lineupMock, matchCenterMock, summaryMock } from "@/mocks/fantasy/fixture1180729";
import FantasyMatchRoute, { dynamicParams, generateStaticParams } from "@/app/fantasy/partidas/[fixtureId]/page";
import { metadata } from "@/app/fantasy/layout";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
beforeEach(() => { vi.stubGlobal("React", React); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external request"); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const show = () => render(<MatchCenterPage sections={matchCenterMock} examples={lineupExamples} />);

it("exports only fixture 1180729 and refuses other IDs", () => {
  expect(generateStaticParams()).toEqual([{ fixtureId: "1180729" }]);
  expect(dynamicParams).toBe(false);
  expect(() => FantasyMatchRoute({ params: { fixtureId: "999" } })).toThrow("NOT_FOUND");
  expect(metadata.robots).toEqual({ index: false, follow: false });
});

it("opens Sumário and preserves added time and the supplied goals", () => {
  show();
  expect(screen.getByRole("tab", { name: "Sumário" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("90+2'")).toBeTruthy();
  expect(screen.queryByText("92'")).toBeNull();
  expect(screen.getByText("Assistência: Igor Jesus")).toBeTruthy();
  expect(screen.getAllByLabelText("Placar após evento").map(element => element.textContent)).toEqual(["1 × 0", "1 × 1", "2 × 1"]);
  expect(screen.getByText("08/12/2024")).toBeTruthy();
  expect(screen.getByRole("img", { name: "Escudo do Botafogo indisponível" })).toBeTruthy();
});

it("switches statistics, preserves zeros and nulls, and formats percentages and xG", () => {
  show(); fireEvent.click(screen.getByRole("tab", { name: "Estatísticas" }));
  const row = (label: string) => screen.getByRole("rowheader", { name: label }).closest("tr")!;
  expect(within(row("Defesas do goleiro")).getAllByRole("cell").map(cell => cell.textContent)).toEqual(["0", "5"]);
  expect(within(row("Escanteios")).getAllByRole("cell").map(cell => cell.textContent)).toEqual(["3", "0"]);
  expect(within(row("Cartões amarelos")).getAllByLabelText("Indisponível")).toHaveLength(2);
  expect(within(row("Posse de bola")).getAllByRole("cell").map(cell => cell.textContent)).toEqual(["46%", "54%"]);
  expect(within(row("Gols esperados (xG)")).getAllByRole("cell").map(cell => cell.textContent)).toEqual(["1,88", "0,32"]);
});

it("shows the supplied partial formations without invented identities or reserves", () => {
  show(); fireEvent.click(screen.getByRole("tab", { name: "Formação" }));
  expect(screen.getByRole("tab", { name: "Botafogo" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("3-3-1-3")).toBeTruthy(); expect(screen.queryByText("3-4-1-2")).toBeNull();
  expect(screen.getByText("Treinador: Artur Jorge")).toBeTruthy();
  expect(within(screen.getByRole("region", { name: "Campo de Botafogo" })).getByText("John")).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Campo de São Paulo" })).toBeNull();
  expect(screen.getAllByText("Reservas disponíveis no mock (0)")).toHaveLength(1);
  fireEvent.click(screen.getByRole("tab", { name: "São Paulo" }));
  expect(screen.getByRole("tab", { name: "São Paulo" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("3-4-1-2")).toBeTruthy(); expect(screen.queryByText("3-3-1-3")).toBeNull();
  expect(screen.getByText("Treinador: L. Zubeldía")).toBeTruthy();
  expect(within(screen.getByRole("region", { name: "Campo de São Paulo" })).getByText("William")).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Campo de Botafogo" })).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Botafogo" }));
  expect(screen.getByRole("region", { name: "Campo de Botafogo" })).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Campo de São Paulo" })).toBeNull();
  expect(lineupMock.mandante.titulares).toEqual([]);
  expect(lineupExamples.mandante).toHaveLength(3);
});

it("supports keyboard selection, wrapping, Home and End with roving focus", () => {
  show(); const summary = screen.getByRole("tab", { name: "Sumário" }); summary.focus();
  fireEvent.keyDown(summary, { key: "ArrowLeft" });
  const lineup = screen.getByRole("tab", { name: "Formação" });
  expect(document.activeElement).toBe(lineup); expect(lineup.getAttribute("aria-selected")).toBe("true");
  fireEvent.keyDown(lineup, { key: "Home" }); expect(document.activeElement).toBe(summary);
  fireEvent.keyDown(summary, { key: "ArrowRight" });
  const statistics = screen.getByRole("tab", { name: "Estatísticas" }); expect(document.activeElement).toBe(statistics);
  fireEvent.keyDown(statistics, { key: "End" }); expect(document.activeElement).toBe(lineup);
  expect(summary.tabIndex).toBe(-1); expect(lineup.tabIndex).toBe(0);
});

it("keeps other tabs working when formation fails", () => {
  render(<MatchCenterPage sections={{ ...matchCenterMock, lineup: { status: "error", message: "Tente novamente depois." } }} />);
  fireEvent.click(screen.getByRole("tab", { name: "Formação" })); expect(screen.getByRole("alert").textContent).toContain("Formação indisponível");
  fireEvent.click(screen.getByRole("tab", { name: "Estatísticas" })); expect(screen.getByRole("table")).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Sumário" })); expect(screen.getByText("90+2'")).toBeTruthy();
});

it("supports loading, missing data, unknown events and empty lineups", () => {
  const view = render(<MatchCenterPage sections={{ ...matchCenterMock, summary: { status: "loading" }, statistics: { status: "empty" } }} />);
  expect(screen.getByRole("status").textContent).toContain("Carregando sumário");
  fireEvent.click(screen.getByRole("tab", { name: "Estatísticas" })); expect(screen.getByText("Nenhum dado de estatísticas disponível.")).toBeTruthy();
  view.rerender(<MatchCenterPage sections={{ ...matchCenterMock, summary: { status: "ready", data: { ...summaryMock, eventos: [{ tipo: "NOVO_EVENTO", tempo: { minuto: null, acrescimo: null, exibicao: "—" }, equipe: null, comentarios: "Informação recebida", origem: null }] } } }} />);
  fireEvent.click(screen.getByRole("tab", { name: "Sumário" })); expect(screen.getByText("NOVO_EVENTO")).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Formação" })); expect(screen.getAllByText("Posições no campo indisponíveis")).toHaveLength(1);
});

it("supports team keyboard navigation and resets to the home team when entering Formação", () => {
  show(); const originalUrl = window.location.href;
  fireEvent.click(screen.getByRole("tab", { name: "Formação" }));
  const home = screen.getByRole("tab", { name: "Botafogo" });
  const away = screen.getByRole("tab", { name: "São Paulo" });
  home.focus(); fireEvent.keyDown(home, { key: "ArrowRight" });
  expect(document.activeElement).toBe(away); expect(away.tabIndex).toBe(0); expect(home.tabIndex).toBe(-1);
  expect(screen.getByRole("region", { name: "Campo de São Paulo" })).toBeTruthy();
  fireEvent.keyDown(away, { key: "ArrowRight" }); expect(document.activeElement).toBe(home);
  fireEvent.keyDown(home, { key: "ArrowLeft" }); expect(document.activeElement).toBe(away);
  fireEvent.keyDown(away, { key: "Home" }); expect(document.activeElement).toBe(home);
  fireEvent.keyDown(home, { key: "End" }); expect(document.activeElement).toBe(away);
  expect(window.location.href).toBe(originalUrl);
  fireEvent.click(screen.getByRole("tab", { name: "Sumário" }));
  fireEvent.click(screen.getByRole("tab", { name: "Formação" }));
  expect(screen.getByRole("tab", { name: "Botafogo" }).getAttribute("aria-selected")).toBe("true");
});

it("preserves null formation and coach and empty rosters for the selected team", () => {
  render(<MatchCenterPage sections={{ ...matchCenterMock, lineup: { status: "ready", data: { ...lineupMock, visitante: { ...lineupMock.visitante, formacao: null, treinador: null } } } }} />);
  fireEvent.click(screen.getByRole("tab", { name: "Formação" }));
  fireEvent.click(screen.getByRole("tab", { name: "São Paulo" }));
  const team = within(screen.getByRole("region", { name: "Formação de São Paulo" }));
  expect(team.getByText("Treinador: Indisponível")).toBeTruthy();
  expect(team.getByText("—")).toBeTruthy();
  expect(team.getByText("Nenhum registro completo disponível.")).toBeTruthy();
  expect(team.getByText("Nenhum reserva fornecido nesta POC.")).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Formação de Botafogo" })).toBeNull();
});

it("positions valid contract players by grid and lists missing positions without guessing", () => {
  render(<FantasyFieldLineup teamName="Equipe" formation="3-4-1-2" players={[
    { idExterno: 1, nome: "Jogador de teste", numero: 0, posicao: "F", grid: "5:2" },
    { idExterno: 2, nome: "Sem grid", numero: null, posicao: null, grid: null },
  ]} />);
  expect(screen.getByText("Jogador de teste").parentElement?.style.gridColumn).toBe("2");
  expect(screen.getByText("Jogador de teste").closest("[data-field-row]")?.getAttribute("data-field-row")).toBe("5");
  expect(screen.getByText("0")).toBeTruthy(); expect(screen.getByText("Sem grid").tagName).toBe("LI");
});

it("renders the route and every tab without fetch or public links", () => {
  render(FantasyMatchRoute({ params: { fixtureId: "1180729" } }));
  for (const name of ["Estatísticas", "Formação", "Sumário"]) fireEvent.click(screen.getByRole("tab", { name }));
  expect(fetch).not.toHaveBeenCalled(); expect(screen.queryAllByRole("link")).toEqual([]);
});
