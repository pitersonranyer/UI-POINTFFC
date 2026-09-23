import { beforeEach, describe, expect, it, vi } from "vitest";
import { pointLeagueService, blockMessages } from "./pointLeagueService";
import { apiFetch } from "./apiClient";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
const fetchMock = vi.mocked(apiFetch);
describe("POINT FFC API", () => {
  beforeEach(() => fetchMock.mockReset());
  it("opens the league and lists real round competitions", async () => {
    fetchMock.mockResolvedValueOnce({ nome: "POINT FFC" }).mockResolvedValueOnce([]);
    await pointLeagueService.league(); await pointLeagueService.competitions();
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/ligas/point-ffc");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/ligas/point-ffc/competicoes?modalidade=RODADA");
  });
  it("loads public and authenticated summaries separately", async () => {
    await pointLeagueService.summary(5, false); await pointLeagueService.summary(5, true);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/competicoes/5/resumo", { authenticated: false });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/competicoes/5/resumo", { authenticated: true });
  });
  it("sends all selected Cartola team IDs in one enrollment request", async () => {
    await pointLeagueService.enroll(5, [123, 456]);
    expect(fetchMock).toHaveBeenCalledWith("/competicoes/5/inscricoes", { method: "POST", authenticated: true, body: '{"timesCartolaIds":[123,456]}' });
  });
  it.each(["0.00", "10.50"])("envia lote com preço %s e Idempotency-Key", async (valorUnitarioEsperado) => {
    const input = { timesCartolaIds: [123, 456], valorUnitarioEsperado };
    await pointLeagueService.enrollBatch(5, input, "enrollment-key-123456");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/competicoes/5/inscricoes/lote", { method: "POST", authenticated: true, headers: { "Idempotency-Key": "enrollment-key-123456" }, body: JSON.stringify(input) });
  });
  it("loads user entries, participants and ranking through their endpoints", async () => {
    await pointLeagueService.myEntries(5); await pointLeagueService.participants(5); await pointLeagueService.ranking(5);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/competicoes/5/inscricoes/minhas", { authenticated: true });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/competicoes/5/participantes");
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/competicoes/5/ranking");
    expect(blockMessages.LIMITE_TIMES_USUARIO_ATINGIDO).toMatch(/limite/);
  });
});
