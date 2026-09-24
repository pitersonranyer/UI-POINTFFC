import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PointLeaguePage } from "./PointLeaguePage";
import { pointLeagueService, type Competition, type CompetitionSummary, type PointLeague } from "@/services/pointLeagueService";

const auth = vi.hoisted(() => ({ authenticated: false }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: auth.authenticated, isLoading: false }) }));
vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { league: vi.fn(), competitions: vi.fn(), summary: vi.fn() } }));
const league: PointLeague = { id: 1, nome: "POINT FFC", slug: "point-ffc", descricao: "Liga oficial", imagemUrl: null, modalidades: [{ codigo: "RODADA", nome: "Rodada" }] };
const competition: Competition = { id: 42, nome: "POINT FFC - Rodada 27", slug: "disputa-42", descricao: null, tipoAcesso: "FREE", valorInscricao: 0, rodadaInicio: 27, rodadaFim: 27, inicioInscricao: null, fimInscricao: "2026-09-30T20:59:00-03:00", limiteTimesUsuario: 30, limiteParticipantes: null, status: "INSCRICOES_ABERTAS" };
const summary: CompetitionSummary = { competicao: competition, liga: { id: 1, nome: "POINT FFC", slug: "point-ffc", imagemUrl: null }, inscritos: { quantidade: 12 }, premiacao: [] };
beforeEach(() => { vi.stubGlobal("React", React); auth.authenticated = false; vi.mocked(pointLeagueService.league).mockReset().mockResolvedValue(league); vi.mocked(pointLeagueService.competitions).mockReset().mockResolvedValue([competition]); vi.mocked(pointLeagueService.summary).mockReset().mockResolvedValue(summary); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("renderiza o card compacto com dados reais e abre a competição escolhida", async () => {
  render(<PointLeaguePage />);
  expect(screen.getByRole("status", { name: "Carregando liga" })).toBeTruthy();
  expect(await screen.findByRole("link", { name: "Abrir competição POINT FFC" })).toBeTruthy();
  expect(pointLeagueService.competitions).toHaveBeenCalledTimes(1);
  expect(pointLeagueService.summary).toHaveBeenCalledWith(42, false);
  expect(await screen.findByText("12")).toBeTruthy();
  expect(screen.getByText("Rodada 27")).toBeTruthy();
  expect(screen.getByText("Inscrições abertas")).toBeTruthy();
  expect(screen.getByText("GRÁTIS")).toBeTruthy();
  expect(screen.queryByText("por time")).toBeNull();
  expect(screen.getByText("Até 30/09")).toBeTruthy();
  expect(screen.getByText("20:59")).toBeTruthy();
  expect(screen.getByText("Até 30")).toBeTruthy();
  expect(screen.getByText("times por usuário")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Abrir competição POINT FFC" }).getAttribute("href")).toBe("/competicoes?id=42");
  expect(screen.queryByText(/Ver competição/i)).toBeNull();
  expect(screen.queryByLabelText("Resumo da modalidade")).toBeNull();
  expect(screen.getByText("Mensal").parentElement?.getAttribute("aria-disabled")).toBe("true");
});
it("mostra lista vazia sem criar competições fictícias", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("Nenhuma competição disponível nesta rodada.")).toBeTruthy();
  expect(pointLeagueService.summary).not.toHaveBeenCalled();
});

it.each([[10, "R$ 10,00"], [1234.56, "R$ 1.234,56"], [0, "R$ 0,00"]])("exibe entrada paga com valor real %s em pt-BR e indicação por time", async (valorInscricao, formatted) => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, tipoAcesso: "PAGO", valorInscricao }]);
  render(<PointLeaguePage />);
  expect(await screen.findByText(formatted)).toBeTruthy();
  expect(screen.getByText("por time")).toBeTruthy();
  expect(screen.queryByText("PAGO")).toBeNull();
  expect(screen.queryByText("GRÁTIS")).toBeNull();
  expect(await screen.findByText("12")).toBeTruthy();
  expect(screen.getByText("Até 30/09")).toBeTruthy();
  expect(screen.getByText("Até 30")).toBeTruthy();
});
it("mostra erro da API e permite tentar novamente", async () => {
  vi.mocked(pointLeagueService.league).mockRejectedValueOnce(new Error("Liga offline"));
  render(<PointLeaguePage />);
  expect((await screen.findByRole("alert")).textContent).toContain("Liga offline");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(pointLeagueService.league).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole("link", { name: "Abrir competição POINT FFC" })).toBeTruthy();
});
it("usa o limite do resumo autenticado", async () => {
  auth.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, usuario: { quantidadeTimesInscritos: 2, limiteTimesUsuario: 30, podeInscrever: true, motivoBloqueio: null, melhorPosicaoUsuario: null, melhorPontuacaoUsuario: null } });
  render(<PointLeaguePage />);
  expect(await screen.findByText("Até 30")).toBeTruthy();
  expect(pointLeagueService.summary).toHaveBeenCalledWith(42, true);
});

it("preserva nomes que não correspondem com segurança à rodada", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, nome: "Liga dos Amigos - Rodada 26" }]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("Liga dos Amigos - Rodada 26")).toBeTruthy();
});

it("renderiza várias competições retornadas pela API", async () => {
  const second = { ...competition, id: 84, nome: "Liga dos Amigos", slug: "liga-dos-amigos" };
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([competition, second]);
  vi.mocked(pointLeagueService.summary).mockImplementation(async (id) => ({ ...summary, competicao: id === 84 ? second : competition }));
  render(<PointLeaguePage />);
  expect(await screen.findByRole("link", { name: "Abrir competição POINT FFC" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Abrir competição Liga dos Amigos" }).getAttribute("href")).toBe("/competicoes?id=84");
});

it("humaniza status desconhecidos sem exibir o enum", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, status: "AGUARDANDO_INICIO" }]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("Aguardando inicio")).toBeTruthy();
  expect(screen.queryByText("AGUARDANDO_INICIO")).toBeNull();
});
