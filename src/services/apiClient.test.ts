import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); sessionStorage.clear(); });

it("preserva dados estruturados de erros financeiros e a mensagem existente", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
  vi.resetModules();
  const { apiFetch, ApiError } = await import("./apiClient");
  const details = { code: "SALDO_INSUFICIENTE", message: "Saldo insuficiente", saldoDisponivel: "5.00", valorNecessario: "20.00", valorFaltante: "15.00" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(details), { status: 409 })));
  try { await apiFetch("/competicoes/42/inscricoes/lote"); expect.fail("Deveria rejeitar"); }
  catch (error) { expect(error).toBeInstanceOf(ApiError); expect(error).toMatchObject({ status: 409, message: details.message, details }); }
});

it("preserva mensagens de validação em array e suporta erro sem JSON", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
  vi.resetModules();
  const { apiFetch } = await import("./apiClient");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ message: ["Campo inválido"] }), { status: 400 })).mockResolvedValueOnce(new Response("offline", { status: 500 })));
  await expect(apiFetch("/teste")).rejects.toMatchObject({ status: 400, message: "Campo inválido" });
  await expect(apiFetch("/teste")).rejects.toMatchObject({ status: 500, message: "Erro na API" });
});
