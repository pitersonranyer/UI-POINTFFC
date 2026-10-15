import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("@/services/pointFantasyService", () => ({ loadFantasyPages: vi.fn() }));

import { apiFetch } from "@/services/apiClient";
import { loadFantasyPages } from "@/services/pointFantasyService";
import {
  captureFantasyCatalog,
  createFantasyCompetition,
  freezeFantasyCatalog,
  loadCapturedCatalogAthletes,
  publishFantasyCompetition,
} from "@/services/adminPointFantasyService";

describe("adminPointFantasyService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa o contrato de captura com autenticação administrativa", async () => {
    const payload = { temporada: 2026, rodada: 31, versao: 1 };
    await captureFantasyCatalog(payload);
    expect(apiFetch).toHaveBeenCalledWith("/admin/point-fantasy/catalogos/capturar", {
      authenticated: true,
      preserveSessionOnForbidden: true,
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("usa congelamento e publicação sem corpo", async () => {
    await freezeFantasyCatalog(42);
    await publishFantasyCompetition(73);
    expect(apiFetch).toHaveBeenNthCalledWith(1, "/admin/point-fantasy/catalogos/42/congelar", {
      authenticated: true, preserveSessionOnForbidden: true, method: "POST",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/admin/point-fantasy/competicoes/73/publicar", {
      authenticated: true, preserveSessionOnForbidden: true, method: "POST",
    });
  });

  it("cria somente competição FREE com os campos do DTO", async () => {
    const payload = {
      catalogoId: 42,
      nome: "Fantasy de homologação",
      tipoAcesso: "FREE" as const,
      valorInscricao: "0.00" as const,
      inicioInscricao: "2026-10-15T12:00:00.000Z",
      fimInscricao: "2026-10-16T12:00:00.000Z",
      partidaIds: [1001, 1002],
      limiteEscalacoesUsuario: 1,
    };
    await createFantasyCompetition(payload);
    expect(apiFetch).toHaveBeenCalledWith("/admin/point-fantasy/competicoes", {
      authenticated: true,
      preserveSessionOnForbidden: true,
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("carrega atletas do próprio catálogo para calcular as quantidades", async () => {
    const signal = new AbortController().signal;
    await loadCapturedCatalogAthletes(42, signal);
    expect(loadFantasyPages).toHaveBeenCalledWith("/point-fantasy/catalogos/42/atletas", signal);
  });
});
