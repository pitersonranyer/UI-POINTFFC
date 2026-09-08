import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CartolaMarketStatus } from "./CartolaMarketStatus";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("status do mercado", () => {
  for (const aberto of [true, false]) for (const aoVivo of [true, false]) {
    it(`aberto=${aberto}, bola rolando=${aoVivo}`, () => {
      const { container } = render(<CartolaMarketStatus mercado={{ rodada_atual: 26, status_mercado: aberto ? 1 : 2, bola_rolando: aoVivo }} aberto={aberto} aoVivo={aoVivo} atualizar={() => {}} />);
      expect(container.querySelector("section")?.getAttribute("data-market-open")).toBe(String(aberto));
      expect(screen.getByText(aberto ? "Aberto" : "Fechado")).toBeTruthy();
      expect(screen.queryByText(/Ao vivo/i) !== null).toBe(!aberto && aoVivo);
      expect(screen.getByText(aberto ? "Mercado aberto para escalações da rodada." : "Mercado fechado para escalações. Acompanhe as parciais e os jogos em tempo real.")).toBeTruthy();
    });
  }
});
