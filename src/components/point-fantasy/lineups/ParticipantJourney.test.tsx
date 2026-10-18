import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LineupEditor } from "./LineupEditor";
import * as service from "@/services/pointFantasyLineupService";
import { completeTestSelection, testContext, testLineup, testMyLineups } from "./lineupTestFixtures";
import { crestIdentity } from "./TeamCrest";
import { getPostAuthRedirect } from "@/lib/postAuthRedirect";
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user:{ status:"ATIVO" } }) }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof service>(), loadLineupContext:vi.fn(), listMyFantasyLineups:vi.fn(), getFantasyLineup:vi.fn(), createFantasyLineup:vi.fn(), updateFantasyLineup:vi.fn(), duplicateFantasyLineup:vi.fn(), confirmFreeFantasyLineups:vi.fn() }));
beforeEach(() => {
 vi.clearAllMocks(); window.localStorage.clear();
 vi.mocked(service.loadLineupContext).mockResolvedValue(testContext());
 vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([], { estadoIdentidade:"NOVO", identidade:null }));
 vi.mocked(service.createFantasyLineup).mockResolvedValue(testLineup());
 vi.spyOn(window,"confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function mount() { render(<LineupEditor integrated competitionId={8} onBack={vi.fn()}/>); await screen.findByRole("button",{name:/Escale seu time/}); }
it("opens My teams with three tabs, then an empty pitch without POST or modal", async () => {
 await mount(); expect(screen.getAllByRole("tab")).toHaveLength(3);
 fireEvent.click(screen.getByRole("tab",{name:"Premiação"})); expect(screen.getByText(/disponível em breve/)).toBeTruthy();
 fireEvent.click(screen.getByRole("tab",{name:"Meus times"}));
 fireEvent.click(screen.getByRole("button",{name:/Escale seu time/}));
 expect(screen.getByRole("region",{name:"Campinho 4-3-3"})).toBeTruthy();
 expect((screen.getByRole("textbox",{name:"Nome do time"}) as HTMLInputElement).value).toBe("Tropa do Mago");
 expect(screen.queryByRole("dialog")).toBeNull(); expect(service.createFantasyLineup).not.toHaveBeenCalled();
 fireEvent.change(screen.getByRole("textbox"),{target:{value:"Meu elenco"}});
 fireEvent.click(screen.getByRole("button",{name:"Salvar time"}));
 await waitFor(() => expect(service.createFantasyLineup).toHaveBeenCalledWith(8, expect.objectContaining({formacao:"4-3-3",titulares:[]}),expect.objectContaining({nomeBase:"Meu elenco"})));
 expect(service.confirmFreeFantasyLineups).not.toHaveBeenCalled();
});
it("saves a complete team and retries registration with the same key", async () => {
 const {context,selection} = completeTestSelection("4-3-3");
 const team=testLineup(selection,{validacao:{completa:true,pendencias:[]}});
 vi.mocked(service.loadLineupContext).mockResolvedValue(context);
 vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([team]));
 vi.mocked(service.getFantasyLineup).mockResolvedValue(team);
 vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValue(new Error("timeout"));
 render(<LineupEditor integrated competitionId={8} onBack={vi.fn()}/>);
 fireEvent.click(await screen.findByRole("button",{name:"Editar"}));
 await screen.findByText("Em montagem",{exact:true});
 fireEvent.click(screen.getByRole("button",{name:"Salvar time"}));
 await screen.findByText(/Não foi possível concluir a inscrição/);
 const first=vi.mocked(service.confirmFreeFantasyLineups).mock.calls[0][1];
 fireEvent.click(screen.getByRole("button",{name:"Salvar time"}));
 await waitFor(() => expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(2));
 expect(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[1][1]).toEqual(first);
 expect(service.createFantasyLineup).not.toHaveBeenCalled();
});
it("keeps deterministic versioned crests and safe authentication destinations", () => {
 const team=testLineup(); expect(crestIdentity(team)).toEqual(crestIdentity(JSON.parse(JSON.stringify(team))));
 expect(crestIdentity(team).key).not.toEqual(crestIdentity({...team,id:13}).key);
 expect(getPostAuthRedirect("/point-fantasy?competicao=8")).toBe("/point-fantasy?competicao=8");
 expect(getPostAuthRedirect("//evil.test/point-fantasy")).toBe("/dashboard");
});
it("confirms a complete FREE team only after the server receipt and retrieves its version", async () => {
 const {context,selection}=completeTestSelection("4-3-3");
 const team=testLineup(selection,{validacao:{completa:true,pendencias:[]}});
 vi.mocked(service.loadLineupContext).mockResolvedValue(context);
 vi.mocked(service.createFantasyLineup).mockResolvedValue(team);
 vi.mocked(service.getFantasyLineup).mockResolvedValueOnce(team).mockResolvedValue({...team,status:"INSCRITA",versao:2});
 let finish!: (value: Awaited<ReturnType<typeof service.confirmFreeFantasyLineups>>) => void;
 vi.mocked(service.confirmFreeFantasyLineups).mockReturnValue(new Promise(resolve => { finish=resolve; }));
 await mount(); fireEvent.click(screen.getByRole("button",{name:/Escale seu time/}));
 const save=screen.getByRole("button",{name:"Salvar time"}); fireEvent.click(save); fireEvent.click(save);
 await waitFor(() => expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(1));
 expect(service.createFantasyLineup).toHaveBeenCalledTimes(1); expect(screen.queryByText("Time salvo e inscrito!")).toBeNull();
 finish({competicao:{id:8,nome:context.competition.nome,tipoAcesso:"FREE"},escalacoes:[{id:12,nomePublico:null,status:"INSCRITA",confirmadaEm:"2026-10-17T12:00:00Z"}],quantidadeConfirmada:1,valorTotal:"0.00",estado:"CONFIRMADA"});
 expect(await screen.findByText("Time salvo e inscrito!")).toBeTruthy();
 expect(service.getFantasyLineup).toHaveBeenCalledTimes(2);
});
it("saves paid teams without registering or charging", async () => {
 const context=testContext(); context.competition.tipoAcesso="PAGO";
 vi.mocked(service.loadLineupContext).mockResolvedValue(context);
 await mount(); fireEvent.click(screen.getByRole("button",{name:/Escale seu time/}));
 fireEvent.click(screen.getByRole("button",{name:"Salvar time"}));
 expect(await screen.findByText(/participação paga depende/)).toBeTruthy();
 expect(service.confirmFreeFantasyLineups).not.toHaveBeenCalled();
});
it.each([false,true])("lists registered and unfinished teams and respects closed=%s", async closed => {
 const context=testContext(); if(closed) context.competition.fimInscricao="2020-01-01T00:00:00Z";
 vi.mocked(service.loadLineupContext).mockResolvedValue(context);
 const team=testLineup(undefined,{status:"INSCRITA",nomePublico:"Tropa 01"});
 vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([team,testLineup(undefined,{id:13})]));
 vi.mocked(service.getFantasyLineup).mockResolvedValue(team);
 vi.mocked(service.updateFantasyLineup).mockResolvedValue({...team,formacao:"4-4-2",versao:2});
 render(<LineupEditor integrated competitionId={8} onBack={vi.fn()}/>);
 const publicName=await screen.findByText("Tropa 01"); expect(publicName.getAttribute("title")).toBe("Tropa 01");
 expect(screen.getAllByRole("img",{name:"Brasão do time"})).toHaveLength(2); expect(screen.getAllByText("4-3-3",{exact:true})).toHaveLength(2); expect(screen.getByText("Inscrito",{exact:true})).toBeTruthy(); expect(screen.getByText("Em montagem",{exact:true})).toBeTruthy();
 fireEvent.click(screen.getAllByRole("button",{name:closed ? "Visualizar" : "Editar"})[0]);
 await screen.findByText("Inscrito",{exact:true});
 const formation=screen.getByRole("combobox",{name:"Formação tática"}) as HTMLSelectElement;
 expect(formation.disabled).toBe(closed);
 expect((screen.getByRole("button",{name:"Duplicar time"}) as HTMLButtonElement).disabled).toBe(true);
 if(!closed) { fireEvent.change(formation,{target:{value:"4-4-2"}}); fireEvent.click(screen.getByRole("button",{name:"Salvar time"})); await waitFor(() => expect(service.updateFantasyLineup).toHaveBeenCalled()); expect(service.confirmFreeFantasyLineups).not.toHaveBeenCalled(); }
});
it("keeps long public team names accessible in the compact My teams row", async () => {
 const longName="Tropa do Mago Campeão da Temporada com Estratégia Especial";
 const team=testLineup(undefined,{nomePublico:longName});
 vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([team],{estadoIdentidade:"DEFINIDA",identidade:{nomeBase:"Tropa do Mago",identificadorPublico:"TROPA-1",ultimoSequencial:1}}));
 render(<LineupEditor integrated competitionId={8} onBack={vi.fn()}/>);
 const name=await screen.findByText(longName);
 expect(name.getAttribute("title")).toBe(longName);
 expect(screen.getByText(/Em montagem/)).toBeTruthy();
 expect(screen.getAllByRole("img",{name:"Brasão do time"})).toHaveLength(1);
 expect(service.createFantasyLineup).not.toHaveBeenCalled();
});
it("duplicates only unfinished teams using the backend identity and roster", async () => {
 const source=testLineup(undefined,{nomePublico:"Original"});
 vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([source,testLineup(undefined,{id:13,status:"INSCRITA"})]));
 vi.mocked(service.duplicateFantasyLineup).mockResolvedValue({...source,id:14,nomePublico:"Nova identidade",sequencial:2});
 render(<LineupEditor integrated competitionId={8} onBack={vi.fn()}/>);
 fireEvent.click(await screen.findByRole("button",{name:"Duplicar"}));
 expect(await screen.findByText("Nova identidade")).toBeTruthy();
 expect(service.duplicateFantasyLineup).toHaveBeenCalledWith(12,1,expect.objectContaining({chaveIdempotencia:expect.any(String)}));
 expect(service.confirmFreeFantasyLineups).not.toHaveBeenCalled();
});
it("recovers an unresolved registration key after remount", async () => {
 const team=testLineup(undefined,{validacao:{completa:true,pendencias:[]}});
 vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([team]));
 vi.mocked(service.getFantasyLineup).mockResolvedValue(team);
 vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValue(new Error("timeout"));
 const open=async () => { render(<LineupEditor integrated competitionId={8} onBack={vi.fn()}/>); fireEvent.click(await screen.findByRole("button",{name:"Editar"})); await screen.findByText("Em montagem",{exact:true}); fireEvent.click(screen.getByRole("button",{name:"Salvar time"})); await screen.findByText(/Não foi possível concluir a inscrição/); };
 await open(); const first=vi.mocked(service.confirmFreeFantasyLineups).mock.calls[0][1]; cleanup();
 await open(); expect(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[1][1]).toEqual(first);
});
