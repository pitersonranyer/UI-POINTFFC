import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { FutebolGamesPage } from "./FutebolGamesPage";
import { useFutebolRodada } from "@/hooks/useFutebolRodada";
import type { FutebolJogo } from "@/types/futebol";

vi.mock("@/hooks/useFutebolRodada", () => ({ useFutebolRodada: vi.fn() }));
const game: FutebolJogo = { id: 1, externalId: 999, rodada: 27, temporada: 2026, status: "TIMED", dataHoraUtc: new Date(2026, 8, 12, 16).toISOString(), vencedor: null, mandante: { id: 1, externalId: 100, cartolaClubeId: 282, nome: "Atlético-MG", nomeCurto: null, sigla: null, escudoUrl: null }, visitante: { id: 2, externalId: 200, cartolaClubeId: 266, nome: "Fluminense", nomeCurto: null, sigla: null, escudoUrl: null }, placar: { mandante: null, visitante: null }, placarIntervalo: { mandante: null, visitante: null } };
function state(jogos: FutebolJogo[] = [game]) { return { data: { competicao: { codigo: "BSA", nome: "Brasileirão" }, temporada: 2026, rodada: 27, total: jogos.length, jogos }, loading: false, error: null }; }
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(useFutebolRodada).mockReturnValue(state()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("ordena e agrupa por dia local sem modificar a coleção original", () => {
  const jogos = [{ ...game, id: 2, dataHoraUtc: new Date(2026, 8, 13, 19).toISOString() }, game, { ...game, id: 3, dataHoraUtc: new Date(2026, 8, 12, 20).toISOString() }];
  vi.mocked(useFutebolRodada).mockReturnValue(state(jogos)); render(<FutebolGamesPage />);
  const days = screen.getAllByRole("heading", { level: 3 }); expect(days[0].textContent).toContain("sábado"); expect(days[1].textContent).toContain("domingo");
  expect(within(days[0].closest("section")!).getAllByRole("link")).toHaveLength(2); expect(jogos.map(item => item.id)).toEqual([2, 1, 3]);
  expect(screen.getByText("16:00")).toBeTruthy();
});
it("mantém o clique pelo ID interno, nomes e escudos acessíveis", () => {
  render(<FutebolGamesPage />); expect(screen.getByRole("link", { name: "Ver confronto: Atlético-MG contra Fluminense" }).getAttribute("href")).toBe("/jogos?futebol=1");
  expect(screen.getByRole("img", { name: "Escudo do Atlético-MG indisponível" })).toBeTruthy();
});
it.each([["IN_PLAY", "Ao vivo"], ["FINISHED", "Encerrado"], ["PAUSED", "Intervalo"]])("apresenta %s com placar", (status, label) => {
  vi.mocked(useFutebolRodada).mockReturnValue(state([{ ...game, status, placar: { mandante: 2, visitante: 0 } }])); render(<FutebolGamesPage />);
  expect(screen.getByText(label)).toBeTruthy(); expect(screen.getByLabelText("Placar 2 a 0")).toBeTruthy();
});
it("jogo adiado não apresenta um placar inexistente", () => {
  vi.mocked(useFutebolRodada).mockReturnValue(state([{ ...game, status: "POSTPONED" }])); render(<FutebolGamesPage />);
  expect(screen.getByText("Adiado")).toBeTruthy(); expect(screen.queryByLabelText(/Placar/)).toBeNull();
});
it("apresenta loading sem cards navegáveis", () => {
  vi.mocked(useFutebolRodada).mockReturnValue({ data: null, loading: true, error: null }); render(<FutebolGamesPage />);
  expect(screen.getByRole("status")).toBeTruthy(); expect(screen.queryByRole("link", { name: /Ver confronto/ })).toBeNull();
});
it("mantém a identidade da página em caso de erro", () => {
  vi.mocked(useFutebolRodada).mockReturnValue({ data: null, loading: false, error: "Erro" }); render(<FutebolGamesPage />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Jogos."); expect(screen.getByRole("alert")).toBeTruthy();
});
it.each([false, true])("trata vazio e rodada nula: %s", nullRound => {
  const result = state([]); vi.mocked(useFutebolRodada).mockReturnValue({ ...result, data: { ...result.data, rodada: nullRound ? null : 27 } }); render(<FutebolGamesPage />);
  expect(screen.getByText("Nenhum jogo disponível no momento.")).toBeTruthy();
});
