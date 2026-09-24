import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
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
  expect(screen.getByText("30 times")).toBeTruthy();
  expect(screen.getByText("por usuário")).toBeTruthy();
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
  expect(screen.getByText("30 times")).toBeTruthy();
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
  expect(await screen.findByText("30 times")).toBeTruthy();
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

it("usa uma unica logo oficial no card sem repetir o nome da marca", async () => {
  render(<PointLeaguePage />);
  const card = await screen.findByRole("link", { name: "Abrir competição POINT FFC" });
  expect(within(card).getAllByRole("img")).toHaveLength(1);
  expect(within(card).getByRole("img", { name: "POINT FFC" }).getAttribute("src")).toBe("/brand/pointffc-logo.png");
  expect(within(card).queryByRole("heading")).toBeNull();
  expect(within(card).getByText("Competição oficial da rodada")).toBeTruthy();
});

it.each([
  ["INSCRICOES_ABERTAS", "Inscrições abertas", null],
  ["INSCRICOES_ENCERRADAS", "Em andamento", "Ver parciais"],
  ["EM_ANDAMENTO", "Em andamento", "Ver parciais"],
  ["ENCERRADA", "Encerrada", "Ver resultado"],
])("interpreta %s e navega para a experiencia existente", async (status, label, action) => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, status }]);
  render(<PointLeaguePage />);
  const badge = await screen.findByText(label);
  expect(badge.parentElement?.className).toContain(status === "INSCRICOES_ABERTAS" ? "open" : label === "Em andamento" ? "live" : "status");
  if (action) expect(screen.getByText(action)).toBeTruthy();
  const link = screen.getByRole("link", { name: `${action ?? "Abrir competição"} POINT FFC` });
  expect(link.getAttribute("href")).toBe(`/competicoes?id=42${action ? "&aba=ranking" : ""}`);
  expect(link.querySelectorAll("a,button")).toHaveLength(0);
});

it.each([null, undefined, "0.00"])("FREE sem premio monetario aplicavel (%s) oculta faixa", async (premiacaoEmDisputa) => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, premiacaoEmDisputa, quantidadeInscritos: 100 }]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("GRÁTIS")).toBeTruthy();
  expect(screen.queryByText("Premiação em disputa")).toBeNull();
});

it.each(["PAGO", "FREE"])("exibe premio %s fornecido pelo backend sem recalcular", async (tipoAcesso) => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, tipoAcesso, valorInscricao: 10,
    quantidadeInscritos: 2, premiacaoEmDisputa: "1234.56" }]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("R$ 1.234,56")).toBeTruthy();
  expect(screen.getByText("Premiação em disputa")).toBeTruthy();
  expect(screen.getByText("2")).toBeTruthy();
});

it("atualiza premio e inscritos periodicamente e ao retornar para a pagina", async () => {
  vi.useFakeTimers();
  const card = { ...competition, tipoAcesso: "PAGO", valorInscricao: 10, quantidadeInscritos: 10, premiacaoEmDisputa: "90.00" };
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([card]);
  await act(async () => { render(<PointLeaguePage />); });
  expect(screen.getByText("R$ 90,00")).toBeTruthy();
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...card, quantidadeInscritos: 11, premiacaoEmDisputa: "99.00" }]);
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(screen.getByText("R$ 99,00")).toBeTruthy();
  expect(screen.getByText("11")).toBeTruthy();
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...card, quantidadeInscritos: 12, premiacaoEmDisputa: "108.00" }]);
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(screen.getByText("R$ 108,00")).toBeTruthy();
  vi.mocked(pointLeagueService.competitions).mockRejectedValueOnce(new Error("Offline"));
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(screen.getByText("R$ 108,00")).toBeTruthy();
  cleanup();
  const calls = vi.mocked(pointLeagueService.competitions).mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(pointLeagueService.competitions).toHaveBeenCalledTimes(calls);
});

it("preserva limite nulo autenticado sem usar limite total de participantes", async () => {
  auth.authenticated = true;
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, limiteParticipantes: 1000 }]);
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, usuario: { quantidadeTimesInscritos: 0,
    limiteTimesUsuario: null, podeInscrever: true, motivoBloqueio: null, melhorPosicaoUsuario: null, melhorPontuacaoUsuario: null } });
  render(<PointLeaguePage />);
  expect(await screen.findByText("Sem limite")).toBeTruthy();
  expect(screen.queryByText("1000")).toBeNull();
});
