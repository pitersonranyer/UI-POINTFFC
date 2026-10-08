import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { DesafioJogo } from "@/services/desafioService";
import { DesafioMatch } from "./DesafioMatch";

const oldGame: DesafioJogo = {
  id: 14, ordem: 1, nomeCompeticao: "Brasileirão", nomeMandante: "SC Internacional", nomeVisitante: "SC Corinthians Paulista",
  logoMandanteUrl: null, logoVisitanteUrl: null, dataInicio: "2026-10-07T22:30:00Z", fechamentoEm: "2026-10-07T22:30:00Z",
  status: "AGENDADA", podeAlterarPalpite: true, meuPalpite: "CASA",
};
const game: DesafioJogo = { ...oldGame, mandanteNome: "Internacional", visitanteNome: "Corinthians", golsMandante: null, golsVisitante: null, pontos: null, apurado: false };
beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function show(change: Partial<DesafioJogo> = {}, authenticated = true, base = game) {
  const choose = vi.fn();
  render(<ol><DesafioMatch game={{ ...base, ...change }} authenticated={authenticated} disabled={false} saving={false} saved={false} missing={false} choose={choose} /></ol>);
  return choose;
}
it("usa diretamente os nomes oficiais novos na partida e na acessibilidade", () => {
  show({ nomeMandante: undefined, nomeVisitante: undefined });
  expect(screen.getByText("Internacional")).toBeTruthy();
  expect(screen.getByText("Corinthians")).toBeTruthy();
  expect(screen.getByRole("group", { name: "Palpite: Internacional x Corinthians" })).toBeTruthy();
  expect(screen.queryByText("SC Internacional")).toBeNull();
});
it.each([{ golsMandante: null, golsVisitante: null }, { golsMandante: 1, golsVisitante: null }, { golsMandante: undefined, golsVisitante: 0 }])("não exibe placar incompleto ou placeholders: %j", change => {
  show(change);
  expect(screen.queryByLabelText(/Placar do/)).toBeNull();
  expect(screen.getByRole("listitem").textContent).not.toMatch(/- x -|0 x 0/);
});
it("mostra cada gol imediatamente após seu time, incluindo zero", () => {
  show({ status: "EM_ANDAMENTO", podeAlterarPalpite: false, golsMandante: 1, golsVisitante: 0 });
  const home = screen.getByLabelText("Placar do Internacional"), away = screen.getByLabelText("Placar do Corinthians");
  expect(home.textContent).toBe("1"); expect(away.textContent).toBe("0");
  expect(home.previousElementSibling?.textContent).toBe("Internacional");
  expect(away.previousElementSibling?.textContent).toBe("Corinthians");
  expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
it("não apresenta acerto definitivo durante jogo mesmo com apuração na resposta", () => {
  show({ status: "EM_ANDAMENTO", apurado: true, pontos: 1 });
  expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
it.each([false, null, undefined])("não exibe resultado quando apurado é %s, mesmo com pontos", apurado => {
  show({ status: "FINALIZADA", podeAlterarPalpite: false, pontos: 1, apurado });
  expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
it.each([[1, "✓ Acertou · +1 ponto"], [0, "✕ Errou · 0 ponto"]] as const)("exibe pontos %s retornados sem recalcular pelo placar", (pontos, label) => {
  // Empate no placar e palpite CASA: somente os pontos persistidos determinam a mensagem.
  const choose = show({ status: "FINALIZADA", podeAlterarPalpite: false, golsMandante: 0, golsVisitante: 0, apurado: true, pontos });
  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Casa" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getAllByRole("button").every(button => (button as HTMLButtonElement).disabled)).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Fora" })); expect(choose).not.toHaveBeenCalled();
});
it.each([null, undefined, 2])("não inventa resultado para pontos %s", pontos => {
  show({ apurado: true, pontos }); expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
it.each([0, 1])("anulada prioriza estado neutro mesmo com apuração e pontos %s", pontos => {
  show({ status: "ANULADA", podeAlterarPalpite: false, apurado: true, pontos });
  expect(screen.getByText("Anulada")).toBeTruthy(); expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
it("não apresenta resultado privado para usuário deslogado", () => {
  show({ apurado: true, pontos: 1 }, false); expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
});
it("preserva resposta antiga sem novos campos e salvamento das opções", () => {
  const choose = show({}, true, oldGame);
  expect(screen.getByRole("group", { name: "Palpite: SC Internacional x SC Corinthians Paulista" })).toBeTruthy();
  expect(screen.queryByLabelText(/Placar do/)).toBeNull(); expect(screen.queryByText(/Acertou|Errou/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Empate" })); expect(choose).toHaveBeenCalledWith(oldGame, "EMPATE");
});
it("usa nomes antigos quando novos nomes são null", () => {
  show({ mandanteNome: null, visitanteNome: null });
  expect(screen.getByText("SC Internacional")).toBeTruthy(); expect(screen.getByText("SC Corinthians Paulista")).toBeTruthy();
});
