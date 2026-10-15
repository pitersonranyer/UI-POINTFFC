import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ReserveCategoryMedal } from "./ReserveCategoryMedal";
import { LineupPitch } from "./LineupPitch";
import { completeTestSelection } from "./lineupTestFixtures";
afterEach(cleanup);
it.each([[1,"Bronze","#bc8050","B"],[2,"Prata","#c1ccd5","P"],[3,"Ouro","#e7bf4e","O"]] as const)("shows an accessible %s medal with tooltip", (id,name,color,letter) => {
  render(<ReserveCategoryMedal categoryId={id} />);
  const medal = screen.getByRole("img",{name:`Categoria do reserva: ${name}`});
  expect(medal.querySelector("title")?.textContent).toBe(`Categoria do reserva: ${name}`);
  expect(medal.querySelector(`circle[fill="${color}"]`)).not.toBeNull(); expect(medal.querySelector("text")?.textContent).toBe(letter);
});
it("shows the actual reserve category rather than the ceiling, independently of the Mago crown", () => {
  const {context,selection} = completeTestSelection("4-3-3");
  context.athletes.find(a => a.id === selection.titulares[0])!.categoriaId = 3;
  context.athletes.find(a => a.id === selection.reservas[0])!.categoriaId = 1;
  render(<LineupPitch value={selection} athletes={context.athletes} disabled={false} onOpen={vi.fn()} onRemove={vi.fn()} onCaptain={vi.fn()} onMago={vi.fn()} />);
  const bench = screen.getByRole("region",{name:"Banco de reservas"});
  expect(within(bench).getAllByRole("img",{name:/^Categoria do reserva:/})).toHaveLength(5);
  expect(within(bench).getAllByRole("img",{name:"Categoria do reserva: Bronze"})).toHaveLength(1);
  expect(within(bench).queryByRole("img",{name:"Categoria do reserva: Ouro"})).toBeNull();
  expect(within(bench).getByRole("img",{name:"Reserva do Mago"})).toBeTruthy();
  expect(bench.textContent).not.toContain("Até "); expect(bench.textContent).not.toContain("Goleiro · Bronze");
  expect(bench.textContent).toContain("Goleiro"); expect(bench.textContent).toContain("Jogador 12");
  expect(within(screen.getByRole("region",{name:"Campinho 4-3-3"})).queryByRole("img",{name:/^Categoria do reserva:/})).toBeNull();
});
it.each([null,999])("does not invent a medal for unknown category %s", categoryId => {
  render(<ReserveCategoryMedal categoryId={categoryId} />); expect(screen.queryByRole("img")).toBeNull();
});
