import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Bench } from "./FieldLineup";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("aplica camisa, ausência de pontuação e remoção do escudo pequeno também ao banco", () => {
  vi.stubGlobal("React", React);
  const player = { atleta_id: 1, clube_id: 1, posicao_id: 1, apelido: "Reserva", entrou_em_campo: null, pontuacaoContabilizada: 0 };
  const clubs = { "1": { escudos: { "60x60": "/clubes_2026/escudos/INT/60x60.png" } } };
  const { container, rerender } = render(<Bench players={[player]} clubs={clubs} effective />);
  expect(screen.getByText("-- pts")).toBeTruthy();
  expect(container.querySelectorAll("img")).toHaveLength(1);
  expect(container.querySelector("img")?.getAttribute("src")).toBe("/clubes_2026/silhuetas/INT/140x140.png");
  rerender(<Bench players={[{ ...player, entrou_em_campo: true }]} clubs={clubs} effective />);
  expect(screen.getByText("0,00 pts")).toBeTruthy();
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toBeNull();
});
