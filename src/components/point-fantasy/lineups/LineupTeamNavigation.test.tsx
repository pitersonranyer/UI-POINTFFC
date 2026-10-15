import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LineupTeamNavigation } from "./LineupTeamNavigation";
import { testLineup } from "./lineupTestFixtures";
afterEach(cleanup);
const drafts = [90,12,55,18,105,700,22].map(id => testLineup(undefined,{id}));
it("shows every real ID as a flat option and opens only the requested ID", () => {
  const onOpen = vi.fn(); const props = {drafts,currentId:null as number|null,busy:false,canCreate:true,onOpen,onNew:vi.fn()};
  render(<LineupTeamNavigation {...props} />);
  const select = screen.getByRole("combobox",{name:"Time em edição"});
  expect(within(select).getAllByRole("option").map(b => b.textContent)).toEqual(["Novo time · não salvo","Time 12","Time 18","Time 22","Time 55","Time 90","Time 105","Time 700"]);
  fireEvent.change(select,{target:{value:"105"}}); expect(onOpen).toHaveBeenCalledWith(105);
  expect(select.querySelector("optgroup")).toBeNull(); expect(screen.getAllByRole("button")).toHaveLength(1);
  expect(screen.queryByText(/Página|Anterior|Próxima/)).toBeNull();
});
it("keeps the current team and stable IDs after edits and deletion", () => {
  const props = {drafts,currentId:700,busy:false,canCreate:true,onOpen:vi.fn(),onNew:vi.fn()};
  const {rerender} = render(<LineupTeamNavigation {...props} />);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("700");
  fireEvent.change(screen.getByRole("combobox",{name:"Time em edição"}),{target:{value:"700"}}); expect(props.onOpen).not.toHaveBeenCalled();
  rerender(<LineupTeamNavigation {...props} drafts={drafts.map(d => ({...d,versao:2}))} />);
  expect(screen.getByRole("option",{name:"Time 700"})).toBeTruthy();
  rerender(<LineupTeamNavigation {...props} drafts={drafts.filter(d => d.id !== 12)} />);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("700");
  rerender(<LineupTeamNavigation {...props} currentId={null} drafts={drafts.filter(d => d.id < 55)} />);
  expect(screen.getByRole("option",{name:"Time 18"})).toBeTruthy(); expect(screen.queryByRole("option",{name:"Time 700"})).toBeNull();
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).value).toBe("");
});
it("supports more than 30 drafts with a single native select and no visual paging", () => {
  const many = Array.from({length:35},(_,i) => testLineup(undefined,{id:100+i})); const onOpen = vi.fn();
  render(<LineupTeamNavigation drafts={many} currentId={134} busy={false} canCreate onOpen={onOpen} onNew={vi.fn()} />);
  const select = screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement;
  expect(select.options).toHaveLength(36); expect(select.value).toBe("134"); expect(select.multiple).toBe(false);
  expect(select.querySelector("optgroup")).toBeNull(); expect(screen.getAllByRole("button")).toHaveLength(1);
  fireEvent.change(select,{target:{value:"130"}}); expect(onOpen).toHaveBeenCalledWith(130);
});
it("disables writes and navigation while busy and offers explicit new time action", () => {
  const onNew = vi.fn(); const props = {drafts,currentId:12,busy:true,canCreate:true,onOpen:vi.fn(),onNew};
  const {rerender} = render(<LineupTeamNavigation {...props} />);
  for (const button of screen.getAllByRole("button")) expect((button as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).disabled).toBe(true);
  rerender(<LineupTeamNavigation {...props} busy={false} canCreate={false} />);
  expect((screen.getByRole("button",{name:"+ Novo time"}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("combobox",{name:"Time em edição"}) as HTMLSelectElement).disabled).toBe(false);
  rerender(<LineupTeamNavigation {...props} busy={false} />); fireEvent.click(screen.getByRole("button",{name:"+ Novo time"})); expect(onNew).toHaveBeenCalledOnce();
});
