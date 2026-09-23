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

const historical: AdminCompetition = { ...competition, status: "EM_ANDAMENTO", dataInicio: "2026-09-20T12:00:00.000Z", dataFim: "2026-09-25T12:00:00.000Z", inicioInscricao: "2026-09-18T12:00:00.000Z", fimInscricao: "2026-09-21T12:00:00.000Z" };
async function prepareHistorical() {
  nav.id = "7";
  vi.mocked(adminService.getCompetition).mockResolvedValue(historical);
  vi.mocked(adminService.updateCompetition).mockResolvedValue({ ...historical, status: "ENCERRADA" });
  render(<CompetitionForm mode="edit" />);
  await screen.findByDisplayValue("Copa Atual");
}
const changeField = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const saveEdit = () => fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

it("permite encerrar competição com datas históricas inconsistentes enviando somente status", async () => {
  await prepareHistorical();
  changeField("Status", "ENCERRADA");
  saveEdit();
  await waitFor(() => expect(vi.mocked(adminService.updateCompetition).mock.calls).toEqual([[7, { status: "ENCERRADA" }]]));
  expect(await screen.findByText("Alterações salvas com sucesso.")).toBeTruthy();
});

it.each([
  ["Data de início", "2026-09-20T13:00"],
  ["Data de fim", "2026-09-26T12:00"],
  ["Início das inscrições", "2026-09-17T12:00"],
  [/^Fim das inscrições/, "2026-09-22T12:00"],
])("revalida todas as datas ao alterar %s na edição", async (label, value) => {
  await prepareHistorical();
  changeField(label, value as string);
  saveEdit();
  expect(screen.getByRole("alert").textContent).toBe("As inscrições devem terminar antes do início da competição.");
  expect(adminService.updateCompetition).not.toHaveBeenCalled();
});

it("permite corrigir as datas e envia apenas a data alterada", async () => {
  await prepareHistorical();
  const value = "2026-09-19T12:00";
  vi.mocked(adminService.updateCompetition).mockResolvedValue({ ...historical, fimInscricao: new Date(value).toISOString() });
  changeField(/^Fim das inscrições/, value);
  saveEdit();
  await waitFor(() => expect(vi.mocked(adminService.updateCompetition).mock.calls).toEqual([[7, { fimInscricao: new Date(value).toISOString() }]]));
  expect(await screen.findByText("Alterações salvas com sucesso.")).toBeTruthy();
});

it("data alterada e revertida não entra no PATCH nem bloqueia status", async () => {
  await prepareHistorical();
  changeField("Data de fim", "2026-09-26T12:00");
  changeField("Data de fim", "2026-09-25T12:00");
  changeField("Status", "ENCERRADA");
  saveEdit();
  await waitFor(() => expect(vi.mocked(adminService.updateCompetition).mock.calls).toEqual([[7, { status: "ENCERRADA" }]]));
});

it.each(["create", "edit"] as const)("preserva as três regras temporais no modo %s", async (mode) => {
  if (mode === "create") await prepareCreate(); else await prepareHistorical();
  const submit = () => fireEvent.click(screen.getByRole("button", { name: mode === "create" ? "Criar competição" : "Salvar alterações" }));
  changeField("Data de início", "2026-09-20T12:00");
  changeField("Data de fim", "2026-09-19T12:00");
  submit();
  expect(screen.getByRole("alert").textContent).toBe("A data final não pode ser anterior à data inicial.");
  changeField("Data de fim", "2026-09-26T12:00");
  changeField("Início das inscrições", "2026-09-18T12:00");
  changeField(/^Fim das inscrições/, "2026-09-17T12:00");
  submit();
  expect(screen.getByRole("alert").textContent).toBe("O fim das inscrições não pode ser anterior ao início.");
  changeField(/^Fim das inscrições/, "2026-09-21T12:00");
  submit();
  expect(screen.getByRole("alert").textContent).toBe("As inscrições devem terminar antes do início da competição.");
  expect(adminService.createCompetition).not.toHaveBeenCalled();
  expect(adminService.updateCompetition).not.toHaveBeenCalled();
});

it.each([
  ["Nome", "", "Preencha nome, slug, liga e modalidade."],
  [/^Slug/, "INVALIDO", "Use apenas letras minúsculas, números e hífens no slug."],
  ["Valor da inscrição", "0,00", "Informe um valor de inscrição maior que zero para competições pagas."],
  ["Valor da taxa", "-1,00", "Informe um valor válido para a taxa da plataforma."],
  [/^Limite de participantes/, "-1", "Rodadas e limites devem ser números inteiros positivos."],
  ["Rodada final", "29", "A rodada final não pode ser anterior à rodada inicial."],
])("edição sem mudança temporal mantém validação de %s", async (label, value, message) => {
  await prepareHistorical();
  changeField("Status", "ENCERRADA");
  changeField(label, value as string);
  saveEdit();
  expect(screen.getByRole("alert").textContent).toBe(message);
  expect(adminService.updateCompetition).not.toHaveBeenCalled();
});

it("edição sem mudança temporal mantém limite de taxa percentual", async () => {
  await prepareHistorical();
  changeField("Taxa da plataforma", "PERCENTUAL");
  changeField("Valor da taxa", "101,00");
  saveEdit();
  expect(screen.getByRole("alert").textContent).toBe("A taxa percentual deve estar entre 0 e 100.");
  expect(adminService.updateCompetition).not.toHaveBeenCalled();
});

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
