import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { adminDesafioService as service, type DesafioPayload } from "./adminDesafioService";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const auth = { authenticated: true, preserveSessionOnForbidden: true };
const read = { ...auth, cache: "no-store" };
it("consulta lista, detalhe e fixtures somente pelo backend autenticado", async () => {
  await service.list({ pagina: 2, limite: 20, status: "RASCUNHO", tipoAcesso: "PAGO" });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios?pagina=2&limite=20&status=RASCUNHO&tipoAcesso=PAGO", read);
  await service.get(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7", read);
  await service.fixtures({ dataInicial: "2026-10-01", dataFinal: "2026-10-07" });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/fixtures?dataInicial=2026-10-01&dataFinal=2026-10-07", read);
  await service.fixtures({ dataInicial: "2026-10-03", dataFinal: "2026-10-03" });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/fixtures?dataInicial=2026-10-03&dataFinal=2026-10-03", read);
  await service.matches(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/partidas", read);
});
it("preserva decimal como texto e usa payloads reais de configuração e ações", async () => {
  const payload: DesafioPayload = { nome: "Copa", descricao: null, tipoAcesso: "PAGO", valorInscricao: "2.50", limiteParticipantes: null };
  await service.create(payload);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios", { ...auth, method: "POST", body: JSON.stringify({ nome: "Copa", tipoAcesso: "PAGO", valorInscricao: "2.50" }) });
  await service.update(7, { descricao: null });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7", { ...auth, method: "PATCH", body: '{"descricao":null}' });
  await service.publish(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/publicar", { ...auth, method: "POST" });
  await service.cancel(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/cancelar", { ...auth, method: "POST" });
});
it("adiciona ID oficial e usa IDs internos para remover/reordenar", async () => {
  await service.addMatch(7, 123456);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/partidas", { ...auth, method: "POST", body: '{"fixtureId":123456}' });
  await service.reorder(7, [14, 11]);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/partidas/ordem", { ...auth, method: "PATCH", body: '{"partidaIds":[14,11]}' });
  await service.removeMatch(7, 14);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/partidas/14", { ...auth, method: "DELETE" });
});

it.each(["", null, "2099-10-01T12:00:00.000Z"])("POST exclui as quatro datas mesmo recebendo valores legados %j", async value => {
  const legacy = { nome: "Copa", tipoAcesso: "FREE" as const, valorInscricao: "0.00", descricao: null, limiteParticipantes: null,
    inicioInscricao: value, fimInscricao: value, dataInicio: value, dataFim: value };
  await service.create(legacy);
  const [path, options] = vi.mocked(apiFetch).mock.calls[0];
  expect(path).toBe("/admin/desafios");
  expect(options?.method).toBe("POST");
  const body = JSON.parse(options?.body as string);
  for (const field of ["inicioInscricao", "fimInscricao", "dataInicio", "dataFim"]) expect(body).not.toHaveProperty(field);
  expect(body).toEqual({ nome: "Copa", tipoAcesso: "FREE", valorInscricao: "0.00" });
});

it("POST preserva descrição preenchida e limite e exclui demais campos de um objeto existente", async () => {
  await service.create({ ...{ id: 7, status: "RASCUNHO", dataInicio: "2099-10-01T12:00:00Z" }, nome: "Copa paga", tipoAcesso: "PAGO", valorInscricao: "2.50", descricao: " Copa do fim de semana ", limiteParticipantes: 30 });
  const body = JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]?.body as string);
  expect(body).toEqual({ nome: "Copa paga", tipoAcesso: "PAGO", valorInscricao: "2.50", descricao: "Copa do fim de semana", limiteParticipantes: 30 });
});

it("POST omite descrição vazia e limite ausente e normaliza FREE", async () => {
  await service.create({ nome: "Copa", tipoAcesso: "FREE", valorInscricao: "99.00", descricao: "   " });
  expect(JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]?.body as string)).toEqual({ nome: "Copa", tipoAcesso: "FREE", valorInscricao: "0.00" });
});
it("envia limite independente de palpites por usuário na criação e edição", async () => {
  await service.create({ nome: "Copa", tipoAcesso: "FREE", valorInscricao: "0.00", limiteParticipantes: 30, limiteInscricoesPorUsuario: 3 });
  expect(JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]?.body as string)).toEqual({ nome: "Copa", tipoAcesso: "FREE", valorInscricao: "0.00", limiteParticipantes: 30, limiteInscricoesPorUsuario: 3 });
  await service.update(7, { limiteInscricoesPorUsuario: 2 });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7", { ...auth, method: "PATCH", body: '{"limiteInscricoesPorUsuario":2}' });
});
