import React from "react";
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FantasyShowcase } from "./FantasyShowcase";
import { competitionAvailability, competitionIdFromSearch } from "./competitionPresentation";
import { listFantasyCompetitions } from "@/services/pointFantasyLineupService";
import { testContext } from "../lineups/lineupTestFixtures";
import { metadata } from "@/app/point-fantasy/page";
import { metadata as legacyMetadata } from "@/app/point-fantasy/escalacoes/page";
import { LegacyFantasyEntry } from "./LegacyFantasyEntry";
import hostingConfig from "../../../../firebase.json";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof import("@/services/pointFantasyLineupService")>(), listFantasyCompetitions: vi.fn() }));
vi.mock("../lineups/FantasyLineupBuilder", () => ({ FantasyLineupBuilder: ({ competitionId, onBack }: { competitionId: number; onBack: () => void }) => <section aria-label="Editor existente"><p>Competição {competitionId}</p><button onClick={onBack}>Voltar</button></section> }));
const competition = (id = 8) => ({ ...testContext().competition, id, nome: `Competição ${id}` });

beforeEach(() => {
  window.history.replaceState({}, "", "/point-fantasy");
  vi.mocked(listFantasyCompetitions).mockReset().mockResolvedValue([competition()]);
  router.replace.mockClear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

it("carrega dados reais em Todas, sem inventar campeonatos, prêmios ou confrontos", async () => {
  render(<FantasyShowcase />);
  expect(screen.getByRole("status").textContent).toContain("Carregando");
  const card = await screen.findByRole("article", { name: "Competição 8" });
  expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Todas"]);
  expect(screen.getByRole("tab").getAttribute("aria-selected")).toBe("true");
  expect(card.textContent).toContain("FREE");
  expect(card.textContent).toContain("Grátis para participar");
  expect(card.textContent).toContain("Rodada 31");
  expect(card.textContent).not.toMatch(/prêmio|confronto|Brasileirão/i);
  expect(screen.queryByRole("button", { name: "Próxima competição" })).toBeNull();
});

it("mostra preço e limite reais em competição paga", async () => {
  vi.mocked(listFantasyCompetitions).mockResolvedValue([{ ...competition(), tipoAcesso: "PAGO", valorInscricao: "12.50", limiteEscalacoesUsuario: 3 }]);
  render(<FantasyShowcase />);
  const card = await screen.findByRole("article");
  expect(card.textContent).toContain("PAGA");
  expect(card.textContent).toMatch(/12,50/);
  expect(card.textContent).toContain("Até 3 times por usuário");
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

it("atualiza a listagem e remove ações quando o servidor encerra a competição", async () => {
  vi.mocked(listFantasyCompetitions).mockResolvedValueOnce([competition()]).mockResolvedValue([{ ...competition(), status: "ENCERRADA" }]);
  render(<FantasyShowcase />);
  await screen.findByRole("button", { name: "Participar" });
  fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
  expect((await screen.findByRole("button", { name: "Encerrada" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByRole("button", { name: "Participar" })).toBeNull();
});

it("expira o botão durante a sessão e impede clique com dados antigos", async () => {
  vi.useFakeTimers(); const now = new Date("2026-10-17T12:00:00Z"); vi.setSystemTime(now);
  vi.mocked(listFantasyCompetitions).mockResolvedValue([{ ...competition(), fimInscricao: "2026-10-17T12:00:02Z" }]);
  await act(async () => { render(<FantasyShowcase />); });
  expect(screen.getByRole("button", { name: "Participar" })).toBeTruthy();
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect((screen.getByRole("button", { name: "Encerrada" }) as HTMLButtonElement).disabled).toBe(true);
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
