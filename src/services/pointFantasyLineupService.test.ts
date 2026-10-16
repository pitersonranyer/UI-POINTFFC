import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./apiClient";
import { confirmFreeFantasyLineups, createFantasyLineup, deleteFantasyLineup, duplicateFantasyLineup, getFantasyLineup, lineupError, listMyFantasyLineups, loadLineupContext, updateFantasyLineup } from "./pointFantasyLineupService";
import { emptySelection } from "@/components/point-fantasy/lineups/lineupPresentation";
import { testContext, testLineup, testMyLineups } from "@/components/point-fantasy/lineups/lineupTestFixtures";
vi.mock("./apiClient", async original => ({ ...await original<typeof import("./apiClient")>(), apiFetch:vi.fn() }));
beforeEach(() => { vi.mocked(apiFetch).mockReset(); });
describe("Fantasy lineup HTTP contracts", () => {
  const registrationRequest = {escalacaoIds:[12],chaveIdempotencia:"confirmacao-001"};
  const registrationResult = {competicao:{id:8,nome:"Competição real",tipoAcesso:"FREE"},escalacoes:[{id:12,nomePublico:"Nome real K7P42AB 01",status:"INSCRITA",confirmadaEm:"2026-10-16T18:00:00Z"}],quantidadeConfirmada:1,valorTotal:"0.00",estado:"CONFIRMADA"};
  it("registers with existing authentication, only IDs/key and a bounded timeout", async () => {
    vi.mocked(apiFetch).mockResolvedValue(registrationResult);
    expect(await confirmFreeFantasyLineups(8,registrationRequest)).toEqual(registrationResult);
    expect(apiFetch).toHaveBeenCalledWith("/point-fantasy/competicoes/8/inscricoes",expect.objectContaining({authenticated:true,preserveSessionOnForbidden:true,method:"POST",body:JSON.stringify(registrationRequest),signal:expect.any(AbortSignal)}));
  });
  it.each([400,401,403,404,409,500])("preserves registration HTTP %i for reconciliation", async status => {
    const error = new ApiError(status,"Falha do backend");
    vi.mocked(apiFetch).mockRejectedValue(error);
    await expect(confirmFreeFantasyLineups(8,registrationRequest)).rejects.toBe(error);
  });
  it.each([
    {...registrationResult,valorTotal:"10.00"},
    {...registrationResult,escalacoes:[]},
    {...registrationResult,competicao:{...registrationResult.competicao,id:9}},
    {...registrationResult,escalacoes:[{...registrationResult.escalacoes[0],id:99}]},
    {...registrationResult,escalacoes:[{...registrationResult.escalacoes[0],confirmadaEm:"invalid"}]},
  ])("rejects unknown receipts instead of inventing confirmed teams", async result => {
    vi.mocked(apiFetch).mockResolvedValue(result);
    await expect(confirmFreeFantasyLineups(8,registrationRequest)).rejects.toThrow("confirmação válida");
  });
  it("creates incomplete drafts with internal IDs and no owner", async () => {
    vi.mocked(apiFetch).mockResolvedValue(testLineup());
    await createFantasyLineup(8, { ...emptySelection(), titulares:[1] }, {nomeBase:"Meu Time", chaveIdempotencia:"test-create"});
    expect(apiFetch).toHaveBeenCalledWith("/point-fantasy/competicoes/8/escalacoes", expect.objectContaining({ authenticated:true, method:"POST" }));
    expect(JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]!.body as string)).toEqual({ ...emptySelection(), titulares:[1], nomeBase:"Meu Time", chaveIdempotencia:"test-create" });
  });
  it("sends current version on update, duplicate and delete", async () => {
    vi.mocked(apiFetch).mockResolvedValue(testLineup());
    await updateFantasyLineup(12, 4, emptySelection()); await duplicateFantasyLineup(12, 5, {chaveIdempotencia:"test-copy"}); await deleteFantasyLineup(12, 6); await getFantasyLineup(12);
    expect(apiFetch).toHaveBeenNthCalledWith(1,"/point-fantasy/escalacoes/12",expect.objectContaining({ method:"PATCH",body:JSON.stringify({ ...emptySelection(), versao:4 }) }));
    expect(apiFetch).toHaveBeenNthCalledWith(2,"/point-fantasy/escalacoes/12/duplicar",expect.objectContaining({ method:"POST",body:'{"versao":5,"chaveIdempotencia":"test-copy"}' }));
    expect(apiFetch).toHaveBeenNthCalledWith(3,"/point-fantasy/escalacoes/12?versao=6",expect.objectContaining({ method:"DELETE" }));
    for (const [, options] of vi.mocked(apiFetch).mock.calls) expect(options?.authenticated).toBe(true);
  });
  it("paginates own drafts with authentication", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ...testMyLineups([testLineup()]),rascunhosLegados:2,total:2,page:1,limit:1 }).mockResolvedValueOnce({ ...testMyLineups([testLineup(undefined,{ id:13 })]),rascunhosLegados:2,total:2,page:2,limit:1 });
    const result = await listMyFantasyLineups(8,new AbortController().signal);
    expect(result.items).toHaveLength(2); expect(result.estadoIdentidade).toBe("DEFINIDA"); expect(result.rascunhosLegados).toBe(2);
    expect(apiFetch).toHaveBeenLastCalledWith("/point-fantasy/competicoes/8/escalacoes/minhas?page=2&limit=100", expect.objectContaining({ authenticated:true, preserveSessionOnForbidden:true }));
  });
  it("preserves a defined identity with no drafts", async () => {
    vi.mocked(apiFetch).mockResolvedValue({...testMyLineups(),total:0,page:1,limit:100});
    const result=await listMyFantasyLineups(8,new AbortController().signal);
    expect(result.estadoIdentidade).toBe("DEFINIDA"); expect(result.identidade?.nomeBase).toBe("Tropa do Mago"); expect(result.items).toEqual([]);
  });
  it("rejects identity changes across pages instead of mixing snapshots", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({...testMyLineups([testLineup()]),rascunhosLegados:2,total:2,page:1,limit:1})
      .mockResolvedValueOnce({...testMyLineups([testLineup(undefined,{id:13})]),rascunhosLegados:2,total:2,page:2,limit:1,identidade:{nomeBase:"Outro",identificadorPublico:"ABC2345",ultimoSequencial:2}});
    await expect(listMyFantasyLineups(8,new AbortController().signal)).rejects.toThrow("mudaram");
  });
  it("does not infer a new identity from an old response without metadata", async () => {
    vi.mocked(apiFetch).mockResolvedValue({items:[],total:0,page:1,limit:100});
    await expect(listMyFantasyLineups(8,new AbortController().signal)).rejects.toThrow("incompleta");
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
