import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/services/apiClient";
import { telegramLinkService } from "@/services/telegramLinkService";

afterEach(() => vi.resetAllMocks());

it("consulta status autenticado sem enviar dados de conta", async () => {
  vi.mocked(apiFetch).mockResolvedValue({ linked: false });
  await telegramLinkService.status();
  expect(apiFetch).toHaveBeenCalledWith("/users/me/telegram-link", { authenticated: true });
});

it("confirma com o código e JWT do usuário autenticado", async () => {
  const code = "a".repeat(48);
  vi.mocked(apiFetch).mockResolvedValue({ linked: true, linkedAt: "2026-10-14T12:00:00.000Z" });
  await telegramLinkService.confirm(code);
  expect(apiFetch).toHaveBeenCalledWith("/users/me/telegram-link/confirm", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ code }),
  });
});

it("desconecta somente a conta autenticada", async () => {
  vi.mocked(apiFetch).mockResolvedValue({ linked: false });
  await telegramLinkService.disconnect();
  expect(apiFetch).toHaveBeenCalledWith("/users/me/telegram-link", { method: "DELETE", authenticated: true });
});
