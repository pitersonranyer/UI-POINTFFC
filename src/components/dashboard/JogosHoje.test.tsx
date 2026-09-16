import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { JogosHoje } from "./JogosHoje";
import shared from "@/components/matches/FutebolMatches.module.css";
import { buscarJogosHoje } from "@/services/futebolService";
import type { FutebolJogoHoje, FutebolJogosHoje } from "@/types/futebol";

vi.mock("@/services/futebolService", () => ({ buscarJogosHoje: vi.fn() }));
const jogo: FutebolJogoHoje = {
  id: 1, externalId: 1, temporada: 2026, rodada: 1, dataHoraUtc: "2026-09-15T18:00:00Z", status: "TIMED", vencedor: null,
  competicao: { id: 1, codigo: "CL", nome: "Champions League", emblemaUrl: null },
  mandante: { id: 1, externalId: 1, cartolaClubeId: null, nome: "Arsenal Football Club", nomeCurto: "Arsenal", sigla: null, escudoUrl: "/arsenal.svg" },
  visitante: { id: 2, externalId: 2, cartolaClubeId: null, nome: "Inter", nomeCurto: null, sigla: null, escudoUrl: null },
  placar: { mandante: null, visitante: null }, placarIntervalo: { mandante: null, visitante: null },
};
const response: FutebolJogosHoje = { data: "2026-09-15", timezone: "America/Sao_Paulo", total: 1, jogos: [jogo] };
it.each([
  ["IN_PLAY", 2, 0, "mandante"], ["PAUSED", 0, 1, "visitante"],
  ["FINISHED", 0, 2, "visitante"], ["FINISHED", 1, 1, null],
  ["IN_PLAY", null, 1, null], ["TIMED", 2, 0, null], ["CANCELLED", 2, 0, null],
])("destaca somente o líder em %s (%s x %s)", async (status, mandante, visitante, expected) => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, jogos: [{ ...jogo, status: String(status), placar: { mandante: mandante as number | null, visitante: visitante as number | null } }] });
  render(<JogosHoje />);
  await screen.findByText("Arsenal");
  expect(screen.getByText("Arsenal").parentElement?.classList.contains(shared.leadingTeam)).toBe(expected === "mandante");
  expect(screen.getByText("Inter").parentElement?.classList.contains(shared.leadingTeam)).toBe(expected === "visitante");
});
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(buscarJogosHoje).mockResolvedValue(response); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("mostra skeleton compacto durante loading e mantém Ver todos", () => {
  vi.mocked(buscarJogosHoje).mockReturnValue(new Promise(() => {}));
  render(<JogosHoje />);
  expect(screen.getByRole("status", { name: "Carregando jogos de hoje" }).children).toHaveLength(6);
  expect(screen.getByRole("link", { name: "Ver todos" }).getAttribute("href")).toBe("/jogos");
});
it("renderiza aliases, múltiplas competições e todos os jogos sem filtrar data ou código", async () => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, total: 2, jogos: [jogo, { ...jogo, id: 2, dataHoraUtc: "2026-09-16T01:00:00Z", competicao: { ...jogo.competicao, codigo: "NEW", nome: "Nova competição" } }] });
  render(<JogosHoje />);
  expect(await screen.findByText("Champions League")).toBeTruthy();
  expect(screen.getByText("Nova competição")).toBeTruthy();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.queryByRole("link", { name: "Ver agenda" })).toBeNull();
  expect(screen.getAllByText("Arsenal")).toHaveLength(2);
  expect(screen.getAllByText("Inter")).toHaveLength(2);
  expect(screen.getByText("15:00")).toBeTruthy();
  expect(screen.getByText("22:00")).toBeTruthy();
});
it.each(["TIMED", "SCHEDULED"])("%s mostra horário sem placar mesmo com zeros recebidos", async status => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, jogos: [{ ...jogo, status, placar: { mandante: 0, visitante: 0 } }] });
  render(<JogosHoje />);
  expect(await screen.findByText("Às 15:00")).toBeTruthy();
  expect(screen.queryByLabelText(/Placar do/)).toBeNull();
});
it.each([["IN_PLAY", "Ao vivo"], ["PAUSED", "Intervalo"], ["FINISHED", "Encerrado"], ["AWARDED", "Encerrado"], ["SUSPENDED", "Suspenso"]])("%s mostra status e placar incluindo zero", async (status, label) => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, jogos: [{ ...jogo, status, placar: { mandante: 2, visitante: 0 } }] });
  render(<JogosHoje />);
  expect(await screen.findByText(label)).toBeTruthy();
  expect(screen.getByLabelText("Placar do Arsenal Football Club").textContent).toBe("2");
  expect(screen.getByLabelText("Placar do Inter").textContent).toBe("0");
});
it.each([["POSTPONED", "Adiado"], ["CANCELLED", "Cancelado"], ["UNKNOWN", "A definir"], ["FINISHED", "Encerrado"]])("%s sem placar não inventa zero", async (status, label) => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, jogos: [{ ...jogo, status }] });
  render(<JogosHoje />);
  expect(await screen.findByText(label)).toBeTruthy();
  expect(screen.queryByLabelText(/Placar do/)).toBeNull();
});
it("mantém seção vazia quando total é zero", async () => {
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, total: 0, jogos: [] });
  render(<JogosHoje />);
  expect(await screen.findByText("Nenhum jogo programado para hoje")).toBeTruthy();
  expect(screen.getByText("Confira a agenda completa e os próximos jogos.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver agenda" }).getAttribute("href")).toBe("/jogos");
  expect(screen.queryByRole("region", { name: "Carrossel de jogos de hoje" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Próximos jogos de hoje" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Jogos de hoje anteriores" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Jogos de hoje" })).toBeTruthy();
});
it("mostra erro e permite tentar novamente", async () => {
  vi.mocked(buscarJogosHoje).mockRejectedValueOnce(new Error("offline"));
  render(<JogosHoje />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Arsenal")).toBeTruthy();
  expect(buscarJogosHoje).toHaveBeenCalledTimes(2);
});
it("reutiliza fallback para escudo ausente e quebrado", async () => {
  render(<JogosHoje />);
  expect(await screen.findByRole("img", { name: "Escudo do Inter indisponível" })).toBeTruthy();
  fireEvent.error(screen.getByAltText("Escudo do Arsenal Football Club"));
  expect(screen.getByRole("img", { name: "Escudo do Arsenal Football Club indisponível" })).toBeTruthy();
});
it("preserva nome longo completo no título e nome acessível do card", async () => {
  const nome = "Nome muito longo de um clube de futebol internacional";
  vi.mocked(buscarJogosHoje).mockResolvedValue({ ...response, jogos: [{ ...jogo, mandante: { ...jogo.mandante, nome, nomeCurto: null } }] });
  render(<JogosHoje />);
  const card = await screen.findByRole("article", { name: `${nome} contra Inter` });
  expect(within(card).getByText(nome).getAttribute("title")).toBe(nome);
});
it("permite navegação por setas e teclado com controles nos limites", async () => {
  render(<JogosHoje />);
  const track = await screen.findByRole("region", { name: "Carrossel de jogos de hoje" });
  Object.defineProperties(track, { clientWidth: { value: 900 }, scrollWidth: { value: 1810 } });
  Object.defineProperty(track, "scrollBy", { value: vi.fn(({ left }: ScrollToOptions) => { track.scrollLeft += left ?? 0; fireEvent.scroll(track); }) });
  fireEvent.resize(window);
  const next = screen.getByRole("button", { name: "Próximos jogos de hoje" }) as HTMLButtonElement;
  const previous = screen.getByRole("button", { name: "Jogos de hoje anteriores" }) as HTMLButtonElement;
  expect(previous.disabled).toBe(true);
  fireEvent.click(next);
  expect(track.scrollLeft).toBe(910);
  expect(next.disabled).toBe(true);
  fireEvent.keyDown(track, { key: "ArrowLeft" });
  expect(track.scrollLeft).toBe(0);
});
