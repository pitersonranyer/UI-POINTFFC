import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminRoundActions } from "./AdminRoundActions";
import { buscarDashboardComMetadados } from "@/services/cartola/cartola.service";
import { reprocessPartials, simulateReconsolidation, type RoundSimulation } from "@/services/adminRoundService";
import { ApiError } from "@/services/apiClient";

let role: string | null = "PLATFORM_ADMIN";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: role ? { tipoUsuario: role } : null, isLoading: false }) }));
vi.mock("@/config/cartola", () => ({ CARTOLA_ADMIN_SEASONS: [2026, 2025] }));
vi.mock("@/services/cartola/cartola.service", () => ({ buscarDashboardComMetadados: vi.fn() }));
vi.mock("@/services/adminRoundService", async (original) => ({ ...await original<object>(), reprocessPartials: vi.fn(), simulateReconsolidation: vi.fn() }));
const simulation: RoundSimulation = {
  temporada: 2026, rodada: 26, statusRodada: "CONSOLIDADA", totalTimes: 10, consistentes: 4,
  divergentes: 1, pendentesDeDados: 3, naoVerificaveis: 2, timesSemSnapshot: 5,
  diagnosticoDefinitivo: false, processamentoEmAndamento: true,
  times: [{ timeId: 7, nomeTime: "Time divergente", classificacao: "DIVERGENTE",
    pontuacaoPersistida: 20, pontuacaoRecalculada: 25, diferenca: 5, jogadoresParticiparam: 11,
    capitaoEfetivoId: 99, motivo: "Pontuacao divergente",
    substituicoesPersistidas: [{ atletaSaiuId: 10, atletaEntrouId: 11, posicaoId: 3, reservaLuxo: false, herdouCapitao: true }],
    substituicoesEsperadas: [{ atletaSaiuId: 10, atletaEntrouId: 12, posicaoId: 3, reservaLuxo: true, herdouCapitao: false }],
  }],
};
const result = { temporada: 2026, rodada: 26, status: "PARCIAL" as const, timesProcessados: 100, timesComErro: 2, substituicoesAlteradas: 3, duracaoMs: 1843, processadoEm: "2026-09-07T15:00:00Z" };
beforeEach(() => {
  role = "PLATFORM_ADMIN";
  refresh.mockClear();
  vi.mocked(buscarDashboardComMetadados).mockReset().mockResolvedValue({ data: { rodada: 26, mercado: { temporada: 2026 } }, stale: false } as Awaited<ReturnType<typeof buscarDashboardComMetadados>>);
  vi.mocked(reprocessPartials).mockReset().mockResolvedValue(result);
  vi.mocked(simulateReconsolidation).mockReset().mockResolvedValue(simulation);
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
  [401, "technical", "Sua sessão expirou. Entre novamente para executar esta operação."],
  [404, "technical", "A rodada selecionada não foi encontrada nesta temporada."],
  [409, "snapshot incompleto", "As escalações congeladas desta rodada estão indisponíveis ou incompletas."],
  [409, "Envelope persistido indisponivel ou invalido", "Os dados persistidos desta rodada estão indisponíveis ou inválidos."],
  [500, "stack trace privado", "Não foi possível reprocessar as parciais. Tente novamente."],
])("trata erro %s %s", async (status, technical, friendly) => {
  vi.mocked(reprocessPartials).mockRejectedValue(new ApiError(status, technical));
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Reprocessar parciais" }));
  expect((await screen.findByRole("alert")).textContent).toBe(friendly);
});
it.each([1, 38])("confirma e executa temporada configurada e rodada %s", async (round) => {
  render(<AdminRoundActions />);
  await waitFor(() => expect((screen.getByLabelText("Rodada") as HTMLSelectElement).value).toBe("26"));
  expect((screen.getByLabelText("Temporada") as HTMLSelectElement).value).toBe("2026");
  fireEvent.change(screen.getByLabelText("Temporada"), { target: { value: "2025" } });
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: String(round) } });
  vi.mocked(reprocessPartials).mockResolvedValue({ ...result, temporada: 2025, rodada: round });
  fireEvent.click(screen.getByRole("button", { name: "Reprocessar parciais" }));
  expect(screen.getByRole("dialog").textContent).toContain(`Rodada ${round} · Temporada 2025`);
  expect((screen.getByLabelText("Rodada") as HTMLSelectElement).disabled).toBe(true);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reprocessar parciais" }));
  await screen.findByRole("status");
  expect(reprocessPartials).toHaveBeenCalledWith(2025, round);
});
it.each(["unavailable", "invalid"])("mantém operações indisponíveis com dashboard %s", async (condition) => {
  if (condition === "unavailable") vi.mocked(buscarDashboardComMetadados).mockRejectedValue(new Error("offline"));
  else vi.mocked(buscarDashboardComMetadados).mockResolvedValue({ data: { rodada: 26, mercado: {} }, stale: false } as Awaited<ReturnType<typeof buscarDashboardComMetadados>>);
  render(<AdminRoundActions />);
  await screen.findByText(/Não foi possível identificar/);
  expect((screen.getByLabelText("Rodada") as HTMLSelectElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Reprocessar parciais" }) as HTMLButtonElement).disabled).toBe(true);
  expect(reprocessPartials).not.toHaveBeenCalled();
});
it.each([401, 403, 404, 409])("isola bloqueio de rodada e preserva acesso para %s", async (status) => {
  vi.mocked(reprocessPartials).mockRejectedValue(new ApiError(status, "Rodada consolidada"));
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Reprocessar parciais" }));
  await screen.findByRole("alert");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "1" } });
  expect((screen.getByRole("button", { name: "Reprocessar parciais" }) as HTMLButtonElement).disabled).toBe(status === 401 || status === 403);
  expect(screen.queryByRole("alert") !== null).toBe(status === 401 || status === 403);
});
it("limpa resultado ao trocar seleção e preserva escolha após refresh", async () => {
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Reprocessar parciais" }));
  await screen.findByRole("status");
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "38" } });
  expect(screen.queryByRole("status")).toBeNull();
  expect((screen.getByLabelText("Rodada") as HTMLSelectElement).value).toBe("38");
  expect(buscarDashboardComMetadados).toHaveBeenCalledTimes(1);
});
it("não exibe resposta divergente e libera outra seleção", async () => {
  vi.mocked(reprocessPartials).mockResolvedValue({ ...result, temporada: 2025 });
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Reprocessar parciais" }));
  await screen.findByRole("alert");
  expect(screen.queryByRole("status")).toBeNull();
  expect(refresh).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "1" } });
  expect(screen.queryByRole("alert")).toBeNull();
});
it("ignora resposta atrasada após desmontagem", async () => {
  let resolve!: (value: typeof result) => void;
  vi.mocked(reprocessPartials).mockReturnValue(new Promise((done) => { resolve = done; }));
  const dialog = await openDialog();
  fireEvent.click(dialog.getByRole("button", { name: "Reprocessar parciais" }));
  cleanup();
  resolve(result);
  await waitFor(() => expect(refresh).not.toHaveBeenCalled());
});
it("desabilita quando a rodada disponível está desatualizada", async () => {
  vi.mocked(buscarDashboardComMetadados).mockResolvedValue({ data: { rodada: 26 }, stale: true } as Awaited<ReturnType<typeof buscarDashboardComMetadados>>);
  render(<AdminRoundActions />);
  await screen.findByText(/Não foi possível identificar/);
  expect((screen.getByRole("button", { name: "Reprocessar parciais" }) as HTMLButtonElement).disabled).toBe(true);
});

async function readySimulation() {
  render(<AdminRoundActions />);
  await waitFor(() => expect((screen.getByRole("button", { name: "Simular reconsolidação" }) as HTMLButtonElement).disabled).toBe(false));
}
it("simula seleção manual e mostra resumo, avisos e detalhes reais", async () => {
  await readySimulation();
  fireEvent.change(screen.getByLabelText("Temporada"), { target: { value: "2025" } });
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "38" } });
  expect(simulateReconsolidation).not.toHaveBeenCalled();
  vi.mocked(simulateReconsolidation).mockResolvedValue({ ...simulation, temporada: 2025, rodada: 38 });
  fireEvent.click(screen.getByRole("button", { name: "Simular reconsolidação" }));
  const status = await screen.findByRole("status");
  expect(simulateReconsolidation).toHaveBeenCalledWith(2025, 38);
  for (const [label, value] of [["Total de times", "10"], ["Consistentes", "4"], ["Divergentes", "1"], ["Pendentes de dados", "3"], ["Não verificáveis", "2"], ["Times sem snapshot", "5"]]) {
    expect(within(status).getByText(label).nextElementSibling?.textContent).toBe(value);
  }
  expect(status.textContent).toContain("não conclusivo");
  expect(status.textContent).toContain("processamento concorrente");
  expect(status.textContent).toContain("Time divergente");
  const summary = screen.getByText("Ver substituições e capitão");
  fireEvent.click(summary);
  expect(summary.closest("details")?.open).toBe(true);
  expect(status.textContent).toContain("Atleta 10 → Atleta 11");
  expect(status.textContent).toContain("Atleta 10 → Atleta 12");
  expect(status.textContent).toContain("Capitão efetivo (ID): 99");
  expect(reprocessPartials).not.toHaveBeenCalled();
  expect(refresh).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "1" } });
  expect(screen.queryByRole("status")).toBeNull();
});
it("preserva null e distingue zero e lista vazia", async () => {
  vi.mocked(simulateReconsolidation).mockResolvedValue({ ...simulation, diagnosticoDefinitivo: true, processamentoEmAndamento: false,
    times: [{ ...simulation.times[0], nomeTime: null, pontuacaoPersistida: null, pontuacaoRecalculada: 0,
      diferenca: null, jogadoresParticiparam: null, capitaoEfetivoId: null, motivo: null,
      substituicoesPersistidas: [], substituicoesEsperadas: null }] });
  await readySimulation();
  fireEvent.click(screen.getByRole("button", { name: "Simular reconsolidação" }));
  await screen.findByRole("status");
  expect(screen.getByText("Pontuação atual").nextElementSibling?.textContent).toBe("Não disponível");
  expect(screen.getByText("Pontuação recalculada").nextElementSibling?.textContent).toBe("0");
  expect(screen.getByText("Nenhuma substituição.")).toBeTruthy();
  expect(screen.queryByText(/não conclusivo/)).toBeNull();
});
it("ignora resposta antiga e impede duplicidade sem bloquear troca de seleção", async () => {
  let resolve!: (value: RoundSimulation) => void;
  vi.mocked(simulateReconsolidation).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  await readySimulation();
  const button = screen.getByRole("button", { name: "Simular reconsolidação" });
  fireEvent.click(button); fireEvent.click(button);
  expect(simulateReconsolidation).toHaveBeenCalledTimes(1);
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "1" } });
  vi.mocked(simulateReconsolidation).mockResolvedValue({ ...simulation, rodada: 1, times: [] });
  fireEvent.click(screen.getByRole("button", { name: "Simular reconsolidação" }));
  await screen.findByText("Nenhum time divergente neste diagnóstico.");
  resolve(simulation);
  await waitFor(() => expect(screen.queryByText(/Time divergente · Time/)).toBeNull());
  expect(screen.getAllByText("Rodada 1 · Temporada 2026")).toHaveLength(2);
});
it("rejeita simulação de outra rodada", async () => {
  vi.mocked(simulateReconsolidation).mockResolvedValue({ ...simulation, rodada: 27 });
  await readySimulation();
  fireEvent.click(screen.getByRole("button", { name: "Simular reconsolidação" }));
  expect((await screen.findByRole("alert")).textContent).toContain("outra temporada ou rodada");
  expect(screen.queryByRole("status")).toBeNull();
});
it.each([400, 401, 403, 404, 409, 500])("trata erro de simulação %s sem expor mensagem técnica", async (code) => {
  vi.mocked(simulateReconsolidation).mockRejectedValue(new ApiError(code, "private stack"));
  await readySimulation();
  fireEvent.click(screen.getByRole("button", { name: "Simular reconsolidação" }));
  await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(0));
  expect(screen.getAllByRole("alert").every((item) => !item.textContent?.includes("private stack"))).toBe(true);
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "1" } });
  expect((screen.getByRole("button", { name: "Simular reconsolidação" }) as HTMLButtonElement).disabled).toBe(code === 401 || code === 403);
});
