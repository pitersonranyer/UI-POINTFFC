import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CompetitionForm } from "./CompetitionForm";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetition } from "@/services/adminService";

const nav = vi.hoisted(() => ({ id: null as string | null, replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: nav.replace }), useSearchParams: () => new URLSearchParams(nav.id ? `id=${nav.id}` : "") }));
vi.mock("@/services/adminService", async (original) => { const actual = await original<object>(); return { ...actual, adminService: { getLeagues: vi.fn(), getLeagueModalities: vi.fn(), getCompetition: vi.fn(), createCompetition: vi.fn(), updateCompetition: vi.fn(), duplicateCompetition: vi.fn() } }; });

const leagues = [{ id: 1, nome: "POINT FFC", slug: "point-ffc", tipo: "OFICIAL", status: "ATIVA", visivelApp: true, imagemUrl: null }];
const modalities = [{ ligaModalidadeId: 10, modalidadeId: 1, codigo: "RODADA", nome: "Rodada", ativa: true, ordem: 1 }, { ligaModalidadeId: 11, modalidadeId: 2, codigo: "CAMPEONATO", nome: "Campeonato antigo", ativa: false, ordem: 2 }];
const competition: AdminCompetition = { id: 7, ligaModalidadeId: 11, nome: "Copa Atual", slug: "copa-atual", descricao: "Descrição", tipoAcesso: "PAGO", valorInscricao: 25, tipoTaxaPlataforma: "VALOR_FIXO", valorTaxaPlataforma: 2.5, rodadaInicio: 30, rodadaFim: 31, dataInicio: null, dataFim: null, inicioInscricao: null, fimInscricao: null, limiteTimesUsuario: 2, limiteParticipantes: null, status: "RASCUNHO", visivelApp: false, destaque: false, atualizadoEm: "2026-09-18T12:00:00.000Z", liga: { id: 1, nome: "POINT FFC", slug: "point-ffc" }, modalidade: { id: 2, codigo: "CAMPEONATO", nome: "Campeonato antigo" } };

beforeEach(() => { vi.stubGlobal("React", React); nav.id = null; nav.replace.mockReset(); vi.mocked(adminService.getLeagues).mockReset().mockResolvedValue(leagues); vi.mocked(adminService.getLeagueModalities).mockReset().mockResolvedValue(modalities); vi.mocked(adminService.getCompetition).mockReset().mockResolvedValue(competition); vi.mocked(adminService.createCompetition).mockReset().mockResolvedValue({ ...competition, id: 8 }); vi.mocked(adminService.updateCompetition).mockReset().mockResolvedValue(competition); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function prepareCreate() {
  render(<CompetitionForm mode="create" />);
  await screen.findByRole("heading", { name: "Nova competição" });
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Copa São Paulo" } });
  fireEvent.change(screen.getByLabelText("Liga"), { target: { value: "1" } });
  await waitFor(() => expect(adminService.getLeagueModalities).toHaveBeenCalledWith(1));
  fireEvent.change(screen.getByLabelText("Modalidade"), { target: { value: "10" } });
}

it("carrega ligas, busca modalidades por liga e não oferece vínculo inativo na criação", async () => {
  await prepareCreate();
  expect(adminService.getLeagues).toHaveBeenCalled();
  expect(screen.getByRole("option", { name: "Rodada" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: /Campeonato antigo/ })).toBeNull();
});

it("sugere slug automaticamente e preserva edição manual", async () => {
  await prepareCreate();
  expect((screen.getByLabelText(/^Slug/) as HTMLInputElement).value).toBe("copa-sao-paulo");
  fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: "slug-personalizado" } });
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Outro nome" } });
  expect((screen.getByLabelText(/^Slug/) as HTMLInputElement).value).toBe("slug-personalizado");
});

it("FREE força zero, sem taxa e limites vazios enviam null e navega para edição", async () => {
  await prepareCreate();
  expect((screen.getByLabelText("Valor da inscrição") as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Criar competição" }));
  await waitFor(() => expect(adminService.createCompetition).toHaveBeenCalled());
  const sent = vi.mocked(adminService.createCompetition).mock.calls[0][0];
  expect(sent).toMatchObject({ ligaModalidadeId: 10, tipoAcesso: "FREE", valorInscricao: 0, tipoTaxaPlataforma: null, valorTaxaPlataforma: null, limiteTimesUsuario: null, limiteParticipantes: null });
  expect(nav.replace).toHaveBeenCalledWith("/admin/competicoes/editar?id=8");
});

it("PAGO exige valor positivo e envia taxa percentual no enum real", async () => {
  await prepareCreate();
  fireEvent.change(screen.getByLabelText("Tipo de acesso"), { target: { value: "PAGO" } });
  fireEvent.change(screen.getByLabelText("Valor da inscrição"), { target: { value: "0,00" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar competição" }));
  expect(screen.getByText(/maior que zero/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Valor da inscrição"), { target: { value: "35,50" } });
  fireEvent.change(screen.getByLabelText("Taxa da plataforma"), { target: { value: "PERCENTUAL" } });
  fireEvent.change(screen.getByLabelText("Valor da taxa"), { target: { value: "12,5" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar competição" }));
  await waitFor(() => expect(adminService.createCompetition).toHaveBeenCalledWith(expect.objectContaining({ tipoAcesso: "PAGO", valorInscricao: 35.5, tipoTaxaPlataforma: "PERCENTUAL", valorTaxaPlataforma: 12.5 })));
});

it("envia taxa fixa usando VALOR_FIXO", async () => {
  await prepareCreate();
  fireEvent.change(screen.getByLabelText("Taxa da plataforma"), { target: { value: "VALOR_FIXO" } });
  fireEvent.change(screen.getByLabelText("Valor da taxa"), { target: { value: "2,75" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar competição" }));
  await waitFor(() => expect(adminService.createCompetition).toHaveBeenCalledWith(expect.objectContaining({ tipoTaxaPlataforma: "VALOR_FIXO", valorTaxaPlataforma: 2.75 })));
});

it("edição carrega dados reais, preserva modalidade atual inativa e envia somente alteração", async () => {
  nav.id = "7"; vi.mocked(adminService.updateCompetition).mockResolvedValue({ ...competition, nome: "Copa Editada" });
  render(<CompetitionForm mode="edit" />);
  expect(await screen.findByDisplayValue("Copa Atual")).toBeTruthy();
  const inactive = screen.getByRole("option", { name: "Campeonato antigo (inativa)" }) as HTMLOptionElement;
  expect(inactive.disabled).toBe(false);
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Copa Editada" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() => expect(adminService.updateCompetition).toHaveBeenCalledWith(7, { nome: "Copa Editada" }));
  expect(await screen.findByText("Alterações salvas com sucesso.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Configurar premiações" }).getAttribute("href")).toBe("/admin/competicoes/premiacoes?id=7");
  expect(screen.getByRole("button", { name: "Duplicar" })).toBeTruthy();
});

it("humaniza conflito por inscrições e slug duplicado", async () => {
  await prepareCreate();
  vi.mocked(adminService.createCompetition).mockRejectedValueOnce(new ApiError(409, "Slug de competicao ja cadastrado."));
  fireEvent.click(screen.getByRole("button", { name: "Criar competição" }));
  expect(await screen.findByText("Já existe uma competição utilizando este slug.")).toBeTruthy();
  cleanup(); nav.id = "7"; vi.mocked(adminService.updateCompetition).mockRejectedValueOnce(new ApiError(409, "Competicao com inscricoes ativas"));
  render(<CompetitionForm mode="edit" />); await screen.findByDisplayValue("Copa Atual");
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Mudança" } }); fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  expect(await screen.findByText(/possui inscrições ou está em um estado incompatível/)).toBeTruthy();
});
