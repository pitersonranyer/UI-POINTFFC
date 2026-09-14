import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PointLeaguePage } from "./PointLeaguePage";
import { pointLeagueService, type Competition, type CompetitionSummary, type PointLeague } from "@/services/pointLeagueService";

const auth = vi.hoisted(() => ({ authenticated: false }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: auth.authenticated, isLoading: false }) }));
vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { league: vi.fn(), competitions: vi.fn(), summary: vi.fn() } }));
const league: PointLeague = { id: 1, nome: "POINT FFC", slug: "point-ffc", descricao: "Liga oficial", imagemUrl: null, modalidades: [{ codigo: "RODADA", nome: "Rodada" }] };
const competition: Competition = { id: 42, nome: "Disputa 42", slug: "disputa-42", descricao: null, tipoAcesso: "FREE", valorInscricao: 0, rodadaInicio: 27, rodadaFim: 27, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: 2, limiteParticipantes: null, status: "INSCRICOES_ABERTAS" };
const summary: CompetitionSummary = { competicao: competition, liga: { id: 1, nome: "POINT FFC", slug: "point-ffc", imagemUrl: null }, inscritos: { quantidade: 12 }, premiacao: [] };
beforeEach(() => { vi.stubGlobal("React", React); auth.authenticated = false; vi.mocked(pointLeagueService.league).mockReset().mockResolvedValue(league); vi.mocked(pointLeagueService.competitions).mockReset().mockResolvedValue([competition]); vi.mocked(pointLeagueService.summary).mockReset().mockResolvedValue(summary); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("carrega competições de Rodada e abre a competição escolhida", async () => {
  render(<PointLeaguePage />);
  expect(screen.getByRole("status", { name: "Carregando liga" })).toBeTruthy();
  expect(await screen.findByText("Disputa 42")).toBeTruthy();
  expect(pointLeagueService.competitions).toHaveBeenCalledTimes(1);
  expect(pointLeagueService.summary).toHaveBeenCalledWith(42, false);
  expect(await screen.findByText("12")).toBeTruthy();
  expect(screen.getByText("27")).toBeTruthy();
  expect(screen.getByText("Inscrições abertas")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Ver competição/ }).getAttribute("href")).toBe("/competicoes?id=42");
  expect(screen.getByText("Mensal").parentElement?.getAttribute("aria-disabled")).toBe("true");
});
it("mostra lista vazia sem criar competições fictícias", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("Nenhuma competição disponível nesta rodada.")).toBeTruthy();
  expect(pointLeagueService.summary).not.toHaveBeenCalled();
});
it("mostra erro da API e permite tentar novamente", async () => {
  vi.mocked(pointLeagueService.league).mockRejectedValueOnce(new Error("Liga offline"));
  render(<PointLeaguePage />);
  expect((await screen.findByRole("alert")).textContent).toContain("Liga offline");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(pointLeagueService.league).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("Disputa 42")).toBeTruthy();
});
it("mostra times do usuário apenas no resumo autenticado", async () => {
  auth.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, usuario: { quantidadeTimesInscritos: 2, limiteTimesUsuario: 30, podeInscrever: true, motivoBloqueio: null, melhorPosicaoUsuario: null, melhorPontuacaoUsuario: null } });
  render(<PointLeaguePage />);
  expect(await screen.findByText("2 / 30")).toBeTruthy();
  expect(pointLeagueService.summary).toHaveBeenCalledWith(42, true);
});
