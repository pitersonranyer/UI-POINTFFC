import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PointCompetitionPage } from "./PointCompetitionPage";
import { pointLeagueService, type CompetitionSummary, type Entry, type RankingEntry } from "@/services/pointLeagueService";
import { teamService } from "@/services/teamService";

const state = vi.hoisted(() => ({ authenticated: false, push: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: state.authenticated, isLoading: false }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { summary: vi.fn(), myEntries: vi.fn(), participants: vi.fn(), ranking: vi.fn(), enroll: vi.fn() }, blockMessages: { LIMITE_TIMES_USUARIO_ATINGIDO: "Você já atingiu o limite de times desta competição." } }));
vi.mock("@/services/teamService", () => ({ teamService: { buscarMeusTimes: vi.fn() } }));
const entry: Entry = { id: 7, timeIdCartola: 123, nomeTime: "Meu FC", nomeCartoleiro: "Ana", escudoUrl: null, pontuacao: null, posicao: null, posicaoAnterior: null };
const rival: Entry = { id: 8, nomeTime: "Rival FC", nomeCartoleiro: "Bia", escudoUrl: null, pontuacao: 88.5, posicao: 1, posicaoAnterior: 2 };
const ranking: RankingEntry[] = [{ ...rival, inscricaoId: 8, timeIdCartola: 456 }, { ...entry, inscricaoId: 7, timeIdCartola: 123 }];
const summary: CompetitionSummary = { competicao: { id: 42, nome: "Disputa 42", slug: "disputa-42", descricao: "Rodada de teste", tipoAcesso: "FREE", valorInscricao: 0, rodadaInicio: 27, rodadaFim: 27, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: 2, limiteParticipantes: null, status: "INSCRICOES_ABERTAS" }, liga: { id: 1, nome: "POINT FFC", slug: "point-ffc", imagemUrl: null }, inscritos: { quantidade: 1 }, premiacao: [] };
const member: CompetitionSummary = { ...summary, usuario: { quantidadeTimesInscritos: 0, limiteTimesUsuario: 2, podeInscrever: true, motivoBloqueio: null, melhorPosicaoUsuario: null, melhorPontuacaoUsuario: null }, minhasInscricoes: [] };
beforeEach(() => {
  vi.stubGlobal("React", React);
  state.authenticated = false; state.push.mockReset();
  vi.mocked(pointLeagueService.summary).mockReset().mockResolvedValue(summary);
  vi.mocked(pointLeagueService.myEntries).mockReset().mockResolvedValue([]);
  vi.mocked(pointLeagueService.participants).mockReset().mockResolvedValue([rival]);
  vi.mocked(pointLeagueService.ranking).mockReset().mockResolvedValue({ ranking });
  vi.mocked(pointLeagueService.enroll).mockReset().mockResolvedValue(entry);
  vi.mocked(teamService.buscarMeusTimes).mockReset().mockResolvedValue([{ timeId: 123, nome: "Meu FC", nomeCartoleiro: "Ana", escudoUrl: "" }]);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const open = async () => { render(<PointCompetitionPage id={42} />); return screen.findByRole("heading", { name: "Disputa 42" }); };
it("abre resumo público com skeleton, Grátis e status humanizado", async () => {
  render(<PointCompetitionPage id={42} />);
  expect(screen.getByRole("status", { name: "Carregando competição" })).toBeTruthy();
  await screen.findByRole("heading", { name: "Disputa 42" });
  expect(pointLeagueService.summary).toHaveBeenCalledWith(42, false);
  expect(screen.getAllByText("Grátis").length).toBeGreaterThan(0);
  expect(screen.queryByText("FREE")).toBeNull();
  expect(screen.getByText("Inscrições abertas")).toBeTruthy();
  expect(screen.getByText("Rodada de teste")).toBeTruthy();
  expect(screen.getByText("Entre para participar")).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Entre para inscrever time" })).toHaveLength(2);
});
it("envia visitante ao login ao tentar inscrever", async () => {
  await open(); fireEvent.click(screen.getAllByRole("button", { name: "Entre para inscrever time" })[0]);
  expect(state.push).toHaveBeenCalledWith("/login?next=%2Fcompeticoes%3Fid%3D42");
  expect(pointLeagueService.enroll).not.toHaveBeenCalled();
});
it("mostra resumo autenticado e estado vazio de premiação", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue(member);
  await open(); expect(pointLeagueService.summary).toHaveBeenCalledWith(42, true);
  expect(screen.getByText("Ainda não inscrito")).toBeTruthy();
  expect(screen.getByText("Você ainda não está participando.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Premiação" }));
  expect(screen.getByText("Premiação ainda não definida para esta competição.")).toBeTruthy();
});
it("abre modal, seleciona time vinculado, inscreve FREE e atualiza resumo", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValueOnce(member).mockResolvedValue({ ...member, inscritos: { quantidade: 2 }, usuario: { ...member.usuario!, quantidadeTimesInscritos: 1 }, minhasInscricoes: [entry] });
  await open(); fireEvent.click(screen.getAllByRole("button", { name: "Inscrever meu time" })[0]);
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText("Meu FC");
  expect((within(dialog).getByRole("button", { name: "Confirmar inscrição FREE" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(within(dialog).getByRole("radio"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar inscrição FREE" }));
  await waitFor(() => expect(pointLeagueService.enroll).toHaveBeenCalledWith(42, 123));
  await screen.findByText("Time inscrito com sucesso!");
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(screen.getByText("1 time inscrito")).toBeTruthy());
  expect(screen.queryByText("Você ainda não está participando.")).toBeNull();
  expect(pointLeagueService.summary).toHaveBeenCalledTimes(2);
});
it("respeita bloqueio por limite retornado pelo backend", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, podeInscrever: false, motivoBloqueio: "LIMITE_TIMES_USUARIO_ATINGIDO" } });
  await open(); expect((screen.getAllByRole("button", { name: "Inscrever meu time" })[0] as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getAllByText("Você já atingiu o limite de times desta competição.").length).toBeGreaterThan(0);
  expect(teamService.buscarMeusTimes).not.toHaveBeenCalled();
});
it("mostra meus times e ausência de pontuação sem inventar zero", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, minhasInscricoes: [entry] }); vi.mocked(pointLeagueService.myEntries).mockResolvedValue([entry]);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Meus times" }));
  expect(await screen.findByText("Meu FC")).toBeTruthy();
  expect(screen.getByText("Sem pontuação")).toBeTruthy();
  expect(pointLeagueService.myEntries).toHaveBeenCalledWith(42);
});
it("mostra participantes na ordem e valores recebidos", async () => {
  await open(); fireEvent.click(screen.getByRole("button", { name: "Participantes" }));
  expect(await screen.findByText("Rival FC")).toBeTruthy();
  expect(screen.getByText("88,50")).toBeTruthy();
  expect(pointLeagueService.participants).toHaveBeenCalledWith(42);
});
it("mostra ranking, movimento, destaque do usuário e atualização manual", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, minhasInscricoes: [entry] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Ranking" }));
  expect(await screen.findByText("Meu FC · Meu time")).toBeTruthy();
  expect(screen.getByText("↑ 1")).toBeTruthy();
  expect(screen.getByText("Meu FC · Meu time").closest("article")?.className).toContain("own");
  expect(pointLeagueService.ranking).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
  await waitFor(() => expect(pointLeagueService.ranking).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByRole("button", { name: "Visão geral" }));
  expect(screen.getByRole("heading", { name: "Classificação parcial" })).toBeTruthy();
  expect(screen.getByText("Meu FC · Meu time")).toBeTruthy();
  expect(pointLeagueService.ranking).toHaveBeenCalledTimes(2);
});
it("mostra resumo real para usuário já inscrito e mantém a ordem das abas", async () => {
  state.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, quantidadeTimesInscritos: 2, melhorPosicaoUsuario: 18, melhorPontuacaoUsuario: 84.37 }, minhasInscricoes: [entry] });
  await open();
  expect(screen.getByText("2 times inscritos")).toBeTruthy();
  expect(screen.getByText("18º")).toBeTruthy();
  expect(screen.getByText("84,37 pts")).toBeTruthy();
  expect(screen.queryByText("Ainda não inscrito")).toBeNull();
  const tabs = within(screen.getByRole("navigation", { name: "Seções da competição" })).getAllByRole("button").map((button) => button.textContent);
  expect(tabs).toEqual(["Visão geral", "Meus times", "Participantes", "Ranking", "Premiação"]);
  fireEvent.click(screen.getByRole("button", { name: "Ver meus times" }));
  expect(await screen.findByRole("heading", { name: "Meus times" })).toBeTruthy();
});
it("evita repetir a rodada no título quando ela já está no badge", async () => {
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, competicao: { ...summary.competicao, nome: "POINT FFC - Rodada 27", descricao: null } });
  render(<PointCompetitionPage id={42} />);
  expect(await screen.findByRole("heading", { name: "POINT FFC" })).toBeTruthy();
  expect(screen.getByText("Rodada 27")).toBeTruthy();
  expect(screen.getByText("Competição oficial da rodada")).toBeTruthy();
});
it("mostra erro do resumo", async () => {
  vi.mocked(pointLeagueService.summary).mockRejectedValue(new Error("API offline"));
  render(<PointCompetitionPage id={42} />);
  expect((await screen.findByRole("alert")).textContent).toContain("API offline");
});
