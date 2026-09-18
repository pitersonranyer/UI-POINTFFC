import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminGuard } from "./AdminGuard";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCompetitions } from "./AdminCompetitions";
import { adminService, type AdminCompetition, type AdminCompetitionPage } from "@/services/adminService";

const state = vi.hoisted(() => ({ user: null as null | { tipoUsuario: string; status: string; nome: string }, loading: false, replace: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: state.user, isLoading: state.loading }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: state.replace }) }));
vi.mock("@/services/adminService", async (original) => { const actual = await original<object>(); return { ...actual, adminService: { listCompetitions: vi.fn(), getCompetition: vi.fn(), getLeagues: vi.fn(), getLeagueModalities: vi.fn(), createCompetition: vi.fn(), updateCompetition: vi.fn() } }; });

const competition: AdminCompetition = { id: 1, ligaModalidadeId: 10, nome: "Copa POINT", slug: "copa-point", descricao: null, tipoAcesso: "FREE", valorInscricao: 0, tipoTaxaPlataforma: null, valorTaxaPlataforma: null, rodadaInicio: 30, rodadaFim: 30, dataInicio: null, dataFim: null, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: null, limiteParticipantes: null, status: "INSCRICOES_ABERTAS", visivelApp: true, destaque: false, atualizadoEm: "2026-09-18T12:00:00.000Z", liga: { id: 1, nome: "POINT FFC", slug: "point-ffc" }, modalidade: { id: 1, codigo: "RODADA", nome: "Rodada" } };
const page = (change: Partial<AdminCompetitionPage> = {}): AdminCompetitionPage => ({ itens: [competition], paginacao: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 }, ...change });
beforeEach(() => { vi.stubGlobal("React", React); state.user = { tipoUsuario: "PLATFORM_ADMIN", status: "ATIVO", nome: "Admin POINT" }; state.loading = false; state.replace.mockReset(); vi.mocked(adminService.listCompetitions).mockReset().mockResolvedValue(page()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("permite PLATFORM_ADMIN ativo e bloqueia usuário comum sem renderizar conteúdo", async () => {
  const { rerender } = render(<AdminGuard><span>Conteúdo administrativo</span></AdminGuard>);
  expect(screen.getByText("Conteúdo administrativo")).toBeTruthy();
  state.user = { tipoUsuario: "PLAYER", status: "ATIVO", nome: "Jogador" };
  rerender(<AdminGuard><span>Conteúdo administrativo</span></AdminGuard>);
  expect(screen.queryByText("Conteúdo administrativo")).toBeNull();
  expect(screen.getByRole("alert")).toBeTruthy();
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/dashboard"));
});

it("dashboard usa registros reais da API, sem métricas inventadas, e humaniza status", async () => {
  render(<AdminDashboard />);
  expect(screen.getByText("Carregando competições...")).toBeTruthy();
  expect(await screen.findByText("Copa POINT")).toBeTruthy();
  expect(screen.getByText("Inscrições abertas")).toBeTruthy();
  expect(screen.queryByText("INSCRICOES_ABERTAS")).toBeNull();
  expect(screen.queryByText(/2\.847|1\.236|12 competições/)).toBeNull();
  expect(adminService.listCompetitions).toHaveBeenCalledWith({ pagina: 1, limite: 5 });
});

it("listagem cobre vazio, erro e nova tentativa", async () => {
  vi.mocked(adminService.listCompetitions).mockResolvedValueOnce(page({ itens: [] }));
  const { unmount } = render(<AdminCompetitions />);
  expect(await screen.findByText("Nenhuma competição encontrada.")).toBeTruthy();
  unmount();
  vi.mocked(adminService.listCompetitions).mockRejectedValueOnce(new Error("detalhe técnico")).mockResolvedValueOnce(page());
  render(<AdminCompetitions />);
  expect(await screen.findByText("Não foi possível carregar as competições.")).toBeTruthy();
  expect(screen.queryByText("detalhe técnico")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Copa POINT")).toBeTruthy();
});

it("aplica busca e status e navega pela paginação real", async () => {
  vi.mocked(adminService.listCompetitions).mockResolvedValue(page({ paginacao: { pagina: 1, limite: 20, total: 25, totalPaginas: 2 } }));
  render(<AdminCompetitions />);
  await screen.findByText("Copa POINT");
  fireEvent.change(screen.getByLabelText("Buscar competições"), { target: { value: "final" } });
  fireEvent.change(screen.getByLabelText("Filtrar por status"), { target: { value: "ENCERRADA" } });
  fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
  await waitFor(() => expect(adminService.listCompetitions).toHaveBeenLastCalledWith({ pagina: 1, limite: 20, busca: "final", status: "ENCERRADA" }));
  fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
  await waitFor(() => expect(adminService.listCompetitions).toHaveBeenLastCalledWith({ pagina: 2, limite: 20, busca: "final", status: "ENCERRADA" }));
});

it("estrutura a competição como lista responsiva sem tabela com overflow", async () => {
  render(<AdminCompetitions />);
  const item = await screen.findByRole("listitem");
  expect(item.textContent).toContain("POINT FFC");
  expect(item.textContent).toContain("Rodada 30");
  expect(item.textContent).toContain("Visível");
  expect(document.querySelector("table")).toBeNull();
  expect(screen.getByRole("link", { name: "Nova competição" }).getAttribute("href")).toBe("/admin/competicoes/nova");
  expect(screen.getByRole("link", { name: "Editar" }).getAttribute("href")).toBe("/admin/competicoes/editar?id=1");
});
