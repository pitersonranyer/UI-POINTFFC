import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CompetitionRanking } from "./CompetitionRanking";
import { getFantasyCompetitionRanking } from "@/services/pointFantasyRankingService";
import { ApiError } from "@/services/apiClient";
import type { FantasyCompetitionRanking, FantasyRankingEntry } from "@/types/pointFantasyRanking";
import { TeamCrest } from "../lineups/TeamCrest";
import { testLineup } from "../lineups/lineupTestFixtures";

const auth=vi.hoisted(() => ({isAuthenticated:true,isLoading:false,user:{idUsuario:10},accessToken:"session-one"}));
vi.mock("@/contexts/AuthContext",()=>({useAuth:()=>auth}));
vi.mock("@/services/pointFantasyRankingService",()=>({getFantasyCompetitionRanking:vi.fn()}));
const entry=(id:number,mine=false):FantasyRankingEntry=>({escalacaoId:id,nomePublico:`Time ${id}`,identidade:{identificadorPublico:`PUBLIC${id}`,nomeBase:"Time",sequencial:id},formacao:"4-3-3",meuTime:mine,posicao:null,pontuacao:null});
const ranking=(changes:Partial<FantasyCompetitionRanking>={}):FantasyCompetitionRanking=>({competicaoId:8,estadoPontuacao:"NAO_INICIADA",items:[entry(3,true),entry(1),entry(2,true)],total:3,page:1,limit:50,...changes});
beforeEach(()=>{vi.mocked(getFantasyCompetitionRanking).mockReset().mockResolvedValue(ranking());auth.isAuthenticated=true;auth.isLoading=false;auth.user={idUsuario:10};auth.accessToken="session-one";});
afterEach(cleanup);
it("lists all participants in server order and highlights every official own team",async()=>{
 render(<CompetitionRanking competitionId={8}/>);
 await screen.findByText("3 times inscritos");
 expect(within(screen.getByRole("list")).getAllByRole("listitem").map(row=>within(row).getByText(/^Time \d$/).textContent)).toEqual(["Time 3","Time 1","Time 2"]);
 expect(screen.getAllByText("Seu time")).toHaveLength(2);
 expect(screen.getByText("Time 3").closest("li")?.className).toContain("own");
 expect(screen.getByText("Time 1").closest("li")?.className).not.toContain("mine");
 expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(1);
});
it("keeps null positions and scores as dashes without ranking by registration order",async()=>{
 render(<CompetitionRanking competitionId={8}/>); await screen.findByText("Time 3");
 expect(screen.getAllByLabelText("Posição não disponível").map(node=>node.textContent)).toEqual(["—","—","—"]);
 expect(screen.getAllByLabelText("Pontuação não disponível").map(node=>node.textContent)).toEqual(["—","—","—"]);
 expect(screen.queryByText("A competição ainda não começou. Confira os times que já estão na disputa!")).toBeNull();
});
it("renders real future scores and positions without local calculations",async()=>{
 vi.mocked(getFantasyCompetitionRanking).mockResolvedValue(ranking({estadoPontuacao:"OUTRO_ESTADO",items:[{...entry(3),posicao:7,pontuacao:-1.25}]}));
 render(<CompetitionRanking competitionId={8}/>); await screen.findByText("Time 3");
 expect(screen.getByLabelText("Posição 7").textContent).toBe("7");expect(screen.getByLabelText("Pontuação -1,25").textContent).toBe("-1,25");
});
it("allows anonymous reading with no personalized highlights",async()=>{
 auth.isAuthenticated=false;
 render(<CompetitionRanking competitionId={8}/>);await screen.findByText("Time 3");
 expect(screen.queryByText("Seu time")).toBeNull();expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(1);
});
it("does not query while authentication is still loading",()=>{
 auth.isLoading=true;render(<CompetitionRanking competitionId={8}/>);expect(getFantasyCompetitionRanking).not.toHaveBeenCalled();
});
it("shows the unavailable-scoring message and an empty state",async()=>{
 vi.mocked(getFantasyCompetitionRanking).mockResolvedValue(ranking({items:[],total:0,estadoPontuacao:"INDISPONIVEL"}));
 render(<CompetitionRanking competitionId={8}/>);
 expect(await screen.findByText("Nenhum time inscrito nesta competição.")).toBeTruthy();
 expect(screen.getByText("A pontuação do POINT FFC Fantasy ainda não está disponível.")).toBeTruthy();
 expect(screen.queryByRole("navigation")).toBeNull();
});
it("requests one page at a time and clears old rows immediately",async()=>{
 vi.mocked(getFantasyCompetitionRanking).mockImplementation(async(id,page)=>ranking({page,total:51,items:[entry(page)]}));
 render(<CompetitionRanking competitionId={8}/>);await screen.findByText("Time 1");
 expect((screen.getByRole("button",{name:"Anterior"}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole("button",{name:"Próxima"}));expect(screen.queryByText("Time 1")).toBeNull();
 await screen.findByText("Time 2");expect(screen.getByText("Página 2 de 2")).toBeTruthy();
 expect(getFantasyCompetitionRanking).toHaveBeenLastCalledWith(8,2,expect.any(AbortSignal));
 expect((screen.getByRole("button",{name:"Próxima"}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole("button",{name:"Anterior"}));await screen.findByText("Time 1");
});
it("ignores late responses and aborts when changing competitions",async()=>{
 let resolve!: (data:FantasyCompetitionRanking)=>void;
 vi.mocked(getFantasyCompetitionRanking).mockImplementationOnce(()=>new Promise(done=>{resolve=done;})).mockResolvedValueOnce(ranking({competicaoId:9,items:[entry(9)]}));
 const view=render(<CompetitionRanking competitionId={8}/>);const signal=vi.mocked(getFantasyCompetitionRanking).mock.calls[0][2];
 view.rerender(<CompetitionRanking competitionId={9}/>);expect(signal.aborted).toBe(true);
 await screen.findByText("Time 9");await act(async()=>resolve(ranking()));
 expect(screen.queryByText("Time 3")).toBeNull();expect(screen.getByText("Time 9")).toBeTruthy();
});
it("clears the previous page on failure and retries that same page",async()=>{
 vi.mocked(getFantasyCompetitionRanking).mockResolvedValueOnce(ranking({total:51})).mockRejectedValueOnce(new ApiError(0)).mockResolvedValueOnce(ranking({page:2,total:51,items:[entry(50)]}));
 render(<CompetitionRanking competitionId={8}/>);await screen.findByText("Time 3");fireEvent.click(screen.getByRole("button",{name:"Próxima"}));
 await screen.findByRole("alert");expect(screen.queryByText("Time 3")).toBeNull();fireEvent.click(screen.getByRole("button",{name:"Tentar novamente"}));
 await screen.findByText("Time 50");expect(getFantasyCompetitionRanking).toHaveBeenLastCalledWith(8,2,expect.any(AbortSignal));
});
it.each([401,403,404])("handles HTTP %s without stale personalized rows",async status=>{
 vi.mocked(getFantasyCompetitionRanking).mockRejectedValue(new ApiError(status));
 render(<CompetitionRanking competitionId={8}/>);await screen.findByRole("alert");expect(screen.getByRole("button",{name:"Tentar novamente"})).toBeTruthy();
 if(status===401) expect(screen.getByRole("link",{name:"Entrar na minha conta"}).getAttribute("href")).toContain("competicao%3D8");
});
it.each([false,true])("reuses exactly the My teams crest with legacy=%s",async legacy=>{
 const team=entry(3);if(legacy) team.identidade=null;
 const lineup=testLineup(undefined,{id:3,identidade:legacy?null:{nomeBase:"Time",identificadorPublico:"PUBLIC3",ultimoSequencial:3},sequencial:legacy?null:3});
 vi.mocked(getFantasyCompetitionRanking).mockResolvedValue(ranking({items:[team]}));
 const view=render(<><TeamCrest team={lineup}/><CompetitionRanking competitionId={8}/></>);await screen.findByText("Time 3");
 const crests=view.container.querySelectorAll('svg[data-identity]');expect(crests[1].outerHTML).toBe(crests[0].outerHTML);
});
it("clears personalized data when the viewer changes",async()=>{
 const view=render(<CompetitionRanking competitionId={8}/>);await screen.findAllByText("Seu time");
 auth.isAuthenticated=false;auth.accessToken="";
 view.rerender(<CompetitionRanking competitionId={8}/>);expect(screen.queryByText("Seu time")).toBeNull();
 await waitFor(()=>expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(2));
});
it.each(["NAO_INICIADA","INDISPONIVEL"])("keeps a compact ranking header without explanations for occupied state %s",async estadoPontuacao=>{
 vi.mocked(getFantasyCompetitionRanking).mockResolvedValue(ranking({estadoPontuacao}));
 render(<CompetitionRanking competitionId={8}/>);await screen.findByText("Time 3");
 expect(screen.getByRole("heading",{name:"Ranking"})).toBeTruthy();
 expect(screen.getByRole("button",{name:"Atualizar"})).toBeTruthy();
 expect(screen.queryByText(/A competição ainda não começou|A pontuação do POINT FFC Fantasy ainda não está disponível/)).toBeNull();
 const row=screen.getByText("Time 3").closest("li")!;
 expect(within(row).getByText("Seu time").parentElement).toBe(within(row).getByText("Time 3").parentElement);
 expect(screen.queryByText("Meu time")).toBeNull();
});
it("refreshes the current page without resetting pagination",async()=>{
 vi.mocked(getFantasyCompetitionRanking).mockImplementation(async(id,page)=>ranking({page,total:51,items:[entry(page)]}));
 render(<CompetitionRanking competitionId={8}/>);await screen.findByText("Time 1");
 fireEvent.click(screen.getByRole("button",{name:"Próxima"}));await screen.findByText("Time 2");
 const previousSignal=vi.mocked(getFantasyCompetitionRanking).mock.calls[1][2];
 fireEvent.click(screen.getByRole("button",{name:"Atualizar"}));
 await screen.findByText("Time 2");
 expect(previousSignal.aborted).toBe(true);
 expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(3);
 expect(getFantasyCompetitionRanking).toHaveBeenLastCalledWith(8,2,expect.any(AbortSignal));
 expect(screen.getByText("Página 2 de 2")).toBeTruthy();
});
