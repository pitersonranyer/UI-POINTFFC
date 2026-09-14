import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PointLeaguePage } from "./PointLeaguePage";
import { pointLeagueService, type Competition, type PointLeague } from "@/services/pointLeagueService";

vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { league: vi.fn(), competitions: vi.fn() } }));
const league: PointLeague = { id: 1, nome: "POINT FFC", slug: "point-ffc", descricao: "Liga oficial", imagemUrl: null, modalidades: [{ codigo: "RODADA", nome: "Rodada" }] };
const competition: Competition = { id: 42, nome: "Disputa 42", slug: "disputa-42", descricao: null, tipoAcesso: "FREE", valorInscricao: 0, rodadaInicio: 27, rodadaFim: 27, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: 2, limiteParticipantes: null, status: "ABERTA" };
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(pointLeagueService.league).mockReset().mockResolvedValue(league); vi.mocked(pointLeagueService.competitions).mockReset().mockResolvedValue([competition]); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("carrega competições de Rodada e abre a competição escolhida", async () => {
  render(<PointLeaguePage />);
  expect(screen.getByRole("status").textContent).toContain("Carregando");
  expect(await screen.findByText("Disputa 42")).toBeTruthy();
  expect(pointLeagueService.competitions).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: /Ver competição/ }).getAttribute("href")).toBe("/competicoes?id=42");
  expect(screen.getByText(/Mensal · Em breve/).getAttribute("aria-disabled")).toBe("true");
});
it("mostra lista vazia sem criar competições fictícias", async () => {
  vi.mocked(pointLeagueService.competitions).mockResolvedValue([]);
  render(<PointLeaguePage />);
  expect(await screen.findByText("Nenhuma competição da rodada disponível.")).toBeTruthy();
});
it("mostra erro da API", async () => {
  vi.mocked(pointLeagueService.league).mockRejectedValue(new Error("Liga offline"));
  render(<PointLeaguePage />);
  expect((await screen.findByRole("alert")).textContent).toContain("Liga offline");
});
