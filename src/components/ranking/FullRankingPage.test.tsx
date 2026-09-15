import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FullRankingPage } from "./FullRankingPage";
import { generalRankingService } from "@/services/generalRankingService";
import { buscarDashboardComMetadados } from "@/services/cartola/cartola.service";

const params = vi.hoisted(() => ({ value: new URLSearchParams("temporada=2026&rodada=27") }));
vi.mock("next/navigation", () => ({ useSearchParams: () => params.value }));
vi.mock("@/services/generalRankingService", () => ({ generalRankingService: { buscar: vi.fn() } }));
vi.mock("@/services/cartola/cartola.service", () => ({ buscarDashboardComMetadados: vi.fn() }));
const row = { posicao: 1, timeId: 42, nomeTime: "Real Prime", nomeCartoleiro: "Piterson", escudoUrl: null, pontuacao: 84.37, status: "FINAL", capitao: { atletaId: 99, apelido: "Arrascaeta" } };
const response = { temporada: 2026, rodada: 27, total: 21, paginacao: { pagina: 1, limite: 20, total: 21, totalPaginas: 2 }, ranking: [row] };
beforeEach(() => {
  vi.stubGlobal("React", React);
  params.value = new URLSearchParams("temporada=2026&rodada=27");
  vi.mocked(generalRankingService.buscar).mockReset().mockResolvedValue(response);
  vi.mocked(buscarDashboardComMetadados).mockReset();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("carrega página 1 com dados completos, capitão e estrutura compacta", async () => {
  render(<FullRankingPage />);
  expect(screen.getByRole("status", { name: "Carregando ranking" })).toBeTruthy();
  const name = await screen.findByText("Real Prime");
  const item = name.closest("li")!;
  expect(within(item).getByText("1º")).toBeTruthy();
  expect(within(item).getByText("C")).toBeTruthy();
  expect(within(item).getByText("Arrascaeta")).toBeTruthy();
  expect(within(item).getByText("Piterson")).toBeTruthy();
  expect(within(item).getByText(/84,37/)).toBeTruthy();
  expect(item.querySelector("table")).toBeNull();
  expect(generalRankingService.buscar).toHaveBeenCalledWith(2026, 27, 20, { page: 1, nomeTime: "", nomeCartoleiro: "" });
  expect(buscarDashboardComMetadados).not.toHaveBeenCalled();
});

it("aplica filtros no servidor, muda rodada e pagina sem carregar a lista inteira", async () => {
  render(<FullRankingPage />);
  await screen.findByText("Real Prime");
  fireEvent.change(screen.getByPlaceholderText("Buscar time"), { target: { value: "Real" } });
  fireEvent.change(screen.getByPlaceholderText("Buscar cartoleiro"), { target: { value: "Piterson" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  await waitFor(() => expect(generalRankingService.buscar).toHaveBeenLastCalledWith(2026, 27, 20, { page: 1, nomeTime: "Real", nomeCartoleiro: "Piterson" }));
  fireEvent.click(screen.getByRole("button", { name: "Próxima →" }));
  await waitFor(() => expect(generalRankingService.buscar).toHaveBeenLastCalledWith(2026, 27, 20, { page: 2, nomeTime: "Real", nomeCartoleiro: "Piterson" }));
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "26" } });
  await waitFor(() => expect(generalRankingService.buscar).toHaveBeenLastCalledWith(2026, 26, 20, { page: 1, nomeTime: "Real", nomeCartoleiro: "Piterson" }));
});

it("omite capitão ausente e mostra estado vazio", async () => {
  vi.mocked(generalRankingService.buscar).mockResolvedValueOnce({ ...response, ranking: [{ ...row, capitao: null }] }).mockResolvedValueOnce({ ...response, total: 0, ranking: [], paginacao: { pagina: 1, limite: 20, total: 0, totalPaginas: 0 } });
  render(<FullRankingPage />);
  expect(await screen.findByText("Real Prime")).toBeTruthy();
  expect(screen.queryByText("Arrascaeta")).toBeNull();
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "26" } });
  expect(await screen.findByText("A classificação ainda não está disponível.")).toBeTruthy();
});

it("mostra erro e permite tentar novamente", async () => {
  vi.mocked(generalRankingService.buscar).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(response);
  render(<FullRankingPage />);
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível carregar o ranking.");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Real Prime")).toBeTruthy();
});

it("resolve a rodada atual ao abrir a rota diretamente", async () => {
  params.value = new URLSearchParams();
  vi.mocked(buscarDashboardComMetadados).mockResolvedValue({ data: { rodada: 28, mercadoAberto: true, mercado: { temporada: 2026 } } } as Awaited<ReturnType<typeof buscarDashboardComMetadados>>);
  render(<FullRankingPage />);
  await screen.findByText("Real Prime");
  expect(buscarDashboardComMetadados).toHaveBeenCalledTimes(1);
  expect(generalRankingService.buscar).toHaveBeenCalledWith(2026, 27, 20, { page: 1, nomeTime: "", nomeCartoleiro: "" });
});
