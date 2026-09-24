import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartolaDashboard } from "./CartolaDashboard";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { MagoDashboardCard } from "./MagoDashboardCard";
import { magoRodada28 } from "@/data/mago/rodada28";
import { buscarJogosHoje } from "@/services/futebolService";

vi.mock("@/services/futebolService", () => ({ buscarJogosHoje: vi.fn().mockResolvedValue({ total: 0, jogos: [] }) }));
vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { competitions: vi.fn().mockResolvedValue([]) } }));

vi.mock("@/hooks/useCartolaDashboard");
vi.mock("@/components/matches/FutebolMatches", () => ({ FutebolMatches: () => <section>Partidas da API</section> }));
vi.mock("./GeneralRanking", () => ({ GeneralRanking: ({ round }: { round: number }) => <section>Ranking {round}</section> }));
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.mocked(buscarJogosHoje).mockResolvedValue({ data: "2026-09-15", timezone: "America/Sao_Paulo", total: 0, jogos: [] });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function setup(round = 27, open = true) {
  const state: ReturnType<typeof useCartolaDashboard> = {
    dashboard: { rodada: round, mercadoAberto: open, bolaRolando: false, mercado: { rodada_atual: round, status_mercado: open ? 1 : 2, bola_rolando: false }, partidas: [], clubes: {} },
    loading: false, error: null, stale: false, atualizar: vi.fn(), athletes: { atletas: {} }, athletesLoading: false, athletesError: null,
    statisticsMatches: [{ partida_id: 1, clube_casa_id: 1, clube_visitante_id: 2, placar_oficial_mandante: 3, placar_oficial_visitante: 1 }],
  };
  vi.mocked(useCartolaDashboard).mockReturnValue(state);
  return state;
}

describe("Dashboard e resumo do Mago", () => {
  it("preserva bloco e aba Hoje vazia com agenda e sem carrossel", async () => {
    setup();
    render(<CartolaDashboard />);
    const block = within(screen.getByRole("region", { name: "Acompanhe os jogos" }));
    expect(await block.findByText("Nenhum jogo programado para hoje")).toBeTruthy();
    expect(block.getByText("Confira a agenda completa e os próximos jogos.")).toBeTruthy();
    expect(block.getByRole("link", { name: "Ver agenda" }).getAttribute("href")).toBe("/jogos");
    expect(block.getByRole("link", { name: "Ver todos" }).getAttribute("href")).toBe("/jogos");
    expect(block.getByRole("button", { name: "Hoje" }).getAttribute("aria-pressed")).toBe("true");
    expect(block.queryByText("Partidas da API")).toBeNull();
    expect(block.queryByRole("region", { name: /Carrossel/ })).toBeNull();
    expect(block.getAllByRole("button")).toHaveLength(2);
  });
  it("isola falha dos jogos de hoje e preserva os demais blocos", async () => {
    setup();
    vi.mocked(buscarJogosHoje).mockRejectedValueOnce(new Error("offline"));
    render(<CartolaDashboard />);
    expect(await screen.findByText("Não foi possível carregar os jogos de hoje.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hoje" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Brasileirão" }));
    expect(screen.getByText("Partidas da API")).toBeTruthy();
    expect(screen.getByText("Ranking 26")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Mago do Point Fantasy" })).toBeTruthy();
  });
  it("mostra R27, preserva os blocos existentes e usa a rodada anterior enquanto o mercado está aberto", () => {
    setup();
    const { container } = render(<CartolaDashboard />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver liga" }).getAttribute("href")).toBe("/ligas/point-ffc");
    expect(screen.getAllByText("Rodada 27").length).toBeGreaterThan(0);
    expect(screen.getByText("Aberto")).toBeTruthy();
    expect(screen.getByText("Ranking 26")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Melhores da Rodada 26" })).toBeTruthy();
    expect(screen.getByText("Ainda não há pontuações disponíveis.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Estatísticas da rodada 26" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ver mais" })).toBeNull();
    const headings = Array.from(container.querySelectorAll("h2")).map(node => node.textContent);
    expect(headings).not.toContain("Ligas disponíveis para jogar");
    expect(headings).not.toContain("Ligas em andamento");
    expect(screen.getByRole("region", { name: "Acompanhe os jogos" }).compareDocumentPosition(screen.getByRole("region", { name: "Mago do Point Fantasy" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("mostra quatro insights da R28, indicadores e link na mesma aba", () => {
    render(<MagoDashboardCard data={magoRodada28} />);
    const card = screen.getByRole("region", { name: "Mago do Point Fantasy" });
    expect(within(card).getByText("Inteligência para sua rodada")).toBeTruthy();
    expect(within(card).getByText("Rodada 28")).toBeTruthy();
    const carousel = within(card).getByRole("region", { name: "Insights do Mago" });
    expect(carousel.getAttribute("aria-roledescription")).toBe("carrossel");
    expect(carousel.querySelectorAll("article")).toHaveLength(4);
    expect(within(card).getAllByText("37,79%")).toHaveLength(2);
    expect(card.textContent).toContain("São Paulo37,31%");
    expect(card.textContent).toContain("Corinthians40,10%");
    expect(card.textContent).toContain("Atlético-MG1,77 xG");
    expect(card.textContent).toContain("Athletico-PR1,75 xG");
    expect(card.textContent).toContain("5 dos principais nomes");
    expect(card.textContent).toContain("14,90% SG");
    expect(card.textContent).toContain("1,89 xG projetado");
    const dots = within(card).getAllByRole("button", { name: /Ir para/ });
    expect(dots).toHaveLength(4);
    expect(dots[0].getAttribute("aria-current")).toBe("true");
    Object.defineProperty(carousel, "clientWidth", { value: 300, configurable: true });
    carousel.scrollTo = vi.fn();
    fireEvent.click(dots[1]);
    expect(carousel.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 300 }));
    expect(dots[1].getAttribute("aria-current")).toBe("true");
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(carousel.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 600 }));
    const link = within(card).getByRole("link", { name: "Ver análise completa" });
    expect(link.getAttribute("href")).toBe("/mago");
    expect(link.getAttribute("target")).toBeNull();
  });

  it("não força a rodada ou status do backend para coincidir com a análise", () => {
    setup(28, false);
    render(<CartolaDashboard />);
    expect(screen.getAllByText("Rodada 28").length).toBeGreaterThan(0);
    expect(screen.getByText("Fechado")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Melhores da Rodada 28" })).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Mago do Point Fantasy" })).getByText("Rodada 28")).toBeTruthy();
  });

  it("aceita outra análise sem números fixados no componente", () => {
    render(<MagoDashboardCard data={{ ...magoRodada28, rodada: 29, topSg: [{ ...magoRodada28.topSg[0], clube: "Outro clube", sg: 50, xgAdversario: null }], ataques: [{ clube: "Outro ataque", xg: 2.5 }] }} />);
    expect(screen.getByText("Rodada 29")).toBeTruthy();
    expect(screen.getAllByText("Outro clube")).toHaveLength(2);
    expect(screen.getAllByText("Outro ataque")).toHaveLength(2);
    expect(screen.getAllByText("2,50 xG")).toHaveLength(2);
    expect(screen.queryByText(/37,79/)).toBeNull();
  });

  it("preserva carregamento e erro", () => {
    const state = setup();
    vi.mocked(useCartolaDashboard).mockReturnValue({ ...state, dashboard: null, loading: true });
    const view = render(<CartolaDashboard />);
    expect(screen.getByRole("status")).toBeTruthy();
    vi.mocked(useCartolaDashboard).mockReturnValue({ ...state, dashboard: null, error: "offline" });
    view.rerender(<CartolaDashboard />);
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  });
});
