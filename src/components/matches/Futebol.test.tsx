import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FutebolMatches } from "./FutebolMatches";
import { MatchDetailsPage } from "./MatchDetailsPage";
import { FutebolMatchInfo } from "./FutebolMatch";
import { buscarRodadaAtualBsa } from "@/services/futebolService";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import type { FutebolJogo, FutebolRodada } from "@/types/futebol";

vi.mock("@/services/futebolService", () => ({ buscarRodadaAtualBsa: vi.fn() }));
vi.mock("@/hooks/useCartolaDashboard", () => ({ useCartolaDashboard: vi.fn() }));
const jogo: FutebolJogo = { id: 268, externalId: 555005, temporada: 2026, rodada: 27, dataHoraUtc: "2026-09-13T20:30:00.000Z", status: "TIMED", vencedor: null,
  mandante: { id: 14, externalId: 1783, cartolaClubeId: 262, nome: "Flamengo", nomeCurto: "Outro", sigla: "FLA", escudoUrl: "/fla.svg" },
  visitante: { id: 11, externalId: 1779, cartolaClubeId: 264, nome: "Corinthians", nomeCurto: "Outro", sigla: "COR", escudoUrl: "/cor.svg" },
  placar: { mandante: null, visitante: null }, placarIntervalo: { mandante: null, visitante: null } };
const rodada: FutebolRodada = { competicao: { codigo: "BSA", nome: "Brasileirão" }, temporada: 2026, rodada: 27, total: 1, jogos: [jogo] };
function fantasy(open = false, error: string | null = null) {
  const atletas = Object.fromEntries([262, 264, 282, 266, 293, 1783, 1779].map(id => [id, { clube_id: id, apelido: `Atleta ${id}`, pontuacao: 5, posicao_id: 5, scout: {}, entrou_em_campo: true }]));
  vi.mocked(useCartolaDashboard).mockReturnValue({ dashboard: { mercadoAberto: open, partidas: [] }, athletes: { atletas }, athletesLoading: false, athletesError: error, loading: false, error: null, atualizar: vi.fn() } as unknown as ReturnType<typeof useCartolaDashboard>);
}
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(buscarRodadaAtualBsa).mockResolvedValue(rodada); fantasy(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("card futebol", () => {
  it("renderiza rodada, nomes amigáveis, escudos e rota própria do detalhe", async () => {
    render(<FutebolMatches />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(await screen.findByText("Rodada 27")).toBeTruthy();
    expect(screen.getByText("Flamengo")).toBeTruthy(); expect(screen.getByText("Corinthians")).toBeTruthy();
    expect(screen.queryByText("Outro")).toBeNull();
    expect(screen.getByAltText("Escudo do Flamengo").getAttribute("src")).toBe("/fla.svg");
    const link = screen.getByRole("link"); expect(link.getAttribute("href")).toBe("/jogos?futebol=268");
    expect(buscarRodadaAtualBsa).toHaveBeenCalledTimes(1);
  });
  it.each(["TIMED", "SCHEDULED"])("%s usa horário local", status => {
    render(<FutebolMatchInfo jogo={{ ...jogo, status }} />);
    const date = new Date(jogo.dataHoraUtc);
    expect(screen.getByText(`${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`)).toBeTruthy();
  });
  it.each([["IN_PLAY", "Ao vivo"], ["PAUSED", "Intervalo"], ["FINISHED", "Encerrado"], ["AWARDED", "Encerrado"], ["SUSPENDED", "Suspenso"]])("%s mostra placar e status", (status, label) => {
    render(<FutebolMatchInfo jogo={{ ...jogo, status, placar: { mandante: 1, visitante: 0 } }} />);
    expect(screen.getByText("1 × 0")).toBeTruthy(); expect(screen.getByText(label)).toBeTruthy();
  });
  it.each([["POSTPONED", "Adiado"], ["CANCELLED", "Cancelado"], ["FINISHED", "Encerrado"]])("%s não transforma null em zero", (status, label) => {
    render(<FutebolMatchInfo jogo={{ ...jogo, status }} />); expect(screen.getByText(label)).toBeTruthy(); expect(screen.queryByText(/0 × 0/)).toBeNull();
  });
  it("isola erro da consulta", async () => { vi.mocked(buscarRodadaAtualBsa).mockRejectedValue(new Error()); render(<FutebolMatches />); expect(await screen.findByRole("alert")).toBeTruthy(); });
  it.each([{ ...rodada, jogos: [] }, { ...rodada, rodada: null }])("trata estado vazio %#", async data => {
    vi.mocked(buscarRodadaAtualBsa).mockResolvedValue(data); render(<FutebolMatches />); expect(await screen.findByText("Nenhum jogo disponível no momento.")).toBeTruthy();
  });
  it.each([null, "", "/broken.svg"])("fallback do escudo %s", async escudoUrl => {
    vi.mocked(buscarRodadaAtualBsa).mockResolvedValue({ ...rodada, jogos: [{ ...jogo, mandante: { ...jogo.mandante, escudoUrl } }] });
    render(<FutebolMatches />); await screen.findByText("Flamengo");
    if (escudoUrl) fireEvent.error(screen.getByAltText("Escudo do Flamengo"));
    expect(screen.getByRole("img", { name: "Escudo do Flamengo indisponível" })).toBeTruthy();
  });
});
describe("detalhe existente com futebol", () => {
  it.each([[262,264], [282,266], [293,264]])("filtra exclusivamente clube_id %i e %i, ignorando nomes e externalId", async (home, away) => {
    vi.mocked(buscarRodadaAtualBsa).mockResolvedValue({ ...rodada, jogos: [{ ...jogo, mandante: { ...jogo.mandante, cartolaClubeId: home }, visitante: { ...jogo.visitante, cartolaClubeId: away } }] });
    render(<MatchDetailsPage matchId={0} futebolId={268} />);
    expect(await screen.findByText(`Atleta ${home}`)).toBeTruthy(); expect(screen.getByText(`Atleta ${away}`)).toBeTruthy();
    expect(screen.queryByText("Atleta 1783")).toBeNull(); expect(screen.queryByText("Atleta 1779")).toBeNull();
    expect(buscarRodadaAtualBsa).toHaveBeenCalledTimes(1);
  });
  it("mantém atletas ocultos com mercado aberto", async () => { fantasy(true); render(<MatchDetailsPage matchId={0} futebolId={268}/>); await screen.findByText("Flamengo"); expect(screen.queryByText("Atleta 262")).toBeNull(); });
  it("erro dos atletas preserva partida", async () => { fantasy(false, "Falha"); render(<MatchDetailsPage matchId={0} futebolId={268}/>); expect(await screen.findByText("Flamengo")).toBeTruthy(); expect(screen.getByRole("alert")).toBeTruthy(); });
  it("clube sem vínculo não usa heurística textual e mantém o outro lado", async () => {
    vi.mocked(buscarRodadaAtualBsa).mockResolvedValue({ ...rodada, jogos: [{ ...jogo, mandante: { ...jogo.mandante, cartolaClubeId: null } }] });
    render(<MatchDetailsPage matchId={0} futebolId={268}/>); await screen.findByText(/Dados fantasy não disponíveis/);
    expect(screen.queryByText("Atleta 262")).toBeNull(); expect(screen.getByText("Atleta 264")).toBeTruthy();
  });
  it("preserva rota Cartola sem consultar futebol", async () => { render(<MatchDetailsPage matchId={123}/>); await waitFor(() => expect(screen.getByText("Jogo não encontrado")).toBeTruthy()); expect(buscarRodadaAtualBsa).not.toHaveBeenCalled(); });
});
