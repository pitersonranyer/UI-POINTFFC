import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generalRankingService } from "@/services/generalRankingService";
import { partialScoreService } from "@/services/partialScoreService";
import { GeneralRanking, GeneralRankingView } from "./GeneralRanking";

vi.mock("@/services/generalRankingService", () => ({ generalRankingService: { buscar: vi.fn() } }));
vi.mock("@/services/partialScoreService", () => ({ partialScoreService: { atualizarRodadaAnterior: vi.fn() } }));
let authenticated = true;
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: authenticated, isLoading: false }) }));
const buscar = vi.mocked(generalRankingService.buscar);
const atualizar = vi.mocked(partialScoreService.atualizarRodadaAnterior);
const entries = [
  { posicao: 2, timeId: 20, nomeTime: "Segundo", nomeCartoleiro: "B", escudoUrl: "", pontuacao: 79.35, status: "PARCIAL" },
  { posicao: 1, timeId: 10, nomeTime: "Primeiro", nomeCartoleiro: "A", escudoUrl: "", pontuacao: 81.5, status: "PARCIAL" },
  { posicao: 3, timeId: 30, nomeTime: "Terceiro", nomeCartoleiro: "C", escudoUrl: "", pontuacao: 70, status: "AGUARDANDO" },
];

const updateResponse = (overrides = {}) => ({
  temporada: 2026, rodada: 25, timesCadastrados: 30, atualizados: 30,
  jaProcessados: 0, semSnapshot: 0, timeIdsSemSnapshot: [], falhas: 0, detalhesFalhas: [],
  ...overrides,
});

afterEach(cleanup);
beforeEach(() => {
  authenticated = true;
  buscar.mockReset();
  atualizar.mockReset();
  atualizar.mockResolvedValue(updateResponse());
});

describe("GeneralRanking", () => {
  it.each([false, true])("oculta tentativa com mercado fechado, falha no GET: %s", async (getFailed) => {
    atualizar.mockRejectedValue(new Error("offline"));
    if (getFailed) buscar.mockRejectedValue(new Error("offline"));
    else buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 3, ranking: entries });
    render(<GeneralRanking season={2026} round={25} marketOpen={false} />);
    await screen.findByText(getFailed ? "Não foi possível carregar o Ranking Geral." : /Exibindo os dados disponíveis/);
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).toBeNull();
  });
  it("carrega o GET público sem disparar atualização autenticada para visitante", async () => {
    authenticated = false;
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 3, ranking: entries });
    render(<GeneralRanking season={2026} round={25} />);
    await screen.findByText("3 times no ranking");
    expect(atualizar).not.toHaveBeenCalled();
    expect(buscar).toHaveBeenCalledWith(2026, 25, 100);
  });
  it.each([
    ["atualizados", { atualizados: 30, jaProcessados: 0 }],
    ["ja processados", { atualizados: 0, jaProcessados: 30 }],
    ["misto", { atualizados: 12, jaProcessados: 18 }],
  ])("executa POST antes do GET: %s", async (_label, result) => {
    atualizar.mockResolvedValue(updateResponse(result));
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 3, ranking: entries });
    render(<GeneralRanking season={2026} round={24} />);
    await screen.findByText("3 times no ranking");
    expect(buscar).toHaveBeenCalledWith(2026, 25, 100);
    expect(atualizar.mock.invocationCallOrder[0]).toBeLessThan(buscar.mock.invocationCallOrder[0]);
  });
  it.each([
    [{ semSnapshot: 2, timeIdsSemSnapshot: [10, 20] }],
    [{ falhas: 1, detalhesFalhas: [{ timeId: 10, motivo: "timeout" }] }],
  ])("mantem ranking com aviso em resposta parcial", async (result) => {
    atualizar.mockResolvedValue(updateResponse(result));
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 3, ranking: entries });
    render(<GeneralRanking season={2026} round={25} />);
    await screen.findByText(/alguns times não puderam ser atualizados/);
  });
  it("faz fallback para GET e permite retry", async () => {
    atualizar.mockRejectedValueOnce(new Error("cold start")).mockResolvedValueOnce(updateResponse());
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 3, ranking: entries });
    render(<GeneralRanking season={2026} round={25} marketOpen />);
    await screen.findByText(/Exibindo os dados disponíveis/);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(atualizar).toHaveBeenCalledTimes(2));
  });
  it("mostra erro e retry quando ambas chamadas falham", async () => {
    atualizar.mockRejectedValue(new Error("offline"));
    buscar.mockRejectedValue(new Error("offline"));
    render(<GeneralRanking season={2026} round={25} marketOpen />);
    await screen.findByRole("button", { name: "Tentar novamente" });
  });
  it("trata a primeira rodada", () => {
    render(<GeneralRankingView round={1} data={null} loading={false} error firstRound />);
    expect(screen.getByText(/primeira rodada/)).toBeTruthy();
  });
  it("renderiza como visitante, preserva a ordem do backend e formata posicoes, pontos e total", async () => {
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 5234, ranking: entries });
    render(<GeneralRanking season={2026} round={25} />);
    expect(screen.getByLabelText("Carregando ranking geral")).toBeTruthy();
    await screen.findByText("5.234 times no ranking");
    const names = screen.getAllByTitle(/Primeiro|Segundo|Terceiro/).map((node) => node.textContent);
    expect(names).toEqual(["Segundo", "Primeiro", "Terceiro"]);
    expect(screen.getByText("1º")).toBeTruthy(); expect(screen.getByText("2º")).toBeTruthy(); expect(screen.getByText("3º")).toBeTruthy();
    expect(screen.getByText(/81,50/)).toBeTruthy(); expect(buscar).toHaveBeenCalledTimes(1);
  });
  it("mantem o loading local enquanto a chamada esta pendente", () => {
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 0, ranking: [] }); render(<GeneralRanking season={2026} round={25} />);
    expect(screen.getByLabelText("Carregando ranking geral")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Aguarde");
  });
  it("mostra erro discreto sem depender de autenticacao", async () => {
    render(<GeneralRankingView round={25} data={null} loading={false} error />);
    expect(screen.getByText(/carregar o Ranking Geral/)).toBeTruthy();
  });
  it("mostra o estado vazio", async () => {
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 0, ranking: [] }); render(<GeneralRanking season={2026} round={25} />);
    await waitFor(() => expect(screen.getByText("Ranking ainda não disponível para esta rodada")).toBeTruthy());
  });
});
