import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { mercadoPagoPocService } from "./mercadoPagoPocService";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
beforeEach(() => { vi.mocked(apiFetch).mockReset(); });

it("consulta health sem depender do formato da resposta", async () => {
  vi.mocked(apiFetch).mockResolvedValue("ok");
  await expect(mercadoPagoPocService.health()).resolves.toBe("ok");
  expect(apiFetch).toHaveBeenCalledWith("/poc/mercado-pago/health", { cache: "no-store", signal: undefined });
});

it("envia somente valor no POST, sem autenticação adicional", async () => {
  const controller = new AbortController();
  await mercadoPagoPocService.create(10.5, controller.signal);
  expect(apiFetch).toHaveBeenCalledWith("/poc/mercado-pago/pix", {
    method: "POST", body: '{"valor":10.5}', signal: controller.signal,
  });
});

it("consulta pelo id interno com cancelamento e sem cache", async () => {
  const controller = new AbortController();
  await mercadoPagoPocService.status("internal/id", controller.signal);
  expect(apiFetch).toHaveBeenCalledWith("/poc/mercado-pago/pix/internal%2Fid/status", {
    cache: "no-store", signal: controller.signal,
  });
});

it("propaga erro do backend", async () => {
  vi.mocked(apiFetch).mockRejectedValue(new Error("Valor não permitido"));
  await expect(mercadoPagoPocService.create(10)).rejects.toThrow("Valor não permitido");
});
