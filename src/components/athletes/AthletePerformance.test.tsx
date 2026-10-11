import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AthletePerformance, ScoreChart } from "./AthletePerformance";
import { AthleteDetails } from "./AthleteRanking";
import { fetchAthleteHistory } from "@/services/athleteHistoryService";
import type { AthleteHistory, HistoryRound } from "@/types/athlete-history";
vi.mock("@/services/athleteHistoryService", () => ({ fetchAthleteHistory: vi.fn() }));
const entry = (rodada: number, pontuacao: number | null): HistoryRound => ({ rodada, pontuacao, parcial: true, statusRodada: "PARCIAL", situacao: pontuacao === null ? "SEM_DADOS" : "PONTUADO", motivo: null, entrouEmCampo: null, scouts: null, consolidadoEm: null, estadoSnapshot: "VALIDO" });
const history: AthleteHistory = {
  atletaId: 1, temporada: 2026, rodadaReferencia: 30,
  historico: [entry(26, 2), entry(27, null), entry(28, 0), entry(29, -2), entry(30, 3)],
  indicadores: { mediaGeralDisponivel: null, mediaUltimas5: null, maior: null, menor: null, desvioPadrao: null, amostraGeral: 0, amostraUltimas5: 0 },
  cobertura: { rodadasSemSnapshot: [], rodadasSemPontuacaoDoAtleta: [27], rodadasParciais: [26, 27, 28, 29, 30], rodadasComSnapshotInvalidoOuIncompleto: [], temporadaComSnapshotsCompletosAteReferencia: false },
};
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(fetchAthleteHistory).mockResolvedValue(history); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("consulta somente ao abrir Desempenho e preserva a rodada atual", async () => {
  render(<AthleteDetails athleteId="1" season={2026} round={30} athlete={{ apelido: "Teste", pontuacao: 4, posicao_id: 4 }} clubs={{}} matches={[]} onClose={() => {}} />);
  expect(fetchAthleteHistory).not.toHaveBeenCalled();
  expect(screen.getByText("4,00")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Desempenho" }));
  await screen.findByText("Pontuações parciais podem mudar. Indicadores disponíveis após a consolidação.");
  expect(fetchAthleteHistory).toHaveBeenCalledWith("1", 2026, 30, 5);
  expect(screen.getAllByText("—")).toHaveLength(5);
  expect(screen.getByText("Sem pontuação disponível")).toBeTruthy();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "10" } });
  await waitFor(() => expect(fetchAthleteHistory).toHaveBeenLastCalledWith("1", 2026, 30, 10));
});
it("preserva zero e negativos e não conecta lacunas", () => {
  const { container } = render(<ScoreChart rounds={history.historico} />);
  expect(container.querySelectorAll("[data-score-segment]")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Rodada 28: 0,00 pts • Parcial" })).toBeTruthy();
  fireEvent.focus(screen.getByRole("button", { name: "Rodada 29: -2,00 pts • Parcial" }));
  fireEvent.mouseLeave(screen.getByRole("button", { name: "Rodada 29: -2,00 pts • Parcial" }));
  expect(screen.getByRole("status").textContent).toContain("-2,00 pts • Parcial");
  expect(container.querySelectorAll("circle")).toHaveLength(4);
});
it("descarta resposta atrasada de outro atleta", async () => {
  let resolve!: (data: AthleteHistory) => void;
  vi.mocked(fetchAthleteHistory).mockReturnValueOnce(new Promise(r => { resolve = r; }));
  const view = render(<AthletePerformance athleteId="1" season={2026} round={30} />);
  view.rerender(<AthletePerformance athleteId="2" season={2026} round={30} />);
  await screen.findByText("Sem pontuação disponível");
  await act(async () => resolve({ ...history, historico: [entry(30, 99)] }));
  expect(screen.queryByText(/99,00/)).toBeNull();
});
it("trata erro com nova tentativa e histórico vazio", async () => {
  vi.mocked(fetchAthleteHistory).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ ...history, historico: [] });
  render(<AthletePerformance athleteId="1" season={2026} round={30} />);
  fireEvent.click(await screen.findByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Nenhuma pontuação disponível neste histórico.")).toBeTruthy();
});
it("usa indicadores consolidados do backend sem recalcular", async () => {
  vi.mocked(fetchAthleteHistory).mockResolvedValue({ ...history, indicadores: { amostraGeral: 3, amostraUltimas5: 2, mediaGeralDisponivel: 12.34, mediaUltimas5: 9.87, maior: { pontuacao: 23.45, rodada: 20 }, menor: { pontuacao: -3.21, rodada: 21 }, desvioPadrao: 4.56 } });
  render(<AthletePerformance athleteId="1" season={2026} round={30} />);
  expect(await screen.findByText("12,34")).toBeTruthy();
  expect(screen.getByText("9,87")).toBeTruthy();
  expect(screen.getByText("23,45")).toBeTruthy();
  expect(screen.getByText("-3,21")).toBeTruthy();
  expect(screen.getByText("4,56")).toBeTruthy();
});
