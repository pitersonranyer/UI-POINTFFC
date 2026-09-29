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
  await service.fixtures({ from: "2026-10-01", to: "2026-10-07", league: 2013, season: 2026 });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/fixtures?from=2026-10-01&to=2026-10-07&league=2013&season=2026", read);
  await service.fixtures({ date: "2026-10-03" });
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/fixtures?date=2026-10-03", read);
  await service.matches(7);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios/7/partidas", read);
});
it("preserva decimal como texto e usa payloads reais de configuração e ações", async () => {
  const payload: DesafioPayload = { nome: "Copa", descricao: null, tipoAcesso: "PAGO", valorInscricao: "2.50", inicioInscricao: "2026-10-01T12:00:00Z", fimInscricao: "2026-10-02T12:00:00Z", dataInicio: "2026-10-03T12:00:00Z", dataFim: "2026-10-04T12:00:00Z", limiteParticipantes: null };
  await service.create(payload);
  expect(apiFetch).toHaveBeenLastCalledWith("/admin/desafios", { ...auth, method: "POST", body: JSON.stringify(payload) });
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
