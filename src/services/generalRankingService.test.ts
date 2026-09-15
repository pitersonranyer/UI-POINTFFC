import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/apiClient";
import { generalRankingService } from "./generalRankingService";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedFetch = vi.mocked(apiFetch);

describe("generalRankingService", () => {
  beforeEach(() => { mockedFetch.mockReset(); sessionStorage.clear(); mockedFetch.mockResolvedValue({ temporada: 2026, rodada: 25, total: 0, ranking: [] }); });
  it("faz uma unica chamada publica com limite 15", async () => {
    await generalRankingService.buscar(2026, 25);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith("/ranking-geral?temporada=2026&rodada=25&limit=15");
  });
  it("nao passa autenticacao obrigatoria mesmo se existir sessao", async () => {
    sessionStorage.setItem("fantasy.accessToken", "token");
    await generalRankingService.buscar(2026, 25);
    expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining("/ranking-geral?"));
  });
  it("envia pagina e filtros opcionais pela URL", async () => {
    await generalRankingService.buscar(2026, 27, 20, { page: 2, nomeTime: "Real Prime", nomeCartoleiro: "Piterson" });
    expect(mockedFetch).toHaveBeenCalledWith("/ranking-geral?temporada=2026&rodada=27&limit=20&page=2&nomeTime=Real+Prime&nomeCartoleiro=Piterson");
  });
});
