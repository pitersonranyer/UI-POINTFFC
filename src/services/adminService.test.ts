import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { adminService } from "./adminService";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
beforeEach(() => vi.mocked(apiFetch).mockReset());

it("lista competições administrativas com autenticação e filtros reais", async () => {
  await adminService.listCompetitions({ pagina: 2, limite: 20, busca: "Copa POINT", status: "RASCUNHO" });
  expect(apiFetch).toHaveBeenCalledWith("/admin/competicoes?pagina=2&limite=20&busca=Copa+POINT&status=RASCUNHO", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
});

it("busca uma competição administrativa pelo ID", async () => {
  await adminService.getCompetition(7);
  expect(apiFetch).toHaveBeenCalledWith("/admin/competicoes/7", { authenticated: true, preserveSessionOnForbidden: true, cache: "no-store" });
});
