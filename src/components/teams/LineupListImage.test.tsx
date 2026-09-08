import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LineupListImage } from "./LineupListImage";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const club = { escudos: { "60x60": "/clubes_2026/escudos/INT/60x60.png" } };
const shirt = "/clubes_2026/silhuetas/INT/140x140.png";

it("usa a camisa do mesmo clube e temporada quando a foto está ausente", () => {
  const { container } = render(<LineupListImage photo="" club={club} name="Atleta" />);
  expect(container.querySelector("img")?.getAttribute("src")).toBe(shirt);
});
it("prioriza foto e usa camisa quando ela falha, sem loop se ambas falharem", () => {
  const { container } = render(<LineupListImage photo="/photo.png" club={club} name="Atleta" />);
  expect(container.querySelector("img")?.getAttribute("src")).toBe("/photo.png");
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")?.getAttribute("src")).toBe(shirt);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toBe("A");
});
it("aceita uma nova URL após a anterior falhar", () => {
  const { container, rerender } = render(<LineupListImage photo="/old.png" club={{}} name="Atleta" />);
  fireEvent.error(container.querySelector("img")!);
  rerender(<LineupListImage photo="/new.png" club={{}} name="Atleta" />);
  expect(container.querySelector("img")?.getAttribute("src")).toBe("/new.png");
});
