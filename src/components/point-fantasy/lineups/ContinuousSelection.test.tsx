import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { LineupEditor } from "./LineupEditor";
import { useLineupEditor } from "./useLineupEditor";
import { emptySelection, selectIntoLineupSlot, slotKey } from "./lineupPresentation";
import { testAthlete, testContext, testLineup } from "./lineupTestFixtures";
import * as service from "@/services/pointFantasyLineupService";
import type { Formation, LineupPickerSession } from "@/types/pointFantasyLineup";
vi.mock("@/contexts/AuthContext", () => ({ useAuth:() => ({ user:{idUsuario:"test-only",status:"ATIVO"} }) }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof import("@/services/pointFantasyLineupService")>(), loadLineupContext:vi.fn(), listMyFantasyLineups:vi.fn(), createFantasyLineup:vi.fn(), updateFantasyLineup:vi.fn() }));
beforeEach(() => {
  vi.mocked(service.loadLineupContext).mockReset().mockResolvedValue(testContext());
  vi.mocked(service.listMyFantasyLineups).mockReset().mockResolvedValue([]);
  vi.mocked(service.createFantasyLineup).mockReset().mockImplementation(async (_id, value) => testLineup(value));
  vi.mocked(service.updateFantasyLineup).mockReset();
  vi.spyOn(window,"confirm").mockReturnValue(true);
  Object.defineProperty(HTMLDialogElement.prototype,"showModal",{configurable:true,value:vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open",""); })});
  Object.defineProperty(HTMLDialogElement.prototype,"close",{configurable:true,value:vi.fn(function(this: HTMLDialogElement) { this.removeAttribute("open"); })});
});
afterEach(cleanup);

describe("Continuous lineup selection", () => {
  it.each([
    ["4-3-3", "Atacante", "Atacantes", 3], ["4-5-1", "Meia", "Meias", 5], ["4-3-3", "Zagueiro", "Zagueiros", 2],
    ["4-3-3", "Lateral", "Laterais", 2], ["4-3-3", "Goleiro", "Goleiros", 1], ["4-3-3", "Técnico", "Técnico", 1],
  ] as const)("fills %s %s slots in one dialog, announces progress and closes only when full", async (formation, label, plural, capacity) => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    const formationInput = await screen.findByLabelText("Formação tática");
    fireEvent.change(formationInput,{target:{value:formation}});
    fireEvent.click(screen.getAllByRole("button",{name:`Adicionar ${label} 1`})[0]);
    const dialog = screen.getByRole("dialog");
    const compact = ({Atacante:"ATA",Meia:"MEI",Zagueiro:"ZAG",Lateral:"LAT",Goleiro:"GOL",Técnico:"TEC"} as Record<string,string>)[label];
    expect(within(dialog).getByText(new RegExp(`${compact} · 0/${capacity}`))).toBeTruthy();
    for (let n = 1; n <= capacity; n++) {
      const button = within(screen.getByRole("list",{name:"Atletas elegíveis"})).getAllByRole("button",{name:/^Comprar /}).find(b => !(b as HTMLButtonElement).disabled)!;
      const name = button.getAttribute("aria-label")!; button.focus(); fireEvent.click(button);
      if (n < capacity) {
        expect(screen.getByRole("dialog")).toBe(dialog);
        expect(within(dialog).getByText(new RegExp(`${compact} · ${n}/${capacity}`))).toBeTruthy();
        expect(dialog.contains(document.activeElement)).toBe(true);
        expect(screen.getByRole("list",{name:"Atletas elegíveis"}).querySelectorAll("button[aria-label^=\"Vender \"]")).toHaveLength(n);
      }
    }
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    expect(service.createFantasyLineup).not.toHaveBeenCalled(); expect(service.updateFantasyLineup).not.toHaveBeenCalled();
  });
  it("preserves filters, partial selections and dialog identity when no candidates remain", async () => {
    const c = testContext(); c.athletes = [testAthlete(1,5,{apelido:"Alvo A",statusId:2}),testAthlete(2,5,{apelido:"Alvo B",statusId:2}),testAthlete(3,5,{apelido:"Outro",categoriaId:3})];
    vi.mocked(service.loadLineupContext).mockResolvedValue(c); render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Atacante 1"}))[0]);
    fireEvent.change(screen.getByRole("searchbox"),{target:{value:"Alvo"}}); fireEvent.change(screen.getByLabelText("Clube"),{target:{value:"262"}});
    fireEvent.change(screen.getByLabelText("Categoria"),{target:{value:"2"}}); fireEvent.click(screen.getByRole("button",{name:/^Situação/})); fireEvent.click(screen.getByRole("checkbox",{name:"Provável"}));
    const dialog = screen.getByRole("dialog"); const input = screen.getByRole("searchbox");
    fireEvent.click(screen.getByRole("button",{name:"Comprar Alvo A"})); fireEvent.click(screen.getByRole("button",{name:"Comprar Alvo B"}));
    expect(screen.getByRole("dialog")).toBe(dialog); expect(screen.getByRole("searchbox")).toBe(input); expect((input as HTMLInputElement).value).toBe("Alvo");
    expect((screen.getByLabelText("Clube") as HTMLSelectElement).value).toBe("262"); expect((screen.getByLabelText("Categoria") as HTMLSelectElement).value).toBe("2");
    expect((screen.getByRole("checkbox",{name:"Provável"}) as HTMLInputElement).checked).toBe(false); expect((screen.getByRole("checkbox",{name:"Dúvida"}) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("button",{name:"Vender Alvo A"})).toBeTruthy(); expect(screen.getByRole("button",{name:"Vender Alvo B"})).toBeTruthy(); expect(document.activeElement).toBe(screen.getByRole("button",{name:"Concluir"}));
    fireEvent.click(screen.getByRole("button",{name:"Concluir"})); fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"}));
    await screen.findByText("Rascunho salvo no servidor."); expect(service.createFantasyLineup).toHaveBeenCalledWith(8,expect.objectContaining({titulares:[1,2]}));
  });
  it("sells from the open list without advancing the active slot", async () => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Atacante 1"}))[0]);
    fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 5"}));
    expect(screen.getByText("ATA · 1/3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Vender Jogador 5"}));
    expect(screen.getByRole("dialog")).toBeTruthy(); expect(screen.getByText("ATA · 0/3")).toBeTruthy();
    expect(screen.queryByRole("button",{name:"Ações de Jogador 5"})).toBeNull();
    expect(service.createFantasyLineup).not.toHaveBeenCalled(); expect(service.updateFantasyLineup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 11"}));
    expect(screen.getByText("ATA · 1/3")).toBeTruthy(); expect(screen.getByRole("button",{name:"Vender Jogador 11"})).toBeTruthy();
  });
  it.each(["Concluir","Fechar seletor","Esc"])("manual close via %s keeps selected athletes without autosave", async mechanism => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Atacante 1"}))[0]);
    fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 5"}));
    if (mechanism === "Esc") fireEvent(screen.getByRole("dialog"),new Event("cancel",{cancelable:true}));
    else fireEvent.click(screen.getByRole("button",{name:mechanism}));
    expect(screen.queryByRole("dialog")).toBeNull(); expect(screen.getByRole("button",{name:"Ações de Jogador 5"})).toBeTruthy();
    expect(service.createFantasyLineup).not.toHaveBeenCalled(); expect(service.updateFantasyLineup).not.toHaveBeenCalled();
  });
  it("fills the clicked last slot first, wraps predictably and never overwrites existing players or roles", async () => {
    const {result} = renderHook(() => useLineupEditor(8)); await waitFor(() => expect(result.current.context).not.toBeNull());
    act(() => result.current.setValue({...emptySelection(),titulares:[5],capitaoAtletaId:5,reservas:[3],reservaMagoAtletaId:3}));
    act(() => result.current.openSlot({role:"titulares",position:5,index:2}));
    act(() => { result.current.selectAthlete(11); result.current.selectAthlete(11); });
    expect(result.current.value.titulares).toEqual([5,11]); expect(result.current.slot?.index).toBe(1);
    expect(result.current.slotPlacements["titulares-5-2"]).toBe(11); expect(result.current.slotPlacements["titulares-5-0"]).toBe(5);
    act(() => result.current.selectAthlete(17)); expect(result.current.slot).toBeNull(); expect(result.current.slotPlacements["titulares-5-1"]).toBe(17);
    expect(result.current.value.capitaoAtletaId).toBe(5); expect(result.current.value.reservaMagoAtletaId).toBe(3);
    expect(service.createFantasyLineup).not.toHaveBeenCalled();
  });
  it("renders and announces progress with already selected athletes", async () => {
    const selection = {...emptySelection(),titulares:[5]}; vi.mocked(service.listMyFantasyLineups).mockResolvedValue([testLineup(selection)]);
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    // Start from a local partial draft; the first pick already exists before reopening.
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Atacante 1"}))[0]); fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 5"})); fireEvent.click(screen.getByRole("button",{name:"Concluir"}));
    fireEvent.click(screen.getByRole("button",{name:"Adicionar Atacante 2"}));
    const progress = screen.getByText("ATA · 1/3"); expect(progress.getAttribute("aria-live")).toBe("polite"); expect(progress.getAttribute("aria-atomic")).toBe("true");
  });
  it("replacement changes only the target and closes despite other empty slots, clearing captain", async () => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Atacante 1"}))[0]); fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 5"})); fireEvent.click(screen.getByRole("button",{name:"Concluir"}));
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 5"})); fireEvent.click(screen.getByRole("button",{name:"Tornar capitão"}));
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 5"})); fireEvent.click(screen.getByRole("button",{name:"Trocar jogador"}));
    expect(screen.getByText(/Troca/)).toBeTruthy(); fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 11"}));
    expect(screen.queryByRole("dialog")).toBeNull(); expect(screen.queryByRole("button",{name:"Ações de Jogador 5"})).toBeNull(); expect(screen.getByRole("button",{name:"Adicionar Atacante 2"})).toBeTruthy();
    expect(screen.getByLabelText("Capitão escolhido").textContent).toBe("Não definido");
  });
  it.each(["3-5-2","3-4-3"] as Formation[])("fills both reserve defenders for %s without entering starters or another position", async formation => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />); fireEvent.change(await screen.findByLabelText("Formação tática"),{target:{value:formation}});
    const bench = screen.getByRole("region",{name:"Banco de reservas"}); fireEvent.click(within(bench).getByRole("button",{name:"Adicionar Zagueiro 1"}));
    const dialog = screen.getByRole("dialog"); fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 3"}));
    expect(screen.getByRole("dialog")).toBe(dialog); expect(screen.getByText("ZAG · 1/2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 9"})); expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(bench).getByRole("button",{name:"Ações de Jogador 3"})).toBeTruthy(); expect(screen.getByText(/Titulares: 0\/11/)).toBeTruthy();
    expect(within(bench).getByRole("button",{name:"Adicionar Goleiro 1"})).toBeTruthy();
  });
  it("enforces reserve categories throughout the sequence and clears Reserva Power only on replacement", async () => {
    const {result} = renderHook(() => useLineupEditor(8)); await waitFor(() => expect(result.current.context).not.toBeNull());
    const c = result.current.context!; const bronze = testAthlete(201,3,{categoriaId:1}); const gold = testAthlete(202,3,{categoriaId:3});
    c.athletes.push(bronze,gold);
    act(() => result.current.setValue({...emptySelection(),formacao:"3-5-2",titulares:[201]}));
    act(() => result.current.openSlot({role:"reservas",position:3,index:0})); act(() => result.current.selectAthlete(202));
    expect(result.current.value.reservas).toEqual([]); expect(result.current.slot?.index).toBe(0);
    // Bronze candidates can fill both, while a chosen reserve cannot be selected twice.
    c.athletes.push(testAthlete(203,3,{categoriaId:1}),testAthlete(204,3,{categoriaId:1}),testAthlete(205,3,{categoriaId:1}));
    act(() => { result.current.selectAthlete(203); result.current.selectAthlete(203); result.current.selectAthlete(204); });
    expect(result.current.value.reservas).toEqual([203,204]); expect(result.current.slot).toBeNull();
    act(() => result.current.setValue({...result.current.value,reservaMagoAtletaId:203})); act(() => result.current.openSlot({role:"reservas",position:3,index:0}));
    act(() => result.current.selectAthlete(205)); expect(result.current.value.reservaMagoAtletaId).toBeNull(); expect(result.current.slot).toBeNull();
  });
  it("refuses selection once the competition blocks during a sequence", async () => {
    const {result} = renderHook(() => useLineupEditor(8)); await waitFor(() => expect(result.current.context).not.toBeNull());
    act(() => result.current.openSlot({role:"titulares",position:5,index:0})); act(() => result.current.selectAthlete(5));
    const clock = vi.spyOn(Date,"now").mockReturnValue(Date.parse("2100-01-01T00:00:00Z"));
    act(() => result.current.selectAthlete(11)); expect(result.current.value.titulares).toEqual([5]); clock.mockRestore();
  });
  it("rejects duplicate, occupied, out-of-position and ineligible selections", () => {
    const athletes = [testAthlete(1,5),testAthlete(2,5),testAthlete(3,4)];
    const value = {...emptySelection(),titulares:[1]}; const session: LineupPickerSession = {role:"titulares",position:5,index:0,mode:"fill"};
    expect(selectIntoLineupSlot(value,athletes,session,2)).toBeNull();
    for (const id of [1,3,999]) expect(selectIntoLineupSlot(value,athletes,{...session,index:1},id)).toBeNull();
    const next = selectIntoLineupSlot(value,athletes,{...session,index:2},2)!;
    expect(next.placements[slotKey({...session,index:2})]).toBe(2); expect(next.nextSlot?.index).toBe(1);
  });
});
