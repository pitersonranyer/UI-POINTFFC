import { afterEach, describe, expect, it, vi } from "vitest";
import { buscarPontuacaoEscalacao } from "./cartola.service";
import type { CartolaTeamLineupResponse } from "@/types/cartola";

const team: CartolaTeamLineupResponse = {
  time: { time_id: 10, nome: "Time", rodada_time_id: 25 },
  atletas: [
    { atleta_id: 1, clube_id: 1, posicao_id: 5, apelido: "Atacante", pontos_num: 0 },
    { atleta_id: 2, clube_id: 1, posicao_id: 6, apelido: "Técnico" },
    { atleta_id: 3, clube_id: 1, posicao_id: 1, apelido: "Goleiro", pontos_num: 4 },
    { atleta_id: 5, clube_id: 1, posicao_id: 4, apelido: "Meia" },
  ],
  reservas: [{ atleta_id: 4, clube_id: 1, posicao_id: 5, apelido: "Reserva" }],
};

afterEach(() => vi.unstubAllGlobals());

describe("pontuação da escalação", () => {
  it("busca a rodada exibida e associa pontos por ID para titulares, técnico e reservas", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      rodada: 25, atletas: { "4": { pontuacao: -1.5 }, "2": { pontuacao: 0 }, "1": { pontuacao: 12.3 } },
    })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await buscarPontuacaoEscalacao(team, 25);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/cartola\/atletas\/pontuados\/25$/);
    expect(result.atletas.map((player) => player.pontos_num)).toEqual([12.3, 0, 4, undefined]);
    expect(result.reservas?.[0].pontos_num).toBe(-1.5);
    expect(team.atletas[0].pontos_num).toBe(0);
  });

  it("rejeita pontuações de outra rodada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ rodada: 26, atletas: {} }))));
    await expect(buscarPontuacaoEscalacao(team, 25)).rejects.toThrow("Pontuação de outra rodada");
  });

  it("conta titulares que jogaram com zero ou pontos negativos e o técnico, sem contar reservas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      rodada: 25,
      atletas: {
        "1": { pontuacao: 0, entrou_em_campo: true },
        "2": { pontuacao: 0 },
        "3": { pontuacao: -2, entrou_em_campo: true },
        "4": { pontuacao: 10, entrou_em_campo: true },
        "5": { pontuacao: 0, entrou_em_campo: false },
      },
    }))));
    const result = await buscarPontuacaoEscalacao(team, 25);
    expect(result.jogadores_jogaram).toBe(3);
    expect(result.atletas[0].entrou_em_campo).toBe(true);
    expect(result.atletas[3].entrou_em_campo).toBe(false);
    expect(result.reservas?.[0].entrou_em_campo).toBe(true);
  });

  it("não conta pontos antigos da escalação como participação na rodada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ rodada: 25, atletas: {} }))));
    expect((await buscarPontuacaoEscalacao(team, 25)).jogadores_jogaram).toBe(0);
  });

  it("propaga falha para a tela poder informar e permitir nova tentativa", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(buscarPontuacaoEscalacao(team, 25)).rejects.toThrow("HTTP 503");
  });
});
