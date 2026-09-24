import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FeaturedLeagueCard } from "./FeaturedLeagueCard";
import { pointLeagueService, type CompetitionCard } from "@/services/pointLeagueService";

vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { competitions: vi.fn() } }));
const competition: CompetitionCard = { id: 1, nome: "Competição", slug: "competicao", descricao: null,
  tipoAcesso: "PAGO", valorInscricao: 10, rodadaInicio: 29, rodadaFim: 29, inicioInscricao: null,
  fimInscricao: null, limiteTimesUsuario: 30, limiteParticipantes: 100, status: "INSCRICOES_ABERTAS",
  quantidadeInscritos: 50, premiacaoEmDisputa: "500.00" };
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(pointLeagueService.competitions).mockReset().mockResolvedValue([]); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("mantem logo, identidade, rota e rodada recebida sem dados de competicao", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([competition]);
  const view = render(<FeaturedLeagueCard name="POINT FFC" round={29} />);
  const card = within(screen.getByRole("region", { name: "Liga em destaque" }));
  expect(await card.findByText("Competições abertas")).toBeTruthy();
  expect(card.getByRole("img", { name: "POINT FFC" }).getAttribute("src")).toBe("/brand/pointffc-logo.png");
  expect(card.getByText("Fantasy da rodada do Brasileirão")).toBeTruthy();
  expect(card.getByLabelText("Rodada 29").textContent).toBe("Rodada29");
  expect(card.getByRole("link", { name: "Ver liga" }).getAttribute("href")).toBe("/ligas/point-ffc");
  expect(card.queryByText(/R\$|Inscritos|Premiação|por time|30 times/i)).toBeNull();
  view.rerender(<FeaturedLeagueCard name="POINT FFC" round={30} />);
  expect(card.getByLabelText("Rodada 30")).toBeTruthy();
  expect(card.queryByLabelText("Rodada 29")).toBeNull();
});

it.each(["INSCRICOES_ENCERRADAS", "EM_ANDAMENTO"])("interpreta %s como andamento pela API", async status => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, status }]);
  render(<FeaturedLeagueCard name="POINT FFC" round={29} />);
  expect(await screen.findByText("Competições em andamento")).toBeTruthy();
  expect(screen.queryByText("Competições abertas")).toBeNull();
});

it("prioriza inscricoes abertas quando existem competicoes em ambos os estados", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, status: "INSCRICOES_ENCERRADAS" }, competition]);
  render(<FeaturedLeagueCard name="POINT FFC" round={29} />);
  expect(await screen.findByText("Competições abertas")).toBeTruthy();
});

it.each([
  { status: "ENCERRADA" },
  { fimInscricao: "2020-01-01T00:00:00Z" },
  { inicioInscricao: "2099-01-01T00:00:00Z" },
])("nao inventa inscricoes abertas para %j", async changes => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([{ ...competition, ...changes }]);
  render(<FeaturedLeagueCard name="POINT FFC" round={29} />);
  expect(await screen.findByText("Competições da rodada 29")).toBeTruthy();
  expect(screen.queryByText("Competições abertas")).toBeNull();
});

it("preserva informacao da rodada quando a API nao esta disponivel", async () => {
  vi.mocked(pointLeagueService.competitions).mockRejectedValue(new Error("offline"));
  render(<FeaturedLeagueCard name="POINT FFC" round={31} />);
  expect(await screen.findByText("Competições da rodada 31")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver liga" })).toBeTruthy();
});
