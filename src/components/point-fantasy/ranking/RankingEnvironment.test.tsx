import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FantasyLineupBuilder } from "../lineups/FantasyLineupBuilder";
import { getFantasyCompetitionRanking } from "@/services/pointFantasyRankingService";
import { apiFetch } from "@/services/apiClient";
import { loadLineupContext, listMyFantasyLineups } from "@/services/pointFantasyLineupService";
import { testContext, testMyLineups } from "../lineups/lineupTestFixtures";

const auth=vi.hoisted(()=>({isAuthenticated:true,isLoading:false,user:{idUsuario:10,status:"ATIVO"},accessToken:"test-session"}));
vi.mock("@/contexts/AuthContext",()=>({useAuth:()=>auth}));
vi.mock("@/services/pointFantasyRankingService",()=>({getFantasyCompetitionRanking:vi.fn()}));
vi.mock("@/services/apiClient",async original=>({...await original<typeof import("@/services/apiClient")>(),apiFetch:vi.fn()}));
vi.mock("@/services/pointFantasyLineupService",async original=>({...await original<typeof import("@/services/pointFantasyLineupService")>(),loadLineupContext:vi.fn(),listMyFantasyLineups:vi.fn()}));
beforeEach(()=>{
 auth.isAuthenticated=true;auth.accessToken="test-session";
 vi.mocked(apiFetch).mockResolvedValue(testContext().competition);
 vi.mocked(loadLineupContext).mockResolvedValue(testContext());vi.mocked(listMyFantasyLineups).mockResolvedValue(testMyLineups());
 vi.mocked(getFantasyCompetitionRanking).mockResolvedValue({competicaoId:8,estadoPontuacao:"NAO_INICIADA",items:[],total:0,page:1,limit:50});
});
afterEach(cleanup);
it("keeps the editor focused, then loads ranking from Meus times without losing its local formation",async()=>{
 render(<FantasyLineupBuilder competitionId={8}/>);
 fireEvent.click(await screen.findByRole("button",{name:/Escale seu time/}));
 fireEvent.change(screen.getByRole("combobox",{name:"Formação tática"}),{target:{value:"4-4-2"}});
 expect(getFantasyCompetitionRanking).not.toHaveBeenCalled();
 expect(screen.queryByRole("tablist",{name:"Ambiente da competição"})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"← Meus times"}));
 expect(screen.getByRole("button",{name:"Continuar editando"})).toBeTruthy();
 fireEvent.click(screen.getByRole("tab",{name:"Ranking"}));await screen.findByText("Nenhum time inscrito nesta competição.");
 expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("tab",{name:"Premiação"}));expect(screen.getByText(/Funcionalidade disponível em breve/)).toBeTruthy();
 expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("tab",{name:"Meus times"}));
 fireEvent.click(screen.getByRole("button",{name:"Continuar editando"}));
 expect((screen.getByRole("combobox",{name:"Formação tática"}) as HTMLSelectElement).value).toBe("4-4-2");
 expect(screen.queryByRole("tablist",{name:"Ambiente da competição"})).toBeNull();
});
it("gives anonymous visitors public ranking access and keeps private teams protected",async()=>{
 auth.isAuthenticated=false;auth.accessToken="";
 render(<FantasyLineupBuilder competitionId={8}/>);
 await screen.findByRole("region",{name:"Competição selecionada"});
 expect(screen.getByRole("link",{name:"Entrar na minha conta"}).getAttribute("href")).toContain("competicao%3D8");
 expect(loadLineupContext).not.toHaveBeenCalled();expect(listMyFantasyLineups).not.toHaveBeenCalled();expect(getFantasyCompetitionRanking).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("tab",{name:"Ranking"}));await screen.findByText("Nenhum time inscrito nesta competição.");
 expect(getFantasyCompetitionRanking).toHaveBeenCalledTimes(1);
});
it("aborts ranking when leaving the tab and ignores a late response",async()=>{
 let finish!:(value:Awaited<ReturnType<typeof getFantasyCompetitionRanking>>)=>void;
 vi.mocked(getFantasyCompetitionRanking).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 render(<FantasyLineupBuilder competitionId={8}/>);await screen.findByRole("button",{name:/Escale seu time/});
 fireEvent.click(screen.getByRole("tab",{name:"Ranking"}));const signal=vi.mocked(getFantasyCompetitionRanking).mock.calls[0][2];
 fireEvent.click(screen.getByRole("tab",{name:"Premiação"}));expect(signal.aborted).toBe(true);
 await act(async()=>finish({competicaoId:8,estadoPontuacao:"NAO_INICIADA",items:[],total:0,page:1,limit:50}));
 expect(screen.queryByText("Nenhum time inscrito nesta competição.")).toBeNull();
});
