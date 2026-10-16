import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { FantasyLineupBuilder } from "./FantasyLineupBuilder";
import { LineupEditor } from "./LineupEditor";
import { LineupPitch } from "./LineupPitch";
import { LineupAthletePicker } from "./LineupAthletePicker";
import { useLineupEditor } from "./useLineupEditor";
import { ApiError } from "@/services/apiClient";
import * as service from "@/services/pointFantasyLineupService";
import { completeTestSelection, testAthlete, testContext, testLineup } from "./lineupTestFixtures";
import { defaultPickerFilters, emptySelection, formationCounts } from "./lineupPresentation";
import type { Formation } from "@/types/pointFantasyLineup";

const auth = vi.hoisted(() => ({ authenticated:true, loading:false, status:"ATIVO" }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth:() => ({ isAuthenticated:auth.authenticated, isLoading:auth.loading, user:{ idUsuario:"test-user", status:auth.status } }) }));
vi.mock("@/services/pointFantasyLineupService", async original => ({ ...await original<typeof import("@/services/pointFantasyLineupService")>(), loadLineupContext:vi.fn(), listMyFantasyLineups:vi.fn(), listFantasyCompetitions:vi.fn(), getFantasyLineup:vi.fn(), createFantasyLineup:vi.fn(), updateFantasyLineup:vi.fn(), duplicateFantasyLineup:vi.fn(), deleteFantasyLineup:vi.fn() }));
beforeEach(() => {
  vi.mocked(service.loadLineupContext).mockReset().mockResolvedValue(testContext());
  vi.mocked(service.listMyFantasyLineups).mockReset().mockResolvedValue([]);
  vi.mocked(service.listFantasyCompetitions).mockReset().mockResolvedValue([testContext().competition]);
  vi.mocked(service.getFantasyLineup).mockReset().mockResolvedValue(testLineup());
  vi.mocked(service.createFantasyLineup).mockReset().mockResolvedValue(testLineup());
  vi.mocked(service.updateFantasyLineup).mockReset().mockResolvedValue(testLineup(undefined,{ versao:2 }));
  vi.mocked(service.duplicateFantasyLineup).mockReset().mockResolvedValue(testLineup(undefined,{ id:13 }));
  vi.mocked(service.deleteFantasyLineup).mockReset().mockResolvedValue({ id:12, excluida:true });
  auth.authenticated = true; auth.loading = false; auth.status = "ATIVO";
  vi.spyOn(window, "confirm").mockReturnValue(true);
  Object.defineProperty(HTMLDialogElement.prototype,"showModal",{ configurable:true,value:function() { this.setAttribute("open",""); } });
  Object.defineProperty(HTMLDialogElement.prototype,"close",{ configurable:true,value:function() { this.removeAttribute("open"); } });
});
afterEach(cleanup);
async function chooseTeam(id: number) { fireEvent.change(await screen.findByRole("combobox",{name:"Time em edição"}),{target:{value:String(id)}}); }
describe("Pitch and formations", () => {
  it.each(Object.keys(formationCounts) as Formation[])("renders %s with 11 starters, separate coach and five reserves", formation => {
    const { context, selection } = completeTestSelection(formation);
    const { container } = render(<LineupPitch value={selection} athletes={context.athletes} disabled={false} onOpen={vi.fn()} onRemove={vi.fn()} onCaptain={vi.fn()} onPowerReserve={vi.fn()} />);
    const pitch = screen.getByRole("region",{ name:`Campinho ${formation}` });
    expect(pitch.querySelectorAll('[data-line] [data-position]')).toHaveLength(11);
    expect(screen.getByTestId("coach-slot").querySelector('[data-position="6"]')).not.toBeNull();
    expect(screen.getByTestId("coach-slot").className).toContain("coach");
    expect(within(screen.getByRole("region",{ name:"Banco de reservas" })).getAllByRole("button",{ name:/Ações de/ })).toHaveLength(5);
    const benchPositions = [...screen.getByRole("region",{name:"Banco de reservas"}).querySelectorAll("[data-position]")].map(n => Number(n.getAttribute("data-position")));
    expect(benchPositions).toEqual(formation.startsWith("3") ? [1,3,3,4,5] : [1,2,3,4,5]);
    expect(container.querySelectorAll('[aria-label="Capitão"]')).toHaveLength(1);
    expect(screen.getByRole("img",{name:"Reserva Power"})).toBeTruthy();
  });
  it("opens position-specific slots using keyboard accessible buttons", () => {
    const onOpen = vi.fn(); render(<LineupPitch value={emptySelection()} athletes={[]} disabled={false} onOpen={onOpen} onRemove={vi.fn()} onCaptain={vi.fn()} onPowerReserve={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button",{ name:"Adicionar Goleiro 1" })[0]);
    expect(onOpen).toHaveBeenCalledWith({ role:"titulares",position:1,index:0 });
  });
});
describe("Athlete picker", () => {
  function picker(context = testContext(), value = emptySelection(), role: "titulares" | "reservas" = "titulares") {
    const onSelect = vi.fn();
    function PickerHarness() { const [filters,setFilters] = useState(defaultPickerFilters); return <LineupAthletePicker context={context} value={value} slot={{ role,position:1,index:0 }} filters={filters} onFiltersChange={setFilters} onSelect={onSelect} onSell={vi.fn()} onClose={vi.fn()} />; }
    render(<PickerHarness />); return onSelect;
  }
  it("starts with collapsed filters, defaults to probable and doubt, and keeps selected athletes visible", () => {
    picker(testContext(),{ ...emptySelection(), titulares:[1] });
    const toggle = screen.getByRole("button",{name:"Filtros"});
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region",{name:"Filtros avançados"})).toBeNull();
    expect(screen.getByRole("list",{name:"Atletas elegíveis"})).toBeTruthy();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    for (const name of ["Provável","Dúvida"]) expect((screen.getByRole("checkbox",{name}) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("button",{name:"Comprar João Dúvida"})).toBeTruthy();
    expect(screen.getByRole("button",{name:"Vender Jogador 1"})).toBeTruthy(); expect(screen.getByText("Escalado")).toBeTruthy();
    expect(screen.queryByText("Suspenso Teste")).toBeNull();
    fireEvent.change(screen.getByRole("searchbox"),{target:{value:" joao "}});
    expect(screen.getByRole("button",{name:"Comprar João Dúvida"})).toBeTruthy();
    const clubGroup = screen.getAllByRole("group").find(group => group.querySelector("legend")?.textContent === "Clubes")!;
    fireEvent.click(within(clubGroup).getByRole("button",{name:"Limpar"})); fireEvent.click(within(clubGroup).getByRole("checkbox",{name:"Botafogo"}));
    expect(screen.getByText(/Nenhum atleta para esta posição/)).toBeTruthy();
    fireEvent.click(within(clubGroup).getByRole("button",{name:"Todos"}));
    const categoryGroup = screen.getAllByRole("group").find(group => group.querySelector("legend")?.textContent === "Categoria")!;
    fireEvent.click(within(categoryGroup).getByRole("button",{name:"Limpar"})); fireEvent.click(within(categoryGroup).getByRole("checkbox",{name:"Ouro"}));
    expect(screen.getByText(/Nenhum atleta para esta posição/)).toBeTruthy();
  });
  it("offers all, clear and default restore for situations, clubs and categories", () => {
    picker(); fireEvent.click(screen.getByRole("button",{name:"Filtros"}));
    const groups = screen.getAllByRole("group");
    const situation = within(groups.find(group => group.querySelector("legend")?.textContent === "Situação")!);
    const clubs = within(groups.find(group => group.querySelector("legend")?.textContent === "Clubes")!);
    const categories = within(groups.find(group => group.querySelector("legend")?.textContent === "Categoria")!);
    fireEvent.click(situation.getByRole("button",{name:"Limpar"})); expect(screen.getByRole("button",{name:/^Filtros/}).textContent).toContain("Filtros · 1");
    expect(screen.getByRole("button",{name:/Ordenar por PointCoins: PC\$ ↓/})).toBeTruthy();
    fireEvent.click(situation.getByRole("button",{name:"Todos"})); expect(screen.getByRole("button",{name:"Comprar Sem situação"})).toBeTruthy(); expect(screen.getByRole("button",{name:"Comprar Suspenso Teste"})).toBeTruthy();
    fireEvent.click(situation.getByRole("button",{name:"Restaurar padrão"})); expect(screen.queryByRole("button",{name:"Comprar Sem situação"})).toBeNull();
    fireEvent.click(screen.getByRole("checkbox",{name:"Sem situação"})); expect(screen.getByRole("button",{name:"Comprar Sem situação"})).toBeTruthy();
    fireEvent.click(clubs.getByRole("button",{name:"Limpar"})); expect(screen.getByText(/Nenhum clube/)).toBeTruthy();
    fireEvent.click(clubs.getByRole("button",{name:"Todos"})); expect(screen.getByRole("button",{name:"Comprar João Dúvida"})).toBeTruthy();
    fireEvent.click(categories.getByRole("button",{name:"Limpar"})); expect(screen.queryByRole("button",{name:/^Comprar /})).toBeNull();
    fireEvent.click(categories.getByRole("button",{name:"Todas"})); expect(screen.getByRole("button",{name:"Comprar João Dúvida"})).toBeTruthy();
  });
  it("selects multiple clubs and categories and sorts by PC$ in both directions with alphabetical ties", () => {
    const c = testContext(); c.athletes = [
      testAthlete(1,1,{apelido:"Zeca",clubeIdExterno:262,categoriaId:1,pointcoins:10}),
      testAthlete(2,1,{apelido:"Ana",clubeIdExterno:263,categoriaId:2,pointcoins:30}),
      testAthlete(3,1,{apelido:"Bia",clubeIdExterno:262,categoriaId:3,pointcoins:30}),
      testAthlete(4,1,{apelido:"Cleo",clubeIdExterno:263,categoriaId:3,pointcoins:15}),
    ];
    picker(c);
    expect(screen.getAllByRole("listitem").map(item => item.querySelector("strong")?.textContent)).toEqual(["Ana","Bia","Cleo","Zeca"]);
    fireEvent.click(screen.getByRole("button",{name:/^Filtros/}));
    const clubs = screen.getAllByRole("group").find(group => group.querySelector("legend")?.textContent === "Clubes")!;
    const categories = screen.getAllByRole("group").find(group => group.querySelector("legend")?.textContent === "Categoria")!;
    fireEvent.click(within(clubs).getByRole("button",{name:"Limpar"}));
    for (const name of ["Flamengo","Botafogo"]) fireEvent.click(within(clubs).getByRole("checkbox",{name}));
    fireEvent.click(within(categories).getByRole("button",{name:"Limpar"}));
    for (const name of ["Prata","Ouro"]) fireEvent.click(within(categories).getByRole("checkbox",{name}));
    expect(screen.getAllByRole("listitem").map(item => item.querySelector("strong")?.textContent)).toEqual(["Ana","Bia","Cleo"]);
    fireEvent.click(screen.getByRole("button",{name:/Ordenar por PointCoins: PC\$ ↓/}));
    expect(screen.getAllByRole("listitem").map(item => item.querySelector("strong")?.textContent)).toEqual(["Cleo","Ana","Bia"]);
  });
  it("preserves status filters between pages and selects the internal athlete", () => {
    const c = testContext(); c.athletes = Array.from({length:30},(_,i) => testAthlete(i+1,1,{statusId:2}));
    const onSelect = picker(c); fireEvent.click(screen.getByRole("button",{name:/^Filtros/})); fireEvent.click(screen.getByRole("checkbox",{name:"Provável"}));
    fireEvent.click(screen.getByText("Próxima")); expect((screen.getByRole("checkbox",{name:"Provável"}) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 30"})); expect(onSelect).toHaveBeenCalledWith(c.athletes[29]);
  });
  it("prevents high category reserves and allows incomplete positional references", () => {
    const c = testContext(); c.athletes = [testAthlete(1,1,{categoriaId:1}),testAthlete(2,1,{categoriaId:3})];
    picker(c,{...emptySelection(),titulares:[1]},"reservas");
    expect((screen.getByRole("button",{name:"Comprar Jogador 2"}) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Categoria superior/)).toBeTruthy();
  });
});
describe("Private journey", () => {
  it("requires the existing login and makes no anonymous requests", () => {
    auth.authenticated = false; render(<FantasyLineupBuilder />);
    expect(screen.getByRole("link",{name:"Entrar na minha conta"}).getAttribute("href")).toMatch(/^\/login\/?$/);
    expect(service.listFantasyCompetitions).not.toHaveBeenCalled();
  });
  it("discovers competitions and creates an incomplete draft without fake validation", async () => {
    render(<FantasyLineupBuilder />); fireEvent.click(await screen.findByText("Montar escalação"));
    fireEvent.click(await screen.findByText("Salvar rascunho"));
    await screen.findByText("Rascunho salvo no servidor.");
    expect(service.createFantasyLineup).toHaveBeenCalledWith(8,emptySelection());
    expect(screen.getByText("Escolha o técnico")).toBeTruthy(); expect(screen.queryByText(/Escalação completa/)).toBeNull();
  });
  it("uses only the backend complete flag", async () => {
    vi.mocked(service.createFantasyLineup).mockResolvedValue(testLineup(undefined,{validacao:{completa:true,pendencias:[]}}));
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />); fireEvent.click(await screen.findByText("Salvar rascunho"));
    expect(await screen.findByText("Escalação completa — rascunho salvo")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Formação tática"),{target:{value:"4-4-2"}}); expect(screen.queryByText("Escalação completa — rascunho salvo")).toBeNull();
  });
  it("keeps visualization but disables mutations after time lock", async () => {
    const c = testContext(); c.competition.partidas[0].inicioPrevisto = "2020-01-01T00:00:00Z"; vi.mocked(service.loadLineupContext).mockResolvedValue(c);
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    const button = await screen.findByText("Salvar rascunho"); expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("region",{name:"Campinho 4-3-3"})).toBeTruthy(); expect(screen.getByText(/Edição bloqueada pelo início/)).toBeTruthy();
  });
  it("allows captain only from starters and Reserva Power only from reserves", async () => {
    const { context, selection } = completeTestSelection("4-3-3"); vi.mocked(service.loadLineupContext).mockResolvedValue(context);
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue([testLineup(selection)]); vi.mocked(service.getFantasyLineup).mockResolvedValue(testLineup(selection));
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    await chooseTeam(12); await screen.findByText("Rascunho #12 · v1");
    expect(screen.queryByRole("combobox",{name:"Capitão"})).toBeNull(); expect(screen.queryByRole("combobox",{name:"Reserva Power"})).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 2"}));
    expect(screen.queryByRole("button",{name:"Ativar Reserva Power"})).toBeNull(); fireEvent.click(screen.getByRole("button",{name:"Tornar capitão"}));
    expect(screen.getByLabelText("Capitão escolhido").textContent).toBe("Jogador 2");
    fireEvent.click(screen.getByRole("button",{name:`Ações de Jogador ${selection.tecnico}`}));
    expect(screen.queryByRole("button",{name:/capitão/})).toBeNull(); expect(screen.queryByRole("button",{name:/Reserva Power/})).toBeNull();
  });
});
describe("Draft editing state and concurrency", () => {
  async function hook() { const result = renderHook(() => useLineupEditor(8)); await waitFor(() => expect(result.result.current.context).not.toBeNull()); return result; }
  it("resumes, edits with the current version and accepts the server response", async () => {
    const {result} = await hook(); await act(() => result.current.openDraft(12));
    act(() => result.current.setValue({...result.current.value,formacao:"4-4-2"}));
    await act(() => result.current.save());
    expect(service.updateFantasyLineup).toHaveBeenCalledWith(12,1,expect.objectContaining({formacao:"4-4-2"}));
    expect(result.current.saved?.versao).toBe(2); expect(result.current.dirty).toBe(false);
  });
  it("duplicates on the server, confirms deletion and prevents duplicate submissions", async () => {
    const {result} = await hook(); await act(() => result.current.openDraft(12));
    await act(async () => { await Promise.all([result.current.duplicate(),result.current.duplicate()]); });
    expect(service.duplicateFantasyLineup).toHaveBeenCalledTimes(1); expect(service.duplicateFantasyLineup).toHaveBeenCalledWith(12,1);
    expect(result.current.saved?.id).toBe(13);
    vi.mocked(service.deleteFantasyLineup).mockResolvedValue({id:13,excluida:true});
    vi.mocked(window.confirm).mockReturnValueOnce(false); await act(() => result.current.remove()); expect(service.deleteFantasyLineup).not.toHaveBeenCalled();
    await act(() => result.current.remove()); expect(service.deleteFantasyLineup).toHaveBeenCalledWith(13,1); expect(result.current.saved).toBeNull();
  });
  it("preserves local edits on 409 and requires confirmation before loading current version", async () => {
    const {result} = await hook(); await act(() => result.current.openDraft(12));
    act(() => result.current.setValue({...result.current.value,formacao:"4-4-2"}));
    vi.mocked(service.updateFantasyLineup).mockRejectedValue(new ApiError(409,"Versao desatualizada"));
    await act(() => result.current.save()); expect(result.current.conflict).toBe(true); expect(result.current.value.formacao).toBe("4-4-2");
    vi.mocked(window.confirm).mockReturnValueOnce(false); await act(() => result.current.reload()); expect(result.current.value.formacao).toBe("4-4-2");
    vi.mocked(service.getFantasyLineup).mockResolvedValue(testLineup(undefined,{versao:3})); await act(() => result.current.reload());
    expect(result.current.saved?.versao).toBe(3); expect(result.current.conflict).toBe(false);
  });
  it("treats temporal 409 as a write lock and keeps the selection", async () => {
    const {result} = await hook(); await act(() => result.current.openDraft(12));
    act(() => result.current.setValue({...result.current.value,titulares:[1]}));
    vi.mocked(service.updateFantasyLineup).mockRejectedValue(new ApiError(409,"Escalacao bloqueada: primeira partida iniciada/prevista"));
    await act(() => result.current.save()); expect(result.current.serverBlocked).toBe(true); expect(result.current.value.titulares).toEqual([1]);
  });
});

describe("Phase 2B.1 lineup UX", () => {
  async function filledEditor() {
    const { context, selection } = completeTestSelection("4-3-3");
    vi.mocked(service.loadLineupContext).mockResolvedValue(context);
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue([testLineup(selection)]);
    vi.mocked(service.getFantasyLineup).mockResolvedValue(testLineup(selection));
    vi.mocked(service.updateFantasyLineup).mockImplementation(async (_id, version, next) => testLineup(next,{versao:version+1}));
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    await chooseTeam(12);
    await screen.findByText("Rascunho #12 · v1");
    return { context, selection };
  }
  it("removes Cartola presentation but preserves categories, coins and status", async () => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Goleiro 1"}))[0]);
    const list = screen.getByRole("list",{name:"Atletas elegíveis"});
    expect(list.textContent).toContain("Prata · PC$ 20"); expect(list.textContent).toContain("Provável");
    expect(list.textContent).not.toContain("Cartola"); expect(list.textContent).not.toContain("8,55"); expect(list.textContent).toContain("PC$ 20");
  });
  it("preserves club, category, text and statuses on select, reopen and position change", async () => {
    const c = testContext(); c.athletes = [testAthlete(201,3,{apelido:"Preferido A"}),testAthlete(202,3,{apelido:"Preferido B",statusId:2}),testAthlete(203,4,{apelido:"Preferido Meia"}),testAthlete(204,6,{apelido:"Preferido Técnico"}),testAthlete(205,3,{apelido:"Outro clube",clubeIdExterno:263})];
    vi.mocked(service.loadLineupContext).mockResolvedValue(c);
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Zagueiro 1"}))[0]);
    fireEvent.click(screen.getByRole("button",{name:"Filtros"}));
    const clubs = screen.getAllByRole("group").find(group => group.querySelector("legend")?.textContent === "Clubes")!;
    fireEvent.click(within(clubs).getByRole("button",{name:"Limpar"})); fireEvent.click(within(clubs).getByRole("checkbox",{name:"Flamengo"}));
    fireEvent.click(screen.getByRole("checkbox",{name:"Bronze"})); fireEvent.click(screen.getByRole("checkbox",{name:"Ouro"}));
    fireEvent.change(screen.getByRole("searchbox"),{target:{value:"Preferido"}});
    fireEvent.click(screen.getByRole("button",{name:"Comprar Preferido A"}));
    fireEvent.click(screen.getByRole("button",{name:"Concluir"}));
    fireEvent.click(screen.getByRole("button",{name:"Adicionar Zagueiro 2"}));
    fireEvent.click(screen.getByRole("button",{name:/^Filtros/}));
    expect((screen.getByRole("checkbox",{name:"Flamengo"}) as HTMLInputElement).checked).toBe(true); expect((screen.getByRole("checkbox",{name:"Prata"}) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Preferido");
    for (const name of ["Provável","Dúvida"]) expect((screen.getByRole("checkbox",{name}) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Comprar Preferido B"}));
    fireEvent.click(screen.getAllByRole("button",{name:"Adicionar Meia 1"})[0]);
    expect(screen.getByText("MEI · 0/3")).toBeTruthy(); expect(screen.getByRole("button",{name:"Comprar Preferido Meia"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/^Filtros/}));
    expect((screen.getByRole("checkbox",{name:"Prata"}) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Fechar seletor"}));
    fireEvent.click(screen.getByRole("button",{name:"Adicionar Técnico 1"}));
    expect(screen.getByRole("button",{name:"Comprar Preferido Técnico"})).toBeTruthy();
  });
  it("keeps custom empty statuses and zero-result filters until explicit restore", async () => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Zagueiro 1"}))[0]);
    fireEvent.change(screen.getByRole("searchbox"),{target:{value:"Sem correspondência"}});
    fireEvent.click(screen.getByRole("button",{name:"Filtros"}));
    const statusGroup = screen.getAllByRole("group").find(group => group.querySelector("legend")?.textContent === "Situação")!;
    fireEvent.click(within(statusGroup).getByRole("button",{name:"Limpar"})); fireEvent.click(screen.getByRole("button",{name:"Fechar seletor"}));
    fireEvent.click(screen.getAllByRole("button",{name:"Adicionar Meia 1"})[0]);
    expect(screen.getByRole("button",{name:/^Filtros/})).toBeTruthy(); expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Sem correspondência");
    fireEvent.click(screen.getByRole("button",{name:/^Filtros/})); fireEvent.click(screen.getByText("Restaurar padrão")); expect(screen.getByText(/Nenhum atleta para esta posição/)).toBeTruthy();
    fireEvent.click(screen.getByText("Limpar filtros")); expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("checkbox",{name:"Suspenso"}) instanceof HTMLInputElement).toBe(true);
    fireEvent.click(screen.getByText("Restaurar filtros padrão")); expect((screen.getByRole("checkbox",{name:"Suspenso"}) as HTMLInputElement).checked).toBe(false);
  });
  it("preserves filters through saving, duplicating, removing and new drafts without marking edits dirty", async () => {
    const {result} = renderHook(() => useLineupEditor(8)); await waitFor(() => expect(result.current.context).not.toBeNull());
    const filters = {search:"Jogador",clubs:["262","263"],categories:["2","3"],statuses:["3","unknown"],sort:"asc" as const};
    act(() => result.current.setPickerFilters(filters)); expect(result.current.dirty).toBe(false);
    await act(() => result.current.save()); expect(result.current.pickerFilters).toEqual(filters);
    await act(() => result.current.duplicate()); expect(result.current.pickerFilters).toEqual(filters);
    act(() => result.current.newDraft()); expect(result.current.pickerFilters).toEqual(filters);
    await act(() => result.current.openDraft(12)); expect(result.current.pickerFilters).toEqual(filters);
    await act(() => result.current.remove()); expect(result.current.pickerFilters).toEqual(filters);
    expect(service.createFantasyLineup).toHaveBeenCalledWith(8,emptySelection());
  });
  it("changes captain from a starter, replaces the previous badge and sends the same versioned contract", async () => {
    const {selection} = await filledEditor();
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 2"}));
    expect(screen.queryByRole("button",{name:"Ativar Reserva Power"})).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Tornar capitão"}));
    expect(screen.queryByRole("dialog")).toBeNull(); expect(screen.getByLabelText("Capitão escolhido").textContent).toBe("Jogador 2");
    expect(document.querySelectorAll('[aria-label="Capitão"]')).toHaveLength(1);
    expect(service.updateFantasyLineup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"})); await screen.findByText("Rascunho #12 · v2");
    expect(service.updateFantasyLineup).toHaveBeenCalledWith(12,1,{...selection,capitaoAtletaId:2});
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 2"})); fireEvent.click(screen.getByRole("button",{name:"Remover capitão"}));
    expect(screen.getByLabelText("Capitão escolhido").textContent).toBe("Não definido"); expect(document.querySelector('[aria-label="Capitão"]')).toBeNull();
  });
  it("assigns one Reserva Power badge, replaces it, allows reserve goalkeeper and removes the title", async () => {
    const {selection} = await filledEditor();
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 13"}));
    expect(screen.queryByRole("button",{name:"Tornar capitão"})).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Ativar Reserva Power"}));
    expect(screen.getAllByRole("img",{name:"Reserva Power"})).toHaveLength(1);
    expect(screen.getByRole("button",{name:"Ações de Jogador 13"}).contains(screen.getByRole("img",{name:"Reserva Power"}))).toBe(true);
    expect(screen.getByRole("img",{name:"Reserva Power"}).tagName.toLowerCase()).toBe("svg");
    expect(screen.getByRole("img",{name:"Reserva Power"}).querySelector("path")).not.toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"})); await screen.findByText("Rascunho #12 · v2");
    expect(service.updateFantasyLineup).toHaveBeenCalledWith(12,1,{...selection,reservaMagoAtletaId:13});
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 12"})); fireEvent.click(screen.getByRole("button",{name:"Ativar Reserva Power"}));
    expect(screen.getByRole("button",{name:"Ações de Jogador 12"}).contains(screen.getByRole("img",{name:"Reserva Power"}))).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Salvar rascunho"})); await screen.findByText("Rascunho #12 · v3");
    expect(service.updateFantasyLineup).toHaveBeenCalledWith(12,2,{...selection,reservaMagoAtletaId:12});
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 12"})); fireEvent.click(screen.getByRole("button",{name:"Remover Reserva Power"}));
    expect(screen.queryByRole("img",{name:"Reserva Power"})).toBeNull(); expect(screen.getByLabelText("Reserva Power escolhido").textContent).toBe("Não definido");
  });
  it.each(["captain","mago"])("removing the %s athlete clears its title and closes the action dialog", async role => {
    await filledEditor(); const id = role === "captain" ? 1 : 12;
    fireEvent.click(screen.getByRole("button",{name:`Ações de Jogador ${id}`})); fireEvent.click(screen.getByRole("button",{name:"Vender"}));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByLabelText(role === "captain" ? "Capitão escolhido" : "Reserva Power escolhido").textContent).toBe("Não definido");
    expect(screen.queryByRole("button",{name:`Ações de Jogador ${id}`})).toBeNull();
  });
  it("coach offers only replace/remove; menus close on Escape or backdrop and never stack", async () => {
    await filledEditor(); fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 17"}));
    expect(screen.queryByRole("button",{name:/capitão/})).toBeNull(); expect(screen.queryByRole("button",{name:/Reserva Power/})).toBeNull();
    expect(screen.getByRole("button",{name:"Trocar jogador"})).toBeTruthy(); expect(screen.getByRole("button",{name:"Vender"})).toBeTruthy();
    fireEvent.click(screen.getByText("Ver informações do atleta")); expect(screen.getByText("Situação no catálogo")).toBeTruthy(); expect(screen.getByText("Clube")).toBeTruthy();
    const first = screen.getByRole("button",{name:"Fechar ações"}); const last = screen.getByText("Ver informações do atleta");
    last.focus(); fireEvent.keyDown(last,{key:"Tab"}); expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first,{key:"Tab",shiftKey:true}); expect(document.activeElement).toBe(last);
    fireEvent(screen.getByRole("dialog"),new Event("cancel",{cancelable:true})); expect(screen.queryByRole("dialog")).toBeNull();
    const trigger = screen.getByRole("button",{name:"Ações de Jogador 2"}); trigger.focus(); fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog"); expect(trigger.getAttribute("aria-expanded")).toBe("true"); expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("dialog")); expect(screen.queryByRole("dialog")).toBeNull(); expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger); fireEvent.click(screen.getByRole("button",{name:"Trocar jogador"}));
    expect(screen.getAllByRole("dialog")).toHaveLength(1); expect(screen.getByRole("heading",{name:"Escolher Lateral"})).toBeTruthy();
  });
  it("keeps filters after removing an athlete and starts a fresh editor with defaults", async () => {
    await filledEditor(); fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 2"})); fireEvent.click(screen.getByRole("button",{name:"Trocar jogador"}));
    fireEvent.change(screen.getByRole("searchbox"),{target:{value:"Preservar busca"}}); fireEvent.click(screen.getByRole("button",{name:"Fechar seletor"}));
    fireEvent.click(screen.getByRole("button",{name:"Ações de Jogador 2"})); fireEvent.click(screen.getByRole("button",{name:"Vender"}));
    fireEvent.click(screen.getByRole("button",{name:"Adicionar Lateral 1"})); expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Preservar busca");
    cleanup(); const {result} = renderHook(() => useLineupEditor(8)); expect(result.current.pickerFilters).toEqual(defaultPickerFilters());
  });
});

describe("Team navigation refinements", () => {
  it("switches across the complete flat list with discard confirmation and no visual paging", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue([12,25,42,80].map(id => testLineup(undefined,{id})));
    vi.mocked(service.getFantasyLineup).mockImplementation(async id => testLineup(undefined,{id}));
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />); await chooseTeam(12); await screen.findByText("Rascunho #12 · v1");
    fireEvent.change(screen.getByLabelText("Formação tática"),{target:{value:"4-4-2"}});
    vi.mocked(window.confirm).mockReturnValueOnce(false); await chooseTeam(80);
    expect(service.getFantasyLineup).toHaveBeenCalledTimes(1); expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("12");
    await chooseTeam(80); await screen.findByText("Rascunho #80 · v1");
    expect(service.getFantasyLineup).toHaveBeenLastCalledWith(80); expect(screen.queryByRole("button",{name:/página de times/i})).toBeNull();
  });
  it("loads the real API ID and confirms before discarding unsaved edits", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue([testLineup(),testLineup(undefined,{id:80})]);
    vi.mocked(service.getFantasyLineup).mockImplementation(async id => testLineup(undefined,{id}));
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    await chooseTeam(12); await screen.findByText("Rascunho #12 · v1");
    fireEvent.change(screen.getByLabelText("Formação tática"),{target:{value:"4-4-2"}});
    vi.mocked(window.confirm).mockReturnValueOnce(false); await chooseTeam(80);
    expect(service.getFantasyLineup).toHaveBeenCalledTimes(1); expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("12");
    await chooseTeam(80); await screen.findByText("Rascunho #80 · v1");
    expect(service.getFantasyLineup).toHaveBeenLastCalledWith(80); expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("80");
    expect(screen.getByText(/Completar um rascunho não confirma inscrição/)).toBeTruthy();
  });
  it("selects the duplicated draft and updates the combo after confirmed deletion", async () => {
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue([12,25,80].map(id => testLineup(undefined,{id})));
    vi.mocked(service.duplicateFantasyLineup).mockResolvedValue(testLineup(undefined,{id:99}));
    vi.mocked(service.deleteFantasyLineup).mockResolvedValue({id:99,excluida:true});
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    await chooseTeam(12); await screen.findByText("Rascunho #12 · v1");
    fireEvent.click(screen.getByRole("button",{name:"Criar variação"})); await screen.findByText("Rascunho #99 · v1");
    expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("99"); expect(service.duplicateFantasyLineup).toHaveBeenCalledWith(12,1);
    fireEvent.click(screen.getByRole("button",{name:"Excluir rascunho"})); await screen.findByText("Rascunho excluído.");
    expect(screen.queryByRole("option",{name:"Time 99"})).toBeNull(); expect(screen.getByRole("option",{name:"Time 80"})).toBeTruthy();
    expect(service.deleteFantasyLineup).toHaveBeenCalledWith(99,1);
  });
  it("restores captain and crown from the saved selection without role selects", async () => {
    const {context,selection} = completeTestSelection("4-3-3");
    vi.mocked(service.loadLineupContext).mockResolvedValue(context);
    vi.mocked(service.listMyFantasyLineups).mockResolvedValue([testLineup(selection)]); vi.mocked(service.getFantasyLineup).mockResolvedValue(testLineup(selection));
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />); await chooseTeam(12); await screen.findByText("Rascunho #12 · v1");
    expect(screen.queryByRole("combobox",{name:"Capitão"})).toBeNull(); expect(screen.queryByRole("combobox",{name:"Reserva Power"})).toBeNull();
    const bolt = screen.getByRole("img",{name:"Reserva Power"}); expect(bolt.tagName.toLowerCase()).toBe("svg");
    expect(bolt.querySelector('path[fill="#e9bd42"]')).not.toBeNull(); expect(bolt.querySelector("text")).toBeNull();
    expect(screen.getByLabelText("Capitão escolhido").textContent).toBe("Jogador 1"); expect(screen.getByLabelText("Reserva Power escolhido").textContent).toBe("Jogador 12");
    expect(screen.getByRole("button",{name:"Ações de Jogador 1"}).querySelector('[aria-label="Capitão"]')?.textContent).toBe("C");
  });
  it("new time keeps filters and confirms dirty state, without creating an anonymous or automatic draft", async () => {
    render(<LineupEditor competitionId={8} onBack={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button",{name:"Adicionar Goleiro 1"}))[0]);
    fireEvent.change(screen.getByRole("searchbox"),{target:{value:"Jogador"}}); fireEvent.click(screen.getByRole("button",{name:"Comprar Jogador 1"}));
    vi.mocked(window.confirm).mockReturnValueOnce(false); fireEvent.click(screen.getByRole("button",{name:"+ Novo time"})); expect(screen.getByRole("button",{name:"Ações de Jogador 1"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"+ Novo time"})); expect(screen.queryByRole("button",{name:"Ações de Jogador 1"})).toBeNull();
    fireEvent.click(screen.getAllByRole("button",{name:"Adicionar Goleiro 1"})[0]); expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Jogador");
    expect(service.createFantasyLineup).not.toHaveBeenCalled();
  });
});
