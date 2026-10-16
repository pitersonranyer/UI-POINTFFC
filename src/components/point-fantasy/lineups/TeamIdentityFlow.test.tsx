import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LineupEditor } from "./LineupEditor";
import { ApiError } from "@/services/apiClient";
import * as service from "@/services/pointFantasyLineupService";
import { emptySelection } from "./lineupPresentation";
import { testContext, testIdentity, testLineup, testMyLineups } from "./lineupTestFixtures";
import { normalizeTeamName } from "./teamIdentity";

vi.mock("@/contexts/AuthContext", () => ({ useAuth:() => ({user:{status:"ATIVO"}}) }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof import("@/services/pointFantasyLineupService")>(), loadLineupContext:vi.fn(), listMyFantasyLineups:vi.fn(), getFantasyLineup:vi.fn(), createFantasyLineup:vi.fn(), updateFantasyLineup:vi.fn(), duplicateFantasyLineup:vi.fn(), deleteFantasyLineup:vi.fn() }));
const fresh = () => testMyLineups([], {estadoIdentidade:"NOVO",identidade:null});
const publicTeam = (id = 12, sequence = 1) => testLineup(undefined, {id, nomePublico:`#K7P42AB · Tropa do Mago ${String(sequence).padStart(2,"0")}`, sequencial:sequence, legado:false, identidade:{...testIdentity,ultimoSequencial:sequence}});
beforeEach(() => {
  vi.mocked(service.loadLineupContext).mockReset().mockResolvedValue(testContext());
  vi.mocked(service.listMyFantasyLineups).mockReset().mockResolvedValue(fresh());
  vi.mocked(service.getFantasyLineup).mockReset().mockResolvedValue(publicTeam());
  vi.mocked(service.createFantasyLineup).mockReset().mockResolvedValue(publicTeam());
  vi.mocked(service.updateFantasyLineup).mockReset().mockResolvedValue(publicTeam());
  vi.mocked(service.duplicateFantasyLineup).mockReset().mockResolvedValue(publicTeam(20,7));
  vi.mocked(service.deleteFantasyLineup).mockReset().mockResolvedValue({id:12,excluida:true});
  vi.spyOn(window,"confirm").mockReturnValue(true);
});
afterEach(() => {cleanup(); vi.restoreAllMocks();});
async function mount() { render(<LineupEditor competitionId={8} onBack={vi.fn()} />); await screen.findByRole("button",{name:"Salvar rascunho"}); }
async function openModal() { fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"})); return screen.findByRole("dialog",{name:"Dê um nome ao seu time"}); }
async function openTeam(id = 12) { fireEvent.change(screen.getByRole("combobox",{name:"Time em edição"}),{target:{value:String(id)}}); await waitFor(() => expect(service.getFantasyLineup).toHaveBeenCalledWith(id)); await screen.findByText(`Rascunho #${id} · v1`); }
describe("Server public identity", () => {
  it("goes straight to the pitch and asks for a name only on save", async () => {
    await mount();
    expect(screen.queryByRole("navigation",{name:"Meus times"})).toBeNull();
    expect(screen.queryByRole("textbox",{name:"Nome do time"})).toBeNull();
    expect(screen.getByRole("region",{name:"Campinho 4-3-3"})).toBeTruthy();
    const modal = await openModal();
    expect((within(modal).getByRole("textbox",{name:"Nome do time"}) as HTMLInputElement).value).toBe("Meu Time");
    expect(within(modal).getByText("#CÓDIGO · Meu Time 01")).toBeTruthy();
    expect(service.createFantasyLineup).not.toHaveBeenCalled();
  });
  it("cancels without losing formation or posting", async () => {
    await mount(); fireEvent.change(screen.getByRole("combobox",{name:"Formação tática"}),{target:{value:"3-5-2"}});
    const modal = await openModal(); fireEvent.click(within(modal).getByRole("button",{name:"Cancelar"}));
    expect(screen.queryByRole("dialog")).toBeNull(); expect((screen.getByRole("combobox",{name:"Formação tática"}) as HTMLSelectElement).value).toBe("3-5-2");
    expect(service.createFantasyLineup).not.toHaveBeenCalled();
  });
  it.each(["Meu Time","Tropa do Mago"])("sends %s and an idempotency key with the complete selection", async name => {
    await mount(); const modal = await openModal();
    fireEvent.change(within(modal).getByRole("textbox"),{target:{value:name}});
    fireEvent.click(within(modal).getByRole("button",{name:"Salvar rascunho"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(service.createFantasyLineup).toHaveBeenCalledWith(8,emptySelection(),{nomeBase:name,chaveIdempotencia:expect.stringMatching(/^[A-Za-z0-9_-]{1,100}$/)});
    expect(screen.getByRole("option",{name:publicTeam().nomePublico!})).toBeTruthy();
  });
  it("does not close or report success until the server confirms; ignores double submission", async () => {
    let resolve!: (value: ReturnType<typeof publicTeam>) => void;
    vi.mocked(service.createFantasyLineup).mockReturnValue(new Promise(done => {resolve=done;}));
    await mount(); const modal = await openModal(); const form = within(modal).getByRole("textbox").closest("form")!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(service.createFantasyLineup).toHaveBeenCalledTimes(1); expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByText("Rascunho salvo no servidor.")).toBeNull();
    await act(async () => resolve(publicTeam())); expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("validates names and preserves the input after a rejected request", async () => {
    vi.mocked(service.createFantasyLineup).mockRejectedValue(new ApiError(400,"Nome inválido"));
    await mount(); const modal = await openModal(); const input=within(modal).getByRole("textbox");
    fireEvent.change(input,{target:{value:"⚽"}}); fireEvent.submit(input.closest("form")!);
    expect(service.createFantasyLineup).not.toHaveBeenCalled();
    fireEvent.change(input,{target:{value:"Tropa do Mago"}}); fireEvent.submit(input.closest("form")!);
    await within(modal).findByRole("alert"); expect((input as HTMLInputElement).value).toBe("Tropa do Mago");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("uses persisted identity after remount, even when all drafts were deleted", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups());
    await mount(); fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"}));
    await waitFor(() => expect(service.createFantasyLineup).toHaveBeenCalledTimes(1));
    expect(service.createFantasyLineup).toHaveBeenCalledWith(8,emptySelection(),{chaveIdempotencia:expect.any(String)});
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("reuses a rejected intent key for identical parameters and changes it when the name changes", async () => {
    vi.mocked(service.createFantasyLineup).mockRejectedValue(new ApiError(400,"Nome rejeitado"));
    await mount(); const modal=await openModal(); const input=within(modal).getByRole("textbox"); const form=input.closest("form")!;
    fireEvent.submit(form); await within(modal).findByRole("alert");
    const first=vi.mocked(service.createFantasyLineup).mock.calls[0];
    fireEvent.submit(form); await waitFor(() => expect(service.createFantasyLineup).toHaveBeenCalledTimes(2));
    expect(vi.mocked(service.createFantasyLineup).mock.calls[1]).toEqual(first);
    await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false));
    fireEvent.change(input,{target:{value:"Outro nome"}}); fireEvent.submit(form);
    await waitFor(() => expect(service.createFantasyLineup).toHaveBeenCalledTimes(3));
    expect(vi.mocked(service.createFantasyLineup).mock.calls[2][2].chaveIdempotencia).not.toBe(first[2].chaveIdempotencia);
  });
  it("creates the second team without a name or modal and uses a new key", async () => {
    await mount(); const modal=await openModal(); fireEvent.submit(within(modal).getByRole("textbox").closest("form")!);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const firstKey=vi.mocked(service.createFantasyLineup).mock.calls[0][2].chaveIdempotencia;
    fireEvent.click(screen.getByRole("button",{name:"+ Novo time"}));
    vi.mocked(service.createFantasyLineup).mockResolvedValue(publicTeam(15,4));
    fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"}));
    await screen.findByRole("option",{name:publicTeam(15,4).nomePublico!});
    const options=vi.mocked(service.createFantasyLineup).mock.calls[1][2]; expect(options.nomeBase).toBeUndefined(); expect(options.chaveIdempotencia).not.toBe(firstKey);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("duplicates using the server sequence without renumbering after deletion", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([publicTeam()]));
    await mount(); await openTeam(); fireEvent.click(screen.getByRole("button",{name:"Duplicar time"}));
    await screen.findByRole("option",{name:publicTeam(20,7).nomePublico!});
    expect(service.duplicateFantasyLineup).toHaveBeenCalledWith(12,1,{chaveIdempotencia:expect.any(String)});
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("confirms deletion and preserves the identity after removing the last team", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([publicTeam()]));
    await mount(); await openTeam(); vi.mocked(window.confirm).mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button",{name:"Excluir rascunho"})); expect(service.deleteFantasyLineup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Excluir rascunho"})); await waitFor(() => expect(screen.queryByRole("option",{name:publicTeam().nomePublico!})).toBeNull());
    fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"}));
    await waitFor(() => expect(service.createFantasyLineup).toHaveBeenCalledTimes(1));
    expect(vi.mocked(service.createFantasyLineup).mock.calls[0][2].nomeBase).toBeUndefined(); expect(screen.queryByRole("dialog")).toBeNull();
  });
  it.each(["create","duplicate"])("asks for a name for a legacy %s and leaves the old draft intact", async operation => {
    vi.mocked(service.createFantasyLineup).mockResolvedValue(publicTeam(20));
    const legacy=testLineup(); vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([legacy],{estadoIdentidade:"LEGADO",identidade:null}));
    vi.mocked(service.getFantasyLineup).mockResolvedValue(legacy);
    await mount(); expect(screen.getByRole("option",{name:"Time #12 · Rascunho antigo"})).toBeTruthy(); await openTeam();
    if(operation==="create") fireEvent.click(screen.getByRole("button",{name:"+ Novo time"}));
    fireEvent.click(screen.getByRole("button",{name:operation==="create"?"Salvar rascunho":"Duplicar time"}));
    const modal=await screen.findByRole("dialog"); fireEvent.submit(within(modal).getByRole("textbox").closest("form")!);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("option",{name:"Time #12 · Rascunho antigo"})).toBeTruthy();
    const mock=operation==="create"?service.createFantasyLineup:service.duplicateFantasyLineup;
    expect(vi.mocked(mock).mock.calls[0][2]).toEqual({nomeBase:"Meu Time",chaveIdempotencia:expect.any(String)});
  });
  it("edits a legacy draft via PATCH without asking for a name", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([testLineup()],{estadoIdentidade:"LEGADO",identidade:null})); vi.mocked(service.getFantasyLineup).mockResolvedValue(testLineup());
    await mount(); await openTeam(); fireEvent.change(screen.getByRole("combobox",{name:"Formação tática"}),{target:{value:"3-5-2"}});
    fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"}));
    await waitFor(() => expect(service.updateFantasyLineup).toHaveBeenCalledWith(12,1,{...emptySelection(),formacao:"3-5-2"})); expect(screen.queryByRole("dialog")).toBeNull();
  });
  it.each([new ApiError(0,"Falha de rede"), new ApiError(408,"Timeout"), new ApiError(409,"Conflito de concorrência")])("reconciles before retry and reuses the exact key and parameters (%s)", async error => {
    vi.mocked(service.createFantasyLineup).mockRejectedValueOnce(error).mockResolvedValue(publicTeam());
    await mount(); const modal=await openModal(); const input=within(modal).getByRole("textbox");
    fireEvent.change(input,{target:{value:"Tropa do Mago"}}); fireEvent.submit(input.closest("form")!);
    await within(modal).findByRole("button",{name:"Tentar novamente"});
    const first=vi.mocked(service.createFantasyLineup).mock.calls[0];
    expect((input as HTMLInputElement).value).toBe("Tropa do Mago"); expect((input as HTMLInputElement).disabled).toBe(true);
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([publicTeam()]));
    fireEvent.click(within(modal).getByRole("button",{name:"Tentar novamente"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(2); expect(vi.mocked(service.createFantasyLineup).mock.calls[1]).toEqual(first);
    expect(vi.mocked(service.listMyFantasyLineups).mock.invocationCallOrder[1]).toBeLessThan(vi.mocked(service.createFantasyLineup).mock.invocationCallOrder[1]);
  });
  it("does not POST again when reconciliation fails", async () => {
    vi.mocked(service.createFantasyLineup).mockRejectedValue(new ApiError(0));
    await mount(); const modal=await openModal(); fireEvent.submit(within(modal).getByRole("textbox").closest("form")!);
    await within(modal).findByRole("button",{name:"Tentar novamente"});
    vi.mocked(service.listMyFantasyLineups).mockRejectedValue(new ApiError(0));
    fireEvent.click(within(modal).getByRole("button",{name:"Tentar novamente"}));
    await waitFor(() => expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(2)); expect(service.createFantasyLineup).toHaveBeenCalledTimes(1);
  });
  it("locks a failed duplicate to its source version, parameters and key", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([publicTeam()]));
    vi.mocked(service.duplicateFantasyLineup).mockRejectedValueOnce(new ApiError(0)).mockResolvedValue(publicTeam(20,7));
    await mount(); await openTeam(); fireEvent.click(screen.getByRole("button",{name:"Duplicar time"}));
    await screen.findByRole("button",{name:"Tentar novamente"});
    expect((screen.getByRole("button",{name:"+ Novo time"}) as HTMLButtonElement).disabled).toBe(true);
    const first=vi.mocked(service.duplicateFantasyLineup).mock.calls[0];
    fireEvent.click(screen.getByRole("button",{name:"Tentar novamente"}));
    await screen.findByRole("option",{name:publicTeam(20,7).nomePublico!});
    expect(vi.mocked(service.duplicateFantasyLineup).mock.calls[1]).toEqual(first);
  });
  it("preserves the selection after a stale-version duplicate conflict and offers reload", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups([publicTeam()]));
    vi.mocked(service.duplicateFantasyLineup).mockRejectedValue(new ApiError(409,"Versao desatualizada ou escalacao indisponivel"));
    await mount(); await openTeam(); fireEvent.click(screen.getByRole("button",{name:"Duplicar time"}));
    await screen.findByRole("button",{name:"Recarregar versão atual"});
    expect(screen.getByText("Rascunho #12 · v1")).toBeTruthy(); expect(service.createFantasyLineup).not.toHaveBeenCalled();
  });
  it("requires reloading after a definite renaming conflict", async () => {
    vi.mocked(service.createFantasyLineup).mockRejectedValue(new ApiError(409,"Nome-base definitivo nao pode ser alterado"));
    await mount(); const modal=await openModal(); fireEvent.submit(within(modal).getByRole("textbox").closest("form")!);
    await within(modal).findByRole("alert"); expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(within(modal).getByRole("button",{name:"Cancelar"}));
    await screen.findByRole("button",{name:"Recarregar versão atual"});
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue(testMyLineups());
    fireEvent.click(screen.getByRole("button",{name:"Recarregar versão atual"})); await waitFor(() => expect(service.listMyFantasyLineups).toHaveBeenCalledTimes(2));
  });
});
describe("Backend name rules", () => {
  it.each(["a","⚽ Time","<b>Time</b>","Nome\u200Boculto","a\tb","a".repeat(61)])("rejects %s", name => {expect(normalizeTeamName(name)).toBeNull();});
  it("normalizes NFC and ASCII spaces", () => {expect(normalizeTeamName("  A\u0301guia   d'Ouro-2.  ")).toBe("Águia d'Ouro-2.");});
});
