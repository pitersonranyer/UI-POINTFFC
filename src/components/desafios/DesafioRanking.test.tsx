import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { desafioService as service, type DesafioRanking as Ranking, type DesafioJogo } from "@/services/desafioService";
import { DesafioDetailPage } from "./DesafioDetailPage";
import { DesafioMatch } from "./DesafioMatch";
import { DesafioRanking } from "./DesafioRanking";

const auth = vi.hoisted(() => ({ id: "2", authenticated: true, loading: false }));
const nav = vi.hoisted(() => ({ query: "id=7&aba=ranking", push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }), useSearchParams: () => new URLSearchParams(nav.query) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.authenticated ? { idUsuario: auth.id } : null, isAuthenticated: auth.authenticated, isLoading: auth.loading }) }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ refreshWallet: vi.fn() }) }));
vi.mock("@/services/desafioService", async original => ({ ...await original<object>(), desafioService: { ranking: vi.fn(), detail: vi.fn(), predict: vi.fn(), participate: vi.fn() } }));
const result: Ranking = {
  desafioId: 7, status: "EM_ANDAMENTO", totalPartidasValidas: 8, totalPartidasApuradas: 5, totalPartidasAnuladas: 1, pontuacaoMaxima: 8,
  ranking: [1, 1, 3, 4, 4].map((posicao, index) => ({ posicao, participante: { idUsuario: index + 1, nome: ["Ana", "Bruno", "Carla", "Diego", "Eva"][index], fotoUrl: null }, pontos: [5, 5, 3, 1, 1][index], acertos: [5, 5, 3, 1, 1][index] })),
  paginacao: { pagina: 1, limite: 20, total: 5, totalPaginas: 1 },
};
beforeEach(() => { vi.stubGlobal("React", React); vi.resetAllMocks(); auth.id = "2"; auth.authenticated = true; auth.loading = false; nav.query = "id=7&aba=ranking"; vi.mocked(service.ranking).mockResolvedValue(structuredClone(result)); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const positions = () => rows().map(row => within(row).getAllByRole("cell")[0].textContent);
it("mantém entradas independentes do mesmo usuário com número e posições do backend", async () => {
  vi.mocked(service.ranking).mockResolvedValue({ ...result, ranking: [
    { ...result.ranking[1], inscricaoId: 88, numero: 1, nome: "Palpite 1", posicao: 1, pontos: 8 },
    { ...result.ranking[0], inscricaoId: 90, numero: 1, nome: "Palpite 1", posicao: 2, pontos: 7 },
    { ...result.ranking[1], inscricaoId: 99, numero: 2, nome: "Palpite 2", posicao: 3, pontos: 6 },
  ] });
  render(<DesafioRanking id={7} />); await screen.findByRole("table");
  expect(positions()).toEqual(["1", "2", "3"]);
  expect(rows().map(row => within(row).getAllByRole("cell")[1].textContent)).toEqual(["8", "7", "6"]);
  expect(rows().map(row => within(row).getByRole("rowheader").textContent)).toEqual(["Bruno· Palpite 1Você", "Ana· Palpite 1", "Bruno· Palpite 2Você"]);
  expect(screen.getAllByRole("row", { name: "Sua classificação" })).toHaveLength(2);
});

it("preserva exatamente ordem, posições empatadas e pontos da API", async () => {
  render(<DesafioRanking id={7} />); expect(screen.getByRole("status").textContent).toBe("Carregando ranking...");
  await screen.findByRole("table");
  expect(positions()).toEqual(["1", "1", "3", "4", "4"]);
  expect(rows().map(row => within(row).getByRole("rowheader").textContent)).toEqual(["Ana", "BrunoVocê", "Carla", "Diego", "Eva"]);
  expect(rows().map(row => within(row).getAllByRole("cell")[1].textContent)).toEqual(["5", "5", "3", "1", "1"]);
  expect(screen.getByText("5 de 8 partidas apuradas")).toBeTruthy(); expect(screen.getByText("Máximo: 8 pts")).toBeTruthy();
});
it("identifica usuário por ID, mesmo com string na autenticação e número na API", async () => {
  render(<DesafioRanking id={7} />); const own = await screen.findByRole("row", { name: "Sua classificação" });
  expect(within(own).getByRole("rowheader").textContent).toBe("BrunoVocê");
  expect(own.className).toContain("ownRank");
});
it.each(["anonimo", "ausente"])("não inventa inscrição nem posição para usuário %s", async mode => {
  if (mode === "anonimo") auth.authenticated = false; else auth.id = "999";
  render(<DesafioRanking id={7} />); await screen.findByRole("table");
  expect(screen.queryByText("Você")).toBeNull(); expect(screen.queryByText(/não está inscrito/i)).toBeNull();
  expect(service.ranking).toHaveBeenCalledWith(7, 1, expect.any(AbortSignal));
});
it("pagina no servidor mantendo posição global e empate entre páginas", async () => {
  vi.mocked(service.ranking).mockImplementation(async (_id, page) => ({ ...result, ranking: page === 1 ? [{ ...result.ranking[0], posicao: 19 }] : [{ ...result.ranking[1], posicao: 19 }], paginacao: { pagina: page ?? 1, limite: 20, total: 21, totalPaginas: 2 } }));
  render(<DesafioRanking id={7} />); await screen.findByRole("table"); expect(positions()).toEqual(["19"]);
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  await waitFor(() => expect(service.ranking).toHaveBeenLastCalledWith(7, 2, expect.any(AbortSignal)));
  await screen.findByText("Página 2 de 2"); expect(positions()).toEqual(["19"]);
  expect((screen.getByRole("button", { name: "Próxima" }) as HTMLButtonElement).disabled).toBe(true);
});
it("ranking encerrado abre diretamente sem depender do detalhe 404, até durante carregamento da autenticação", async () => {
  auth.loading = true;
  vi.mocked(service.ranking).mockResolvedValue({ ...result, status: "ENCERRADO" });
  vi.mocked(service.detail).mockRejectedValue(new ApiError(404));
  render(<DesafioDetailPage />); await screen.findByText("Encerrado");
  expect(screen.getByText("Desafio encerrado. Classificação conforme a última apuração.")).toBeTruthy();
  expect(service.detail).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Desafio / Palpites" }).getAttribute("href")).toBe("/desafios/detalhe?id=7");
  expect(screen.getByRole("link", { name: "Ranking" }).getAttribute("aria-current")).toBe("page");
});
it("detalhe indisponível mantém acesso ao ranking", async () => {
  nav.query = "id=7"; vi.mocked(service.detail).mockRejectedValue(new ApiError(404));
  render(<DesafioDetailPage />); await screen.findByRole("alert");
  expect(screen.getByRole("link", { name: "Ranking" }).getAttribute("href")).toBe("/desafios/detalhe?id=7&aba=ranking");
  expect(service.ranking).not.toHaveBeenCalled();
});
it("mostra zero pontos como zero e participantes sem nome com fallback neutro", async () => {
  vi.mocked(service.ranking).mockResolvedValue({ ...result, status: "ABERTO", totalPartidasApuradas: 0, ranking: [{ posicao: 1, participante: { idUsuario: 99, nome: null, fotoUrl: null }, pontos: 0, acertos: 0 }] });
  render(<DesafioRanking id={7} />); await screen.findByRole("table");
  expect(within(rows()[0]).getByRole("rowheader").textContent).toBe("Participante");
  expect(within(rows()[0]).getAllByRole("cell").map(cell => cell.textContent)).toEqual(["1", "0", "0"]);
});
it("vazio não cria classificações fictícias", async () => {
  vi.mocked(service.ranking).mockResolvedValue({ ...result, ranking: [], paginacao: { pagina: 1, limite: 20, total: 0, totalPaginas: 0 } });
  render(<DesafioRanking id={7} />); await screen.findByText("Nenhum participante no ranking ainda.");
  expect(screen.queryByRole("table")).toBeNull(); expect(screen.queryByRole("navigation", { name: "Paginação do ranking" })).toBeNull();
});
it.each([0, 401, 403, 404])("trata erro %s e permite nova consulta", async status => {
  vi.mocked(service.ranking).mockRejectedValueOnce(new ApiError(status));
  render(<DesafioRanking id={7} />); await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" })); await screen.findByRole("table");
  expect(service.ranking).toHaveBeenCalledTimes(2);
});
it("troca de Desafio cancela resposta antiga e reinicia página", async () => {
  let resolve!: (value: Ranking) => void;
  vi.mocked(service.ranking).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const view = render(<DesafioDetailPage />);
  const signal = vi.mocked(service.ranking).mock.calls[0][2]!;
  nav.query = "id=8&aba=ranking";
  vi.mocked(service.ranking).mockResolvedValue({ ...result, desafioId: 8, ranking: [{ ...result.ranking[0], participante: { idUsuario: 99, nome: "Novo participante", fotoUrl: null } }] });
  view.rerender(<DesafioDetailPage />); await screen.findByText("Novo participante");
  expect(signal.aborted).toBe(true); resolve(result);
  await waitFor(() => expect(screen.queryByText("Ana")).toBeNull());
  expect(service.ranking).toHaveBeenLastCalledWith(8, 1, expect.any(AbortSignal));
});

const match: DesafioJogo = { id: 1, ordem: 1, nomeCompeticao: "Brasileirão", nomeMandante: "Flamengo", nomeVisitante: "Palmeiras", logoMandanteUrl: null, logoVisitanteUrl: null, dataInicio: "2026-10-03T19:00:00Z", fechamentoEm: "2026-10-03T19:00:00Z", status: "FINALIZADA", podeAlterarPalpite: false, meuPalpite: "CASA" };
function showMatch(change: Partial<DesafioJogo> = {}) {
  render(<ol><DesafioMatch game={{ ...match, ...change }} authenticated disabled={false} saving={false} saved={false} missing={false} choose={vi.fn()} /></ol>);
}
it("finalizada mantém palpite sem inventar acerto, erro ou placar", () => {
  showMatch(); expect(screen.getByText("Finalizado")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.queryByText(/Acertou|Errou|0 pontos|1 ponto/)).toBeNull();
  expect((screen.getByRole("button", { name: "Casa" }) as HTMLButtonElement).disabled).toBe(true);
});
it("anulada tem estado neutro e não vira erro do jogador", () => {
  showMatch({ status: "ANULADA" }); expect(screen.getByText("Anulada")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull(); expect(screen.queryByText(/Errou|Resultado e pontuação/)).toBeNull();
  expect(screen.getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
});
it("em andamento não presume resultado nem pontuação antes da apuração", () => {
  showMatch({ status: "EM_ANDAMENTO", meuPalpite: null });
  expect(screen.getByText("Em andamento")).toBeTruthy();
  expect(screen.getAllByRole("button").every(item => item.getAttribute("aria-pressed") === "false")).toBe(true);
  expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
