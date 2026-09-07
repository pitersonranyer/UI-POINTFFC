import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminRoundActions } from "./AdminRoundActions";
import { buscarDashboardComMetadados } from "@/services/cartola/cartola.service";
import { reprocessPartials } from "@/services/adminRoundService";
import { ApiError } from "@/services/apiClient";

let role: string | null = "PLATFORM_ADMIN";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: role ? { tipoUsuario: role } : null, isLoading: false }) }));
vi.mock("@/services/cartola/cartola.service", () => ({ buscarDashboardComMetadados: vi.fn() }));
vi.mock("@/services/adminRoundService", async (original) => ({ ...await original<object>(), reprocessPartials: vi.fn() }));
const result = { temporada: 2026, rodada: 26, status: "PARCIAL" as const, timesProcessados: 100, timesComErro: 2, substituicoesAlteradas: 3, duracaoMs: 1843, processadoEm: "2026-09-07T15:00:00Z" };
beforeEach(() => {
  role = "PLATFORM_ADMIN";
  vi.mocked(buscarDashboardComMetadados).mockReset().mockResolvedValue({ data: { rodada: 26 }, stale: false } as Awaited<ReturnType<typeof buscarDashboardComMetadados>>);
  vi.mocked(reprocessPartials).mockReset().mockResolvedValue(result);
});
afterEach(cleanup);
async function openDialog() {
  render(<AdminRoundActions />);
  await waitFor(() => expect((screen.getByRole("button", { name: "Reprocessar parciais" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Reprocessar parciais" }));
  return within(screen.getByRole("dialog"));
}
it.each([null, "PLAYER", "ORGANIZER"])("oculta ação e não consulta para %s", (value) => {
  role = value; render(<AdminRoundActions />);
  expect(screen.queryByRole("button")).toBeNull();
  expect(buscarDashboardComMetadados).not.toHaveBeenCalled();
});
it("permite cancelar sem POST", async () => {
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(reprocessPartials).not.toHaveBeenCalled();
});
it("bloqueia duplicidade e fechamento durante POST e apresenta resumo com falhas", async () => {
  let resolve!: (value: typeof result) => void;
  vi.mocked(reprocessPartials).mockReturnValue(new Promise((done) => { resolve = done; }));
  const dialog = await openDialog();
  const confirm = dialog.getByRole("button", { name: "Reprocessar parciais" });
  fireEvent.click(confirm); fireEvent.click(confirm);
  expect(reprocessPartials).toHaveBeenCalledTimes(1);
  expect(reprocessPartials).toHaveBeenCalledWith(2026, 26);
  expect((dialog.getByRole("button", { name: "Reprocessando parciais..." }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByRole("dialog")).toBeTruthy();
  resolve(result);
  await screen.findByText("Parciais reprocessadas com sucesso.");
  expect(screen.getByText(/concluído com falhas/)).toBeTruthy();
  expect(screen.getByText("1,843 s")).toBeTruthy();
  expect(refresh).toHaveBeenCalled();
});
it.each([
  [403, "technical", "Você não possui permissão para executar esta operação."],
  [409, "Rodada consolidada", "Esta rodada já está consolidada e não pode ter suas parciais reprocessadas."],
  [409, "Processamento em andamento", "Já existe um processamento em andamento para esta rodada."],
  [409, "snapshot incompleto", "Não foi possível reprocessar as parciais. Tente novamente."],
  [500, "stack trace privado", "Não foi possível reprocessar as parciais. Tente novamente."],
])("trata erro %s %s", async (status, technical, friendly) => {
  vi.mocked(reprocessPartials).mockRejectedValue(new ApiError(status, technical));
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Reprocessar parciais" }));
  expect((await screen.findByRole("alert")).textContent).toBe(friendly);
});
it("desabilita quando a rodada disponível está desatualizada", async () => {
  vi.mocked(buscarDashboardComMetadados).mockResolvedValue({ data: { rodada: 26 }, stale: true } as Awaited<ReturnType<typeof buscarDashboardComMetadados>>);
  render(<AdminRoundActions />);
  await screen.findByText(/Não foi possível identificar/);
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
});
