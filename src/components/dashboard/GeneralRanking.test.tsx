import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generalRankingService } from "@/services/generalRankingService";
import { GeneralRanking, GeneralRankingView } from "./GeneralRanking";

vi.mock("@/services/generalRankingService", () => ({ generalRankingService: { buscar: vi.fn() } }));
const buscar = vi.mocked(generalRankingService.buscar);
const entries = [
  { posicao: 2, timeId: 20, nomeTime: "Segundo", nomeCartoleiro: "B", escudoUrl: "", pontuacao: 79.35, status: "PARCIAL" },
  { posicao: 1, timeId: 10, nomeTime: "Primeiro", nomeCartoleiro: "A", escudoUrl: "", pontuacao: 81.5, status: "PARCIAL" },
  { posicao: 3, timeId: 30, nomeTime: "Terceiro", nomeCartoleiro: "C", escudoUrl: "", pontuacao: 70, status: "AGUARDANDO" },
];

afterEach(cleanup);
beforeEach(() => buscar.mockReset());

describe("GeneralRanking", () => {
  it("renderiza como visitante, preserva a ordem do backend e formata posicoes, pontos e total", async () => {
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 5234, ranking: entries });
    render(<GeneralRanking round={25} />);
    expect(screen.getByLabelText("Carregando ranking geral")).toBeTruthy();
    await screen.findByText("5.234 times no ranking");
    const names = screen.getAllByTitle(/Primeiro|Segundo|Terceiro/).map((node) => node.textContent);
    expect(names).toEqual(["Segundo", "Primeiro", "Terceiro"]);
    expect(screen.getByText("1º")).toBeTruthy(); expect(screen.getByText("2º")).toBeTruthy(); expect(screen.getByText("3º")).toBeTruthy();
    expect(screen.getByText(/81,50/)).toBeTruthy(); expect(buscar).toHaveBeenCalledTimes(1);
  });
  it("mantem o loading local enquanto a chamada esta pendente", () => {
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 0, ranking: [] }); render(<GeneralRanking round={25} />);
    expect(screen.getByLabelText("Carregando ranking geral")).toBeTruthy();
  });
  it("mostra erro discreto sem depender de autenticacao", async () => {
    render(<GeneralRankingView round={25} data={null} loading={false} error />);
    expect(screen.getByText("Ranking indisponível no momento")).toBeTruthy();
  });
  it("mostra o estado vazio", async () => {
    buscar.mockResolvedValue({ temporada: 2026, rodada: 25, total: 0, ranking: [] }); render(<GeneralRanking round={25} />);
    await waitFor(() => expect(screen.getByText("Ranking ainda não disponível para esta rodada")).toBeTruthy());
  });
});
