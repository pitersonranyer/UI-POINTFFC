import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PointCompetitionPage } from "./PointCompetitionPage";
import { ApiError } from "@/services/apiClient";
import { pointLeagueService, type CompetitionSummary, type Entry, type RankingEntry } from "@/services/pointLeagueService";
import { teamService } from "@/services/teamService";

const state = vi.hoisted(() => ({ authenticated: false, push: vi.fn(), refreshMarket: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: state.authenticated, isLoading: false }) }));
vi.mock("@/hooks/useCartolaDashboard", () => ({ useCartolaDashboard: () => ({ dashboard: { mercado: { rodada_atual: 27, status_mercado: 1, bola_rolando: false, fechamento: { timestamp: Math.floor(Date.now() / 1000) + 172800 } }, rodada: 27, mercadoAberto: true, bolaRolando: false, partidas: [], clubes: {} }, loading: false, error: null, atualizar: state.refreshMarket }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { summary: vi.fn(), myEntries: vi.fn(), participants: vi.fn(), ranking: vi.fn(), enroll: vi.fn() }, blockMessages: { LIMITE_TIMES_USUARIO_ATINGIDO: "Você já atingiu o limite de times desta competição." } }));
vi.mock("@/services/teamService", () => ({ teamService: { buscarMeusTimes: vi.fn(), buscarTimesPorIds: vi.fn(), importarMeusTimes: vi.fn() } }));
const entry: Entry = { id: 7, timeIdCartola: 123, nomeTime: "Meu FC", nomeCartoleiro: "Ana", escudoUrl: null, pontuacao: null, posicao: null, posicaoAnterior: null };
const rival: Entry = { id: 8, nomeTime: "Rival FC", nomeCartoleiro: "Bia", escudoUrl: null, pontuacao: 88.5, posicao: 1, posicaoAnterior: 2 };
const ranking: RankingEntry[] = [{ ...rival, inscricaoId: 8, timeIdCartola: 456, capitao: { atletaId: 99, apelido: "Arrascaeta" } }, { ...entry, inscricaoId: 7, timeIdCartola: 123, capitao: null }];
const summary: CompetitionSummary = { competicao: { id: 42, nome: "Disputa 42", slug: "disputa-42", descricao: "Rodada de teste", tipoAcesso: "FREE", valorInscricao: 0, rodadaInicio: 27, rodadaFim: 27, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: 2, limiteParticipantes: null, status: "INSCRICOES_ABERTAS" }, liga: { id: 1, nome: "POINT FFC", slug: "point-ffc", imagemUrl: null }, inscritos: { quantidade: 1 }, premiacao: [] };
const member: CompetitionSummary = { ...summary, usuario: { quantidadeTimesInscritos: 0, limiteTimesUsuario: 2, podeInscrever: true, motivoBloqueio: null, melhorPosicaoUsuario: null, melhorPontuacaoUsuario: null }, minhasInscricoes: [] };
beforeEach(() => {
  vi.stubGlobal("React", React);
  state.authenticated = false; state.push.mockReset(); state.refreshMarket.mockReset();
  vi.mocked(pointLeagueService.summary).mockReset().mockResolvedValue(summary);
  vi.mocked(pointLeagueService.myEntries).mockReset().mockResolvedValue([]);
  vi.mocked(pointLeagueService.participants).mockReset().mockResolvedValue([rival]);
  vi.mocked(pointLeagueService.ranking).mockReset().mockResolvedValue({ ranking });
  vi.mocked(pointLeagueService.enroll).mockReset().mockResolvedValue(entry);
  vi.mocked(teamService.buscarMeusTimes).mockReset().mockResolvedValue([{ timeId: 123, nome: "Meu FC", nomeCartoleiro: "Ana", escudoUrl: "" }]);
  vi.mocked(teamService.buscarTimesPorIds).mockReset().mockResolvedValue({ times: [], naoEncontrados: [], tentarNovamente: [] });
  vi.mocked(teamService.importarMeusTimes).mockReset().mockResolvedValue({ adicionados: 0, jaExistentes: 0, naoEncontrados: [], tentarNovamente: [], naoProcessados: 0 });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const open = async () => { render(<PointCompetitionPage id={42} />); return screen.findByRole("heading", { name: "Disputa 42" }); };
it("abre resumo público com cabeçalho clean, contador do mercado e CTA de inscrição", async () => {
  render(<PointCompetitionPage id={42} />);
  expect(screen.getByRole("status", { name: "Carregando competição" })).toBeTruthy();
  await screen.findByRole("heading", { name: "Disputa 42" });
  expect(pointLeagueService.summary).toHaveBeenCalledWith(42, false);
  expect(screen.getAllByText("Grátis").length).toBeGreaterThan(0);
  expect(screen.queryByText("FREE")).toBeNull();
  expect(screen.getByText("Rodada de teste")).toBeTruthy();
  expect(screen.getAllByText("Rodada 27")).toHaveLength(2);
  expect(screen.getByText("1")).toBeTruthy();
  expect(screen.getByText("Até 2")).toBeTruthy();
  expect(screen.getByText("Fecha em")).toBeTruthy();
  expect(screen.getByText("dias")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Inscreva seu time" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Sua participação" })).toBeNull();
  expect(screen.queryByText("Entre para participar")).toBeNull();
  expect(screen.queryByText("Acompanhe seus times nesta competição.")).toBeNull();
  expect(screen.queryByText("Faça login para inscrever um time e acompanhar sua posição.")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Classificação parcial" })).toBeNull();
  expect(pointLeagueService.ranking).not.toHaveBeenCalled();
});
it("envia visitante ao login ao tentar inscrever", async () => {
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  expect(state.push).toHaveBeenCalledWith("/login?next=%2Fcompeticoes%3Fid%3D42");
  expect(pointLeagueService.enroll).not.toHaveBeenCalled();
});
it("mostra resumo autenticado e estado vazio de premiação", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue(member);
  await open(); expect(pointLeagueService.summary).toHaveBeenCalledWith(42, true);
  expect(screen.getByRole("button", { name: "Inscreva seu time" })).toBeTruthy();
  expect(screen.queryByText("Ainda não inscrito")).toBeNull();
  expect(screen.queryByText("Você ainda não está participando.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Premiações" }));
  expect(screen.getByText("Premiação ainda não definida para esta competição.")).toBeTruthy();
});
it("abre modal, seleciona time vinculado, inscreve FREE e atualiza resumo", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValueOnce(member).mockResolvedValue({ ...member, inscritos: { quantidade: 2 }, usuario: { ...member.usuario!, quantidadeTimesInscritos: 1 }, minhasInscricoes: [entry] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText("Meu FC");
  const values = within(dialog).getByText("Valor por time").closest("dl")!;
  expect(within(values).getByText("Valor por time").nextElementSibling?.textContent).toMatch(/R\$\s*0,00/);
  expect(within(values).getByText("Total da inscrição").nextElementSibling?.textContent).toMatch(/R\$\s*0,00/);
  expect((within(dialog).getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(within(dialog).getByRole("checkbox", { name: "Selecionar Meu FC" }));
  expect(within(dialog).queryByText(/titularidade|titular dos times|comprovação/i)).toBeNull();
  expect(within(dialog).queryByRole("checkbox", { name: /Declaro/ })).toBeNull();
  fireEvent.click(within(dialog).getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }));
  await waitFor(() => expect(pointLeagueService.enroll).toHaveBeenCalledWith(42, 123));
  await screen.findByText("1 time inscrito com sucesso.");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByText("Você ainda não está participando.")).toBeNull();
  expect(pointLeagueService.summary).toHaveBeenCalledTimes(2);
});
it("calcula o total com o valor real retornado pela competição", async () => {
  state.authenticated = true;
  const teams = [{ timeId: 123, nome: "Time A", nomeCartoleiro: "Ana", escudoUrl: "" }, { timeId: 456, nome: "Time B", nomeCartoleiro: "Bia", escudoUrl: "" }, { timeId: 789, nome: "Time C", nomeCartoleiro: "Caio", escudoUrl: "" }];
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, competicao: { ...member.competicao, tipoAcesso: "PAGO", valorInscricao: 10, limiteTimesUsuario: 3 }, usuario: { ...member.usuario!, limiteTimesUsuario: 3 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue(teams);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.click(dialog.getByRole("button", { name: "Selecionar todos" }));
  const values = dialog.getByText("Valor por time").closest("dl")!;
  expect(within(values).getByText("Valor por time").nextElementSibling?.textContent).toMatch(/R\$\s*10,00/);
  expect(within(values).getByText("Total da inscrição").nextElementSibling?.textContent).toMatch(/R\$\s*30,00/);
  expect(dialog.getByRole("button", { name: /Confirmar inscrição.*R\$\s*30,00/i })).toBeTruthy();
});
it("respeita bloqueio por limite retornado pelo backend", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, podeInscrever: false, motivoBloqueio: "LIMITE_TIMES_USUARIO_ATINGIDO" } });
  await open(); expect((screen.getByRole("button", { name: "Inscreva seu time" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Você já atingiu o limite de times desta competição.")).toBeTruthy();
  expect(teamService.buscarMeusTimes).not.toHaveBeenCalled();
});
it("mostra meus times e ausência de pontuação sem inventar zero", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, minhasInscricoes: [entry] }); vi.mocked(pointLeagueService.myEntries).mockResolvedValue([entry]);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Meus times" }));
  expect(await screen.findByText("Meu FC")).toBeTruthy();
  expect(screen.getByText("Sem pontuação")).toBeTruthy();
  expect(pointLeagueService.myEntries).toHaveBeenCalledWith(42);
});
it("remove a aba Participantes e exibe inscritos sem posição ou pontuação no Ranking", async () => {
  vi.mocked(pointLeagueService.ranking).mockResolvedValue({ ranking: [{ ...entry, inscricaoId: 7, timeIdCartola: 123, capitao: null }] });
  await open();
  expect(screen.queryByRole("button", { name: "Participantes" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Ranking" }));
  expect(await screen.findByText("Meu FC")).toBeTruthy();
  expect(screen.getByText("Ana")).toBeTruthy();
  expect(screen.getAllByText("—")).toHaveLength(2);
  expect(pointLeagueService.ranking).toHaveBeenCalledWith(42);
  expect(pointLeagueService.participants).not.toHaveBeenCalled();
});
it("mostra ranking na ordem da API, posição, cartoleiro, pontuação, destaque e atualização", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, minhasInscricoes: [entry] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Ranking" }));
  expect(await screen.findByText("Rival FC")).toBeTruthy();
  expect(screen.getByText("1º")).toBeTruthy();
  expect(screen.getByText("Bia")).toBeTruthy();
  expect(within(screen.getByText("Rival FC").closest("article")!).getByText("Arrascaeta")).toBeTruthy();
  expect(within(screen.getByText("Rival FC").closest("article")!).getByText("C")).toBeTruthy();
  expect(within(screen.getByText("Meu FC").closest("article")!).queryByText("C")).toBeNull();
  expect(screen.getByText("88,50 pts")).toBeTruthy();
  expect(screen.getByText("Seu time").closest("article")?.className).toContain("own");
  const cards = Array.from(screen.getByText("Rival FC").closest("section")?.querySelectorAll("article") ?? []);
  expect(cards.map((card) => card.textContent)).toEqual([expect.stringContaining("Rival FC"), expect.stringContaining("Meu FC")]);
  expect(pointLeagueService.ranking).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
  await waitFor(() => expect(pointLeagueService.ranking).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByRole("button", { name: "Visão geral" }));
  expect(screen.queryByRole("heading", { name: "Classificação parcial" })).toBeNull();
  expect(pointLeagueService.ranking).toHaveBeenCalledTimes(2);
});
it("remove o resumo de participação, mantém o CTA para usuário inscrito com vagas e a ordem das abas", async () => {
  state.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, quantidadeTimesInscritos: 2, melhorPosicaoUsuario: 18, melhorPontuacaoUsuario: 84.37 }, minhasInscricoes: [entry] });
  await open();
  expect(screen.queryByText("2 times inscritos")).toBeNull();
  expect(screen.queryByText("18º")).toBeNull();
  expect(screen.queryByText("84,37 pts")).toBeNull();
  expect(screen.getByRole("button", { name: "Inscreva seu time" })).toBeTruthy();
  expect(screen.queryByText("Ainda não inscrito")).toBeNull();
  const tabs = within(screen.getByRole("navigation", { name: "Seções da competição" })).getAllByRole("button").map((button) => button.textContent);
  expect(tabs).toEqual(["Visão geral", "Meus times", "Ranking", "Premiações"]);
  fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
});
it("evita repetir a rodada no título quando ela já está no badge", async () => {
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, competicao: { ...summary.competicao, nome: "POINT FFC - Rodada 27", descricao: null } });
  render(<PointCompetitionPage id={42} />);
  expect(await screen.findByRole("heading", { name: "POINT FFC" })).toBeTruthy();
  expect(screen.getAllByText("Rodada 27")).toHaveLength(2);
  expect(screen.getByText("Competição oficial da rodada")).toBeTruthy();
});
it("mostra Sobre como lista compacta com os dados disponíveis", async () => {
  await open();
  expect(screen.getByText("Período de inscrições")).toBeTruthy();
  expect(screen.getByText("Período da competição")).toBeTruthy();
  expect(screen.getByText("Formato")).toBeTruthy();
  expect(screen.getByText("Limite de times por usuário")).toBeTruthy();
  expect(screen.getByText("Consulte a aba Premiações")).toBeTruthy();
});
it("seleciona e desmarca vários times, atualiza contador e respeita o limite restante", async () => {
  state.authenticated = true;
  const teams = [{ timeId: 123, nome: "Time A", nomeCartoleiro: "Ana", escudoUrl: "" }, { timeId: 456, nome: "Time B", nomeCartoleiro: "Bia", escudoUrl: "" }, { timeId: 789, nome: "Time C", nomeCartoleiro: "Caio", escudoUrl: "" }];
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, limiteTimesUsuario: 2 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue(teams);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time A" }));
  fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time B" }));
  expect(dialog.getAllByText("2 times selecionados")).toHaveLength(2);
  expect((dialog.getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(false);
  expect((dialog.getByRole("checkbox", { name: "Selecionar Time C" }) as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time A" }));
  expect(dialog.getAllByText("1 time selecionado")).toHaveLength(2);
  expect((dialog.getByRole("checkbox", { name: "Selecionar Time C" }) as HTMLInputElement).disabled).toBe(false);
});

it("busca, seleciona todos os resultados até o limite e desmarca todos", async () => {
  state.authenticated = true;
  const teams = [{ timeId: 123, nome: "Real Prime", nomeCartoleiro: "Ana", escudoUrl: "" }, { timeId: 456, nome: "Real Madrid", nomeCartoleiro: "Bia", escudoUrl: "" }, { timeId: 789, nome: "Outro Time", nomeCartoleiro: "Caio", escudoUrl: "" }];
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, limiteTimesUsuario: 2 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue(teams);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.change(dialog.getByRole("searchbox", { name: "Buscar pelo nome do time" }), { target: { value: "real" } });
  expect(dialog.getByText("Real Prime")).toBeTruthy();
  expect(dialog.getByText("Real Madrid")).toBeTruthy();
  expect(dialog.queryByText("Outro Time")).toBeNull();
  fireEvent.click(dialog.getByRole("button", { name: "Selecionar todos" }));
  expect(dialog.getAllByText("2 times selecionados")).toHaveLength(2);
  expect(dialog.getByText("0 vagas restantes")).toBeTruthy();
  expect((dialog.getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(dialog.getByRole("button", { name: "Desmarcar todos" }));
  expect(dialog.getAllByText("0 times selecionados")).toHaveLength(2);
  expect((dialog.getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(true);
});

it("identifica time já inscrito e impede nova seleção", async () => {
  state.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, quantidadeTimesInscritos: 1 }, minhasInscricoes: [entry] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const checkbox = await screen.findByRole("checkbox", { name: "Meu FC: Já inscrito" }) as HTMLInputElement;
  expect(checkbox.disabled).toBe(true);
  expect(screen.getByText("Já inscrito")).toBeTruthy();
});

it("Selecionar por IDs seleciona somente times já vinculados pela fonte oficial", async () => {
  state.authenticated = true;
  const linkedTeam = { timeId: 456, nome: "Vinculado", nomeCartoleiro: "Bia", escudoUrl: "" };
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, limiteTimesUsuario: 4 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue([linkedTeam]);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  expect(await screen.findByRole("checkbox", { name: "Selecionar Vinculado" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Importar IDs" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Selecionar por IDs" }));
  fireEvent.change(screen.getByLabelText("IDs dos times"), { target: { value: "Favoritos=>456;789" } });
  expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Selecionar times" }));
  const selected = screen.getByRole("checkbox", { name: "Selecionar Vinculado" }) as HTMLInputElement;
  expect(selected.checked).toBe(true);
  expect(screen.queryByText("789")).toBeNull();
  expect(screen.getByText("1 time selecionado. 1 não encontrado(s) ou indisponível(is) nesta competição.")).toBeTruthy();
  expect(teamService.buscarTimesPorIds).not.toHaveBeenCalled();
  expect(teamService.importarMeusTimes).not.toHaveBeenCalled();
  expect(pointLeagueService.enroll).not.toHaveBeenCalled();
});

it("ID de time não vinculado não entra na lista nem pode ser inscrito", async () => {
  state.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue(member);
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue([]);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  expect(screen.getByText("Nenhum time vinculado. Cadastre seus times em Meus Times para continuar.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Selecionar por IDs" }));
  fireEvent.change(screen.getByLabelText("IDs dos times"), { target: { value: "789" } });
  fireEvent.click(screen.getByRole("button", { name: "Selecionar times" }));
  expect(screen.getByText("0 times selecionados. 1 não encontrado(s) ou indisponível(is) nesta competição.")).toBeTruthy();
  expect(screen.queryByRole("checkbox", { name: /789/ })).toBeNull();
  expect(pointLeagueService.enroll).not.toHaveBeenCalled();
  expect(teamService.buscarTimesPorIds).not.toHaveBeenCalled();
  expect(teamService.importarMeusTimes).not.toHaveBeenCalled();
});

it("inscreve sequencialmente, continua após falha, preserva somente retry e impede duplo envio", async () => {
  state.authenticated = true;
  const teams = [{ timeId: 123, nome: "Time A", nomeCartoleiro: "Ana", escudoUrl: "" }, { timeId: 456, nome: "Time B", nomeCartoleiro: "Bia", escudoUrl: "" }, { timeId: 789, nome: "Time C", nomeCartoleiro: "Caio", escudoUrl: "" }];
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, limiteTimesUsuario: 4 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue(teams);
  let resolveFirst!: (value: Entry) => void; let rejectSecond!: (reason: Error) => void; let resolveThird!: (value: Entry) => void;
  vi.mocked(pointLeagueService.enroll)
    .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
    .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSecond = reject; }))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveThird = resolve; }))
    .mockResolvedValueOnce(entry);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time A" })); fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time B" })); fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time C" }));
  const confirm = dialog.getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }); fireEvent.click(confirm); fireEvent.click(confirm);
  expect(pointLeagueService.enroll).toHaveBeenCalledTimes(1);
  expect(dialog.getByRole("button", { name: "Inscrevendo 1 de 3..." })).toBeTruthy();
  resolveFirst(entry);
  await waitFor(() => expect(pointLeagueService.enroll).toHaveBeenCalledTimes(2));
  expect(pointLeagueService.enroll).toHaveBeenNthCalledWith(2, 42, 456);
  rejectSecond(new ApiError(500, "Internal server error"));
  await waitFor(() => expect(pointLeagueService.enroll).toHaveBeenCalledTimes(3));
  expect(pointLeagueService.enroll).toHaveBeenNthCalledWith(3, 42, 789);
  resolveThird(entry);
  expect(await screen.findByText("2 de 3 times inscritos. 1 não pôde ser inscrito.")).toBeTruthy();
  expect(screen.getByText("Não foi possível concluir a inscrição").closest("li")?.textContent).toContain("Time B");
  expect(screen.queryByText("Internal server error")).toBeNull();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect((dialog.getByRole("checkbox", { name: "Selecionar Time A" }) as HTMLInputElement).checked).toBe(false);
  expect((dialog.getByRole("checkbox", { name: "Selecionar Time B" }) as HTMLInputElement).checked).toBe(true);
  expect((dialog.getByRole("checkbox", { name: "Selecionar Time C" }) as HTMLInputElement).checked).toBe(false);
  fireEvent.click(dialog.getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }));
  await waitFor(() => expect(pointLeagueService.enroll).toHaveBeenCalledTimes(4));
  expect(pointLeagueService.enroll).toHaveBeenNthCalledWith(4, 42, 456);
  expect(await screen.findByText("1 time inscrito com sucesso.")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
});

it.each(["resumo", "times"])("preserva o sucesso quando falha o refresh de %s", async (target) => {
  state.authenticated = true;
  const team = { timeId: 123, nome: "Time A", nomeCartoleiro: "Ana", escudoUrl: "" };
  if (target === "resumo") vi.mocked(pointLeagueService.summary).mockResolvedValueOnce(member).mockRejectedValueOnce(new ApiError(500, "Internal server error"));
  else vi.mocked(pointLeagueService.summary).mockResolvedValue(member);
  if (target === "times") vi.mocked(teamService.buscarMeusTimes).mockResolvedValueOnce([team]).mockRejectedValueOnce(new ApiError(500, "Internal server error"));
  else vi.mocked(teamService.buscarMeusTimes).mockResolvedValue([team]);
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  fireEvent.click(await screen.findByRole("checkbox", { name: "Selecionar Time A" }));
  fireEvent.click(screen.getByRole("button", { name: /Confirmar inscrição.*R\$\s*0,00/i }));
  expect(await screen.findByText("1 time inscrito com sucesso.")).toBeTruthy();
  expect(screen.getByText("Inscrições concluídas, mas não foi possível atualizar os dados da tela.")).toBeTruthy();
  expect(screen.queryByText("Internal server error")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(pointLeagueService.enroll).toHaveBeenCalledTimes(1);
});
it("mostra erro do resumo", async () => {
  vi.mocked(pointLeagueService.summary).mockRejectedValue(new Error("API offline"));
  render(<PointCompetitionPage id={42} />);
  expect((await screen.findByRole("alert")).textContent).toContain("API offline");
});
