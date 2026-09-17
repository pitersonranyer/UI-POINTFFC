import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { pointLeagueService, type PointLeague } from "@/services/pointLeagueService";
import { LeaguesPage } from "./LeaguesPage";

vi.mock("@/services/pointLeagueService", () => ({ pointLeagueService: { league: vi.fn() } }));
const league: PointLeague = { id: 1, nome: "POINT FFC", slug: "point-ffc", descricao: "Descrição da API", imagemUrl: null, modalidades: [{ codigo: "RODADA", nome: "Rodada" }, { codigo: "MENSAL", nome: "Mensal" }] };
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(pointLeagueService.league).mockReset().mockResolvedValue(league); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("apresenta somente a liga real, suas modalidades e o CTA correto", async () => {
  render(<LeaguesPage />); expect(screen.getByRole("status", { name: "Carregando ligas" })).toBeTruthy();
  expect(await screen.findByRole("heading", { name: "POINT FFC" })).toBeTruthy(); expect(pointLeagueService.league).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Rodada")).toBeTruthy(); expect(screen.getByText("Mensal")).toBeTruthy();
  expect(screen.getByRole("link", { name: /ver competições/i }).getAttribute("href")).toBe("/ligas/point-ffc");
  for (const fake of ["Liga do Barão", "Liga dos Patrões", "Liga da Galera", "Liga Só Craques"]) expect(screen.queryByText(fake)).toBeNull();
});
it("não apresenta dados que pertencem a uma competição", async () => {
  render(<LeaguesPage />); await screen.findByRole("heading", { name: "POINT FFC" });
  for (const value of [/Rodada 27/i, /inscritos/i, /times por usuário/i, /valor da inscrição/i, /grátis/i, /pago/i, /inscrições abertas/i, /premiação garantida/i]) expect(screen.queryByText(value)).toBeNull();
});
it("não inventa modalidades ausentes nem usa mocks como fallback", async () => {
  vi.mocked(pointLeagueService.league).mockResolvedValue({ ...league, modalidades: [] }); render(<LeaguesPage />);
  await screen.findByRole("heading", { name: "POINT FFC" }); expect(screen.queryByLabelText("Modalidades disponíveis")).toBeNull(); expect(screen.queryByText("Rodada")).toBeNull(); expect(screen.queryByText("Liga do Barão")).toBeNull();
});
it("mostra erro e permite tentar novamente sem fallback mockado", async () => {
  vi.mocked(pointLeagueService.league).mockRejectedValueOnce(new Error("API offline")); render(<LeaguesPage />);
  expect((await screen.findByRole("alert")).textContent).toContain("API offline"); expect(screen.queryByText("Liga do Barão")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" })); await waitFor(() => expect(pointLeagueService.league).toHaveBeenCalledTimes(2)); expect(await screen.findByRole("heading", { name: "POINT FFC" })).toBeTruthy();
});
it("trata liga invisível ou indisponível", async () => {
  vi.mocked(pointLeagueService.league).mockRejectedValue(new ApiError(404, "Não encontrada")); render(<LeaguesPage />);
  expect(await screen.findByRole("heading", { name: "Liga indisponível" })).toBeTruthy(); expect(screen.queryByRole("alert")).toBeNull();
});
