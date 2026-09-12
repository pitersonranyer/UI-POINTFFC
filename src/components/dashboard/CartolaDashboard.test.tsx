import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartolaDashboard } from "./CartolaDashboard";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import { MagoDashboardCard } from "./MagoDashboardCard";
import { magoRodada27 } from "@/data/mago/rodada27";

vi.mock("@/hooks/useCartolaDashboard");
vi.mock("@/components/matches/FutebolMatches", () => ({ FutebolMatches: () => <section>Partidas da API</section> }));
vi.mock("./GeneralRanking", () => ({ GeneralRanking: ({ round }: { round: number }) => <section>Ranking {round}</section> }));
beforeEach(() => vi.stubGlobal("React", React));
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
  it("mostra R27, preserva os blocos existentes e usa a rodada anterior enquanto o mercado está aberto", () => {
    setup();
    const { container } = render(<CartolaDashboard />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getAllByText("Rodada 27").length).toBeGreaterThan(0);
    expect(screen.getByText("Aberto")).toBeTruthy();
    expect(screen.getByText("Ranking 26")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Melhores da Rodada 26" })).toBeTruthy();
    expect(screen.getByText("Ainda não há pontuações disponíveis.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Estatísticas da rodada 26" })).toBeTruthy();
    const headings = Array.from(container.querySelectorAll("h2")).map(node => node.textContent);
    expect(headings.indexOf("Mago do Point Fantasy")).toBeLessThan(headings.indexOf("Ligas disponíveis para jogar"));
    expect(screen.getByText("Partidas da API").compareDocumentPosition(screen.getByRole("region", { name: "Mago do Point Fantasy" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("mostra quatro insights da R27, indicadores e link na mesma aba", () => {
    render(<MagoDashboardCard data={magoRodada27} />);
    const card = screen.getByRole("region", { name: "Mago do Point Fantasy" });
    expect(within(card).getByText("Inteligência para sua rodada")).toBeTruthy();
    expect(within(card).getByText("Rodada 27")).toBeTruthy();
    const carousel = within(card).getByRole("region", { name: "Insights do Mago" });
    expect(carousel.getAttribute("aria-roledescription")).toBe("carrossel");
    expect(carousel.querySelectorAll("article")).toHaveLength(4);
    expect(within(card).getAllByText("42,66%")).toHaveLength(2);
    expect(card.textContent).toContain("Bahia41,59%");
    expect(card.textContent).toContain("Palmeiras36,86%");
    expect(card.textContent).toContain("Botafogo1,76 xG");
    expect(card.textContent).toContain("Bahia1,73 xG");
    expect(card.textContent).toContain("4 dos principais nomes");
    expect(card.textContent).toContain("17,03% SG");
    expect(card.textContent).toContain("1,76 xG projetado");
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
    expect(within(screen.getByRole("region", { name: "Mago do Point Fantasy" })).getByText("Rodada 27")).toBeTruthy();
  });

  it("aceita outra análise sem números fixados no componente", () => {
    render(<MagoDashboardCard data={{ ...magoRodada27, rodada: 28, topSg: [{ ...magoRodada27.topSg[0], clube: "Outro clube", sg: 50, xgAdversario: null }], ataques: [{ clube: "Outro ataque", xg: 2.5 }] }} />);
    expect(screen.getByText("Rodada 28")).toBeTruthy();
    expect(screen.getAllByText("Outro clube")).toHaveLength(2);
    expect(screen.getAllByText("Outro ataque")).toHaveLength(2);
    expect(screen.getAllByText("2,50 xG")).toHaveLength(2);
    expect(screen.queryByText(/42,66/)).toBeNull();
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
