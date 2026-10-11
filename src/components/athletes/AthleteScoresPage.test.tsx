import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AthleteScoresPage } from "./AthleteScoresPage";
import { useCartolaDashboard } from "@/hooks/useCartolaDashboard";
import type { CartolaScoredAthletesResponse } from "@/types/cartola";

vi.mock("@/hooks/useCartolaDashboard", () => ({ useCartolaDashboard: vi.fn() }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <a {...props}>{children}</a> }));

const club = { id: 10, nome: "Clube do Norte", abreviacao: "NOR", escudos: { "45x45": "https://example.test/nor.png" } };
const athleteData: CartolaScoredAthletesResponse = {
  total_atletas: 3,
  clubes: { "10": club },
  atletas: {
    "1": { apelido: "Atacante Ágil", pontuacao: 15.75, posicao_id: 5, clube_id: 10, entrou_em_campo: true, scout: { G: 2, A: 1, SG: 1, CA: 1, CV: 1, DS: 2 } },
    "2": { apelido: "Meia Central", pontuacao: 9.2, posicao_id: 4, clube_id: 10, scout: {} },
    "3": { apelido: "Goleiro Seguro", pontuacao: 4.1, posicao_id: 1, clube_id: 10, entrou_em_campo: false },
  },
};
const dashboard = { rodada: 8, mercadoAberto: false, bolaRolando: true, partidas: [], clubes: { "10": club } };
const updateMock = vi.fn();
function renderPage(data: CartolaScoredAthletesResponse = athleteData) {
  vi.mocked(useCartolaDashboard).mockReturnValue({
    dashboard, loading: false, error: null, atualizar: updateMock, athletes: data,
    athletesLoading: false, athletesError: null, stale: false, statisticsMatches: [],
  } as unknown as ReturnType<typeof useCartolaDashboard>);
  return render(<AthleteScoresPage />);
}

beforeEach(() => { document.body.style.overflow = ""; });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AthleteScoresPage", () => {
  it("ordena pela pontuação e preserva a precisão decimal exibida", () => {
    renderPage();
    const rows = screen.getAllByRole("button", { name: /Ver detalhes de/ });
    expect(rows[0]).toHaveAccessibleName(/Atacante Ágil.*15,75 pontos/);
    expect(rows[1]).toHaveAccessibleName(/Meia Central.*9,20 pontos/);
  });

  it("mostra scouts textuais prioritários e resume os que excedem o limite", () => {
    renderPage();
    const row = screen.getByRole("button", { name: /Atacante Ágil/ });
    expect(within(row).getByText("2 G")).toBeInTheDocument();
    expect(within(row).getByText("1 A")).toBeInTheDocument();
    expect(within(row).getByText("SG")).toBeInTheDocument();
    expect(within(row).getByText("+3")).toBeInTheDocument();
    expect(row.textContent).not.toMatch(/[⚽👟🟨🟥]/u);
  });

  it("busca nome e clube e filtra por posição sem sair da paginação local", () => {
    renderPage();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar atleta ou clube" }), { target: { value: "norte" } });
    expect(screen.getAllByRole("button", { name: /Ver detalhes de/ })).toHaveLength(3);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar atleta ou clube" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "MEI" }));
    expect(screen.getAllByRole("button", { name: /Ver detalhes de/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Meia Central/ })).toBeInTheDocument();
  });

  it("abre, fecha e apresenta todos os scouts no painel de detalhes", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Ver detalhes de Atacante Ágil/ }));
    const dialog = screen.getByRole("dialog", { name: "Atacante Ágil" });
    expect(within(dialog).getByText("15,75")).toBeInTheDocument();
    expect(within(dialog).getByText("2", { selector: "li strong" })).toBeInTheDocument();
    expect(within(dialog).getByText("Cartões vermelhos")).toBeInTheDocument();
    expect(within(dialog).getByText("Defesas")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Fechar detalhes" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("usa estado vazio verdadeiro quando scouts e informações opcionais não existem", () => {
    renderPage({ atletas: { "8": { apelido: "Atleta sem dados opcionais", pontuacao: 0, posicao_id: 99 } }, clubes: {} });
    fireEvent.click(screen.getByRole("button", { name: /Atleta sem dados opcionais/ }));
    expect(screen.getByText("Nenhum scout disponível para este atleta nesta rodada.")).toBeInTheDocument();
    expect(screen.getByText("Clube não informado")).toBeInTheDocument();
  });

  it("mantém o atleta selecionado atualizado quando a pontuação recebida muda", () => {
    const view = renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Atacante Ágil/ }));
    const updated = structuredClone(athleteData);
    updated.atletas["1"].pontuacao = 21.3;
    vi.mocked(useCartolaDashboard).mockReturnValue({
      dashboard, loading: false, error: null, atualizar: updateMock, athletes: updated,
      athletesLoading: false, athletesError: null, stale: false, statisticsMatches: [],
    } as unknown as ReturnType<typeof useCartolaDashboard>);
    view.rerender(<AthleteScoresPage />);
    expect(screen.getByRole("dialog").textContent).toContain("21,30");
  });

  it("preserva a paginação de 30 atletas por página", () => {
    const atletas = Object.fromEntries(Array.from({ length: 31 }, (_, index) => [String(index + 1), {
      apelido: `Atleta ${String(index + 1).padStart(2, "0")}`, pontuacao: 100 - index, posicao_id: 5, clube_id: 10,
    }]));
    renderPage({ atletas, clubes: { "10": club }, total_atletas: 31 });
    expect(screen.getAllByRole("button", { name: /Ver detalhes de/ })).toHaveLength(30);
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getAllByRole("button", { name: /Ver detalhes de/ })).toHaveLength(1);
  });
});
