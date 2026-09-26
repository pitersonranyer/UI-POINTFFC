import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PointCompetitionPage } from "./PointCompetitionPage";
import CompetitionRoute from "@/app/competicoes/page";
import { ApiError } from "@/services/apiClient";
import { pointLeagueService, type EnrollmentBatchResult, type CompetitionSummary, type Entry, type RankingEntry } from "@/services/pointLeagueService";
import { teamService } from "@/services/teamService";

const state = vi.hoisted(() => ({ marketOpen: true, marketRound: 27, authenticated: false, push: vi.fn(), refreshWallet: vi.fn(), wallet: { saldoDisponivel: "100.00", saldoBloqueado: "0.00", status: "ATIVA" }, refreshMarket: vi.fn() }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ wallet: state.wallet, isLoading: false, error: null, refreshWallet: state.refreshWallet }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: state.authenticated, isLoading: false }) }));
vi.mock("@/hooks/useCartolaDashboard", () => ({ useCartolaDashboard: () => ({ dashboard: { mercado: { rodada_atual: 27, status_mercado: 1, bola_rolando: false, fechamento: { timestamp: Math.floor(Date.now() / 1000) + 172800 } }, rodada: state.marketRound, mercadoAberto: state.marketOpen, bolaRolando: false, partidas: [], clubes: {} }, loading: false, error: null, atualizar: state.refreshMarket }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }), useSearchParams: () => new URLSearchParams("id=42&aba=ranking") }));
vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { summary: vi.fn(), myEntries: vi.fn(), participants: vi.fn(), ranking: vi.fn(), enrollBatch: vi.fn() }, blockMessages: { LIMITE_TIMES_USUARIO_ATINGIDO: "Você já atingiu o limite de times desta competição." } }));
vi.mock("@/services/teamService", () => ({ teamService: { buscarMeusTimes: vi.fn(), buscarTimesPorIds: vi.fn(), importarMeusTimes: vi.fn() } }));
const entry: Entry = { id: 7, timeIdCartola: 123, nomeTime: "Meu FC", nomeCartoleiro: "Ana", escudoUrl: null, pontuacao: null, posicao: null, posicaoAnterior: null };
const rival: Entry = { id: 8, nomeTime: "Rival FC", nomeCartoleiro: "Bia", escudoUrl: null, pontuacao: 88.5, posicao: 1, posicaoAnterior: 2 };
const ranking: RankingEntry[] = [{ ...rival, inscricaoId: 8, timeIdCartola: 456, capitao: { atletaId: 99, apelido: "Arrascaeta" } }, { ...entry, inscricaoId: 7, timeIdCartola: 123, capitao: null }];
const summary: CompetitionSummary = { competicao: { id: 42, nome: "Disputa 42", slug: "disputa-42", descricao: "Rodada de teste", tipoAcesso: "FREE", valorInscricao: 0, rodadaInicio: 27, rodadaFim: 27, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: 2, limiteParticipantes: null, status: "INSCRICOES_ABERTAS" }, liga: { id: 1, nome: "POINT FFC", slug: "point-ffc", imagemUrl: null }, inscritos: { quantidade: 1 }, premiacao: [] };
const member: CompetitionSummary = { ...summary, usuario: { quantidadeTimesInscritos: 0, limiteTimesUsuario: 2, podeInscrever: true, motivoBloqueio: null, melhorPosicaoUsuario: null, melhorPontuacaoUsuario: null }, minhasInscricoes: [] };
const batch: EnrollmentBatchResult = { loteId: 1, competicaoId: 42, quantidade: 1, tipoAcesso: "FREE", moeda: "BRL", valorUnitario: "0.00", valorTotal: "0.00", movimentacaoDebitoId: null, saldoDisponivelAposOperacao: null, inscricoes: [{ id: 7, timeIdCartola: 123, statusInscricao: "ATIVA" }] };
beforeEach(() => {
  state.marketOpen = true; state.marketRound = 27;
  vi.stubGlobal("React", React);
  state.wallet.saldoDisponivel = "100.00"; state.refreshWallet.mockReset().mockResolvedValue(true);
  state.authenticated = false; state.push.mockReset(); state.refreshMarket.mockReset();
  vi.mocked(pointLeagueService.summary).mockReset().mockResolvedValue(summary);
  vi.mocked(pointLeagueService.myEntries).mockReset().mockResolvedValue([]);
  vi.mocked(pointLeagueService.participants).mockReset().mockResolvedValue([rival]);
  vi.mocked(pointLeagueService.ranking).mockReset().mockResolvedValue({ ranking });
  vi.mocked(pointLeagueService.enrollBatch).mockReset().mockResolvedValue(batch);
  vi.mocked(teamService.buscarMeusTimes).mockReset().mockResolvedValue([{ timeId: 123, nome: "Meu FC", nomeCartoleiro: "Ana", escudoUrl: "" }]);
  vi.mocked(teamService.buscarTimesPorIds).mockReset().mockResolvedValue({ times: [], naoEncontrados: [], tentarNovamente: [] });
  vi.mocked(teamService.importarMeusTimes).mockReset().mockResolvedValue({ adicionados: 0, jaExistentes: 0, naoEncontrados: [], tentarNovamente: [], naoProcessados: 0 });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const open = async () => { render(<PointCompetitionPage id={42} />); return screen.findByRole("heading", { name: "Disputa 42" }); };

it.each([
  ["INSCRICOES_ABERTAS", 27, true, false],
  ["INSCRICOES_ABERTAS", 28, false, false],
  ["INSCRICOES_ENCERRADAS", 27, true, false],
  ["INSCRICOES_ENCERRADAS", 27, false, true],
  ["EM_ANDAMENTO", 27, false, true],
  ["ENCERRADA", 28, true, true],
  ["ENCERRADA", 26, false, false],
  ["CANCELADA", 28, false, false],
])("liberação para %s, rodada atual %s, mercado aberto %s", async (status, marketRound, marketOpen, revealed) => {
  state.marketRound = marketRound; state.marketOpen = marketOpen;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, competicao: { ...summary.competicao, status } });
  render(<PointCompetitionPage id={42} initialTab="Ranking" />);
  await screen.findByText("Rival FC");
  const link = screen.queryByRole("link", { name: "Escalação de Rival FC" });
  expect(Boolean(link)).toBe(revealed);
  expect(Boolean(screen.queryByText("Capitão: Arrascaeta"))).toBe(revealed);
  if (revealed) {
    expect(link?.getAttribute("href")).toBe("/time?timeId=456&rodada=27");
    expect(link?.textContent).toMatch(/Rival FC.*Bia.*Capitão: Arrascaeta.*88,50 pts/);
    expect(link?.querySelectorAll("img")).toHaveLength(0);
    expect(screen.getByRole("link", { name: "Escalação de Meu FC" }).getAttribute("href")).toBe("/time?timeId=123&rodada=27");
    expect(within(screen.getByRole("link", { name: "Escalação de Meu FC" })).queryByText(/Capitão:/)).toBeNull();
  }
  expect(screen.queryByText(/Ver escalação|Abrir escalação/)).toBeNull();
  expect(pointLeagueService.ranking).toHaveBeenCalledTimes(1);
});

it.each([null, 28])("não escolhe rodada arbitrária quando rodadaFim é %s", async (rodadaFim) => {
  state.marketOpen = false;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, competicao: { ...summary.competicao, status: "EM_ANDAMENTO", rodadaFim } });
  render(<PointCompetitionPage id={42} initialTab="Ranking" />);
  await screen.findByText("Rival FC");
  expect(screen.queryByRole("link", { name: "Escalação de Rival FC" })).toBeNull();
  expect(screen.queryByText(/Capitão:/)).toBeNull();
});
async function preparePaid() {
  state.authenticated = true;
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, competicao: { ...member.competicao, tipoAcesso: "PAGO", valorInscricao: 10 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue([{ timeId: 123, nome: "Time A", nomeCartoleiro: "Ana", escudoUrl: "" }, { timeId: 456, nome: "Time B", nomeCartoleiro: "Bia", escudoUrl: "" }]);
  vi.mocked(pointLeagueService.enrollBatch).mockResolvedValue({ ...batch, quantidade: 2, tipoAcesso: "PAGO", valorUnitario: "10.00", valorTotal: "20.00", movimentacaoDebitoId: 10, saldoDisponivelAposOperacao: "80.00" });
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  await screen.findByRole("checkbox", { name: "Selecionar Time A" });
  fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
  fireEvent.click(screen.getByRole("button", { name: /Inscrever 2 times/ }));
}
const confirmBatch = () => fireEvent.click(screen.getByRole("button", { name: /CONFIRMAR INSCRIÇÃO/ }));

it.each(["INSCRICOES_ENCERRADAS", "ENCERRADA"])("abre ranking existente a partir do card %s", async (status) => {
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, competicao: { ...summary.competicao, status } });
  render(<CompetitionRoute />);
  expect(await screen.findByText("Rival FC")).toBeTruthy();
  expect(pointLeagueService.ranking).toHaveBeenCalledWith(42);
  expect(screen.getByRole("heading", { name: "Ranking" })).toBeTruthy();
  expect(pointLeagueService.enrollBatch).not.toHaveBeenCalled();
});

it("PAGO mostra saldo real e envia uma compra para todos os times", async () => {
  await preparePaid();
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByText("Saldo disponível").nextElementSibling?.textContent).toMatch(/R\$\s*100,00/);
  expect(dialog.getByText("Times selecionados").nextElementSibling?.textContent).toBe("2");
  expect(dialog.getByText("Total da inscrição").nextElementSibling?.textContent).toMatch(/R\$\s*20,00/);
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledTimes(1);
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledWith(42, { timesCartolaIds: [123, 456], valorUnitarioEsperado: "10.00" }, expect.stringMatching(/^[\w-]{16,128}$/));
  expect(state.refreshWallet).toHaveBeenCalledTimes(2);
});

it("saldo local insuficiente oferece PIX existente e não impede validação definitiva no backend", async () => {
  state.wallet.saldoDisponivel = "5.00";
  await preparePaid();
  expect(screen.getByText(/Faltam: R\$\s*15,00/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR SALDO VIA PIX" }));
  expect(screen.getByRole("dialog", { name: "Adicionar saldo" })).toBeTruthy();
  expect(screen.getByLabelText("Valor da recarga")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(screen.getByRole("dialog", { name: "Inscrever times" })).toBeTruthy();
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
});

it("SALDO_INSUFICIENTE mantém modal e usa saldo, necessário e faltante do backend", async () => {
  await preparePaid();
  vi.mocked(pointLeagueService.enrollBatch).mockRejectedValueOnce(new ApiError(409, "Saldo", { code: "SALDO_INSUFICIENTE", saldoDisponivel: "3.00", valorNecessario: "20.00", valorFaltante: "17.00", moeda: "BRL" }));
  confirmBatch();
  await screen.findByText(/Faltam: R\$\s*17,00/);
  expect(screen.getByText(/Saldo disponível: R\$\s*3,00/)).toBeTruthy();
  expect(screen.getByText(/Necessário: R\$\s*20,00/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "ADICIONAR SALDO VIA PIX" })).toBeTruthy();
  const first = vi.mocked(pointLeagueService.enrollBatch).mock.calls[0];
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  expect(vi.mocked(pointLeagueService.enrollBatch).mock.calls[1]).toEqual(first);
});

it("retry após erro de rede preserva chave e pedido mesmo fechando e reabrindo o modal", async () => {
  await preparePaid();
  vi.mocked(pointLeagueService.enrollBatch).mockRejectedValueOnce(new ApiError(0, "offline"));
  confirmBatch();
  await screen.findByText(/Tente novamente para consultar a mesma tentativa/);
  const first = vi.mocked(pointLeagueService.enrollBatch).mock.calls[0];
  expect((screen.getByRole("button", { name: "Voltar" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  expect(vi.mocked(pointLeagueService.enrollBatch).mock.calls[1]).toEqual(first);
});

it("preço alterado exige confirmação explícita e gera outra chave somente nesse clique", async () => {
  await preparePaid();
  vi.mocked(pointLeagueService.enrollBatch).mockRejectedValueOnce(new ApiError(409, "Preço", { code: "PRECO_INSCRICAO_ALTERADO", valorEsperado: "10.00", valorAtual: "12.50", quantidade: 2, valorTotalAtual: "25.00" }));
  confirmBatch();
  await screen.findByText(/O valor da inscrição foi atualizado/);
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: /CONFIRMAR INSCRIÇÃO.*R\$\s*25,00/ })).toBeTruthy();
  const first = vi.mocked(pointLeagueService.enrollBatch).mock.calls[0];
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  const second = vi.mocked(pointLeagueService.enrollBatch).mock.calls[1];
  expect(second[1]).toEqual({ timesCartolaIds: [123, 456], valorUnitarioEsperado: "12.50" });
  expect(second[2]).not.toBe(first[2]);
});

it("chave reutilizada não causa reenvio automático nem nova chave", async () => {
  await preparePaid();
  vi.mocked(pointLeagueService.enrollBatch).mockRejectedValueOnce(new ApiError(409, "Conflito", { code: "IDEMPOTENCY_KEY_REUTILIZADA" }));
  confirmBatch();
  await screen.findByText(/Esta tentativa já foi utilizada com outros dados/);
  confirmBatch();
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog")).toBeTruthy();
});

it("compra posterior ao sucesso recebe uma nova chave", async () => {
  await preparePaid(); confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  await waitFor(() => expect(state.refreshWallet).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  await screen.findByRole("checkbox", { name: "Selecionar Time A" });
  fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
  fireEvent.click(screen.getByRole("button", { name: /Inscrever 2 times/ }));
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  const calls = vi.mocked(pointLeagueService.enrollBatch).mock.calls;
  expect(calls).toHaveLength(2);
  expect(calls[1][2]).not.toBe(calls[0][2]);
});

it("falha ao atualizar carteira após pagamento mantém sucesso", async () => {
  await preparePaid();
  state.refreshWallet.mockResolvedValueOnce(false);
  confirmBatch();
  await screen.findByText("2 times inscritos com sucesso.");
  expect(await screen.findByText("Inscrições concluídas, mas não foi possível atualizar os dados da tela.")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
});
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
  expect(pointLeagueService.enrollBatch).not.toHaveBeenCalled();
});
it("mostra resumo autenticado e estado vazio de premiação", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValue(member);
  await open(); expect(pointLeagueService.summary).toHaveBeenCalledWith(42, true);
  expect(screen.getByRole("button", { name: "Inscreva seu time" })).toBeTruthy();
  expect(screen.queryByText("Ainda não inscrito")).toBeNull();
  expect(screen.queryByText("Você ainda não está participando.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Premiações" }));
  expect(screen.getByText("Premiação ainda não definida.")).toBeTruthy();
});
it("apresenta premiações reais em moeda, destaca o Top 3 e mantém as demais compactas", async () => {
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, premiacaoEmDisputa: "860.00", competicao: { ...summary.competicao, rodadaInicio: 31, rodadaFim: 31 }, premiacao: [
    { posicaoInicio: 1, posicaoFim: 1, tipoPremiacao: "VALOR_FIXO", valor: 350, percentual: null, ordem: 1 },
    { posicaoInicio: 2, posicaoFim: 2, tipoPremiacao: "VALOR_FIXO", valor: 200, percentual: null, ordem: 2 },
    { posicaoInicio: 3, posicaoFim: 3, tipoPremiacao: "VALOR_FIXO", valor: 150, percentual: null, ordem: 3 },
    { posicaoInicio: 4, posicaoFim: 5, tipoPremiacao: "VALOR_FIXO", valor: 80, percentual: null, ordem: 4 },
    { posicaoInicio: 6, posicaoFim: 6, tipoPremiacao: "PERCENTUAL", valor: null, percentual: 10, ordem: 5 },
  ] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Premiações" }));
  expect(screen.getByRole("heading", { name: "Premiação da Rodada 31" })).toBeTruthy();
  expect(screen.queryByText("Rodada 27")).toBeNull();
  expect(screen.queryByText(/VALOR_FIXO|PERCENTUAL/)).toBeNull();
  expect(screen.getByText("R$ 860,00")).toBeTruthy();
  expect(screen.getByText("R$ 350,00").closest('[data-prize-tier="1"]')).toBeTruthy();
  expect(screen.getByText("R$ 200,00").closest('[data-prize-tier="2"]')).toBeTruthy();
  expect(screen.getByText("R$ 150,00").closest('[data-prize-tier="3"]')).toBeTruthy();
  expect(screen.getAllByText("R$ 80,00")).toHaveLength(2);
  expect(screen.getByText("4º lugar").closest('[data-prize-tier="standard"]')).toBeTruthy();
  expect(screen.getByText("5º lugar")).toBeTruthy();
  expect(screen.getByText("10%")).toBeTruthy();
});
it.each([
  ["160.00", ["48.00", "28.80", "19.20", "14.40", "11.20"], ["48,00", "28,80", "19,20", "14,40", "11,20"]],
  ["1.60", ["0.48", "0.29", "0.19", "0.14", "0.11"], ["0,48", "0,29", "0,19", "0,14", "0,11"]],
])("exibe valores do backend em pt-BR sobre base %s", async (base, calculados, exibidos) => {
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, premiacaoEmDisputa: base, premiacao:
    [30, 18, 12, 9, 7].map((percentual, index) => ({ posicaoInicio: index + 1, posicaoFim: index + 1,
      tipoPremiacao: "PERCENTUAL", valor: null, percentual, ordem: index, valorCalculado: calculados[index] })) });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Premiações" }));
  expect(screen.getByText("Premiação em disputa")).toBeTruthy();
  exibidos.forEach((valor, index) => {
    const row = screen.getByText(`${index + 1}º lugar`).closest("[data-prize-tier]")!;
    expect(within(row as HTMLElement).getByText(`R$ ${valor}`).tagName).toBe("STRONG");
    expect(row.getAttribute("data-prize-tier")).toBe(index < 3 ? String(index + 1) : "standard");
  });
  expect(screen.getByText("18%").tagName).toBe("SMALL");
  expect(screen.queryByText(/% do prêmio|% da premiação|Total em prêmios/)).toBeNull();
  expect(screen.getByText("Valores atualizados conforme o número de times inscritos.")).toBeTruthy();
});

it("atualiza ao abrir Premiações e retornar a janela, sem calcular valores localmente", async () => {
  const prize = { posicaoInicio: 1, posicaoFim: 1, tipoPremiacao: "PERCENTUAL", valor: null, percentual: 30, ordem: 1, valorCalculado: "0.00" };
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, premiacaoEmDisputa: "0.00", premiacao: [prize] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Premiações" }));
  await waitFor(() => expect(pointLeagueService.summary).toHaveBeenCalledTimes(2));
  expect(screen.getAllByText("R$ 0,00")).toHaveLength(2);
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...summary, inscritos: { quantidade: 2 }, premiacaoEmDisputa: "1234.56", premiacao: [{ ...prize, valorCalculado: "370.37" }] });
  fireEvent.focus(window);
  expect(await screen.findByText("R$ 370,37")).toBeTruthy();
  expect(screen.getByText("R$ 1.234,56")).toBeTruthy();
  expect(pointLeagueService.summary).toHaveBeenCalledTimes(3);
});

it("falha de atualizacao preserva valores e avisa que podem estar desatualizados", async () => {
  vi.mocked(pointLeagueService.summary).mockResolvedValueOnce({ ...summary, premiacaoEmDisputa: "10.00", premiacao: [
    { posicaoInicio: 1, posicaoFim: 1, tipoPremiacao: "VALOR_FIXO", valor: 10, percentual: null, ordem: 1, valorCalculado: "10.00" },
  ] }).mockRejectedValue(new Error("offline"));
  await open(); fireEvent.click(screen.getByRole("button", { name: "Premiações" }));
  expect(await screen.findByText(/Os valores exibidos podem estar desatualizados/)).toBeTruthy();
  expect(screen.getAllByText("R$ 10,00")).toHaveLength(2);
});

it("mantem estrutura responsiva: moeda inteira, percentual secundario e linhas compactas", () => {
  const style = document.createElement("style");
  style.textContent = readFileSync(resolve("src/components/leagues/PointCompetition.module.css"), "utf8");
  document.head.append(style);
  try {
    const rules = Array.from(style.sheet!.cssRules).filter((rule): rule is CSSStyleRule => "selectorText" in rule);
    const rule = (selector: string) => rules.find(item => item.selectorText === selector)!.style;
    expect(rule(".prizeValue").getPropertyValue("white-space")).toBe("nowrap");
    expect(rule(".prizeTotal").getPropertyValue("flex-wrap")).toBe("wrap");
    expect(rule(".prizeAmount").getPropertyValue("flex-wrap")).toBe("wrap");
    expect(rule(".prizeAmount").getPropertyValue("min-width")).toBe("0");
    expect(parseFloat(rule(".prizePercent").getPropertyValue("font-size")))
      .toBeLessThan(parseFloat(rule(".prizeValue").getPropertyValue("font-size")));
    expect(parseFloat(rule(".prizeListRow").getPropertyValue("min-height"))).toBeLessThanOrEqual(40);
  } finally { style.remove(); }
});

it("abre modal, seleciona time vinculado, inscreve FREE e atualiza resumo", async () => {
  state.authenticated = true; vi.mocked(pointLeagueService.summary).mockResolvedValueOnce(member).mockResolvedValue({ ...member, inscritos: { quantidade: 2 }, usuario: { ...member.usuario!, quantidadeTimesInscritos: 1 }, minhasInscricoes: [entry] });
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText("Meu FC");
  const values = within(dialog).getByText("Valor por time").closest("dl")!;
  expect(within(values).getByText("Valor por time").nextElementSibling?.textContent).toMatch(/R\$\s*0,00/);
  expect(within(values).getByText("Total da inscrição").nextElementSibling?.textContent).toMatch(/R\$\s*0,00/);
  expect((within(dialog).getByRole("button", { name: /Inscrever 0 times.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(within(dialog).getByRole("checkbox", { name: "Selecionar Meu FC" }));
  expect(within(dialog).queryByText(/titularidade|titular dos times|comprovação/i)).toBeNull();
  expect(within(dialog).queryByRole("checkbox", { name: /Declaro/ })).toBeNull();
  fireEvent.click(within(dialog).getByRole("button", { name: /Inscrever 1 time.*R\$\s*0,00/i }));
  fireEvent.click(within(dialog).getByRole("button", { name: /CONFIRMAR INSCRIÇÃO/ }));
  await waitFor(() => expect(pointLeagueService.enrollBatch).toHaveBeenCalledWith(42, { timesCartolaIds: [123], valorUnitarioEsperado: "0.00" }, expect.any(String)));
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
  expect(dialog.getByRole("button", { name: /Inscrever 3 times.*R\$\s*30,00/i })).toBeTruthy();
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
  expect(screen.queryByText(/Arrascaeta/)).toBeNull();
  expect(screen.queryByRole("link", { name: "Escalação de Rival FC" })).toBeNull();
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
  expect((dialog.getByRole("button", { name: /Inscrever 2 times.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(false);
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
  expect(dialog.getByText("Limite: 2")).toBeTruthy();
  expect((dialog.getByRole("button", { name: /Inscrever 2 times.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(dialog.getByRole("button", { name: "Desmarcar todos" }));
  expect(dialog.getAllByText("0 times selecionados")).toHaveLength(2);
  expect((dialog.getByRole("button", { name: /Inscrever 0 times.*R\$\s*0,00/i }) as HTMLButtonElement).disabled).toBe(true);
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
  expect(pointLeagueService.enrollBatch).not.toHaveBeenCalled();
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
  expect(pointLeagueService.enrollBatch).not.toHaveBeenCalled();
  expect(teamService.buscarTimesPorIds).not.toHaveBeenCalled();
  expect(teamService.importarMeusTimes).not.toHaveBeenCalled();
});

it("inscreve os times em lote, impede duplo envio e atualiza os dados", async () => {
  state.authenticated = true;
  const teams = [{ timeId: 123, nome: "Time A", nomeCartoleiro: "Ana", escudoUrl: "" }, { timeId: 456, nome: "Time B", nomeCartoleiro: "Bia", escudoUrl: "" }, { timeId: 789, nome: "Time C", nomeCartoleiro: "Caio", escudoUrl: "" }];
  vi.mocked(pointLeagueService.summary).mockResolvedValue({ ...member, usuario: { ...member.usuario!, limiteTimesUsuario: 4 } });
  vi.mocked(teamService.buscarMeusTimes).mockResolvedValue(teams);
  let resolveEnrollment!: (value: EnrollmentBatchResult) => void;
  vi.mocked(pointLeagueService.enrollBatch).mockImplementationOnce(() => new Promise((resolve) => { resolveEnrollment = resolve; }));
  await open(); fireEvent.click(screen.getByRole("button", { name: "Inscreva seu time" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time A" })); fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time B" })); fireEvent.click(dialog.getByRole("checkbox", { name: "Selecionar Time C" }));
  fireEvent.click(dialog.getByRole("button", { name: /Inscrever 3 times.*R\$\s*0,00/i }));
  const confirm = dialog.getByRole("button", { name: /CONFIRMAR INSCRIÇÃO/ }); fireEvent.click(confirm); fireEvent.click(confirm);
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledTimes(1);
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledWith(42, { timesCartolaIds: [123, 456, 789], valorUnitarioEsperado: "0.00" }, expect.any(String));
  expect(dialog.getByRole("button", { name: "Confirmando inscrição..." })).toBeTruthy();
  expect((dialog.getByRole("button", { name: "Fechar" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
  expect(screen.getByRole("dialog")).toBeTruthy();
  resolveEnrollment({ ...batch, quantidade: 3 });
  expect(await screen.findByText("3 times inscritos com sucesso.")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(pointLeagueService.summary).toHaveBeenCalledTimes(2);
  expect(pointLeagueService.myEntries).toHaveBeenCalledWith(42);
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
  fireEvent.click(screen.getByRole("button", { name: /Inscrever 1 time.*R\$\s*0,00/i }));
  fireEvent.click(screen.getByRole("button", { name: /CONFIRMAR INSCRIÇÃO/ }));
  expect(await screen.findByText("1 time inscrito com sucesso.")).toBeTruthy();
  expect(screen.getByText("Inscrições concluídas, mas não foi possível atualizar os dados da tela.")).toBeTruthy();
  expect(screen.queryByText("Internal server error")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(pointLeagueService.enrollBatch).toHaveBeenCalledTimes(1);
});
it("mostra erro do resumo", async () => {
  vi.mocked(pointLeagueService.summary).mockRejectedValue(new Error("API offline"));
  render(<PointCompetitionPage id={42} />);
  expect((await screen.findByRole("alert")).textContent).toContain("API offline");
});
