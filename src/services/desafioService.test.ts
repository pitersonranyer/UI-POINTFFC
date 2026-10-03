import { expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./apiClient";
import { desafioService as service, insufficientBalance } from "./desafioService";
vi.mock("./apiClient", async original => ({ ...await original<object>(), apiFetch: vi.fn() }));

it("lista publicamente usando somente filtros suportados", async () => {
  await service.list(2, "PAGO");
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios?pagina=2&limite=20&tipoAcesso=PAGO", { cache: "no-store", signal: undefined });
  await service.list();
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios?pagina=1&limite=20", { cache: "no-store", signal: undefined });
});
it("consulta detalhe com JWT opcional e sem cache", async () => {
  const signal = new AbortController().signal;
  await service.detail(7, false, signal);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7", { authenticated: false, cache: "no-store", signal });
  await service.detail(7, true);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7", { authenticated: true, cache: "no-store", signal: undefined });
});
it("cria nova inscrição com a chave fornecida e grava/confirma por ID explícito", async () => {
  const key = "11111111-1111-4111-8111-111111111111";
  await service.createInscricao(7, key);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/inscricoes", { method: "POST", authenticated: true, body: JSON.stringify({ chaveIdempotencia: key }) });
  await service.createInscricao(7, key);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/inscricoes", { method: "POST", authenticated: true, body: JSON.stringify({ chaveIdempotencia: key }) });
  await service.predict(7, 14, "FORA", 99);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/partidas/14/palpite", { method: "PUT", authenticated: true, body: JSON.stringify({ inscricaoId: 99, palpite: "FORA" }) });
  await service.participate(7, 99);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/participar", { method: "POST", authenticated: true, body: JSON.stringify({ inscricaoId: 99 }) });
});
it("consulta ranking público sem JWT nem filtros locais de desempate", async () => {
  const signal = new AbortController().signal;
  await service.ranking(7, 2, signal);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/ranking?pagina=2&limite=20", { cache: "no-store", signal });
  await service.ranking(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/ranking?pagina=1&limite=20", { cache: "no-store", signal: undefined });
});
it("grava palpite usando ID interno e participa sem payload financeiro/usuário", async () => {
  await service.predict(7, 14, "EMPATE");
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/partidas/14/palpite", { authenticated: true, method: "PUT", body: '{"palpite":"EMPATE"}' });
  await service.participate(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/desafios/7/participar", { authenticated: true, method: "POST" });
});
it("usa os três valores oficiais de saldo sem estimar ou substituir campos ausentes", () => {
  const details = { code: "SALDO_INSUFICIENTE", saldoDisponivel: "0.50", valorNecessario: "2.00", valorFaltante: "1.50" };
  expect(insufficientBalance(new ApiError(409, "Saldo insuficiente", details))).toEqual({ saldoDisponivel: "0.50", valorNecessario: "2.00", valorFaltante: "1.50" });
  expect(insufficientBalance(new ApiError(409, "Saldo insuficiente", { code: details.code }))).toBeNull();
  expect(insufficientBalance(new ApiError(409, "Outro conflito"))).toBeNull();
});
