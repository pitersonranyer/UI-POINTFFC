import React from "react";
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FantasyShowcase } from "./FantasyShowcase";
import { competitionAvailability, competitionIdFromSearch } from "./competitionPresentation";
import { listFantasyCompetitions } from "@/services/pointFantasyLineupService";
import { getFantasyShowcaseMatchups } from "@/services/pointFantasyShowcaseService";
import { testContext } from "../lineups/lineupTestFixtures";
import { metadata } from "@/app/point-fantasy/page";
import { metadata as legacyMetadata } from "@/app/point-fantasy/escalacoes/page";
import { LegacyFantasyEntry } from "./LegacyFantasyEntry";
import hostingConfig from "../../../../firebase.json";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof import("@/services/pointFantasyLineupService")>(), listFantasyCompetitions: vi.fn() }));
vi.mock("@/services/pointFantasyShowcaseService", () => ({ getFantasyShowcaseMatchups: vi.fn() }));
vi.mock("../lineups/FantasyLineupBuilder", () => ({ FantasyLineupBuilder: ({ competitionId, onBack }: { competitionId: number; onBack: () => void }) => <section aria-label="Editor existente"><p>Competição {competitionId}</p><button onClick={onBack}>Voltar</button></section> }));
const competition = (id = 8) => ({ ...testContext().competition, id, nome: `Competição ${id}` });

beforeEach(() => {
  window.history.replaceState({}, "", "/point-fantasy");
  vi.mocked(listFantasyCompetitions).mockReset().mockResolvedValue([competition()]);
  vi.mocked(getFantasyShowcaseMatchups).mockReset();
  router.replace.mockClear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

it("mantém os dados reais, indica quando não há premiação informada e abre confrontos sob demanda", async () => {
  render(<FantasyShowcase />);
  expect(screen.getByRole("status").textContent).toContain("Carregando");
  const card = await screen.findByRole("article", { name: "Competição 8" });
  expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Todas"]);
  expect(screen.getByRole("tab").getAttribute("aria-selected")).toBe("true");
  expect(card.textContent).toContain("FREE");
  expect(card.textContent).toContain("Rodada 31");
  expect(card.textContent).toContain("Sem premiação informada");
  expect(card.textContent).not.toMatch(/Brasileirão|times por usuário/i);
  expect(within(card).getByRole("button", { name: /Ver confrontos/ })).toBeTruthy();
  expect(getFantasyShowcaseMatchups).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Próxima competição" })).toBeNull();
});

it("mostra preço de inscrição real em competição paga sem confundi-lo com premiação", async () => {
  vi.mocked(listFantasyCompetitions).mockResolvedValue([{ ...competition(), tipoAcesso: "PAGO", valorInscricao: "12.50", limiteEscalacoesUsuario: 3 }]);
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article");
  expect(card.textContent).toContain("PAGO");
  expect(card.textContent).toMatch(/12,50/);
  expect(card.textContent).toContain("Inscrição");
  expect(card.textContent).toContain("Sem premiação informada");
  expect(card.textContent).not.toContain("Até 3 times por usuário");
});

it("abre uma modal informativa, fecha por Escape e restaura o foco sem iniciar inscrição", async () => {
  vi.mocked(getFantasyShowcaseMatchups).mockResolvedValue({
    partidas: [{ id: 10, competicaoId: 8, partidaIdExterno: 100, clubeMandanteId: 262, clubeVisitanteId: 263, inicioPrevisto: "2026-10-18T19:00:00.000Z", inicioReal: null, status: "AGENDADA" }],
    clubes: [
      { id: 262, dados: { nome: "FLA", abreviacao: "FLA", apelido: "Mengão", escudos: { "45x45": "https://img.example/flamengo.png" } } },
      { id: 263, dados: { nome: "BOT", abreviacao: "BOT", apelido: "Glorioso", escudos: { "45x45": "https://img.example/botafogo.png" } } },
    ],
  });
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article", { name: "Competição 8" });
  const open = within(card).getByRole("button", { name: /Ver confrontos/ });
  open.focus();
  fireEvent.click(open);
  const dialog = await screen.findByRole("dialog", { name: "Jogos da disputa" });
  expect(within(dialog).getByText("Competição 8")).toBeTruthy();
  expect(within(dialog).getByText("Flamengo")).toBeTruthy();
  expect(within(dialog).getByText("Botafogo")).toBeTruthy();
  expect(within(dialog).getByText(/16:00 · Brasília/)).toBeTruthy();
  expect(within(dialog).getByRole("img", { name: "Escudo do Flamengo" })).toBeTruthy();
  const close = within(dialog).getByRole("button", { name: "Fechar" });
  fireEvent.keyDown(dialog, { key: "Tab" });
  expect(document.activeElement).toBe(close);
  expect(window.location.search).toBe("");
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(open);
  fireEvent.click(open);
  await screen.findByRole("dialog", { name: "Jogos da disputa" });
  expect(getFantasyShowcaseMatchups).toHaveBeenCalledTimes(1);
});

it("mostra estado vazio quando a competição não tem confrontos", async () => {
  vi.mocked(getFantasyShowcaseMatchups).mockResolvedValue({ partidas: [], clubes: [] });
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article", { name: "Competição 8" });
  fireEvent.click(within(card).getByRole("button", { name: /Ver confrontos/ }));
  expect(await screen.findByText("Nenhum confronto informado para esta disputa.")).toBeTruthy();
  expect(getFantasyShowcaseMatchups).toHaveBeenCalledTimes(1);
});

it("mostra erro e permite repetir a consulta", async () => {
  vi.mocked(getFantasyShowcaseMatchups).mockRejectedValueOnce(new Error("Sem conexão")).mockResolvedValueOnce({ partidas: [], clubes: [] });
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article", { name: "Competição 8" });
  fireEvent.click(within(card).getByRole("button", { name: /Ver confrontos/ }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Nenhum confronto informado para esta disputa.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent.click(within(card).getByRole("button", { name: /Ver confrontos/ }));
  expect(await screen.findByText("Nenhum confronto informado para esta disputa.")).toBeTruthy();
  expect(getFantasyShowcaseMatchups).toHaveBeenCalledTimes(2);
});

it("ignora uma resposta atrasada depois que a modal é fechada", async () => {
  let resolveRequest!: (data: Awaited<ReturnType<typeof getFantasyShowcaseMatchups>>) => void;
  vi.mocked(getFantasyShowcaseMatchups).mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; }));
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article", { name: "Competição 8" });
  fireEvent.click(within(card).getByRole("button", { name: /Ver confrontos/ }));
  await screen.findByRole("dialog", { name: "Jogos da disputa" });
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  resolveRequest({ partidas: [{ id: 10, competicaoId: 8, partidaIdExterno: 100, clubeMandanteId: 262, clubeVisitanteId: 263, inicioPrevisto: "2026-10-18T19:00:00.000Z", inicioReal: null, status: "AGENDADA" }], clubes: [] });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.queryByText("Flamengo")).toBeNull();
});

it("não mostra partidas atrasadas de outra competição", async () => {
  let resolveOld!: (data: Awaited<ReturnType<typeof getFantasyShowcaseMatchups>>) => void;
  vi.mocked(listFantasyCompetitions).mockResolvedValue([competition(8), competition(19)]);
  vi.mocked(getFantasyShowcaseMatchups)
    .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
    .mockResolvedValueOnce({
      partidas: [{ id: 20, competicaoId: 19, partidaIdExterno: 200, clubeMandanteId: 266, clubeVisitanteId: 264, inicioPrevisto: "2026-10-19T20:00:00.000Z", inicioReal: null, status: "ADIADA" }],
      clubes: [
        { id: 266, dados: { nome: "FLU", abreviacao: "FLU", apelido: "Tricolor" } },
        { id: 264, dados: { nome: "COR", abreviacao: "COR", apelido: "Timão" } },
      ],
    });
  render(<FantasyShowcase />);
  const first = await screen.findByRole("article", { name: "Competição 8" });
  const second = screen.getByRole("article", { name: "Competição 19" });
  fireEvent.click(within(first).getByRole("button", { name: /Ver confrontos/ }));
  await screen.findByRole("dialog", { name: "Jogos da disputa" });
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent.click(within(second).getByRole("button", { name: /Ver confrontos/ }));
  const dialog = await screen.findByRole("dialog", { name: "Jogos da disputa" });
  expect(await within(dialog).findByText("Fluminense")).toBeTruthy();
  resolveOld({
    partidas: [{ id: 10, competicaoId: 8, partidaIdExterno: 100, clubeMandanteId: 262, clubeVisitanteId: 263, inicioPrevisto: "2026-10-18T19:00:00.000Z", inicioReal: null, status: "AGENDADA" }],
    clubes: [],
  });
  await waitFor(() => expect(within(dialog).queryByText("Flamengo")).toBeNull());
  expect(within(dialog).getByText("Fluminense")).toBeTruthy();
});

it("abre o editor com o ID correto e preserva parâmetros e histórico de navegação", async () => {
  window.history.replaceState({}, "", "/point-fantasy?origem=menu#disputas");
  vi.mocked(listFantasyCompetitions).mockResolvedValue([competition(8), competition(19)]);
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article", { name: "Competição 19" });
  fireEvent.click(within(card).getByRole("button", { name: "Participar" }));
  expect(screen.getByRole("region", { name: "Editor existente" }).textContent).toContain("Competição 19");
  expect(window.location.search).toBe("?origem=menu&competicao=19");
  expect(window.location.hash).toBe("#disputas");
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  await screen.findByRole("article", { name: "Competição 8" });
  expect(window.location.search).toBe("?origem=menu");
  window.history.replaceState({}, "", "/point-fantasy?competicao=8");
  fireEvent(window, new PopStateEvent("popstate"));
  expect(screen.getByRole("region", { name: "Editor existente" }).textContent).toContain("Competição 8");
});

it("preserva acesso direto à competição sem carregar a vitrine", () => {
  window.history.replaceState({}, "", "/point-fantasy?competicao=19");
  render(<FantasyShowcase />);
  expect(screen.getByRole("region", { name: "Editor existente" }).textContent).toContain("Competição 19");
  expect(listFantasyCompetitions).not.toHaveBeenCalled();
});

it("oferece controles de carrossel e teclado apenas com múltiplas competições", async () => {
  vi.mocked(listFantasyCompetitions).mockResolvedValue([competition(), competition(19)]);
  render(<FantasyShowcase />);
  await screen.findAllByRole("article");
  const rail = screen.getByRole("region", { name: "Carrossel de competições" });
  const scrollTo = vi.fn(); Object.defineProperty(rail, "scrollTo", { configurable: true, value: scrollTo });
  fireEvent.keyDown(rail, { key: "End" });
  expect(scrollTo).toHaveBeenCalled();
  expect(screen.getByText("2 / 2")).toBeTruthy();
  fireEvent.keyDown(rail, { key: "Home" });
  expect(screen.getByText("1 / 2")).toBeTruthy();
  expect((screen.getByRole("button", { name: "Competição anterior" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Próxima competição" }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
});

it("trata erro, nova tentativa e ausência de competições", async () => {
  vi.mocked(listFantasyCompetitions).mockRejectedValueOnce(new Error("Consulta indisponível")).mockResolvedValue([]);
  render(<FantasyShowcase />);
  expect((await screen.findByRole("alert")).textContent).toContain("Consulta indisponível");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Nenhuma competição disponível no momento.")).toBeTruthy();
});

it("substitui Participar por Ver andamento quando o servidor encerra a competição", async () => {
  vi.mocked(listFantasyCompetitions).mockResolvedValueOnce([competition()]).mockResolvedValue([{ ...competition(), status: "ENCERRADA" }]);
  render(<FantasyShowcase />);
  await screen.findByRole("button", { name: "Participar" });
  fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
  expect((await screen.findByRole("button", { name: "Ver andamento" }) as HTMLButtonElement).disabled).toBe(false);
  expect(screen.queryByRole("button", { name: "Participar" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Ver andamento" }));
  expect(screen.getByRole("region", { name: "Editor existente" }).textContent).toContain("Competição 8");
});

it("permite acompanhar os times quando o prazo expira durante a sessão", async () => {
  vi.useFakeTimers(); const now = new Date("2026-10-17T12:00:00Z"); vi.setSystemTime(now);
  vi.mocked(listFantasyCompetitions).mockResolvedValue([{ ...competition(), fimInscricao: "2026-10-17T12:00:02Z" }]);
  await act(async () => { render(<FantasyShowcase />); });
  expect(screen.getByRole("button", { name: "Participar" })).toBeTruthy();
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect((screen.getByRole("button", { name: "Ver andamento" }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Ver andamento" }));
  expect(window.location.search).toBe("?competicao=8");
});

it.each(["ENCERRADA", "FINALIZADA", "FECHADA"])("permite consultar a competição %s", async status => {
  vi.mocked(listFantasyCompetitions).mockResolvedValue([{ ...competition(19), status }]);
  render(<FantasyShowcase />);
  fireEvent.click(await screen.findByRole("button", { name: "Ver andamento" }));
  expect(window.location.search).toBe("?competicao=19");
});

it("mantém indisponível a participação antes da abertura", async () => {
  vi.mocked(listFantasyCompetitions).mockResolvedValue([{ ...competition(), inicioInscricao:"2099-01-01T00:00:00Z", fimInscricao:"2100-01-01T00:00:00Z" }]);
  render(<FantasyShowcase />);
  expect((await screen.findByRole("button", { name:"Em breve" }) as HTMLButtonElement).disabled).toBe(true);
});

it("respeita início, fim, fechamento definitivo e datas inválidas", () => {
  expect(competitionAvailability(competition(), Date.parse("2025-01-01"))).toBe("Em breve");
  expect(competitionAvailability(competition(), Date.parse("2098-01-01"))).toBe("Encerrada");
  expect(competitionAvailability({ ...competition(), fechamentoDefinitivoEm: "2026-01-01" }, Date.now())).toBe("Encerrada");
  expect(competitionAvailability({ ...competition(), fimInscricao: "" }, Date.now())).toBe("Prazo indisponível");
  for (const value of ["?competicao=-1", "?competicao=1.5", "?competicao=evil", "?competicao=9007199254740992"]) expect(competitionIdFromSearch(value)).toBeNull();
});

it("configura canonical único, sitemap e redirects exatos sem capturar subrotas", () => {
  expect(metadata.title).toBe("POINT FFC Fantasy");
  expect(metadata.alternates?.canonical).toBe("https://pointffc.com.br/point-fantasy");
  expect(legacyMetadata.alternates?.canonical).toBe(metadata.alternates?.canonical);
  expect(legacyMetadata.robots).toEqual({ index: false, follow: false });
  for (const path of ["/point-fantasy/escalacoes", "/point-fantasy/escalacoes/"]) {
    expect(hostingConfig.hosting.redirects.find(rule => new RegExp(rule.regex).test(path))).toEqual({ regex: "^/point-fantasy/escalacoes/?$", destination: "/point-fantasy", type: 301 });
  }
  for (const path of ["/point-fantasy", "/point-fantasy/escalacoes/12", "/point-fantasy/atletas/"]) {
    expect(hostingConfig.hosting.redirects.some(rule => new RegExp(rule.regex).test(path))).toBe(false);
  }
  const sitemap = readFileSync("public/sitemap.xml", "utf8");
  expect(sitemap).toContain("<loc>https://pointffc.com.br/point-fantasy</loc>");
  expect(sitemap).not.toContain("/point-fantasy/escalacoes");
});

it("mantém query e hash no fallback local da rota antiga", () => {
  window.history.replaceState({}, "", "/point-fantasy/escalacoes/?competicao=19&origem=antigo#time");
  render(<LegacyFantasyEntry />);
  expect(router.replace).toHaveBeenCalledWith("/point-fantasy?competicao=19&origem=antigo#time");
});
