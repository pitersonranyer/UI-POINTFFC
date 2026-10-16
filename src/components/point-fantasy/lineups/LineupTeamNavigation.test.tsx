import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LineupTeamNavigation } from "./LineupTeamNavigation";
import { testLineup } from "./lineupTestFixtures";
afterEach(cleanup);
const drafts = [90,12,55,18,105,700,22].map(id => testLineup(undefined,{id}));
it("shows every real ID as a flat option and opens only the requested ID", () => {
  const onOpen = vi.fn(); const props = {drafts,currentId:null as number|null,busy:false,canCreate:true,canDuplicate:false,dirty:false,limit:8,onOpen,onNew:vi.fn(),onDuplicate:vi.fn()};
  render(<LineupTeamNavigation {...props} />);
  const select = screen.getByRole("combobox",{name:"Time em edição"});
  expect(within(select).getAllByRole("option").map(b => b.textContent)).toEqual(["Novo time · não salvo","Time #12 · Rascunho antigo","Time #18 · Rascunho antigo","Time #22 · Rascunho antigo","Time #55 · Rascunho antigo","Time #90 · Rascunho antigo","Time #105 · Rascunho antigo","Time #700 · Rascunho antigo"]);
  fireEvent.change(select,{target:{value:"105"}}); expect(onOpen).toHaveBeenCalledWith(105);
  expect(select.querySelector("optgroup")).toBeNull(); expect(screen.getAllByRole("button")).toHaveLength(3);
  expect(screen.queryByText(/Página|Anterior|Próxima/)).toBeNull();
});
it("keeps the current team and stable IDs after edits and deletion", () => {
  const props = {drafts,currentId:700,busy:false,canCreate:true,canDuplicate:true,dirty:false,onOpen:vi.fn(),onNew:vi.fn(),onDuplicate:vi.fn()};
  const {rerender} = render(<LineupTeamNavigation {...props} />);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("700");
  fireEvent.change(screen.getByRole("combobox",{name:"Time em edição"}),{target:{value:"700"}}); expect(props.onOpen).not.toHaveBeenCalled();
  rerender(<LineupTeamNavigation {...props} drafts={drafts.map(d => ({...d,versao:2}))} />);
  expect(screen.getByRole("option",{name:"Time #700 · Rascunho antigo"})).toBeTruthy();
  rerender(<LineupTeamNavigation {...props} drafts={drafts.filter(d => d.id !== 12)} />);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("700");
  rerender(<LineupTeamNavigation {...props} currentId={null} drafts={drafts.filter(d => d.id < 55)} />);
  expect(screen.getByRole("option",{name:"Time #18 · Rascunho antigo"})).toBeTruthy(); expect(screen.queryByRole("option",{name:"Time #700 · Rascunho antigo"})).toBeNull();
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("");
});
it("supports more than 30 drafts with a single native select and no visual paging", () => {
  const many = Array.from({length:35},(_,i) => testLineup(undefined,{id:100+i})); const onOpen = vi.fn();
  render(<LineupTeamNavigation drafts={many} currentId={134} busy={false} canCreate canDuplicate dirty={false} onOpen={onOpen} onNew={vi.fn()} onDuplicate={vi.fn()} />);
  const select = screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement;
  expect(select.options).toHaveLength(36); expect(select.value).toBe("134"); expect(select.multiple).toBe(false);
  expect(select.querySelector("optgroup")).toBeNull(); expect(screen.getAllByRole("button")).toHaveLength(4);
  fireEvent.change(select,{target:{value:"130"}}); expect(onOpen).toHaveBeenCalledWith(130);
});
it("disables writes and navigation while busy and offers explicit new time action", () => {
  const onNew = vi.fn(); const props = {drafts,currentId:null as number|null,busy:true,canCreate:true,canDuplicate:false,dirty:false,onOpen:vi.fn(),onNew,onDuplicate:vi.fn()};
  const {rerender} = render(<LineupTeamNavigation {...props} />);
  for (const button of screen.getAllByRole("button")) expect((button as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).disabled).toBe(true);
  rerender(<LineupTeamNavigation {...props} busy={false} canCreate={false} />);
  expect((screen.getByRole("button",{name:"+ Novo time"}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).disabled).toBe(false);
  rerender(<LineupTeamNavigation {...props} busy={false} />); fireEvent.click(screen.getByRole("button",{name:"+ Novo time"})); expect(onNew).toHaveBeenCalledOnce();
});
it("offers duplication only for a clean saved team and routes the action once", () => {
  const onDuplicate = vi.fn(); const props = {drafts,currentId:12,busy:false,canCreate:true,canDuplicate:false,dirty:true,onOpen:vi.fn(),onNew:vi.fn(),onDuplicate};
  const {rerender} = render(<LineupTeamNavigation {...props} />);
  expect((screen.getByRole("button",{name:"Duplicar time"}) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Salve as alterações antes de duplicar.")).toBeTruthy();
  rerender(<LineupTeamNavigation {...props} dirty={false} canDuplicate />);
  fireEvent.click(screen.getByRole("button",{name:"Duplicar time"}));
  expect(onDuplicate).toHaveBeenCalledOnce();
});
it("shows actual team count and disables creation when the API limit is reached", () => {
  const props = {drafts,currentId:null as number|null,busy:false,canCreate:false,canDuplicate:false,dirty:false,limit:7,onOpen:vi.fn(),onNew:vi.fn(),onDuplicate:vi.fn()};
  render(<LineupTeamNavigation {...props} />);
  expect(screen.getByText("7/7 times")).toBeTruthy();
  expect((screen.getByRole("button",{name:"+ Novo time"}) as HTMLButtonElement).disabled).toBe(true);
});
