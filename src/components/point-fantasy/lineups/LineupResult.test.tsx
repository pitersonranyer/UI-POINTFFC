import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LineupResult } from "./LineupResult";
import { LineupPitch } from "./LineupPitch";
import { completeTestSelection, testLineup } from "./lineupTestFixtures";
import type { LineupResultDetailDto } from "@/types/pointFantasyResult";

afterEach(cleanup);
const { context, selection } = completeTestSelection("4-3-3");
function result(points = "0"): LineupResultDetailDto {
  return { pontuacao: points, estadoPontuacao:"PARCIAL", revisao:"1", atualizadoEm:"2026-11-02T12:00:00Z", posicao:null,
    capitaoOriginalAtletaId:1, capitaoEfetivoAtletaId:1, reservaMagoAtletaId:selection.reservas[0], reservasUtilizados:[], titularesSubstituidos:[], contribuicoes:[], substituicoes:[],
    atletas:context.athletes.map(a => ({ catalogoAtletaId:a.id, papelOriginal:selection.reservas.includes(a.id) ? "RESERVA" : a.posicaoId === 6 ? "TECNICO" : "TITULAR",
      pontuacaoOficial:points, pontuacaoContabilizada:points, multiplicador:a.id === 1 ? 2 : 1, titularEfetivo:true, capitaoOriginal:a.id === 1, capitaoEfetivo:a.id === 1,
      reservaMagoDesignado:a.id === selection.reservas[0], reservaUtilizado:false, utilizadoComoMago:false, entrouEmCampo:true, origemParticipacao:"REGISTRO_OFICIAL" })) };
}
function lineup(data?: LineupResultDetailDto) {
  return testLineup(selection, { status:"INSCRITA", resultado:data, atletas:context.athletes.map(atleta => ({atleta, catalogoAtletaId:atleta.id, papel:selection.reservas.includes(atleta.id) ? "RESERVA" : atleta.posicaoId === 6 ? "TECNICO" : "TITULAR"})) });
}
it.each(["10.5", "0", "-4.5"])("shows official total %s without adding contributions", points => {
  render(<LineupResult lineup={lineup(result(points))}/>);
  expect(screen.getByRole("heading").textContent).toContain(Number(points).toLocaleString("pt-BR"));
});
it.each(["PARCIAL", "DEFINITIVO"] as const)("labels %s only from API", state => {
  render(<LineupResult lineup={lineup({...result(), estadoPontuacao:state})}/>);
  expect(screen.getByRole("status").textContent).toBe(state === "PARCIAL" ? "Resultado parcial" : "Resultado definitivo");
});
it("distinguishes unavailable results and ignores drafts", () => {
  const view=render(<LineupResult lineup={lineup()}/>);
  expect(screen.getByText("Resultado ainda não disponível")).toBeTruthy();
  view.rerender(<LineupResult lineup={{...lineup(result()), status:"RASCUNHO"}}/>);
  expect(screen.queryByLabelText("Resultado oficial")).toBeNull();
});
it("keeps an unavailable official total null even with numeric contributions", () => {
  render(<LineupResult lineup={lineup({...result("9"), pontuacao:null, estadoPontuacao:"INDISPONIVEL"})}/>);
  expect(screen.getByRole("heading").textContent).toBe("Pontuação oficial: —");
  expect(screen.getByText("Resultado indisponível")).toBeTruthy();
});
it.each(["COMUM", "MAGO"] as const)("describes %s substitution using effective API points", regra => {
  const data=result(); data.substituicoes=[{titularSaiuId:1,reservaEntrouId:selection.reservas[0],regra,pontuacaoOficial:"3",pontuacaoContabilizada:"6",multiplicador:2,herdouCapitao:true}];
  render(<LineupResult lineup={lineup(data)}/>);
  expect(screen.getByRole("listitem").textContent).toContain("6 pts contabilizados");
  expect(screen.getByRole("listitem").textContent).toContain("C 2x herdado");
  expect(screen.getByRole("listitem").textContent).toContain(regra === "MAGO" ? "Reserva do Mago" : "Substituição comum");
});
it.each([false,true])("shows captain, coach, original roster and Mago used=%s", used => {
  const data=result("0"); data.atletas[0].pontuacaoContabilizada="-6";
  const mago=data.atletas.find(a => a.reservaMagoDesignado)!; mago.reservaUtilizado=used; mago.utilizadoComoMago=used;
  data.atletas[1].pontuacaoOficial=null; data.atletas[1].entrouEmCampo=null;
  render(<LineupPitch result={data} value={selection} athletes={context.athletes} disabled onOpen={()=>{}} onRemove={()=>{}} onCaptain={()=>{}} onPowerReserve={()=>{}}/>);
  expect(screen.getByText("C · 2x")).toBeTruthy(); expect(screen.getByText("-6 pts contabilizados")).toBeTruthy();
  expect(screen.getByText(used ? "M · Utilizado como Mago" : "M · Não utilizado")).toBeTruthy();
  expect(screen.getByText("Sem pontuação disponível")).toBeTruthy(); expect(screen.getAllByText("0 pts oficiais").length).toBeGreaterThan(0);
  expect(screen.getByTestId("coach-slot").textContent).toContain("0 pts oficiais");
});
