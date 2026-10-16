import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LineupAthleteActions } from "./LineupAthleteActions";
import { LineupPitch } from "./LineupPitch";
import { completeTestSelection, testAthlete } from "./lineupTestFixtures";
import type { SlotRole } from "@/types/pointFantasyLineup";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype,"showModal",{configurable:true,value:function(){this.setAttribute("open","");}});
  Object.defineProperty(HTMLDialogElement.prototype,"close",{configurable:true,value:function(){this.removeAttribute("open");}});
});
afterEach(cleanup);
function props(role: SlotRole = "titulares") { return {athlete:testAthlete(1,5,{apelido:"Atleta de teste",statusId:2}),clubName:"Flamengo",role,captain:false,powerReserve:false,canReplace:true,onCaptain:vi.fn(),onPowerReserve:vi.fn(),onReplace:vi.fn(),onRemove:vi.fn(),onClose:vi.fn()}; }

describe("Compact reusable athlete actions", () => {
  it.each(["titulares","reservas","tecnico"] as const)("provides the correct actions for %s with removal last", role => {
    const p=props(role);render(<LineupAthleteActions {...p} />);
    const dialog=screen.getByRole("dialog",{name:"Atleta de teste"});
    expect(dialog.getAttribute("data-fantasy-athlete-actions")).toBe(role);
    expect(within(dialog).getByRole("group",{name:"Ações do atleta"})).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(within(dialog).getByRole("heading",{name:"Atleta de teste"})).toBeTruthy();
    expect(within(dialog).queryByRole("button",{name:/capitão/})!==null).toBe(role==="titulares");
    expect(within(dialog).queryByRole("button",{name:/Reserva Power/})!==null).toBe(role==="reservas");
    if(role==="reservas")expect(within(dialog).getByText("Atacante · Reserva")).toBeTruthy();
    const buttons=within(dialog).getAllByRole("button");expect(buttons[buttons.length-1].textContent).toBe("Vender");
    expect(within(dialog).queryByRole("button",{name:"Remover da escalação"})).toBeNull();
    fireEvent.click(within(dialog).getByRole("button",{name:"Trocar jogador"}));expect(p.onReplace).toHaveBeenCalledOnce();
    fireEvent.click(within(dialog).getByRole("button",{name:"Vender"}));expect(p.onRemove).toHaveBeenCalledOnce();
  });
  it.each([false,true])("preserves the captain toggle callback (active=%s)", captain => {
    const p={...props(),captain};render(<LineupAthleteActions {...p} />);
    expect(screen.queryByRole("img",{name:"Capitão ativo"})!==null).toBe(captain);
    if(captain) expect(screen.getByRole("img",{name:"Capitão ativo"}).textContent).toBe("C");
    fireEvent.click(screen.getByRole("button",{name:captain?"Remover capitão":"Tornar capitão"}));expect(p.onCaptain).toHaveBeenCalledOnce();
  });
  it.each([false,true])("preserves Reserva Power toggle callback (active=%s)", powerReserve => {
    const p={...props("reservas"),powerReserve};render(<LineupAthleteActions {...p} />);
    expect(screen.queryByRole("img",{name:"Reserva Power ativo"})!==null).toBe(powerReserve);
    fireEvent.click(screen.getByRole("button",{name:powerReserve?"Remover Reserva Power":"Ativar Reserva Power"}));expect(p.onPowerReserve).toHaveBeenCalledOnce();
  });
  it("does not offer replacement when the existing rules prohibit it", () => {
    render(<LineupAthleteActions {...props()} canReplace={false} />); expect(screen.queryByRole("button",{name:"Trocar jogador"})).toBeNull();
  });
  it("keeps athlete information in the native expandable section before removal", () => {
    const {container}=render(<LineupAthleteActions {...props()} />);
    const summary=screen.getByText("Informações do atleta").closest("summary")!;fireEvent.click(summary);
    expect(container.querySelector("details")?.open).toBe(true);
    expect(screen.getByText("Flamengo")).toBeTruthy();expect(screen.getByText("Dúvida")).toBeTruthy();expect(screen.getByText("PC$ 20")).toBeTruthy();
    expect(summary.compareDocumentPosition(screen.getByRole("button",{name:"Vender"})) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("focuses close, traps Tab, handles cancel/backdrop and restores the trigger", () => {
    const trigger=document.createElement("button");document.body.append(trigger);trigger.focus();
    const p=props();const {unmount}=render(<LineupAthleteActions {...p} />);
    const first=screen.getByRole("button",{name:"Fechar ações"}),last=screen.getByRole("button",{name:"Vender"});
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first,{key:"Tab",shiftKey:true});expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last,{key:"Tab"});expect(document.activeElement).toBe(first);
    const dialog=screen.getByRole("dialog");fireEvent(dialog,new Event("cancel",{cancelable:true}));expect(p.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(dialog);expect(p.onClose).toHaveBeenCalledTimes(2);fireEvent.click(first);expect(p.onClose).toHaveBeenCalledTimes(3);
    unmount();expect(document.activeElement).toBe(trigger);trigger.remove();
  });
});
describe("Conditions on the pitch and bench", () => {
  it("keeps condition, captain and Power in distinct elements attached to the same representation", () => {
    const {context,selection}=completeTestSelection("4-3-3");context.athletes[0].statusId=3;context.athletes[11].statusId=5;
    render(<LineupPitch value={selection} athletes={context.athletes} disabled={false} onOpen={vi.fn()} onRemove={vi.fn()} onCaptain={vi.fn()} onPowerReserve={vi.fn()} />);
    const captain=screen.getByRole("button",{name:"Ações de Jogador 1"}),power=screen.getByRole("button",{name:"Ações de Jogador 12"});
    expect(within(captain).getByRole("img",{name:"Suspenso"})).toBeTruthy();expect(within(captain).getByLabelText("Capitão")).toBeTruthy();
    expect(within(power).getByRole("img",{name:"Contundido"})).toBeTruthy();expect(within(power).getByRole("img",{name:"Reserva Power"})).toBeTruthy();
    for (const [button, name] of [[captain,"Suspenso"],[power,"Contundido"]] as const) {
      const condition=within(button).getByRole("img",{name});
      expect(condition.getAttribute("width")).toBe("13");
      expect(condition.style.width).toBe("13px");
      expect(condition.querySelector("title")?.textContent).toBe(`Condição: ${name}`);
    }
    expect(within(captain).getByRole("img",{name:"Suspenso"}).parentElement).not.toBe(within(captain).getByLabelText("Capitão"));
    expect(screen.getByTestId("coach-slot").querySelector('[aria-label="Provável"]')).toBeTruthy();
  });
});
