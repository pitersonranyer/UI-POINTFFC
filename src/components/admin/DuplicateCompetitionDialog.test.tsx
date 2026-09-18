import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetition } from "@/services/adminService";
import { DuplicateCompetitionDialog, duplicateSuggestion } from "./DuplicateCompetitionDialog";

const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
vi.mock("@/services/adminService", async (original) => { const actual = await original<object>(); return { ...actual, adminService: { duplicateCompetition: vi.fn() } }; });

const source: AdminCompetition = {
  id: 7, ligaModalidadeId: 10, nome: "POINT FFC - Rodada 27", slug: "point-ffc-rodada-27", descricao: "Disputa oficial", tipoAcesso: "PAGO", valorInscricao: 25,
  tipoTaxaPlataforma: "PERCENTUAL", valorTaxaPlataforma: 10, rodadaInicio: 27, rodadaFim: 27,
  inicioInscricao: "2026-09-10T12:00:00.000Z", fimInscricao: "2026-09-12T12:00:00.000Z", dataInicio: "2026-09-13T12:00:00.000Z", dataFim: "2026-09-14T12:00:00.000Z",
  limiteTimesUsuario: 2, limiteParticipantes: 100, status: "ENCERRADA", visivelApp: true, destaque: true, atualizadoEm: "2026-09-15T12:00:00.000Z",
  liga: { id: 1, nome: "POINT FFC", slug: "point-ffc" }, modalidade: { id: 1, codigo: "RODADA", nome: "Rodada" },
};
const created = { ...source, id: 8, nome: "POINT FFC - Rodada 28", slug: "point-ffc-rodada-28", rodadaInicio: 28, rodadaFim: 28, status: "RASCUNHO" as const };

beforeEach(() => { nav.replace.mockReset(); vi.mocked(adminService.duplicateCompetition).mockReset().mockResolvedValue(created); });
afterEach(cleanup);

function open() { render(<DuplicateCompetitionDialog source={source} close={vi.fn()} />); return within(screen.getByRole("dialog")); }
function fillDates(dialog: ReturnType<typeof within>) {
  fireEvent.change(dialog.getByLabelText("Início das inscrições"), { target: { value: "2026-09-20T09:00" } });
  fireEvent.change(dialog.getByLabelText("Fim das inscrições"), { target: { value: "2026-09-21T09:00" } });
  fireEvent.change(dialog.getByLabelText("Início da competição"), { target: { value: "2026-09-22T09:00" } });
  fireEvent.change(dialog.getByLabelText("Fim da competição"), { target: { value: "2026-09-23T09:00" } });
}

describe("duplicação de competição", () => {
  it("carrega a origem, sugere a próxima rodada e mantém nome e slug editáveis", () => {
    const dialog = open();
    expect(dialog.getByText(/Criar a partir de POINT FFC - Rodada 27/)).toBeTruthy();
    expect((dialog.getByLabelText("Nome") as HTMLInputElement).value).toBe("POINT FFC - Rodada 28");
    expect((dialog.getByLabelText("Slug") as HTMLInputElement).value).toBe("point-ffc-rodada-28");
    expect((dialog.getByLabelText("Rodada inicial") as HTMLInputElement).value).toBe("28");
    expect((dialog.getByLabelText("Rodada final") as HTMLInputElement).value).toBe("28");
    fireEvent.change(dialog.getByLabelText("Nome"), { target: { value: "Nome personalizado" } });
    fireEvent.change(dialog.getByLabelText("Slug"), { target: { value: "slug-personalizado" } });
    expect((dialog.getByLabelText("Nome") as HTMLInputElement).value).toBe("Nome personalizado");
    expect((dialog.getByLabelText("Slug") as HTMLInputElement).value).toBe("slug-personalizado");
  });

  it("não presume próxima rodada para competição com intervalo", () => {
    const suggestion = duplicateSuggestion({ ...source, nome: "Temporada 2026", slug: "temporada-2026", rodadaInicio: 20, rodadaFim: 27 });
    expect(suggestion).toMatchObject({ nome: "Temporada 2026", slug: "temporada-2026", rodadaInicio: "", rodadaFim: "" });
  });

  it("exige revisão das quatro datas e valida a ordem cronológica", () => {
    const dialog = open();
    for (const label of ["Início das inscrições", "Fim das inscrições", "Início da competição", "Fim da competição"]) expect((dialog.getByLabelText(label) as HTMLInputElement).value).toBe("");
    fireEvent.click(dialog.getByRole("button", { name: "DUPLICAR COMPETIÇÃO" }));
    expect(dialog.getByText("Preencha os oito campos da nova competição.")).toBeTruthy();
    fillDates(dialog);
    fireEvent.change(dialog.getByLabelText("Fim das inscrições"), { target: { value: "2026-09-23T09:00" } });
    fireEvent.click(dialog.getByRole("button", { name: "DUPLICAR COMPETIÇÃO" }));
    expect(dialog.getByText("O fim das inscrições deve ocorrer antes do início da competição.")).toBeTruthy();
  });

  it("envia exatamente oito campos, não copia premiações e redireciona ao novo ID", async () => {
    const dialog = open(); fillDates(dialog);
    fireEvent.click(dialog.getByRole("button", { name: "DUPLICAR COMPETIÇÃO" }));
    await waitFor(() => expect(adminService.duplicateCompetition).toHaveBeenCalledTimes(1));
    const [id, payload] = vi.mocked(adminService.duplicateCompetition).mock.calls[0];
    expect(id).toBe(7);
    expect(Object.keys(payload).sort()).toEqual(["dataFim", "dataInicio", "fimInscricao", "inicioInscricao", "nome", "rodadaFim", "rodadaInicio", "slug"].sort());
    expect(payload).toMatchObject({ nome: "POINT FFC - Rodada 28", slug: "point-ffc-rodada-28", rodadaInicio: 28, rodadaFim: 28 });
    expect(dialog.getByText("Inscrições, participantes, pontuações, ranking e premiações não serão copiados.")).toBeTruthy();
    expect(nav.replace).toHaveBeenCalledWith("/admin/competicoes/editar?id=8");
  });

  it("bloqueia duplo clique enquanto processa", async () => {
    let resolve!: (value: AdminCompetition) => void;
    vi.mocked(adminService.duplicateCompetition).mockReturnValue(new Promise((done) => { resolve = done; }));
    const dialog = open(); fillDates(dialog);
    const button = dialog.getByRole("button", { name: "DUPLICAR COMPETIÇÃO" });
    fireEvent.click(button); fireEvent.click(button);
    expect(adminService.duplicateCompetition).toHaveBeenCalledTimes(1);
    expect(dialog.getByRole("button", { name: "DUPLICANDO..." }).hasAttribute("disabled")).toBe(true);
    resolve(created);
    await waitFor(() => expect(nav.replace).toHaveBeenCalled());
  });

  it.each([[404, "Competição de origem não encontrada."], [409, "Já existe uma competição utilizando este slug."], [400, "Revise os dados da nova competição."], [403, "Acesso não autorizado."]] as const)("humaniza erro %s", async (status, message) => {
    vi.mocked(adminService.duplicateCompetition).mockRejectedValueOnce(new ApiError(status, "detalhe técnico"));
    const dialog = open(); fillDates(dialog); fireEvent.click(dialog.getByRole("button", { name: "DUPLICAR COMPETIÇÃO" }));
    expect(await dialog.findByText(message)).toBeTruthy();
    expect(dialog.queryByText("detalhe técnico")).toBeNull();
  });

  it("mantém os oito campos em estrutura responsiva sem tabela ou overflow estrutural", () => {
    const dialog = open();
    expect(dialog.getAllByRole("textbox")).toHaveLength(2);
    expect(dialog.getAllByRole("spinbutton")).toHaveLength(2);
    expect(screen.getByRole("dialog").querySelectorAll("input")).toHaveLength(8);
    expect(dialog.queryByRole("table")).toBeNull();
  });
});
