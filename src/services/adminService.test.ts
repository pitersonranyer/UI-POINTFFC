import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { adminService } from "./adminService";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
beforeEach(() => vi.mocked(apiFetch).mockReset());

it("consulta financeiro autenticado com filtros combinados e sem parâmetros opcionais ausentes", async () => {
  await adminService.getFinancialDashboard({ ligaId: 1, competicaoId: 2, rodada: 27, pagina: 3, limite: 20 });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/dashboard-financeiro?ligaId=1&competicaoId=2&rodada=27&pagina=3&limite=20", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
  await adminService.getFinancialDashboard({ ligaId: undefined, pagina: 1, limite: 20 });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/dashboard-financeiro?pagina=1&limite=20", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
  await adminService.getFinancialDashboard();
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/dashboard-financeiro", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
});

it("lista competições administrativas com autenticação e filtros reais", async () => {
  await adminService.listCompetitions({ pagina: 2, limite: 20, busca: "Copa POINT", status: "RASCUNHO" });
  expect(apiFetch).toHaveBeenCalledWith("/admin/competicoes?pagina=2&limite=20&busca=Copa+POINT&status=RASCUNHO", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
});

it("busca uma competição administrativa pelo ID", async () => {
  await adminService.getCompetition(7);
  expect(apiFetch).toHaveBeenCalledWith("/admin/competicoes/7", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
});

it("usa endpoints reais de ligas, modalidades, criação e edição", async () => {
  const payload = { ligaModalidadeId: 10, nome: "Copa", slug: "copa", descricao: null, tipoAcesso: "FREE" as const, valorInscricao: 0, tipoTaxaPlataforma: null, valorTaxaPlataforma: null, rodadaInicio: 30, rodadaFim: 30, dataInicio: null, dataFim: null, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: null, limiteParticipantes: null, status: "RASCUNHO" as const, visivelApp: false, destaque: false };
  await adminService.getLeagues(); await adminService.getLeagueModalities(3); await adminService.createCompetition(payload); await adminService.updateCompetition(9, { nome: "Nova Copa" });
  expect(apiFetch).toHaveBeenNthCalledWith(1, "/admin/ligas", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
  expect(apiFetch).toHaveBeenNthCalledWith(2, "/admin/ligas/3/modalidades", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
  expect(apiFetch).toHaveBeenNthCalledWith(3, "/admin/competicoes", { method: "POST", authenticated: true, preserveSessionOnForbidden: true, body: JSON.stringify(payload) });
  expect(apiFetch).toHaveBeenNthCalledWith(4, "/admin/competicoes/9", { method: "PATCH", authenticated: true, preserveSessionOnForbidden: true, body: '{"nome":"Nova Copa"}' });
});

it("consulta e substitui a grade completa de premiações em um único PUT", async () => {
  const awards = [{ posicaoInicio: 1, posicaoFim: 1, tipoPremiacao: "VALOR_FIXO" as const, valor: 350, percentual: null, ordem: 0 }];
  await adminService.getCompetitionAwards(7); await adminService.updateCompetitionAwards(7, awards);
  expect(apiFetch).toHaveBeenNthCalledWith(1, "/admin/competicoes/7/premiacoes", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
  expect(apiFetch).toHaveBeenNthCalledWith(2, "/admin/competicoes/7/premiacoes", { method: "PUT", authenticated: true, preserveSessionOnForbidden: true, body: JSON.stringify({ premiacoes: awards }) });
});

it("duplica competição com POST autenticado e somente os oito campos do contrato", async () => {
  const payload = { nome: "POINT FFC - Rodada 28", slug: "point-ffc-rodada-28", rodadaInicio: 28, rodadaFim: 28, inicioInscricao: "2026-09-20T12:00:00.000Z", fimInscricao: "2026-09-22T12:00:00.000Z", dataInicio: "2026-09-23T12:00:00.000Z", dataFim: "2026-09-24T12:00:00.000Z" };
  await adminService.duplicateCompetition(7, payload);
  expect(apiFetch).toHaveBeenCalledWith("/admin/competicoes/7/duplicar", { method: "POST", authenticated: true, preserveSessionOnForbidden: true, body: JSON.stringify(payload) });
});
