import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { LineupEditor } from "./LineupEditor";
import { useLineupEditor } from "./useLineupEditor";
import { completeTestSelection, testLineup, testMyLineups } from "./lineupTestFixtures";
import * as service from "@/services/pointFantasyLineupService";
import { ApiError } from "@/services/apiClient";
import type { FantasyLineup, FreeLineupRegistrationResult } from "@/types/pointFantasyLineup";
import { freeRegistrationReason, registrationSelectionIssue } from "./freeLineupRegistration";

vi.mock("@/contexts/AuthContext", () => ({ useAuth:() => ({ user:{status:"ATIVO"}, isAuthenticated:true, isLoading:false }) }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof import("@/services/pointFantasyLineupService")>(), loadLineupContext:vi.fn(), listMyFantasyLineups:vi.fn(), getFantasyLineup:vi.fn(), confirmFreeFantasyLineups:vi.fn(), updateFantasyLineup:vi.fn(), duplicateFantasyLineup:vi.fn(), deleteFantasyLineup:vi.fn() }));
const complete = completeTestSelection("4-3-3");
const first = testLineup(complete.selection, { nomePublico:"Tropa K7P42AB 01", validacao:{completa:true,pendencias:[]} });
const second = {...first,id:13,nomePublico:"Tropa K7P42AB 02"};
const incomplete = testLineup(undefined,{id:14,nomePublico:"Em montagem"});
const registered: FantasyLineup = {...first,id:15,nomePublico:"Confirmado",status:"INSCRITA",confirmadaEm:"2026-10-16T18:00:00Z"};
let teams: FantasyLineup[];
function receipt(ids = [12]): FreeLineupRegistrationResult {
  return {competicao:{id:8,nome:complete.context.competition.nome,tipoAcesso:"FREE"},escalacoes:ids.map(id => ({id,nomePublico:teams.find(t => t.id === id)!.nomePublico,status:"INSCRITA",confirmadaEm:"2026-10-16T18:00:00Z"})),quantidadeConfirmada:ids.length,valorTotal:"0.00",estado:"CONFIRMADA"};
}
beforeEach(() => {
  vi.clearAllMocks();
  teams = [first,second,incomplete,registered];
  vi.mocked(service.loadLineupContext).mockReset().mockResolvedValue(complete.context);
  vi.mocked(service.listMyFantasyLineups).mockReset().mockImplementation(async () => testMyLineups(teams));
  vi.mocked(service.getFantasyLineup).mockReset().mockImplementation(async id => teams.find(t => t.id === id)!);
  vi.mocked(service.confirmFreeFantasyLineups).mockReset().mockImplementation(async (_competition, request) => {
    const result = receipt(request.escalacaoIds);
    teams = teams.map(team => ({...team,...result.escalacoes.find(item => item.id === team.id)}));
    return result;
  });
  vi.spyOn(window,"confirm").mockReturnValue(true);
});
afterEach(cleanup);
async function mount() {
  render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
  await screen.findByRole("region",{name:"Inscrição gratuita"});
  fireEvent.click(screen.getByText("Inscrever times"));
}
const checkbox = (name = first.nomePublico!) => screen.getByRole("checkbox",{name:`Selecionar ${name}`}) as HTMLInputElement;
async function review() {
  fireEvent.click(checkbox());
  fireEvent.click(screen.getByRole("button",{name:"Revisar inscrição"}));
  return screen.findByRole("dialog",{name:"Inscrição gratuita"});
}
describe("FREE registration in the real editor", () => {
  it("selects individual and multiple complete drafts, retaining selection across navigation", async () => {
    await mount();
    expect((screen.getByRole("button",{name:"Revisar inscrição"}) as HTMLButtonElement).disabled).toBe(true);
    expect(checkbox("Em montagem").disabled).toBe(true);
    expect(checkbox("Confirmado").disabled).toBe(true);
    fireEvent.click(checkbox()); fireEvent.click(checkbox(second.nomePublico!));
    fireEvent.change(screen.getByRole("combobox",{name:"Time em edição"}),{target:{value:"13"}});
    await screen.findByText("Rascunho #13 · v1");
    expect(checkbox().checked).toBe(true); expect(checkbox(second.nomePublico!).checked).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Revisar inscrição"}));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(first.nomePublico!)).toBeTruthy();
    expect(within(dialog).getByText(second.nomePublico!)).toBeTruthy();
    expect(within(dialog).getByText("2")).toBeTruthy();
    expect(within(dialog).getByText("R$ 0,00")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button",{name:"Cancelar"}));
    expect(service.confirmFreeFantasyLineups).not.toHaveBeenCalled();
  });
  it("confirms the selected batch, refreshes states and keeps confirmed teams read only", async () => {
    await mount();
    const dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await screen.findByText("1 escalação inscrita com sucesso. Total: R$ 0,00.");
    expect(service.confirmFreeFantasyLineups).toHaveBeenCalledWith(8,{escalacaoIds:[12],chaveIdempotencia:expect.any(String)});
    await waitFor(() => expect(checkbox().disabled).toBe(true));
    expect(checkbox().checked).toBe(false);
    expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole("combobox",{name:"Time em edição"}),{target:{value:"12"}});
    await screen.findByText(`Inscrita · ${first.nomePublico}`);
    expect(screen.getByText(/Inscrita em/)).toBeTruthy();
    for (const name of ["Duplicar time","Excluir rascunho","Salvar rascunho"]) expect(screen.queryByRole("button",{name})).toBeNull();
    expect((screen.getByRole("combobox",{name:"Formação tática"}) as HTMLSelectElement).disabled).toBe(true);
    expect(service.updateFantasyLineup).not.toHaveBeenCalled();
    expect(service.duplicateFantasyLineup).not.toHaveBeenCalled();
    expect(service.deleteFantasyLineup).not.toHaveBeenCalled();
  });
  it.each([new Error("Falha de rede"),new DOMException("Tempo esgotado","TimeoutError"),new ApiError(500,"Resposta desconhecida")])("reuses exactly the same key and teams after an uncertain response (%s)", async failure => {
    vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValueOnce(failure);
    await mount(); const dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toBeTruthy());
    expect(checkbox().disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole("button",{name:"Cancelar"}));
    fireEvent.click(screen.getByRole("button",{name:"Retomar confirmação"}));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button",{name:"Tentar novamente"}));
    await screen.findByText(/1 escalação inscrita com sucesso/);
    const calls = vi.mocked(service.confirmFreeFantasyLineups).mock.calls;
    expect(calls).toHaveLength(2); expect(calls[1]).toEqual(calls[0]);
    expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(3);
  });
  it("refreshes immediately after 409 and refreshes again before replaying the same operation", async () => {
    vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValueOnce(new ApiError(409,"Conflito de concorrência"));
    await mount(); const dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await waitFor(() => expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(2));
    await waitFor(() => expect((within(dialog).getByRole("button",{name:"Tentar novamente"}) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(within(dialog).getByRole("button",{name:"Tentar novamente"}));
    await screen.findByText(/1 escalação inscrita com sucesso/);
    expect(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[1]).toEqual(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[0]);
    expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(4);
  });
  it("does not send again when reconciliation fails", async () => {
    vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValueOnce(new Error("Sem resposta"));
    await mount(); const dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await within(dialog).findByText("Sem resposta");
    vi.mocked(service.listMyFantasyLineups).mockRejectedValueOnce(new Error("Consulta indisponível"));
    fireEvent.click(within(dialog).getByRole("button",{name:"Tentar novamente"}));
    await within(dialog).findByText("Consulta indisponível");
    expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(1);
  });
  it("replays a lost success even if reconciliation finds registered teams and the window has closed", async () => {
    const confirmed = receipt();
    vi.mocked(service.confirmFreeFantasyLineups).mockImplementationOnce(async () => {
      teams = teams.map(team => ({...team,...confirmed.escalacoes.find(item => item.id === team.id)}));
      throw new Error("Resposta perdida");
    }).mockResolvedValueOnce(confirmed);
    await mount(); const dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await within(dialog).findByText("Resposta perdida");
    vi.mocked(service.loadLineupContext).mockResolvedValue({...complete.context,competition:{...complete.context.competition,fimInscricao:"2026-01-01T00:00:00Z"}});
    fireEvent.click(within(dialog).getByRole("button",{name:"Tentar novamente"}));
    await screen.findByText(/1 escalação inscrita com sucesso/);
    expect(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[1]).toEqual(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[0]);
  });
  it("requires reconciliation after 409 when the immediate refresh fails", async () => {
    vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValueOnce(new ApiError(409,"Conflito"));
    await mount(); const dialog = await review();
    vi.mocked(service.listMyFantasyLineups).mockRejectedValueOnce(new Error("Consulta falhou"));
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await within(dialog).findByText(/atualização será exigida/);
    vi.mocked(service.listMyFantasyLineups).mockRejectedValueOnce(new Error("Ainda indisponível"));
    fireEvent.click(within(dialog).getByRole("button",{name:"Tentar novamente"}));
    await within(dialog).findByText("Ainda indisponível");
    expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(1);
  });
  it("keeps an acknowledged success when the following list refresh fails", async () => {
    await mount(); const dialog = await review();
    vi.mocked(service.listMyFantasyLineups).mockRejectedValueOnce(new Error("Consulta falhou"));
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await screen.findByText(/Inscrição confirmada. Não foi possível atualizar/);
    expect(checkbox().disabled).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(1);
  });
  it("generates a different key for a new explicit confirmation", async () => {
    await mount(); let dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await screen.findByText(/1 escalação inscrita com sucesso/);
    fireEvent.click(checkbox(second.nomePublico!));
    fireEvent.click(screen.getByRole("button",{name:"Revisar inscrição"}));
    dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    await waitFor(() => expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(2));
    const calls = vi.mocked(service.confirmFreeFantasyLineups).mock.calls;
    expect(calls[0][1].chaveIdempotencia).not.toBe(calls[1][1].chaveIdempotencia);
  });
  it("prevents concurrent submissions and sends multiple IDs without creating teams", async () => {
    let finish!: (result:FreeLineupRegistrationResult) => void;
    vi.mocked(service.confirmFreeFantasyLineups).mockImplementationOnce(() => new Promise(resolve => {finish=resolve;}));
    await mount(); fireEvent.click(checkbox(second.nomePublico!)); const dialog = await review();
    const confirm = within(dialog).getByRole("button",{name:"Confirmar inscrição"});
    fireEvent.click(confirm); fireEvent.click(confirm);
    expect(service.confirmFreeFantasyLineups).toHaveBeenCalledTimes(1);
    expect(vi.mocked(service.confirmFreeFantasyLineups).mock.calls[0][1].escalacaoIds).toEqual([12,13]);
    await act(async () => finish(receipt([12,13])));
    await screen.findByText(/2 escalações inscritas com sucesso/);
  });
  it.each([400,401,403,404])("explains HTTP %i without reporting success", async status => {
    vi.mocked(service.confirmFreeFantasyLineups).mockRejectedValueOnce(new ApiError(status,"Mensagem do servidor"));
    await mount(); const dialog = await review();
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirmar inscrição"}));
    expect(await within(dialog).findByRole("alert")).toHaveProperty("textContent",expect.stringContaining("Mensagem do servidor"));
    expect(screen.queryByText(/inscrita com sucesso/)).toBeNull();
  });
  it("shows paid registration unavailable and preserves draft controls", async () => {
    vi.mocked(service.loadLineupContext).mockResolvedValue({...complete.context,competition:{...complete.context.competition,tipoAcesso:"PAGO",valorInscricao:"10.00"}});
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    await screen.findByText("Inscrição indisponível para competições pagas nesta fase.");
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByRole("button",{name:"Salvar rascunho"})).toBeTruthy();
  });
  it("preserves local edits and requires saving a selected dirty team", async () => {
    const {result} = renderHook(() => useLineupEditor(8));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.openDraft(12));
    act(() => result.current.toggleRegistration(12));
    act(() => result.current.setValue({...result.current.value,capitaoAtletaId:2}));
    act(() => result.current.reviewRegistration());
    expect(result.current.registrationReview).toBe(false);
    expect(result.current.registrationError).toContain("Salve as alterações");
    expect(result.current.value.capitaoAtletaId).toBe(2);
  });
  it("guards registered rosters at the hook as well as the rendered controls", async () => {
    const {result} = renderHook(() => useLineupEditor(8));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.openDraft(15));
    const previous = result.current.value;
    act(() => result.current.setValue({...previous,titulares:[]}));
    await act(async () => { await result.current.save(); await result.current.duplicate(); await result.current.remove(); });
    expect(result.current.value).toEqual(previous);
    expect(service.updateFantasyLineup).not.toHaveBeenCalled();
    expect(service.duplicateFantasyLineup).not.toHaveBeenCalled();
    expect(service.deleteFantasyLineup).not.toHaveBeenCalled();
  });
});
describe("registration eligibility", () => {
  it("counts confirmed teams toward the limit and rejects incomplete/registered selections", () => {
    expect(registrationSelectionIssue(teams,[12],null,false,2)).toBeNull();
    expect(registrationSelectionIssue(teams,[12,13],null,false,2)).toContain("limite");
    for (const id of [14,15,999]) expect(registrationSelectionIssue(teams,[id],null,false,null)).toContain("rascunhos completos");
  });
  it("checks the enrollment deadline without changing draft editing rules", () => {
    expect(freeRegistrationReason(complete.context,Date.parse("2098-01-02"))).toContain("encerrado");
  });
});
