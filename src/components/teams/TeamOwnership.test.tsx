import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MyTeamsManager } from "./MyTeamsManager";
import { teamService } from "@/services/teamService";
import type { AddTeamResult, ImportResult } from "@/types/team";
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }));
vi.mock("./PartialScore", () => ({ PartialScore: () => null }));
vi.mock("@/services/partialScoreService", () => ({ partialScoreService: { buscarParciais: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/services/teamService", () => ({ teamService: {
  buscarMeusTimes: vi.fn(), buscarTimesPorNome: vi.fn(), adicionarMeuTime: vi.fn(),
  buscarTimesPorIds: vi.fn(), importarMeusTimes: vi.fn(),
} }));
const team = { timeId: 123, nome: "Time Teste", nomeCartoleiro: "Pessoa", escudoUrl: "" };
const imported: ImportResult = { adicionados: 1, jaExistentes: 0, naoEncontrados: [], tentarNovamente: [], naoProcessados: 0 };
const singular = "Para receber qualquer premiação, será necessário comprovar a titularidade do time cadastrado. Caso a titularidade não seja comprovada, a premiação não será paga.";
const plural = "Para receber qualquer premiação, será necessário comprovar a titularidade dos times cadastrados. Caso a titularidade não seja comprovada, a premiação não será paga.";
const declarations = [
  "Declaro que sou o titular deste time e estou ciente da necessidade de comprovação para receber premiações.",
  "Declaro que sou o titular dos times informados e estou ciente da necessidade de comprovação para receber premiações.",
];
beforeEach(() => {
  vi.mocked(teamService.buscarMeusTimes).mockReset().mockResolvedValue([]);
  vi.mocked(teamService.buscarTimesPorNome).mockReset().mockResolvedValue([team]);
  vi.mocked(teamService.adicionarMeuTime).mockReset().mockResolvedValue({ time: team });
  vi.mocked(teamService.buscarTimesPorIds).mockReset().mockResolvedValue({ times: [team], naoEncontrados: [], tentarNovamente: [] });
  vi.mocked(teamService.importarMeusTimes).mockReset().mockResolvedValue(imported);
});
afterEach(cleanup);
async function open(action = "Adicionar time") {
  render(<MyTeamsManager />);
  await screen.findByText("Você ainda não adicionou times.");
  fireEvent.click(screen.getByRole("button", { name: action }));
  return within(screen.getByRole("dialog"));
}
async function selectTeam() {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Teste" } });
  fireEvent.click(await screen.findByRole("radio", { name: "Selecionar Time Teste" }));
}
async function preview() {
  fireEvent.change(screen.getByLabelText("IDs dos times"), { target: { value: "Favoritos=>123;abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar times" }));
  await screen.findByText("1 time encontrado");
}
it.each([["Adicionar time", "Adicionar time", singular, declarations[0]], ["Importar", "Importar times", plural, declarations[1]]])("abre %s com aviso exato e aceite limpo", async (action, confirm, warning, declaration) => {
  const dialog = await open(action);
  expect(dialog.getByText("ATENÇÃO")).toBeTruthy();
  expect(dialog.getByText(warning)).toBeTruthy();
  expect((dialog.getByRole("checkbox", { name: declaration }) as HTMLInputElement).checked).toBe(false);
  const button = dialog.getByRole("button", { name: confirm });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button); fireEvent.keyDown(button, { key: "Enter" });
  expect(teamService.adicionarMeuTime).not.toHaveBeenCalled();
  expect(teamService.importarMeusTimes).not.toHaveBeenCalled();
  fireEvent.click(dialog.getByText(declaration));
  expect((dialog.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  expect((button as HTMLButtonElement).disabled).toBe(true);
});
it.each(["Adicionar time", "Importar"])("cancelar %s não envia e reabrir limpa aceite", async (action) => {
  let dialog = await open(action);
  fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.click(dialog.getByText("Cancelar"));
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: action }));
  dialog = within(screen.getByRole("dialog"));
  expect((dialog.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: action }));
  expect((within(screen.getByRole("dialog")).getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  expect(teamService.adicionarMeuTime).not.toHaveBeenCalled();
  expect(teamService.importarMeusTimes).not.toHaveBeenCalled();
});
it("adiciona somente após seleção e aceite; impede envio duplicado", async () => {
  let resolve!: (value: AddTeamResult) => void;
  vi.mocked(teamService.adicionarMeuTime).mockReturnValue(new Promise((done) => { resolve = done; }));
  const dialog = await open();
  await selectTeam();
  const confirm = dialog.getByRole("button", { name: "Adicionar time" });
  expect((confirm as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(dialog.getByRole("checkbox"));
  expect((confirm as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(confirm); fireEvent.click(confirm);
  expect(teamService.adicionarMeuTime).toHaveBeenCalledTimes(1);
  expect(teamService.adicionarMeuTime).toHaveBeenCalledWith(team);
  expect((dialog.getByText("Cancelar") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByRole("dialog")).toBeTruthy();
  await act(async () => resolve({ time: team }));
  expect(screen.getByText("1 time")).toBeTruthy();
  expect((dialog.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  expect((dialog.getByRole("radio") as HTMLInputElement).disabled).toBe(true);
});
it("nova pesquisa invalida seleção anterior", async () => {
  const dialog = await open(); await selectTeam(); fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Outro" } });
  expect((dialog.getByRole("button", { name: "Adicionar time" }) as HTMLButtonElement).disabled).toBe(true);
});
it("importação preserva busca/prévia, exige aceite e bloqueia duplicidade", async () => {
  let resolve!: (value: ImportResult) => void;
  vi.mocked(teamService.importarMeusTimes).mockReturnValue(new Promise((done) => { resolve = done; }));
  const dialog = await open("Importar");
  fireEvent.change(screen.getByLabelText("IDs dos times"), { target: { value: "abc" } });
  expect((dialog.getByText("Buscar times") as HTMLButtonElement).disabled).toBe(true);
  await preview();
  expect(teamService.buscarTimesPorIds).toHaveBeenCalledWith("123");
  const confirm = dialog.getByRole("button", { name: "Importar times" });
  expect((confirm as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.click(confirm); fireEvent.click(confirm);
  expect(teamService.importarMeusTimes).toHaveBeenCalledTimes(1);
  expect(teamService.importarMeusTimes).toHaveBeenCalledWith([team]);
  await act(async () => resolve(imported));
  expect(screen.getByText("Importação concluída")).toBeTruthy();
  expect(screen.getByText("✓ 1 times adicionados")).toBeTruthy();
});
it("prévia sem times válidos mantém confirmação bloqueada e preserva avisos", async () => {
  vi.mocked(teamService.buscarTimesPorIds).mockResolvedValue({ times: [], naoEncontrados: [123], tentarNovamente: [456] });
  const dialog = await open("Importar");
  fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.change(screen.getByLabelText("IDs dos times"), { target: { value: "123;456" } });
  fireEvent.click(dialog.getByText("Buscar times"));
  await screen.findByText("0 times encontrados");
  expect(screen.getByText("Não encontrados")).toBeTruthy();
  expect(screen.getByText("Alguns times não puderam ser processados agora.")).toBeTruthy();
  expect((dialog.getByRole("button", { name: "Importar times" }) as HTMLButtonElement).disabled).toBe(true);
});
it("falha ao adicionar permite retry sem perder validações", async () => {
  vi.mocked(teamService.adicionarMeuTime).mockRejectedValueOnce(new Error("Falha ao adicionar"));
  const dialog = await open(); await selectTeam(); fireEvent.click(dialog.getByRole("checkbox"));
  fireEvent.click(dialog.getByRole("button", { name: "Adicionar time" }));
  await screen.findByRole("alert");
  fireEvent.click(dialog.getByRole("checkbox"));
  expect((dialog.getByRole("button", { name: "Adicionar time" }) as HTMLButtonElement).disabled).toBe(true);
  expect(teamService.adicionarMeuTime).toHaveBeenCalledTimes(1);
});
