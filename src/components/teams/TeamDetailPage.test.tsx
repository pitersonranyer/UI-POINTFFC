import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamDetailPage } from "./TeamDetailPage";
import { effectiveLineup } from "./lineupSubstitutions";
import type { CartolaTeamLineupResponse } from "@/types/cartola";

const api = vi.hoisted(() => ({ dashboard: vi.fn(), team: vi.fn(), scores: vi.fn(), partial: vi.fn() }));
vi.mock("@/services/cartola/cartola.service", () => ({
  buscarDashboard: api.dashboard, buscarEscalacaoTime: api.team, buscarPontuacaoEscalacao: api.scores,
}));
vi.mock("@/services/partialScoreService", () => ({ partialScoreService: { buscarParcialTime: api.partial } }));

const snapshot = (): CartolaTeamLineupResponse => ({
  time: { time_id: 1, nome: "Time teste", rodada_time_id: 25 }, pontos: 8.41, status: "PARCIAL",
  capitao_id: 1, reserva_luxo_id: 2,
  atletas: [{ atleta_id: 1, clube_id: 1, posicao_id: 5, apelido: "Pedro", titularEfetivo: false, capitaoOriginal: true, capitaoEfetivo: false, pontos_num: 3, pontuacaoContabilizada: 0 }],
  reservas: [{ atleta_id: 2, clube_id: 2, posicao_id: 5, apelido: "Calleri", titularEfetivo: true, capitaoEfetivo: true, reservaLuxo: true, reservaLuxoUtilizado: true, pontos_num: 5.6, pontuacaoContabilizada: 8.4 }],
  substituicoes: [{ ativa: true, titularSaiuId: 1, reservaEntrouId: 2, reservaLuxo: false, herdouCapitao: true }],
});
beforeEach(() => {
  vi.stubGlobal("React", React);
  localStorage.clear();
  api.dashboard.mockResolvedValue({ rodada: 25, mercadoAberto: false, mercado: { temporada: 2026 }, clubes: {} });
  api.scores.mockImplementation(async (team) => team);
  api.partial.mockResolvedValue({ pontuacao: 99 });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("detalhe da escalação efetiva", () => {
  it.each(["PARCIAL", "FINAL"] as const)("separa titulares sem cópias ou duplicações em %s", (status) => {
    const team = snapshot();
    team.status = status;
    team.reservas!.push(team.atletas[0], team.reservas![0]);
    const lineup = effectiveLineup(team);
    expect(lineup.players).toEqual([team.reservas![0]]);
    expect(lineup.reserves).toEqual([team.atletas[0]]);
    expect(lineup.players[0]).toBe(team.reservas![0]);
    expect(lineup.reserves[0]).toBe(team.atletas[0]);
  });

  for (const view of ["field", "list"]) {
    it.each(["PARCIAL", "FINAL"] as const)(`renderiza troca, faixa e pontos oficiais em ${view} / %s`, async (status) => {
      const team = snapshot();
      team.status = status;
      api.team.mockResolvedValue(team);
      localStorage.setItem("fantasypoint_team_view", view);
      render(<TeamDetailPage timeId={1} />);
      await screen.findByText("Time teste");
      const incoming = screen.getByText("Calleri").closest("article")!;
      const outgoing = screen.getByText("Pedro").closest("article")!;
      expect(within(incoming).getByTitle("Capitão")).toBeTruthy();
      expect(within(outgoing).queryByTitle("Capitão")).toBeNull();
      expect(within(incoming).getByText("8,40 pts")).toBeTruthy();
      expect(within(outgoing).getByText("3,00 pts")).toBeTruthy();
      expect(within(incoming).getByText("Reserva de luxo")).toBeTruthy();
      expect(screen.getByText("Entrou no lugar de Pedro")).toBeTruthy();
      expect(screen.getByText("Saiu por Calleri")).toBeTruthy();
      expect(screen.getByText("8,41 pts")).toBeTruthy();
      expect(screen.getAllByText("Calleri")).toHaveLength(1);
      expect(screen.getAllByText("Pedro")).toHaveLength(1);
      expect(within(screen.getByText("Banco de reservas").closest("section")!).getByText("Pedro")).toBeTruthy();
      expect(api.scores).not.toHaveBeenCalled();
      expect(api.partial).not.toHaveBeenCalled();
    });

    it(`aceita lista vazia, luxo não utilizado e contribuição negativa em ${view}`, async () => {
      const team = snapshot();
      team.substituicoes = [];
      Object.assign(team.atletas[0], { titularEfetivo: true, capitaoEfetivo: false, pontuacaoContabilizada: -2.5 });
      Object.assign(team.reservas![0], { titularEfetivo: false, capitaoEfetivo: false, reservaLuxoUtilizado: false, pontuacaoContabilizada: 0 });
      api.team.mockResolvedValue(team);
      localStorage.setItem("fantasypoint_team_view", view);
      render(<TeamDetailPage timeId={1} />);
      await screen.findByText("Time teste");
      expect(screen.getByText("-2,50 pts")).toBeTruthy();
      expect(screen.queryByTitle("Capitão")).toBeNull();
      expect(screen.queryByText(/Entrou no lugar/)).toBeNull();
      expect(within(screen.getByText("Banco de reservas").closest("section")!).getByText("Reserva de luxo")).toBeTruthy();
    });
  }

  it("preserva os arrays, capitão e consultas legados sem substituicoes", async () => {
    const team = snapshot();
    delete team.substituicoes;
    expect(effectiveLineup(team).players).toBe(team.atletas);
    expect(effectiveLineup(team).reserves).toBe(team.reservas);
    api.team.mockResolvedValue(team);
    localStorage.setItem("fantasypoint_team_view", "list");
    render(<TeamDetailPage timeId={1} />);
    await screen.findByText("Time teste");
    expect(within(screen.getByText("Pedro").closest("article")!).getByTitle("Capitão")).toBeTruthy();
    expect(screen.getByText("3,00 pts")).toBeTruthy();
    expect(screen.getByText("99,00 pts")).toBeTruthy();
    expect(api.scores).toHaveBeenCalled();
    expect(api.partial).toHaveBeenCalled();
    expect(screen.queryByText(/Entrou no lugar/)).toBeNull();
  });
});
