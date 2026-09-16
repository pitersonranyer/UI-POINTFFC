import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { FutebolGamesPage } from "./FutebolGamesPage";
import { buscarJogosHoje, buscarRodadaAtual, buscarRodadaAtualBsa } from "@/services/futebolService";
import type { FutebolJogoHoje, FutebolJogosHoje } from "@/types/futebol";

vi.mock("@/services/futebolService", () => ({ buscarJogosHoje: vi.fn(), buscarRodadaAtual: vi.fn(), buscarRodadaAtualBsa: vi.fn() }));
const game: FutebolJogoHoje = {
  id: 1, externalId: 1, temporada: 2026, rodada: 27, dataHoraUtc: "2026-09-16T01:00:00Z", status: "IN_PLAY", vencedor: null,
  competicao: { id: 1, codigo: "CL", nome: "Champions League", emblemaUrl: null },
  mandante: { id: 1, externalId: 1, cartolaClubeId: null, nome: "Arsenal", nomeCurto: "Arsenal", sigla: null, escudoUrl: null },
  visitante: { id: 2, externalId: 2, cartolaClubeId: null, nome: "Inter", nomeCurto: null, sigla: null, escudoUrl: null },
  placar: { mandante: 2, visitante: 0 }, placarIntervalo: { mandante: 1, visitante: 0 },
};
const today: FutebolJogosHoje = { data: "2026-09-15", timezone: "America/Sao_Paulo", total: 1, jogos: [game] };
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.mocked(buscarJogosHoje).mockResolvedValue(today);
  vi.mocked(buscarRodadaAtualBsa).mockResolvedValue({ competicao: { codigo: "BSA", nome: "Brasileirão" }, temporada: 2026, rodada: 27, total: 1, jogos: [game] });
  vi.mocked(buscarRodadaAtual).mockResolvedValue({ competicao: { codigo: "CL", nome: "Champions League" }, temporada: 2026, rodada: 1, total: 1, jogos: [game] });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("Hoje é a primeira opção e consulta apenas os jogos do dia", async () => {
  render(<FutebolGamesPage />);
  const nav = screen.getByRole("navigation", { name: "Selecionar competição" });
  expect(within(nav).getAllByRole("button")[0].textContent).toBe("Hoje");
  expect(screen.getByRole("button", { name: "Hoje" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("status", { name: "Carregando jogos de hoje" })).toBeTruthy();
  expect(await screen.findByText("15 de setembro")).toBeTruthy();
  expect(screen.getByText("22:00")).toBeTruthy();
  expect(screen.getByLabelText("Placar 2 a 0")).toBeTruthy();
  expect(screen.getByText("Ao vivo")).toBeTruthy();
  expect(buscarRodadaAtual).not.toHaveBeenCalled();
  expect(buscarRodadaAtualBsa).not.toHaveBeenCalled();
});
it("reutiliza a estrutura e classes do card existente e mantém o código no detalhe", async () => {
  render(<FutebolGamesPage />);
  const card = await screen.findByRole("link", { name: "Ver confronto: Arsenal contra Inter" });
  const structure = Array.from(card.querySelectorAll("div")).map(node => node.className);
  expect(card.getAttribute("href")).toBe("/jogos?futebol=1&competicao=CL");
  fireEvent.click(screen.getByRole("button", { name: "Champions" }));
  const competitionCard = await screen.findByRole("link", { name: "Ver confronto: Arsenal contra Inter" });
  expect(Array.from(competitionCard.querySelectorAll("div")).map(node => node.className)).toEqual(structure);
  expect(buscarRodadaAtual).toHaveBeenCalledWith("CL");
  expect(screen.getByRole("button", { name: "Champions" }).getAttribute("aria-pressed")).toBe("true");
});
it("preserva Brasileirão e permite voltar para Hoje", async () => {
  render(<FutebolGamesPage initialCodigo="BSA" />);
  expect(await screen.findByText("27")).toBeTruthy();
  expect(buscarJogosHoje).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Hoje" }));
  expect(await screen.findByText("15 de setembro")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Brasileirão" }).getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Brasileirão" }));
  expect(await screen.findByText("27")).toBeTruthy();
  expect(window.location.search).toBe("?competicao=BSA");
});
it("renderiza todos os jogos, inclusive competições fora da lista de abas", async () => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...today, total: 2, jogos: [game, { ...game, id: 2, competicao: { ...game.competicao, codigo: "NEW", nome: "Nova competição" } }] });
  render(<FutebolGamesPage />);
  expect(await screen.findByText("Nova competição")).toBeTruthy();
  expect(screen.getAllByRole("link", { name: /Ver confronto/ })).toHaveLength(2);
});
it("mantém vazio e erro com retry separados e preserva o seletor", async () => {
  vi.mocked(buscarJogosHoje).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ...today, total: 0, jogos: [] });
  render(<FutebolGamesPage />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Champions" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Nenhum jogo programado para hoje.")).toBeTruthy();
});
it("ignora resposta atrasada de Hoje após trocar para Brasileirão", async () => {
  let resolve!: (value: FutebolJogosHoje) => void;
  vi.mocked(buscarJogosHoje).mockReturnValue(new Promise(done => { resolve = done; }));
  render(<FutebolGamesPage />);
  fireEvent.click(screen.getByRole("button", { name: "Brasileirão" }));
  await screen.findByText("27");
  await act(async () => resolve(today));
  expect(screen.queryByText("15 de setembro")).toBeNull();
  expect(screen.getByRole("button", { name: "Brasileirão" }).getAttribute("aria-pressed")).toBe("true");
});
