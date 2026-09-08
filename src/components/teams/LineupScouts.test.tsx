import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LineupScouts } from "./LineupScouts";
import styles from "./LineupScouts.module.css";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("mostra siglas e quantidades, com cores por tipo e sem ícones", () => {
  vi.stubGlobal("React", React);
  const { container } = render(<LineupScouts scout={{ G: 1, DS: 3, CA: 1, FC: 2, A: 0 }} />);
  expect(screen.getByText("G").className).toBe(styles.positive);
  expect(screen.getByText("3DS").className).toBe(styles.positive);
  expect(screen.getByText("CA").className).toBe(styles.negative);
  expect(screen.getByText("2FC").className).toBe(styles.negative);
  expect(screen.queryByText("A")).toBeNull();
  expect(container.querySelector("svg,img")).toBeNull();
});
it.each<Record<string, number> | null | undefined>([undefined, null, {}, { G: 0 }])("omite scouts vazios: %j", (scout) => {
  vi.stubGlobal("React", React);
  const { container } = render(<LineupScouts scout={scout} />);
  expect(container.textContent).toBe("");
});
