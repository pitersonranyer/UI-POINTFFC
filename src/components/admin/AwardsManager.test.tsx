import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AwardsManager } from "./AwardsManager";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminAward, type AdminCompetition } from "@/services/adminService";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("id=7") }));
vi.mock("@/services/adminService", async (original) => { const actual = await original<object>(); return { ...actual, adminService: { getCompetition: vi.fn(), getCompetitionAwards: vi.fn(), updateCompetitionAwards: vi.fn() } }; });
const competition: AdminCompetition = { id: 7, ligaModalidadeId: 10, nome: "POINT FFC - Rodada 27", slug: "point-27", descricao: null, tipoAcesso: "FREE", valorInscricao: 0, tipoTaxaPlataforma: null, valorTaxaPlataforma: null, rodadaInicio: 27, rodadaFim: 27, dataInicio: null, dataFim: null, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: null, limiteParticipantes: 20, status: "RASCUNHO", visivelApp: true, destaque: false, atualizadoEm: "2026-09-18T00:00:00Z", liga: { id: 1, nome: "POINT FFC", slug: "point-ffc" }, modalidade: { id: 1, codigo: "RODADA", nome: "Rodada" } };
const award = (change: Partial<AdminAward>): AdminAward => ({ id: 1, competicaoLigaId: 7, posicaoInicio: 1, posicaoFim: 1, tipoPremiacao: "VALOR_FIXO", valor: 350, percentual: null, ordem: 0, criadoEm: "2026-09-18T00:00:00Z", atualizadoEm: "2026-09-18T00:00:00Z", ...change });
const awards = [award({}), award({ id: 2, posicaoInicio: 2, posicaoFim: 2, tipoPremiacao: "PERCENTUAL", valor: null, percentual: 20, ordem: 1 })];
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(adminService.getCompetition).mockReset().mockResolvedValue(competition); vi.mocked(adminService.getCompetitionAwards).mockReset().mockResolvedValue(awards); vi.mocked(adminService.updateCompetitionAwards).mockReset().mockResolvedValue(awards); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("carrega competição e grade real, humaniza tipos e calcula totais separados", async () => {
  render(<AwardsManager />); expect(screen.getByText("Carregando premiações...")).toBeTruthy();
  expect(await screen.findByText("POINT FFC - Rodada 27")).toBeTruthy();
  expect(adminService.getCompetition).toHaveBeenCalledWith(7); expect(adminService.getCompetitionAwards).toHaveBeenCalledWith(7);
  expect(screen.getByText("R$ 350,00")).toBeTruthy(); expect(screen.getByText("20%")).toBeTruthy();
  expect(screen.getAllByRole("option", { name: "Valor fixo" })).toHaveLength(2); expect(screen.getAllByRole("option", { name: "Percentual" })).toHaveLength(2);
  expect(screen.queryByText("VALOR_FIXO")).toBeNull();
  expect(screen.getByRole("link", { name: /Voltar para competição/ }).getAttribute("href")).toBe("/admin/competicoes/editar?id=7");
});

it("adiciona próxima posição, remove localmente e mantém backend intacto até salvar", async () => {
  render(<AwardsManager />); await screen.findByText("POINT FFC - Rodada 27");
  fireEvent.click(screen.getByRole("button", { name: "Adicionar premiação" }));
  expect((screen.getByLabelText("Posição inicial 3") as HTMLInputElement).value).toBe("3");
  const removes = screen.getAllByRole("button", { name: /Remover premiação/ }); fireEvent.click(removes[2]);
  expect(screen.queryByLabelText("Posição inicial 3")).toBeNull(); expect(adminService.updateCompetitionAwards).not.toHaveBeenCalled();
});

it("valida sobreposição, percentual individual e soma percentual", async () => {
  render(<AwardsManager />); await screen.findByText("POINT FFC - Rodada 27");
  fireEvent.change(screen.getByLabelText("Posição inicial 2"), { target: { value: "1" } }); fireEvent.click(screen.getByRole("button", { name: "Salvar premiações" }));
  expect(screen.getByText(/não podem se sobrepor/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Posição inicial 2"), { target: { value: "2" } }); fireEvent.change(screen.getByLabelText("Percentual 2"), { target: { value: "101" } }); fireEvent.click(screen.getByRole("button", { name: "Salvar premiações" }));
  expect(screen.getByText(/maior que zero e menor ou igual a 100/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Percentual 2"), { target: { value: "60" } }); fireEvent.click(screen.getByRole("button", { name: "Adicionar premiação" }));
  fireEvent.change(screen.getByLabelText("Tipo da premiação 3"), { target: { value: "PERCENTUAL" } }); fireEvent.change(screen.getByLabelText("Percentual 3"), { target: { value: "50" } }); fireEvent.click(screen.getByRole("button", { name: "Salvar premiações" }));
  expect(screen.getByText(/soma das premiações percentuais/i)).toBeTruthy();
});

it("envia grade completa ordenada em um único PUT usando tipoPremiacao", async () => {
  render(<AwardsManager />); await screen.findByText("POINT FFC - Rodada 27"); fireEvent.click(screen.getByRole("button", { name: "Salvar premiações" }));
  await waitFor(() => expect(adminService.updateCompetitionAwards).toHaveBeenCalledTimes(1));
  expect(adminService.updateCompetitionAwards).toHaveBeenCalledWith(7, [{ posicaoInicio: 1, posicaoFim: 1, tipoPremiacao: "VALOR_FIXO", valor: 350, percentual: null, ordem: 0 }, { posicaoInicio: 2, posicaoFim: 2, tipoPremiacao: "PERCENTUAL", valor: null, percentual: 20, ordem: 1 }]);
  expect(screen.getByText("Premiações salvas com sucesso.")).toBeTruthy();
});

it("exibe grade vazia editável", async () => {
  vi.mocked(adminService.getCompetitionAwards).mockResolvedValue([]); render(<AwardsManager />);
  expect(await screen.findByText("Nenhuma premiação configurada.")).toBeTruthy(); expect(screen.getByRole("button", { name: "Adicionar premiação" })).toBeTruthy();
});

it("status congelado mantém leitura e remove ações de alteração", async () => {
  vi.mocked(adminService.getCompetition).mockResolvedValue({ ...competition, status: "EM_ANDAMENTO" }); render(<AwardsManager />);
  expect(await screen.findByText(/fase de configuração foi encerrada/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Adicionar premiação" })).toBeNull(); expect(screen.queryByRole("button", { name: "Salvar premiações" })).toBeNull(); expect(screen.queryByRole("button", { name: /Remover/ })).toBeNull();
});

it("humaniza conflito 409", async () => {
  vi.mocked(adminService.updateCompetitionAwards).mockRejectedValue(new ApiError(409, "detalhe interno")); render(<AwardsManager />); await screen.findByText("POINT FFC - Rodada 27");
  fireEvent.click(screen.getByRole("button", { name: "Salvar premiações" })); expect(await screen.findByText("A premiação não pode mais ser alterada no estado atual da competição.")).toBeTruthy();
});
