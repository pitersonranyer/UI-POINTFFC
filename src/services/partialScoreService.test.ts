import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/apiClient";
import { chunkTeamIds, partialScoreService } from "./partialScoreService";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedFetch = vi.mocked(apiFetch);

describe("partialScoreService", () => {
  beforeEach(() => { partialScoreService.clearCache(); mockedFetch.mockReset(); });

  it("agrupa varios times em uma unica chamada autenticada", async () => {
    mockedFetch.mockResolvedValue({ temporada: 2026, rodada: 25, parciais: [] });
    await partialScoreService.buscarParciais(2026, 25, [3, 1, 2]);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith("/parciais?temporada=2026&rodada=25&timeIds=3%2C1%2C2", { authenticated: true });
  });

  it("consulta a parcial atual do detalhe sem reutilizar valores anteriores do cache", async () => {
    mockedFetch.mockResolvedValueOnce({ parciais: [{ timeId: 3, pontuacao: 8 }] })
      .mockResolvedValueOnce({ parciais: [{ timeId: 3, pontuacao: 0 }] });
    expect((await partialScoreService.buscarParcialTime(2026, 25, 3))?.pontuacao).toBe(8);
    expect((await partialScoreService.buscarParcialTime(2026, 25, 3))?.pontuacao).toBe(0);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenLastCalledWith("/parciais?temporada=2026&rodada=25&timeIds=3", { authenticated: true });
  });

  it("divide mais de 100 ids e preserva a ordem dos lotes e da resposta", async () => {
    const ids = Array.from({ length: 101 }, (_, index) => index + 1);
    mockedFetch.mockImplementation(async (path) => {
      const chunk = new URL(`http://local${path}`).searchParams.get("timeIds")!.split(",").map(Number);
      return { temporada: 2026, rodada: 25, parciais: chunk.map((timeId) => ({ timeId, nomeTime: `T${timeId}`, nomeCartoleiro: "C", escudoUrl: "", pontuacao: timeId, status: "PARCIAL" as const, atualizadoEm: null })) };
    });
    const result = await partialScoreService.buscarParciais(2026, 25, ids);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(result.map((item) => item.timeId)).toEqual(ids);
    expect(chunkTeamIds(ids).map((chunk) => chunk.length)).toEqual([100, 1]);
  });

  it("reutiliza a mesma requisicao para o mesmo conjunto sem cache complexo", async () => {
    mockedFetch.mockResolvedValue({ temporada: 2026, rodada: 25, parciais: [] });
    await partialScoreService.buscarParciais(2026, 25, [1, 2]);
    await partialScoreService.buscarParciais(2026, 25, [2, 1]);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("remove falhas do cache para permitir retry", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ temporada: 2026, rodada: 25, parciais: [] });
    await expect(partialScoreService.buscarParciais(2026, 25, [1])).rejects.toThrow("offline");
    await expect(partialScoreService.buscarParciais(2026, 25, [1])).resolves.toEqual([]);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
  it("deduplica atualizacoes simultaneas da rodada anterior", async () => {
    let resolveRequest!: (value: unknown) => void;
    mockedFetch.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }) as never);
    const first = partialScoreService.atualizarRodadaAnterior(2026);
    const second = partialScoreService.atualizarRodadaAnterior(2026);
    expect(first).toBe(second);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith("/parciais/atualizar-rodada-anterior?temporada=2026", { method: "POST", authenticated: true });
    resolveRequest({ temporada: 2026, rodada: 25, timesCadastrados: 1, atualizados: 1, jaProcessados: 0, semSnapshot: 0, timeIdsSemSnapshot: [], falhas: 0, detalhesFalhas: [] });
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });
});
