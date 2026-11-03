import React, { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RoundGamesPage, agendaGroups } from "./RoundGamesPage";
import { apiFetch, ApiError } from "@/services/apiClient";
import type { Agenda, AgendaMatch } from "@/types/agenda";
import fixture from "./__fixtures__/agenda-2026.json";
import { metadata } from "@/app/jogos-da-rodada/page";

vi.mock("@/services/apiClient", async importOriginal => ({ ...await importOriginal<typeof import("@/services/apiClient")>(), apiFetch: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.mocked(apiFetch).mockImplementation(async path => ({ ...structuredClone(fixture), rodada: Number(new URL(path, "https://test.local").searchParams.get("rodada") ?? fixture.rodada) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const show = () => render(<StrictMode><RoundGamesPage /></StrictMode>);
const ready = () => screen.findByRole("region", { name: `Jogos da rodada ${fixture.rodada}` });
const scored = (changes: Partial<AgendaMatch> = {}): AgendaMatch => ({ ...structuredClone(fixture.partidas[0]), ...changes });

it("loads the automatic round once in StrictMode and links all ten V2 fixtures through the exported query route", async () => {
  show(); expect(screen.getByRole("status")).toBeTruthy();
  const region = await ready(); await within(region).findAllByRole("link");
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(apiFetch).toHaveBeenCalledWith("/fantasy/agenda?temporada=2026");
  expect(screen.getByText(`Rodada ${fixture.rodada} de ${fixture.totalRodadas}`)).toBeTruthy();
  const links = within(region).getAllByRole("link"); expect(links).toHaveLength(10);
  fixture.partidas.forEach((match, index) => {
    const url = new URL(links[index].getAttribute("href")!, "https://pointffc.com.br");
    expect(url.pathname.replace(/\/$/, "")).toBe("/fantasy/partidas");
    expect(url.search).toBe(`?fixtureId=${match.fixtureId}`);
  });
  expect(screen.getByText("2 × 1")).toBeTruthy();
  expect(screen.getByText("Encerrada")).toBeTruthy();
  expect(screen.getByText("Horários de Brasília")).toBeTruthy();
});

it("navigates without a page reload, caches visited rounds and limits both ends", async () => {
  vi.mocked(apiFetch).mockImplementation(async path => ({ ...fixture, rodada: Number(new URL(path, "https://test.local").searchParams.get("rodada") ?? 2), totalRodadas: 3 }));
  show(); await screen.findByText("Rodada 2 de 3");
  fireEvent.click(screen.getByRole("button", { name: "Próxima rodada" }));
  await screen.findByText("Rodada 3 de 3");
  await waitFor(() => expect((screen.getByRole("button", { name: "Próxima rodada" }) as HTMLButtonElement).disabled).toBe(true));
  fireEvent.click(screen.getByRole("button", { name: "Rodada anterior" }));
  await screen.findByText("Rodada 2 de 3");
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(apiFetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Rodada anterior" }));
  await screen.findByText("Rodada 1 de 3");
  await waitFor(() => expect((screen.getByRole("button", { name: "Rodada anterior" }) as HTMLButtonElement).disabled).toBe(true));
});

it("shows a round-change loading state and hides old fixtures until the response arrives", async () => {
  let finish!: (data: Agenda) => void;
  vi.mocked(apiFetch).mockResolvedValueOnce(fixture).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  show(); const region = await ready(); await within(region).findAllByRole("link");
  fireEvent.click(screen.getByRole("button", { name: "Próxima rodada" }));
  expect(screen.getByRole("status").textContent).toContain(`Carregando rodada ${fixture.rodada + 1}`);
  expect(screen.queryByText("Bragantino")).toBeNull();
  finish({ ...fixture, fornecedor: "API_FUTEBOL_V2", rodada: fixture.rodada + 1 });
  await screen.findByText("Bragantino");
});

it("groups and sorts dates in Brasília, including UTC midnight and absent dates", () => {
  const games = [scored({ fixtureId: 3, dataHora: null }), scored({ fixtureId: 2, dataHora: "2026-11-04T02:30:00Z" }), scored({ fixtureId: 1, dataHora: "2026-11-03T20:00:00-03:00" }), scored({ fixtureId: 4, dataHora: "2026-11-04T03:30:00Z" })];
  const groups = agendaGroups(games);
  expect(groups.map(group => group.key)).toEqual(["2026-11-03", "2026-11-04", "unknown"]);
  expect(groups[0].matches.map(match => match.fixtureId)).toEqual([1, 2]);
  expect(games[0].fixtureId).toBe(3);
});

it("renders scheduled, live, finished, postponed and cancelled matches with real values", async () => {
  const statuses = ["AGENDADA", "EM_ANDAMENTO", "ENCERRADA", "ADIADA", "CANCELADA"];
  vi.mocked(apiFetch).mockResolvedValue({ ...fixture, partidas: statuses.map((status, i) => scored({ fixtureId: i + 1, status, dataHora: "2026-11-04T02:30:00Z", placar: { mandante: 0, visitante: status === "ENCERRADA" ? null : 1 } })) });
  show(); await screen.findByText("Agendada");
  for (const status of ["Ao vivo", "Encerrada", "Adiada", "Cancelada"]) expect(screen.getByText(status)).toBeTruthy();
  expect(screen.getByText("23:30")).toBeTruthy();
  expect(screen.getByText("0 × 1")).toBeTruthy();
  expect(screen.getByText("0 × —")).toBeTruthy();
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
});

it("handles missing dates, times, names, invalid fixture IDs and missing or broken shields", async () => {
  const match = scored({ fixtureId: 0, dataHora: null, status: "AGENDADA", mandante: { id: null, nome: null, escudo: null } });
  vi.mocked(apiFetch).mockResolvedValue({ ...fixture, partidas: [match] });
  show(); await screen.findByText("Data não informada");
  expect(screen.getByText("Horário indisponível")).toBeTruthy();
  expect(screen.getByText("Mandante não informado")).toBeTruthy();
  expect(screen.getByText("Central indisponível")).toBeTruthy();
  expect(screen.getByRole("img", { name: "Escudo indisponível" })).toBeTruthy();
  fireEvent.error(screen.getByRole("img", { name: "Escudo do Santos" }));
  expect(screen.getAllByRole("img", { name: "Escudo indisponível" })).toHaveLength(2);
  expect(screen.queryByRole("link", { name: /Santos/ })).toBeNull();
});

it("retries an API failure and handles empty rounds", async () => {
  vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError(503, "Serviço indisponível")).mockResolvedValueOnce({ ...fixture, partidas: [] });
  show(); await screen.findByRole("alert");
  expect(screen.getByText("Serviço indisponível")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Nenhuma partida disponível para esta rodada.");
  expect(apiFetch).toHaveBeenCalledTimes(2);
});

it("reports unsupported seasons and preserves canonical SEO", async () => {
  vi.mocked(apiFetch).mockRejectedValue(new ApiError(404)); show();
  await screen.findByText("Temporada indisponível");
  expect(screen.getByText("A agenda da temporada 2026 não está disponível.")).toBeTruthy();
  expect(metadata.alternates?.canonical).toBe("https://pointffc.com.br/jogos-da-rodada/");
  expect(metadata.title).toBe("Agenda do Brasileirão Série A 2026 | POINT FFC");
});
