import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { desafioService as service, type DesafioDetalhe, type DesafioInscricao, type DesafioJogo, type ParticipacaoConfirmada } from "@/services/desafioService";
import { DesafioDetailPage } from "./DesafioDetailPage";
import { DesafiosPage } from "./DesafiosPage";

const auth = vi.hoisted(() => ({ authenticated: true, loading: false, id: "user-1" }));
const nav = vi.hoisted(() => ({ query: "id=7", push: vi.fn() }));
const wallet = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }), useSearchParams: () => new URLSearchParams(nav.query) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: auth.authenticated, isLoading: auth.loading, user: auth.authenticated ? { idUsuario: auth.id } : null }) }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ refreshWallet: wallet.refresh }) }));
vi.mock("@/components/wallet/AddBalanceModal", () => ({ AddBalanceModal: ({ close }: { close(): void }) => <div role="dialog" aria-label="PIX existente"><button onClick={close}>Concluir recarga</button></div> }));
vi.mock("@/services/desafioService", async original => ({ ...await original<object>(), desafioService: { list: vi.fn(), detail: vi.fn(), predict: vi.fn(), participate: vi.fn() } }));
const first: DesafioJogo = { id: 14, ordem: 1, nomeCompeticao: "Brasileirão", nomeMandante: "Flamengo", nomeVisitante: "Palmeiras", logoMandanteUrl: null, logoVisitanteUrl: null, dataInicio: "2001-10-03T19:00:00.000Z", status: "AGENDADA", fechamentoEm: "2001-10-03T19:00:00.000Z", podeAlterarPalpite: true, meuPalpite: "CASA" };
const second: DesafioJogo = { ...first, id: 11, ordem: 2, nomeMandante: "Grêmio", nomeVisitante: "Corinthians", meuPalpite: "EMPATE" };
const fixture: DesafioDetalhe = { id: 7, nome: "Desafio POINT", descricao: "Palpite nos jogos", tipoAcesso: "FREE", valorInscricao: "0.00", status: "ABERTO", inicioInscricao: "2001-10-01T12:00:00.000Z", fimInscricao: "2001-10-02T12:00:00.000Z", dataInicio: "2001-10-03T12:00:00.000Z", dataFim: "2001-10-04T23:00:00.000Z", partidas: [first, second], inscrito: false, minhaInscricao: null };
const inscription: DesafioInscricao = { id: 88, desafioId: 7, status: "ATIVA", valorInscricao: "0.00", dataInscricao: "2001-10-01T13:00:00.000Z" };
let server: DesafioDetalhe;
beforeEach(() => {
  vi.stubGlobal("React", React); vi.resetAllMocks(); nav.query = "id=7"; auth.authenticated = true; auth.loading = false; auth.id = "user-1";
  server = structuredClone(fixture); wallet.refresh.mockResolvedValue(true);
  vi.mocked(service.detail).mockImplementation(async () => structuredClone(server));
  vi.mocked(service.list).mockResolvedValue({ itens: [fixture], paginacao: { pagina: 1, limite: 20, total: 21, totalPaginas: 2 } });
  vi.mocked(service.predict).mockImplementation(async (id, partidaId, palpite) => {
    server.partidas = server.partidas.map(game => game.id === partidaId ? { ...game, meuPalpite: palpite } : game);
    return { desafioId: id, partidaId, palpite, fechamentoEm: first.fechamentoEm, podeAlterarPalpite: true };
  });
  vi.mocked(service.participate).mockImplementation(async () => {
    const saved = { ...inscription, valorInscricao: server.valorInscricao };
    server = { ...server, inscrito: true, minhaInscricao: saved };
    return { inscricao: saved, tipoAcesso: server.tipoAcesso, valorCobrado: saved.valorInscricao };
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const game = (name = "Flamengo x Palmeiras") => within(screen.getByRole("group", { name: `Palpite: ${name}` }));
const open = async () => { render(<DesafioDetailPage />); await screen.findByRole("heading", { name: "Desafio POINT" }); };

it("vitrine pública compacta usa paginação, acesso e link do detalhe", async () => {
  render(<DesafiosPage />);
  expect(screen.getByRole("status").textContent).toContain("Carregando");
  expect((await screen.findByRole("link", { name: "Abrir Desafio POINT" })).getAttribute("href")).toBe("/desafios/detalhe?id=7");
  fireEvent.click(button("Próxima"));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(2, "", expect.any(AbortSignal)));
  fireEvent.change(screen.getByLabelText("Tipo de acesso"), { target: { value: "PAGO" } });
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(1, "PAGO", expect.any(AbortSignal)));
});
it("vitrine trata erro, nova tentativa e vazio", async () => {
  vi.mocked(service.list).mockRejectedValueOnce(new ApiError(0)).mockResolvedValueOnce({ itens: [], paginacao: { pagina: 1, limite: 20, total: 0, totalPaginas: 0 } });
  render(<DesafiosPage />); await screen.findByRole("alert"); fireEvent.click(button("Tentar novamente"));
  expect(await screen.findByText("Nenhum Desafio disponível no momento.")).toBeTruthy();
});
it("restaura escolhas, ordena partidas e confia na elegibilidade da API, não no relógio", async () => {
  server.partidas = [second, first];
  await open();
  expect(game().getByRole("button", { name: "1 Mandante" }).getAttribute("aria-pressed")).toBe("true");
  expect((game().getByRole("button", { name: "X Empate" }) as HTMLButtonElement).disabled).toBe(false);
  expect(within(screen.getByRole("list", { name: "Partidas do Desafio" })).getAllByRole("listitem")[0].textContent).toContain("Flamengo");
  fireEvent.click(game().getByRole("button", { name: "X Empate" }));
  await waitFor(() => expect(game().getByRole("button", { name: "X Empate" }).getAttribute("aria-pressed")).toBe("true"));
  expect(service.predict).toHaveBeenCalledWith(7, 14, "EMPATE");
  expect(service.participate).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("anônimo consulta publicamente e vai ao login ao palpitar ou participar", async () => {
  auth.authenticated = false;
  server.partidas = server.partidas.map(({ meuPalpite, ...item }) => ({ ...item, podeAlterarPalpite: false }));
  delete server.inscrito; delete server.minhaInscricao;
  await open();
  expect(service.detail).toHaveBeenCalledWith(7, false, expect.any(AbortSignal));
  fireEvent.click(game().getByRole("button", { name: "1 Mandante" }));
  fireEvent.click(button("Participar do Desafio"));
  expect(nav.push).toHaveBeenCalledTimes(2); expect(nav.push).toHaveBeenCalledWith("/login");
  expect(service.predict).not.toHaveBeenCalled(); expect(service.participate).not.toHaveBeenCalled();
});
it("mantém partida bloqueada visível com seu palpite e revalida 409", async () => {
  await open();
  server.partidas[0].podeAlterarPalpite = false;
  vi.mocked(service.predict).mockRejectedValueOnce(new ApiError(409, "Partida fechada."));
  fireEvent.click(game().getByRole("button", { name: "2 Visitante" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Partida fechada.");
  await waitFor(() => expect((game().getByRole("button", { name: "2 Visitante" }) as HTMLButtonElement).disabled).toBe(true));
  expect(game().getByRole("button", { name: "1 Mandante" }).getAttribute("aria-pressed")).toBe("true");
});
it("indica jogos sem palpite, ignora anuladas e só participa após salvar", async () => {
  server.partidas[0].meuPalpite = null;
  server.partidas[1] = { ...second, status: "ANULADA", meuPalpite: null, podeAlterarPalpite: false };
  await open();
  expect(button("Participar do Desafio").disabled).toBe(true);
  expect(screen.getByRole("link", { name: "Flamengo × Palmeiras" }).getAttribute("href")).toBe("#partida-14");
  expect(screen.queryByRole("link", { name: "Grêmio × Corinthians" })).toBeNull();
  fireEvent.click(game().getByRole("button", { name: "1 Mandante" }));
  await waitFor(() => expect(button("Participar do Desafio").disabled).toBe(false));
});
it("FREE confirma via API sem confirmação financeira nem carteira", async () => {
  await open(); fireEvent.click(button("Participar do Desafio"));
  expect(await screen.findByRole("heading", { name: "Participando" })).toBeTruthy();
  expect(screen.getByText("Participação confirmada!")).toBeTruthy();
  expect(service.participate).toHaveBeenCalledWith(7);
  expect(wallet.refresh).not.toHaveBeenCalled(); expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
});
it("PAGO mostra preço antes do POST, permite voltar e atualiza carteira após confirmação", async () => {
  server.tipoAcesso = "PAGO"; server.valorInscricao = "2.00";
  await open(); fireEvent.click(button("Participar do Desafio"));
  expect(screen.getByRole("dialog").textContent).toContain("debitado da sua carteira");
  expect(service.participate).not.toHaveBeenCalled();
  fireEvent.click(button("Voltar")); expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(button("Participar do Desafio")); fireEvent.click(button(/Confirmar e pagar R\$/));
  await screen.findByRole("heading", { name: "Participando" });
  expect(wallet.refresh).toHaveBeenCalledTimes(1);
});
it("saldo insuficiente usa dados oficiais, abre PIX existente e permite repetir após recarga", async () => {
  server.tipoAcesso = "PAGO"; server.valorInscricao = "2.00";
  vi.mocked(service.participate).mockRejectedValueOnce(new ApiError(409, "Adicione saldo para participar.", { code: "SALDO_INSUFICIENTE", saldoDisponivel: "0.50", valorNecessario: "2.00", valorFaltante: "1.50" }));
  await open(); fireEvent.click(button("Participar do Desafio")); fireEvent.click(button(/Confirmar e pagar/));
  await screen.findByText("Saldo disponível");
  expect(screen.getByText(/R\$\s*0,50/)).toBeTruthy(); expect(screen.getByText(/R\$\s*1,50/)).toBeTruthy();
  await waitFor(() => expect(button("Adicionar saldo").disabled).toBe(false));
  fireEvent.click(button("Adicionar saldo")); expect(screen.getByRole("dialog", { name: "PIX existente" })).toBeTruthy();
  fireEvent.click(button("Concluir recarga"));
  await waitFor(() => expect(button("Participar do Desafio").disabled).toBe(false));
  fireEvent.click(button("Participar do Desafio")); fireEvent.click(button(/Confirmar e pagar/));
  await screen.findByRole("heading", { name: "Participando" });
  expect(service.participate).toHaveBeenCalledTimes(2); expect(nav.push).not.toHaveBeenCalled();
});
it("inscrito não recebe nova cobrança e pode alterar palpites mesmo EM_ANDAMENTO", async () => {
  server = { ...server, inscrito: true, minhaInscricao: inscription, status: "EM_ANDAMENTO" };
  await open(); expect(screen.getByRole("heading", { name: "Participando" })).toBeTruthy();
  fireEvent.click(game().getByRole("button", { name: "2 Visitante" }));
  await waitFor(() => expect(service.predict).toHaveBeenCalledWith(7, 14, "FORA"));
  expect(service.participate).not.toHaveBeenCalled(); expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
});
it("bloqueia cliques simultâneos enquanto participação está em andamento", async () => {
  let resolve!: (result: ParticipacaoConfirmada) => void;
  vi.mocked(service.participate).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await open(); const join = button("Participar do Desafio"); fireEvent.click(join); fireEvent.click(join);
  expect(service.participate).toHaveBeenCalledTimes(1);
  server.inscrito = true; server.minhaInscricao = inscription;
  resolve({ inscricao: inscription, tipoAcesso: "FREE", valorCobrado: "0.00" });
  await screen.findByRole("heading", { name: "Participando" });
});
it("recupera inscrição quando POST teve resposta perdida, sem repetir cobrança", async () => {
  vi.mocked(service.participate).mockImplementationOnce(async () => { server.inscrito = true; server.minhaInscricao = inscription; throw new ApiError(0); });
  await open(); fireEvent.click(button("Participar do Desafio"));
  await screen.findByRole("heading", { name: "Participando" });
  expect(screen.getByText("Participação confirmada!")).toBeTruthy(); expect(service.participate).toHaveBeenCalledTimes(1);
});
it("não perde sucesso se atualização do detalhe falhar após confirmação", async () => {
  await open(); vi.mocked(service.detail).mockRejectedValueOnce(new ApiError(0));
  fireEvent.click(button("Participar do Desafio"));
  await screen.findByRole("heading", { name: "Participando" }); await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
  expect(screen.getByText("Participação confirmada!")).toBeTruthy();
});
it("PALPITES_INCOMPLETOS identifica IDs recebidos sem criar inscrição", async () => {
  vi.mocked(service.participate).mockRejectedValueOnce(new ApiError(409, "Preencha os palpites.", { code: "PALPITES_INCOMPLETOS", partidaIds: [11] }));
  await open(); fireEvent.click(button("Participar do Desafio"));
  expect(await screen.findByRole("link", { name: "Grêmio × Corinthians" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Participando" })).toBeNull();
  expect(button("Participar do Desafio").disabled).toBe(true);
  await waitFor(() => expect((game("Grêmio x Corinthians").getByRole("button", { name: "X Empate" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(game("Grêmio x Corinthians").getByRole("button", { name: "X Empate" }));
  await waitFor(() => expect(service.predict).toHaveBeenCalledWith(7, 11, "EMPATE"));
});
it("recusa reinscrição cancelada mas preserva edição de palpites abertos", async () => {
  server.minhaInscricao = { ...inscription, status: "CANCELADA" };
  await open(); expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
  expect((game().getByRole("button", { name: "X Empate" }) as HTMLButtonElement).disabled).toBe(false);
});
it.each([401, 403, 404])("detalhe trata HTTP %s", async status => {
  vi.mocked(service.detail).mockRejectedValueOnce(new ApiError(status));
  render(<DesafioDetailPage />); expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("group")).toBeNull();
});
it("401 no palpite direciona ao login existente", async () => {
  await open(); vi.mocked(service.predict).mockRejectedValueOnce(new ApiError(401));
  fireEvent.click(game().getByRole("button", { name: "X Empate" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/login"));
});
it("troca de usuário descarta detalhes privados anteriores", async () => {
  server.inscrito = true; server.minhaInscricao = inscription;
  const view = render(<DesafioDetailPage />); await screen.findByRole("heading", { name: "Participando" });
  auth.id = "user-2"; server = { ...structuredClone(fixture), partidas: [{ ...first, meuPalpite: null }] };
  view.rerender(<DesafioDetailPage />);
  expect(screen.queryByRole("heading", { name: "Participando" })).toBeNull();
  await screen.findByRole("heading", { name: "Desafio POINT" });
  expect(game().getByRole("button", { name: "1 Mandante" }).getAttribute("aria-pressed")).toBe("false");
});
