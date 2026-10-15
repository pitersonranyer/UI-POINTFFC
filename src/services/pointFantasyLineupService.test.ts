import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./apiClient";
import { createFantasyLineup, deleteFantasyLineup, duplicateFantasyLineup, getFantasyLineup, lineupError, listMyFantasyLineups, loadLineupContext, updateFantasyLineup } from "./pointFantasyLineupService";
import { emptySelection } from "@/components/point-fantasy/lineups/lineupPresentation";
import { testContext, testLineup } from "@/components/point-fantasy/lineups/lineupTestFixtures";
vi.mock("./apiClient", async original => ({ ...await original<typeof import("./apiClient")>(), apiFetch:vi.fn() }));
beforeEach(() => { vi.mocked(apiFetch).mockReset(); });
describe("Fantasy lineup HTTP contracts", () => {
  it("creates incomplete drafts with internal IDs and no owner", async () => {
    vi.mocked(apiFetch).mockResolvedValue(testLineup());
    await createFantasyLineup(8, { ...emptySelection(), titulares:[1] });
    expect(apiFetch).toHaveBeenCalledWith("/point-fantasy/competicoes/8/escalacoes", expect.objectContaining({ authenticated:true, method:"POST" }));
    expect(JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]!.body as string)).toEqual({ ...emptySelection(), titulares:[1] });
  });
  it("sends current version on update, duplicate and delete", async () => {
    vi.mocked(apiFetch).mockResolvedValue(testLineup());
    await updateFantasyLineup(12, 4, emptySelection()); await duplicateFantasyLineup(12, 5); await deleteFantasyLineup(12, 6); await getFantasyLineup(12);
    expect(apiFetch).toHaveBeenNthCalledWith(1,"/point-fantasy/escalacoes/12",expect.objectContaining({ method:"PATCH",body:JSON.stringify({ ...emptySelection(), versao:4 }) }));
    expect(apiFetch).toHaveBeenNthCalledWith(2,"/point-fantasy/escalacoes/12/duplicar",expect.objectContaining({ method:"POST",body:'{"versao":5}' }));
    expect(apiFetch).toHaveBeenNthCalledWith(3,"/point-fantasy/escalacoes/12?versao=6",expect.objectContaining({ method:"DELETE" }));
    for (const [, options] of vi.mocked(apiFetch).mock.calls) expect(options?.authenticated).toBe(true);
  });
  it("paginates own drafts with authentication", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ items:[testLineup()],total:2,page:1,limit:1 }).mockResolvedValueOnce({ items:[testLineup(undefined,{ id:13 })],total:2,page:2,limit:1 });
    expect(await listMyFantasyLineups(8,new AbortController().signal)).toHaveLength(2);
    expect(apiFetch).toHaveBeenLastCalledWith("/point-fantasy/competicoes/8/escalacoes/minhas?page=2&limit=100", expect.objectContaining({ authenticated:true, preserveSessionOnForbidden:true }));
  });
  it("loads all eligible athletes and rejects wrong clubs/catalogs", async () => {
    const c = testContext();
    function responses(wrong: boolean) {
      vi.mocked(apiFetch).mockResolvedValueOnce(c.competition)
        .mockResolvedValueOnce({items:wrong ? [{ ...c.athletes[0], clubeIdExterno:999 }] : c.athletes,total:wrong ? 1 : c.athletes.length,page:1,limit:100})
        .mockResolvedValueOnce({ items:c.clubs }).mockResolvedValueOnce({ items:c.positions })
        .mockResolvedValueOnce({ items:[c.catalog],total:1,page:1,limit:100 });
    }
    responses(false); expect((await loadLineupContext(8,new AbortController().signal)).athletes).toHaveLength(c.athletes.length);
    responses(true); await expect(loadLineupContext(8,new AbortController().signal)).rejects.toThrow("incompatíveis");
  });
  it.each([400,401,403,404,409])("preserves HTTP %i failures and explains them", async status => {
    const error = new ApiError(status,"Mensagem do servidor"); vi.mocked(apiFetch).mockRejectedValue(error);
    let caught: unknown;
    try { await updateFantasyLineup(12,1,emptySelection()); } catch (failure) { caught = failure; }
    expect(caught === error).toBe(true);
    expect(lineupError(error)).toContain("Mensagem do servidor");
  });
});
