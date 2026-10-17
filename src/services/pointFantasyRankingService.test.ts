import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); sessionStorage.clear(); });
const response = () => ({ competicaoId:8, estadoPontuacao:"NAO_INICIADA", items:[{escalacaoId:123,nomePublico:"#ABC2345 · Time 01",identidade:{identificadorPublico:"ABC2345",nomeBase:"Time",sequencial:1},formacao:"4-3-3",meuTime:true,posicao:null,pontuacao:null}], total:1,page:1,limit:50 });
async function service() { vi.stubEnv("NEXT_PUBLIC_API_URL","https://api.example.test"); return import("./pointFantasyRankingService"); }

it.each([false,true])("uses one no-store page, existing authentication=%s and no owner parameter", async authenticated => {
 if (authenticated) sessionStorage.setItem("fantasy.accessToken","session-test");
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify(response()))); vi.stubGlobal("fetch",fetcher);
 const {getFantasyCompetitionRanking}=await service(); const signal=new AbortController().signal;
 expect(await getFantasyCompetitionRanking(8,1,signal)).toEqual(response());
 expect(fetcher).toHaveBeenCalledTimes(1);
 const [url,options]=fetcher.mock.calls[0];
 expect(url).toBe("https://api.example.test/point-fantasy/competicoes/8/ranking?page=1&limit=50");
 expect(options.cache).toBe("no-store"); expect(options.signal).toBe(signal);
 expect(options.headers.get("Authorization")).toBe(authenticated ? "Bearer session-test" : null);
 expect(options.body).toBeUndefined();
});
it("requests the selected page without prefetching all participants", async () => {
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({...response(),page:2,total:80}))); vi.stubGlobal("fetch",fetcher);
 const {getFantasyCompetitionRanking}=await service(); await getFantasyCompetitionRanking(8,2,new AbortController().signal);
 expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher.mock.calls[0][0]).toContain("page=2&limit=50");
});
it("lets the existing session refresher recover an expired credential", async () => {
 sessionStorage.setItem("fantasy.accessToken","expired");
 const fetcher=vi.fn().mockResolvedValueOnce(new Response('{"message":"Expirada"}',{status:401})).mockResolvedValueOnce(new Response(JSON.stringify(response()))); vi.stubGlobal("fetch",fetcher);
 const {getFantasyCompetitionRanking}=await service(); const {setSessionRefresher}=await import("./apiClient");
 const refresh=vi.fn(async () => { sessionStorage.setItem("fantasy.accessToken","renewed"); return "renewed"; }); setSessionRefresher(refresh);
 await getFantasyCompetitionRanking(8,1,new AbortController().signal);
 expect(refresh).toHaveBeenCalledTimes(1); expect(fetcher.mock.calls[1][1].headers.get("Authorization")).toBe("Bearer renewed");
});
it.each([401,403,404,500])("preserves HTTP %s errors", async status => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response('{"message":"Resposta do servidor"}',{status})));
 const {getFantasyCompetitionRanking}=await service();
 await expect(getFantasyCompetitionRanking(8,1,new AbortController().signal)).rejects.toMatchObject({status,message:"Resposta do servidor"});
});
it.each([
 {competicaoId:9}, {page:3}, {limit:100}, {total:-1}, {items:[{...response().items[0],meuTime:"true"}]},
 {items:[{...response().items[0],posicao:0}]}, {items:[{...response().items[0],pontuacao:"0"}]},
 {items:[{...response().items[0],identidade:{sequencial:1}}]},
])("rejects inconsistent responses without inventing values: %j", async changes => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({...response(),...changes}))));
 const {getFantasyCompetitionRanking}=await service();
 await expect(getFantasyCompetitionRanking(8,1,new AbortController().signal)).rejects.toThrow("outra consulta");
});
it("preserves null legacy identity and actual future numeric scores", async () => {
 const result={...response(),estadoPontuacao:"ESTADO_FUTURO",items:[{...response().items[0],identidade:null,formacao:null,posicao:2,pontuacao:-1.25}]};
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify(result))));
 const {getFantasyCompetitionRanking}=await service(); expect(await getFantasyCompetitionRanking(8,1,new AbortController().signal)).toEqual(result);
});
