import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { desafioService as service, type DesafioDetalhe, type DesafioInscricao, type DesafioMinhaInscricao, type DesafioJogo, type ParticipacaoConfirmada } from "@/services/desafioService";
import { DesafioDetailPage } from "./DesafioDetailPage";
import { DesafiosPage } from "./DesafiosPage";

const auth = vi.hoisted(() => ({ authenticated: true, loading: false, id: "user-1" }));
const nav = vi.hoisted(() => ({ query: "id=7", push: vi.fn() }));
const wallet = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }), useSearchParams: () => new URLSearchParams(nav.query) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: auth.authenticated, isLoading: auth.loading, user: auth.authenticated ? { idUsuario: auth.id } : null }) }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ refreshWallet: wallet.refresh }) }));
vi.mock("@/components/wallet/AddBalanceModal", () => ({ AddBalanceModal: ({ close }: { close(): void }) => <div role="dialog" aria-label="PIX existente"><button onClick={close}>Concluir recarga</button></div> }));
vi.mock("@/services/desafioService", async original => ({ ...await original<object>(), desafioService: { list: vi.fn(), detail: vi.fn(), predict: vi.fn(), participate: vi.fn(), createInscricao: vi.fn() } }));
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
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const game = (name = "Flamengo x Palmeiras") => within(screen.getByRole("group", { name: `Palpite: ${name}` }));
const open = async () => { render(<DesafioDetailPage />); await screen.findByRole("heading", { name: "Desafio POINT" }); };

it("polling atualiza placar, aguarda apuração e preserva Palpite 2 até parar", async () => {
  multiple();
  server.partidas = [{ ...first, status: "EM_ANDAMENTO", golsMandante: 0, golsVisitante: 0 }];
  vi.useFakeTimers();
  render(<DesafioDetailPage />);
  await act(async () => {});
  fireEvent.click(button("Palpite 2"));
  server.partidas[0].golsMandante = 1;
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(screen.getByLabelText("Placar do Flamengo").textContent).toBe("1");
  expect(button("Palpite 2").getAttribute("aria-pressed")).toBe("true");
  expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
  server.partidas[0].status = "FINALIZADA";
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(screen.getByText("Finalizado")).toBeTruthy();
  expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
  server.partidas[0].apurado = true;
  server.minhasInscricoes!.forEach(entry => { entry.palpites[0].apurado = true; entry.palpites[0].pontos = entry.id === 99 ? 0 : 1; });
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(screen.getByText("✕ Errou · 0 ponto")).toBeTruthy();
  const calls = vi.mocked(service.detail).mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(180_000); });
  expect(service.detail).toHaveBeenCalledTimes(calls);
  fireEvent.click(button("Palpite 1"));
  expect(screen.getByText("✓ Acertou · +1 ponto")).toBeTruthy();
});

it("polling suspende na aba oculta, retoma e não concorre com salvamento", async () => {
  vi.useFakeTimers();
  server.partidas[0].status = "EM_ANDAMENTO";
  render(<DesafioDetailPage />); await act(async () => {});
  let hidden = true;
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  fireEvent(document, new Event("visibilitychange"));
  await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
  expect(service.detail).toHaveBeenCalledTimes(1);
  hidden = false;
  await act(async () => { fireEvent(document, new Event("visibilitychange")); });
  expect(service.detail).toHaveBeenCalledTimes(2);
  let resolve!: (value: Awaited<ReturnType<typeof service.predict>>) => void;
  vi.mocked(service.predict).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  fireEvent.click(game().getByRole("button", { name: "Empate" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(service.detail).toHaveBeenCalledTimes(2);
  await act(async () => { resolve({ desafioId: 7, partidaId: 14, palpite: "EMPATE", fechamentoEm: first.fechamentoEm, podeAlterarPalpite: true }); });
  expect(game().getByRole("button", { name: "Empate" }).getAttribute("aria-pressed")).toBe("true");
  vi.restoreAllMocks();
});

function entry(id: number, numero: number, status: DesafioInscricao["status"] = "RASCUNHO", pick: DesafioJogo["meuPalpite"] = "CASA"): DesafioMinhaInscricao {
  return { ...inscription, id, numero, nome: `Palpite ${numero}`, status, palpites: [first, second].map(item => ({ partidaId: item.id, meuPalpite: pick ?? null, pontos: null, apurado: false, podeAlterarPalpite: status !== "CANCELADA" })) };
}
function multiple(entries = [entry(88, 1, "ATIVA"), entry(99, 2, "RASCUNHO", "FORA")]) {
  server = { ...server, minhasInscricoes: entries, limiteInscricoesPorUsuario: 2, quantidadeUtilizada: 1, inscrito: true, minhaInscricao: entries[0] };
  vi.mocked(service.predict).mockImplementation(async (id, partidaId, palpite, inscricaoId) => {
    server.minhasInscricoes = server.minhasInscricoes!.map(item => item.id === inscricaoId ? { ...item, palpites: item.palpites.map(pick => pick.partidaId === partidaId ? { ...pick, meuPalpite: palpite } : pick) } : item);
    return { desafioId: id, partidaId, palpite, fechamentoEm: first.fechamentoEm, podeAlterarPalpite: true };
  });
  vi.mocked(service.participate).mockImplementation(async (_id, inscricaoId) => {
    const confirmed = { ...server.minhasInscricoes!.find(item => item.id === inscricaoId)!, status: "ATIVA" as const, valorInscricao: server.valorInscricao };
    server.minhasInscricoes = server.minhasInscricoes!.map(item => item.id === inscricaoId ? confirmed : item);
    server.quantidadeUtilizada = server.minhasInscricoes.filter(item => item.status === "ATIVA").length;
    return { inscricao: confirmed, tipoAcesso: server.tipoAcesso, valorCobrado: confirmed.valorInscricao };
  });
}
it("Palpite 1 é selecionado primeiro e alternância nunca usa os palpites legados", async () => {
  multiple(); server.partidas[0].meuPalpite = "EMPATE";
  await open();
  expect(button("Palpite 1").getAttribute("aria-pressed")).toBe("true");
  expect(game().getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(button("Palpite 2"));
  expect(game().getByRole("button", { name: "Fora" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(game().getByRole("button", { name: "Empate" }));
  await waitFor(() => expect(service.predict).toHaveBeenCalledWith(7, 14, "EMPATE", 99));
  await waitFor(() => expect(button("Palpite 1").disabled).toBe(false));
  fireEvent.click(button("Palpite 1"));
  expect(game().getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.queryByText("Salvo ✓")).toBeNull();
  fireEvent.click(game().getByRole("button", { name: "Fora" }));
  await waitFor(() => expect(service.predict).toHaveBeenLastCalledWith(7, 14, "FORA", 88));
  expect(server.minhasInscricoes![1].palpites[0].meuPalpite).toBe("EMPATE");
});
it("replay de criação reutiliza a chave e uma nova solicitação gera outra", async () => {
  multiple([entry(88, 1, "ATIVA")]);
  const uuid = vi.fn().mockReturnValueOnce("11111111-1111-4111-8111-111111111111").mockReturnValueOnce("22222222-2222-4222-8222-222222222222");
  vi.stubGlobal("crypto", { randomUUID: uuid });
  vi.mocked(service.createInscricao).mockImplementationOnce(async () => {
    server.minhasInscricoes!.push(entry(99, 2, "RASCUNHO", null));
    throw new ApiError(0);
  }).mockImplementationOnce(async () => server.minhasInscricoes![1]).mockImplementationOnce(async () => {
    const created = entry(101, 3, "RASCUNHO", null); server.minhasInscricoes!.push(created); return created;
  });
  await open(); fireEvent.click(button("+ Novo palpite")); await screen.findByRole("alert");
  fireEvent.click(button("+ Novo palpite"));
  await waitFor(() => expect(button("Palpite 2").getAttribute("aria-pressed")).toBe("true"));
  expect(service.createInscricao).toHaveBeenNthCalledWith(1, 7, "11111111-1111-4111-8111-111111111111");
  expect(service.createInscricao).toHaveBeenNthCalledWith(2, 7, "11111111-1111-4111-8111-111111111111");
  expect(screen.queryByRole("heading", { name: "Participando" })).toBeNull();
  expect(button("Participar do Desafio").disabled).toBe(true);
  expect(service.participate).not.toHaveBeenCalled(); expect(wallet.refresh).not.toHaveBeenCalled();
  await waitFor(() => expect(button("+ Novo palpite").disabled).toBe(false));
  fireEvent.click(button("+ Novo palpite"));
  await waitFor(() => expect(button("Palpite 3").getAttribute("aria-pressed")).toBe("true"));
  expect(service.createInscricao).toHaveBeenLastCalledWith(7, "22222222-2222-4222-8222-222222222222");
  expect(uuid).toHaveBeenCalledTimes(2);
});
it("nova resposta sem inscrições exige criar antes de preencher e não reutiliza campos legados", async () => {
  multiple([]); server.quantidadeUtilizada = 0;
  vi.mocked(service.createInscricao).mockImplementation(async () => {
    const created = entry(88, 1, "RASCUNHO", null); server.minhasInscricoes = [created]; return created;
  });
  await open(); expect((game().getByRole("button", { name: "Casa" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button("+ Novo palpite"));
  await waitFor(() => expect((game().getByRole("button", { name: "Casa" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(game().getByRole("button", { name: "Casa" }));
  await waitFor(() => expect(service.predict).toHaveBeenCalledWith(7, 14, "CASA", 88));
});
it("FREE confirma somente o palpite escolhido, mesmo com outra participação ativa", async () => {
  multiple(); await open(); fireEvent.click(button("Palpite 2")); fireEvent.click(button("Participar do Desafio"));
  await screen.findByRole("heading", { name: "Participando" });
  expect(service.participate).toHaveBeenCalledWith(7, 99); expect(wallet.refresh).not.toHaveBeenCalled();
  expect(screen.getByText("2 de 2 participações confirmadas")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("PAGO confirma cada palpite independentemente e não confirma novamente ATIVA", async () => {
  multiple(); server.tipoAcesso = "PAGO"; server.valorInscricao = "2.00";
  await open(); fireEvent.click(button("Palpite 2")); fireEvent.click(button("Participar do Desafio"));
  expect(service.participate).not.toHaveBeenCalled(); fireEvent.click(button(/Confirmar e pagar/));
  await screen.findByRole("heading", { name: "Participando" }); expect(service.participate).toHaveBeenCalledWith(7, 99);
  expect(wallet.refresh).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(button("Palpite 1").disabled).toBe(false)); fireEvent.click(button("Palpite 1"));
  expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
  expect(service.participate).toHaveBeenCalledTimes(1);
});
it("retry de confirmação mantém ID e não confunde falha com outra inscrição ATIVA", async () => {
  multiple(); vi.mocked(service.participate).mockRejectedValueOnce(new ApiError(0));
  await open(); fireEvent.click(button("Palpite 2")); fireEvent.click(button("Participar do Desafio")); await screen.findByRole("alert");
  expect(screen.queryByText("Participação confirmada!")).toBeNull();
  await waitFor(() => expect(button("Participar do Desafio").disabled).toBe(false));
  fireEvent.click(button("Participar do Desafio")); await screen.findByRole("heading", { name: "Participando" });
  expect(service.participate).toHaveBeenNthCalledWith(1, 7, 99); expect(service.participate).toHaveBeenNthCalledWith(2, 7, 99);
});
it("resposta perdida da confirmação recupera somente a inscrição escolhida", async () => {
  multiple(); vi.mocked(service.participate).mockImplementationOnce(async () => {
    server.minhasInscricoes![1].status = "ATIVA"; throw new ApiError(0);
  });
  await open(); fireEvent.click(button("Palpite 2")); fireEvent.click(button("Participar do Desafio"));
  await screen.findByText("Participação confirmada!"); expect(service.participate).toHaveBeenCalledTimes(1);
});
it("saldo insuficiente é do palpite selecionado e reutiliza o PIX existente", async () => {
  multiple(); server.tipoAcesso = "PAGO"; server.valorInscricao = "2.00";
  vi.mocked(service.participate).mockRejectedValueOnce(new ApiError(409, "Adicione saldo para participar.", { code: "SALDO_INSUFICIENTE", saldoDisponivel: "0.50", valorNecessario: "2.00", valorFaltante: "1.50" }));
  await open(); fireEvent.click(button("Palpite 2")); fireEvent.click(button("Participar do Desafio")); fireEvent.click(button(/Confirmar e pagar/));
  await screen.findByText("Saldo disponível"); await waitFor(() => expect(button("Adicionar saldo").disabled).toBe(false));
  fireEvent.click(button("Adicionar saldo")); expect(screen.getByRole("dialog", { name: "PIX existente" })).toBeTruthy();
  fireEvent.click(button("Concluir recarga")); await waitFor(() => expect(button("Participar do Desafio").disabled).toBe(false));
  fireEvent.click(button("Participar do Desafio")); fireEvent.click(button(/Confirmar e pagar/)); await screen.findByRole("heading", { name: "Participando" });
  expect(service.participate).toHaveBeenNthCalledWith(2, 7, 99);
});
it("CANCELADA bloqueia preenchimento e confirmação, preservando a seleção", async () => {
  multiple([entry(88, 1, "ATIVA"), entry(99, 2, "CANCELADA", "FORA")]); await open(); fireEvent.click(button("Palpite 2"));
  expect(game().getByRole("button", { name: "Fora" }).getAttribute("aria-pressed")).toBe("true");
  expect(game().getAllByRole("button").every(item => (item as HTMLButtonElement).disabled)).toBe(true);
  expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
});
it("limite usa quantidade do backend e apresenta rejeição de confirmação sem contar rascunhos", async () => {
  multiple(); server.limiteInscricoesPorUsuario = 1;
  vi.mocked(service.participate).mockRejectedValueOnce(new ApiError(409, "Limite de participações por usuário atingido.", { code: "LIMITE_INSCRICOES_USUARIO_ATINGIDO" }));
  await open(); expect(screen.getByText("1 de 1 participações confirmadas")).toBeTruthy();
  fireEvent.click(button("Palpite 2")); expect(button("Participar do Desafio").disabled).toBe(false);
  fireEvent.click(button("Participar do Desafio")); expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Limite de participações por usuário atingido.");
});
it("apuração, pontos e elegibilidade pertencem a cada inscrição e placar é compartilhado", async () => {
  multiple(); server.partidas[0] = { ...first, status: "FINALIZADA", golsMandante: 1, golsVisitante: 0 };
  server.minhasInscricoes![0].palpites[0] = { partidaId: 14, meuPalpite: "CASA", pontos: 1, apurado: true, podeAlterarPalpite: false };
  server.minhasInscricoes![1].palpites[0] = { partidaId: 14, meuPalpite: "FORA", pontos: 0, apurado: true, podeAlterarPalpite: false };
  await open(); expect(screen.getByText("✓ Acertou · +1 ponto")).toBeTruthy(); expect(screen.getByLabelText("Placar do Palmeiras").textContent).toBe("0");
  fireEvent.click(button("Palpite 2")); expect(screen.getByText("✕ Errou · 0 ponto")).toBeTruthy(); expect(screen.queryByText("✓ Acertou · +1 ponto")).toBeNull();
  expect(screen.getByLabelText("Placar do Flamengo").textContent).toBe("1");
});
it("bloqueia alternância durante salvamento sem contaminar outro palpite", async () => {
  multiple(); let resolve!: (value: Awaited<ReturnType<typeof service.predict>>) => void;
  vi.mocked(service.predict).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await open(); fireEvent.click(game().getByRole("button", { name: "Empate" })); fireEvent.click(button("Palpite 2"));
  expect(button("Palpite 1").getAttribute("aria-pressed")).toBe("true"); expect(button("Palpite 2").disabled).toBe(true);
  resolve({ desafioId: 7, partidaId: 14, palpite: "EMPATE", fechamentoEm: first.fechamentoEm, podeAlterarPalpite: true });
  await waitFor(() => expect(button("Palpite 2").disabled).toBe(false)); fireEvent.click(button("Palpite 2"));
  expect(game().getByRole("button", { name: "Fora" }).getAttribute("aria-pressed")).toBe("true"); expect(screen.queryByText("Salvo ✓")).toBeNull();
});
it("confirmação exige preencher todos os palpites obrigatórios da inscrição escolhida", async () => {
  multiple([entry(88, 1, "ATIVA"), entry(99, 2, "RASCUNHO", null)]); await open(); fireEvent.click(button("Palpite 2"));
  expect(button("Participar do Desafio").disabled).toBe(true); fireEvent.click(game().getByRole("button", { name: "Casa" }));
  await waitFor(() => expect((game("Grêmio x Corinthians").getByRole("button", { name: "Empate" }) as HTMLButtonElement).disabled).toBe(false));
  expect(button("Participar do Desafio").disabled).toBe(true); fireEvent.click(game("Grêmio x Corinthians").getByRole("button", { name: "Empate" }));
  await waitFor(() => expect(button("Participar do Desafio").disabled).toBe(false));
  expect(server.minhasInscricoes![0].palpites.every(pick => pick.meuPalpite === "CASA")).toBe(true);
});
it("rejeição de criação exibe mensagem de negócio sem termos internos", async () => {
  multiple(); vi.mocked(service.createInscricao).mockRejectedValueOnce(new ApiError(409, "Cartela indisponível para criação."));
  await open(); fireEvent.click(button("+ Novo palpite"));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "palpite indisponível para criação."); expect(service.participate).not.toHaveBeenCalled();
});

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
  expect(game().getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
  expect((game().getByRole("button", { name: "Empate" }) as HTMLButtonElement).disabled).toBe(false);
  expect(within(screen.getByRole("list", { name: "Partidas do Desafio" })).getAllByRole("listitem")[0].textContent).toContain("Flamengo");
  fireEvent.click(game().getByRole("button", { name: "Empate" }));
  await waitFor(() => expect(game().getByRole("button", { name: "Empate" }).getAttribute("aria-pressed")).toBe("true"));
  expect(service.predict).toHaveBeenCalledWith(7, 14, "EMPATE");
  expect(service.participate).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("anônimo consulta publicamente e vai ao login ao palpitar ou participar", async () => {
  auth.authenticated = false;
  server.partidas = server.partidas.map(({ meuPalpite, ...item }) => ({ ...item, podeAlterarPalpite: false }));
  delete server.inscrito; delete server.minhaInscricao;
  await open();
  expect(screen.getAllByRole("link", { name: "Entre para fazer seus palpites" })).toHaveLength(1);
  expect(screen.queryByText("Entre para palpitar")).toBeNull();
  expect(service.detail).toHaveBeenCalledWith(7, false, expect.any(AbortSignal));
  fireEvent.click(game().getByRole("button", { name: "Casa" }));
  fireEvent.click(button("Participar do Desafio"));
  expect(nav.push).toHaveBeenCalledTimes(2); expect(nav.push).toHaveBeenCalledWith("/login");
  expect(service.predict).not.toHaveBeenCalled(); expect(service.participate).not.toHaveBeenCalled();
});
it("resumo usa quantidade real de jogos e elimina informações redundantes", async () => {
  server.partidas = [{ ...first, meuPalpite: null }];
  await open();
  expect(screen.getByText("FREE · 1 jogo · Aberto")).toBeTruthy();
  const list = screen.getByRole("list", { name: "Partidas do Desafio" });
  expect(list.querySelectorAll("time")).toHaveLength(1);
  expect(list.textContent).not.toMatch(/Agendada|Fechamento|Mandante|Visitante|Seu palpite|×|- x -/);
  expect(game().getAllByRole("button").map(item => item.getAttribute("aria-label"))).toEqual(["Casa", "Empate", "Fora"]);
  expect(game().getAllByRole("button").every(item => item.getAttribute("aria-pressed") === "false")).toBe(true);
});
it.each([ ["EM_ANDAMENTO", "Em andamento"], ["FINALIZADA", "Finalizado"], ["ANULADA", "Anulada"] ] as const)("mantém seletores e palpite no estado %s sem inventar placar ou pontos", async (status, label) => {
  server.partidas = [{ ...first, status, podeAlterarPalpite: false }];
  await open();
  const list = within(screen.getByRole("list", { name: "Partidas do Desafio" }));
  expect(list.getByText(label)).toBeTruthy();
  expect(game().getAllByRole("button")).toHaveLength(3);
  expect(game().getAllByRole("button").every(item => (item as HTMLButtonElement).disabled)).toBe(true);
  expect(game().getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(game().getByRole("button", { name: "Fora" }));
  expect(service.predict).not.toHaveBeenCalled();
  expect(list.queryByText(/Acertou|Errou|ponto|indisponíveis|- x -/)).toBeNull();
});
it("mantém partida bloqueada visível com seu palpite e revalida 409", async () => {
  await open();
  server.partidas[0].podeAlterarPalpite = false;
  vi.mocked(service.predict).mockRejectedValueOnce(new ApiError(409, "Partida fechada."));
  fireEvent.click(game().getByRole("button", { name: "Fora" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Partida fechada.");
  await waitFor(() => expect((game().getByRole("button", { name: "Fora" }) as HTMLButtonElement).disabled).toBe(true));
  expect(game().getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
});
it("indica jogos sem palpite, ignora anuladas e só participa após salvar", async () => {
  server.partidas[0].meuPalpite = null;
  server.partidas[1] = { ...second, status: "ANULADA", meuPalpite: null, podeAlterarPalpite: false };
  await open();
  expect(button("Participar do Desafio").disabled).toBe(true);
  expect(screen.getByRole("link", { name: "Flamengo × Palmeiras" }).getAttribute("href")).toBe("#partida-14");
  expect(screen.queryByRole("link", { name: "Grêmio × Corinthians" })).toBeNull();
  fireEvent.click(game().getByRole("button", { name: "Casa" }));
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
  fireEvent.click(game().getByRole("button", { name: "Fora" }));
  await waitFor(() => expect(service.predict).toHaveBeenCalledWith(7, 14, "FORA", 88));
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
  await waitFor(() => expect((game("Grêmio x Corinthians").getByRole("button", { name: "Empate" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(game("Grêmio x Corinthians").getByRole("button", { name: "Empate" }));
  await waitFor(() => expect(service.predict).toHaveBeenCalledWith(7, 11, "EMPATE"));
});
it("recusa reinscrição cancelada e bloqueia novos palpites", async () => {
  server.minhaInscricao = { ...inscription, status: "CANCELADA" };
  await open(); expect(screen.queryByRole("button", { name: "Participar do Desafio" })).toBeNull();
  expect((game().getByRole("button", { name: "Empate" }) as HTMLButtonElement).disabled).toBe(true);
});
it.each([401, 403, 404])("detalhe trata HTTP %s", async status => {
  vi.mocked(service.detail).mockRejectedValueOnce(new ApiError(status));
  render(<DesafioDetailPage />); expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("group")).toBeNull();
});
it("401 no palpite direciona ao login existente", async () => {
  await open(); vi.mocked(service.predict).mockRejectedValueOnce(new ApiError(401));
  fireEvent.click(game().getByRole("button", { name: "Empate" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/login"));
});
it("troca de usuário descarta detalhes privados anteriores", async () => {
  server.inscrito = true; server.minhaInscricao = inscription;
  const view = render(<DesafioDetailPage />); await screen.findByRole("heading", { name: "Participando" });
  auth.id = "user-2"; server = { ...structuredClone(fixture), partidas: [{ ...first, meuPalpite: null }] };
  view.rerender(<DesafioDetailPage />);
  expect(screen.queryByRole("heading", { name: "Participando" })).toBeNull();
  await screen.findByRole("heading", { name: "Desafio POINT" });
  expect(game().getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("false");
});
