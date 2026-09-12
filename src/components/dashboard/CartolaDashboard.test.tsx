import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
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

  it("apresenta o resumo centralizado e o link na mesma aba", () => {
    render(<MagoDashboardCard data={magoRodada27} />);
    const card = screen.getByRole("region", { name: "Mago do Point Fantasy" });
    expect(within(card).getByText("Flamengo é o SG nº 1 do Mago")).toBeTruthy();
    expect(within(card).getAllByText("42,66%")).toHaveLength(2);
    expect(card.textContent).toContain("Corinthians: 0,84 xG projetado");
    expect(card.textContent).toContain("Mirassol — 1,82 xG");
    expect(within(card).getAllByRole("listitem").map(node => node.textContent)).toEqual(["Flamengo42,66%", "Bahia41,59%", "Palmeiras36,86%"]);
    const link = within(card).getByRole("link", { name: "Ver análise completa" });
    expect(link.getAttribute("href")).toBe("/mago");
    expect(link.getAttribute("target")).toBeNull();
    expect(card.textContent).not.toContain("2 x 0");
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
    expect(screen.getByText("Outro clube é o SG nº 1 do Mago")).toBeTruthy();
    expect(screen.getByText("Outro ataque — 2,50 xG")).toBeTruthy();
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
