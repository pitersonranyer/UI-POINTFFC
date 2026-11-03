import React, { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MatchCenterPage, MatchCenterQueryPage } from "./MatchCenterPage";
import { FantasyFieldLineup, playerCoordinates, tacticalRows } from "./FantasyFieldLineup";
import formation321 from "./__fixtures__/formation-321.json";
import { apiFetch } from "@/services/apiClient";
import { createMatchCenterLoader } from "@/services/matchCenterService";
import type { FantasyPlayer, FantasyStatisticsValues, MatchCenterResponses } from "@/types/fantasy";
import FantasyMatchRoute, { generateStaticParams, dynamicParams } from "@/app/fantasy/partidas/[fixtureId]/page";
import { metadata } from "@/app/fantasy/layout";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
// Test-only contract excerpts; never imported by public components.
const team = { idExterno: 9, nome: "Fluminense", logo: null };
const away = { idExterno: 3, nome: "Internacional", logo: null };
const role = { nome: "Atacante", codigo: "ATA", categoria: "ATA" };
const player: FantasyPlayer = { idExterno: 201, nome: "Savarino", numero: 11, foto: null, posicao: "Atacante", posicaoCadastral: null, funcaoPartida: role, grid: "4:3", coordenada: { linha: 4, coluna: 3 } };
const squad = { formacao: "4-3-3", treinador: { idExterno: 238, nome: "Marcão", foto: null }, titulares: [player], reservas: [], atualizadoEm: null };
const partida: MatchCenterResponses["pre-jogo"]["partida"] = { idExterno: 321, fornecedor: "API_FUTEBOL_V2", campeonato: "Campeonato Brasileiro", campeonatoId: 1, temporada: "2026", rodada: 33, fase: null, status: "ENCERRADA", statusOriginal: "finalizado", periodo: "encerrado", minuto: null, acrescimos: { primeiroTempo: null, segundoTempo: null, primeiroTempoProrrogacao: null, segundoTempoProrrogacao: null }, data: "2026-10-28T22:30:00+00:00", timezone: "UTC", estadio: "Maracanã", cidade: null, mandante: team, visitante: away, placar: { mandante: 2, visitante: 1 } };
const totals: FantasyStatisticsValues = { finalizacoesNoGol: null, finalizacoesFora: null, finalizacoes: null, finalizacoesBloqueadas: null, finalizacoesDentroArea: null, finalizacoesForaArea: null, faltas: null, escanteios: 0, impedimentos: null, posseBola: 67, cartoesAmarelos: null, cartoesVermelhos: null, defesasGoleiro: null, passes: 782, passesCertos: null, precisaoPasses: null, golsEsperados: 1.86, golsEvitados: null };
const statsTeam = { ...team, disponivel: true, estatisticas: totals, porTempo: { primeiroTempo: { escanteios: null, cartoes: null }, segundoTempo: { escanteios: null, cartoes: null } }, atletas: [{ atleta: { idExterno: 201, nome: "Savarino", foto: null }, posicaoCadastral: null, funcaoPartida: role, numero: 11, titular: true, goleiro: false, estatisticas: { gols: 0, golsEsperados: null, minutosJogados: 90 }, goleiroEstatisticas: null }] };
const responses: MatchCenterResponses = {
  "pre-jogo": { partida, escalacoesDisponiveis: true, escalacoes: { mandante: { confirmada: squad, provavel: null }, visitante: { confirmada: null, provavel: { ...squad, titulares: [], treinador: null } } }, desfalquesInformados: false, desfalques: [] },
  sumario: { partida, eventosDisponiveis: true, eventos: [{ tipo: "GOL", periodo: "segundo-tempo", tempo: { minuto: 45, acrescimo: 7, exibicao: "45+7'" }, equipe: team, jogador: { idExterno: 189, nome: "Lucho Acosta" }, assistencia: { idExterno: 201, nome: "Savarino" }, jogadorSai: null, jogadorEntra: null, comissaoTecnica: null, comentarios: null, origem: { tipo: "GOL", detalhe: null } }, { tipo: "SUBSTITUICAO", periodo: "intervalo", tempo: { minuto: null, acrescimo: null, exibicao: null }, equipe: away, jogador: null, assistencia: null, jogadorSai: { idExterno: 97, nome: "Bernabei" }, jogadorEntra: { idExterno: 100, nome: "Vitinho" }, comissaoTecnica: null, comentarios: null, origem: { tipo: "SUBSTITUICAO", detalhe: null } }], narrativaDisponivel: true, narrativa: [{ idExterno: 60365, tipo: "goal", periodo: "segundo-tempo", periodoOriginal: "second-half", minuto: 45, segundo: 29, acrescimo: 6, titulo: null, texto: "Gol marcado por Lucho Acosta", equipe: null, atleta: null, geradoEm: null }] },
  formacao: { partida: { idExterno: 321, fornecedor: "API_FUTEBOL_V2" }, mandante: { ...team, ...squad, disponivel: true, tipoEscalacao: "CONFIRMADA" }, visitante: { ...away, formacao: null, treinador: null, titulares: [], reservas: [], atualizadoEm: null, disponivel: false, tipoEscalacao: null }, substituicoes: [] },
  estatisticas: { partida: { idExterno: 321, fornecedor: "API_FUTEBOL_V2" }, mandante: statsTeam, visitante: { ...statsTeam, ...away, disponivel: false, atletas: [], estatisticas: { ...totals, posseBola: null, escanteios: null, golsEsperados: null } } },
};
beforeEach(() => { vi.stubGlobal("React", React); vi.mocked(apiFetch).mockImplementation(async path => structuredClone(responses[path.split("/").at(-1) as keyof MatchCenterResponses])); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState({}, "", "/"); });
const show = async () => { render(<StrictMode><MatchCenterPage fixtureId="321" /></StrictMode>); await screen.findByText("Campeonato Brasileiro"); };
const tab = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));
it("exports V2 reference and preserves SEO; query route handles other IDs", async () => {
  expect(generateStaticParams()).toEqual([{ fixtureId: "321" }]); expect(dynamicParams).toBe(false);
  expect(() => FantasyMatchRoute({ params: { fixtureId: "999" } })).toThrow("NOT_FOUND");
  expect(metadata.robots).toEqual({ index: false, follow: false });
  window.history.replaceState({}, "", "/fantasy/partidas/?fixtureId=invalid"); render(<MatchCenterQueryPage />);
  expect(await screen.findByRole("alert")).toBeTruthy(); expect(apiFetch).not.toHaveBeenCalled();
});
it("loads only the active tab and shares requests in StrictMode and after tab switches", async () => {
  await show(); expect(apiFetch).toHaveBeenCalledTimes(1); expect(apiFetch).toHaveBeenCalledWith("/fantasy/partidas/321/pre-jogo");
  expect(screen.getByText("Escalação confirmada")).toBeTruthy(); expect(screen.getByText("Escalação provável")).toBeTruthy(); expect(screen.getByText("Desfalques indisponíveis.")).toBeTruthy();
  tab("Sumário"); await screen.findByText("45+7'"); tab("Pré-jogo"); tab("Sumário"); await screen.findByText("45+7'"); expect(apiFetch).toHaveBeenCalledTimes(2);
});
it.each([
  ["confirmada", "confirmada"],
  ["provavel", "provavel"],
  ["confirmada", "provavel"],
  ["provavel", "confirmada"],
] as const)("selects one pre-match squad per club: home %s, away %s", async (homeKind, awayKind) => {
  const kinds = { mandante: homeKind, visitante: awayKind };
  const pre = structuredClone(responses["pre-jogo"]);
  for (const side of ["mandante", "visitante"] as const) {
    const confirmed = structuredClone(formation321[side]) as MatchCenterResponses["formacao"]["mandante"];
    const probable = { ...confirmed, titulares: confirmed.titulares.map(player => ({ ...player, nome: `Provável ${player.nome}` })), reservas: confirmed.reservas.map(player => ({ ...player, nome: `Provável ${player.nome}` })) };
    // A probable squad remains present even when confirmed, to catch duplication.
    pre.escalacoes[side] = { confirmada: kinds[side] === "confirmada" ? confirmed : null, provavel: probable };
  }
  vi.mocked(apiFetch).mockResolvedValue(pre);
  await show();
  for (const side of ["mandante", "visitante"] as const) {
    const region = screen.getByRole("region", { name: `Escalação de ${pre.partida[side].nome}` });
    const selected = pre.escalacoes[side][kinds[side]]!;
    expect(within(region).getByText(kinds[side] === "confirmada" ? "Escalação confirmada" : "Escalação provável")).toBeTruthy();
    expect(region.querySelectorAll('details')).toHaveLength(1);
    expect(region.querySelectorAll('ul')[0].children).toHaveLength(11);
    for (const player of selected.titulares) expect(within(region).getByText(player.nome!)).toBeTruthy();
    if (kinds[side] === "confirmada") expect(within(region).queryByText(/^Provável /)).toBeNull();
    const bench = region.querySelector('details')!;
    expect(bench.open).toBe(false);
    fireEvent.click(bench.querySelector('summary')!);
    expect(bench.open).toBe(true);
    expect(within(bench).getAllByRole("listitem")).toHaveLength(selected.reservas.length);
    expect(within(region).getByText(selected.formacao!)).toBeTruthy();
  }
  expect(apiFetch).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Desfalques indisponíveis.")).toBeTruthy();
});
it("preserves period-local clocks, interval nulls and removes duplicate goal narrative despite divergent added time", async () => {
  await show(); tab("Sumário"); await screen.findByText("45+7'");
  expect(screen.getByText("2º tempo")).toBeTruthy(); expect(screen.getByText("Intervalo")).toBeTruthy(); expect(screen.getByText("Entra: Vitinho")).toBeTruthy(); expect(screen.getByText("Assistência: Savarino")).toBeTruthy();
  expect(screen.queryByText("52'")).toBeNull(); expect(screen.queryByText("Gol marcado por Lucho Acosta")).toBeNull();
  expect(screen.queryByText(/Narrativa complementar/)).toBeNull();
});
it("preserves zero and null statistics and does not draw comparison for missing opponents", async () => {
  await show(); tab("Estatísticas"); await screen.findByRole("table");
  const cells = (name: string) => within(screen.getByRole("rowheader", { name }).closest("tr")!).getAllByRole("cell").map(cell => cell.textContent);
  expect(cells("Escanteios")).toEqual(["0", "—"]); expect(cells("Posse de bola")).toEqual(["67%", "—"]); expect(cells("Gols esperados (xG)")).toEqual(["1,86", "—"]);
  expect(screen.getByRole("rowheader", { name: "Posse de bola" }).querySelector('[aria-hidden]')).toBeNull();
});
it("opens athlete details within Formation and reuses the statistics request", async () => {
  await show(); tab("Formação"); await screen.findByRole("button", { name: "Detalhes de Savarino" });
  expect(apiFetch).toHaveBeenCalledTimes(2); screen.getByRole("button", { name: "Detalhes de Savarino" }).focus(); fireEvent.click(screen.getByRole("button", { name: "Detalhes de Savarino" }));
  const details = await screen.findByRole("region", { name: "Detalhes de Savarino" }); await within(details).findByText("Minutos jogados");
  expect(within(details).getByText("90")).toBeTruthy(); expect(within(details).getByText("0")).toBeTruthy(); expect(within(details).getByText("Posição cadastral: Indisponível")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Fechar detalhes" })); expect(document.activeElement?.getAttribute("aria-label")).toBe("Detalhes de Savarino");
  tab("Estatísticas"); await screen.findByRole("table"); expect(apiFetch).toHaveBeenCalledTimes(3); expect(screen.getAllByRole("tab")).toHaveLength(4);
});
it("shows loading and independent errors without falling back to mocks", async () => {
  vi.mocked(apiFetch).mockImplementation(path => path.endsWith("pre-jogo") ? Promise.resolve(responses["pre-jogo"]) : Promise.reject(new Error("Serviço indisponível")));
  await show(); tab("Formação"); expect(screen.getByRole("status")).toBeTruthy(); expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Serviço indisponível"));
  tab("Pré-jogo"); expect(screen.getByText("Escalação confirmada")).toBeTruthy();
});
it("supports roving keyboard navigation across all four tabs", async () => {
  await show(); const first = screen.getByRole("tab", { name: "Pré-jogo" }); first.focus(); fireEvent.keyDown(first, { key: "ArrowLeft" });
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Estatísticas" })); fireEvent.keyDown(document.activeElement!, { key: "Home" }); expect(document.activeElement).toBe(first);
  await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
});
it("uses supplied coordinates and grid only, keeping missing positions off the pitch", () => {
  expect(playerCoordinates({ ...player, grid: null, coordenada: null })).toBeNull();
  expect(playerCoordinates({ ...player, coordenada: null })).toEqual({ row: 4, column: 3 });
  expect(playerCoordinates({ ...player, grid: "1:1", coordenada: { linha: 4, coluna: 2 } })).toEqual({ row: 4, column: 2 });
  expect(playerCoordinates({ ...player, grid: "1:1", coordenada: { linha: 4, coluna: null } })).toEqual({ row: 1, column: 1 });
  render(<FantasyFieldLineup teamName="Equipe" players={[player, { ...player, idExterno: 202, nome: "Sem posição", grid: null, coordenada: null }]} onPlayer={vi.fn()} />);
  expect(screen.queryByRole("region", { name: "Campo de Equipe" })).toBeNull();
  expect(screen.getByRole("region", { name: "Titulares de Equipe" })).toBeTruthy();
  expect(screen.getByText("Sem posição")).toBeTruthy();
});
it("deduplicates concurrent requests and rejects invalid IDs and mismatched providers", async () => {
  const load = createMatchCenterLoader("321"); await Promise.all([load("sumario"), load("sumario")]); expect(apiFetch).toHaveBeenCalledTimes(1);
  await expect(createMatchCenterLoader("0")("sumario")).rejects.toThrow("inválido");
  vi.mocked(apiFetch).mockResolvedValue({ ...responses.sumario, partida: { ...partida, fornecedor: "LEGACY" } });
  await expect(createMatchCenterLoader("321")("sumario")).rejects.toThrow("incompatível");
});

it("removes raw details and narrative while preserving structured events", async () => {
  vi.mocked(apiFetch).mockImplementation(async path => path.endsWith("sumario") ? {
    ...responses.sumario, eventos: responses.sumario.eventos.map(event => ({ ...event, comentarios: "Texto narrativo", origem: { tipo: event.tipo, detalhe: "normal" } })),
  } : structuredClone(responses[path.split("/").at(-1) as keyof MatchCenterResponses]));
  await show(); tab("Sumário"); await screen.findByText("45+7'");
  expect(screen.queryByText("normal")).toBeNull();
  expect(screen.queryByText("Texto narrativo")).toBeNull();
  expect(screen.queryByText("Gol marcado por Lucho Acosta")).toBeNull();
});

it("opens a different V2 fixture through the static query entry", async () => {
  vi.mocked(apiFetch).mockResolvedValue({ ...responses["pre-jogo"], partida: { ...partida, idExterno: 340 } });
  window.history.replaceState({}, "", "/fantasy/partidas/?fixtureId=340");
  render(<MatchCenterQueryPage />); await screen.findByText("Campeonato Brasileiro");
  expect(apiFetch).toHaveBeenCalledWith("/fantasy/partidas/340/pre-jogo");
});

// Public API snapshot: GET /fantasy/partidas/321/formacao, captured 2026-11-03.
// Grid sub-lines are 1/4/2/3/1 for Fluminense, while the supplied shape is 4-3-3.
it("renders fixture 321 as real 4-3-3 and 3-6-1 with opposite orientations and athlete selection", async () => {
  vi.mocked(apiFetch).mockImplementation(async path => path.endsWith("formacao") ? structuredClone(formation321) : structuredClone(responses[path.split("/").at(-1) as keyof MatchCenterResponses]));
  await show(); tab("Formação");
  const home = await screen.findByRole("region", { name: "Campo de Fluminense" });
  const awayPitch = screen.getByRole("region", { name: "Campo de Internacional" });
  expect(screen.getByLabelText("Esquema de Fluminense").textContent).toBe("4-3-3");
  expect(screen.getByLabelText("Esquema de Internacional").textContent).toBe("3-6-1");
  const rows = (pitch: HTMLElement) => Array.from(pitch.querySelectorAll('[data-tactical-row]'));
  expect(rows(home).map(row => row.querySelectorAll('button').length)).toEqual([1, 4, 3, 3]);
  expect(rows(awayPitch).map(row => row.querySelectorAll('button').length)).toEqual([1, 6, 3, 1]);
  expect(rows(home)[2].textContent).toContain("Ganso");
  expect(rows(home)[3].textContent).toContain("Hulk");
  expect(rows(home)[0].textContent).toContain("Fábio");
  expect(rows(awayPitch).at(-1)?.textContent).toContain("Kauan Jesus");
  expect(within(home).getByRole("button", { name: "Detalhes de Guga" }).style.left).toBe("87.5%");
  const bruno = within(awayPitch).getByRole("button", { name: "Detalhes de Bruno Gomes" });
  expect(parseFloat(bruno.style.left)).toBeCloseTo(16.6667, 3);
  expect(bruno.getAttribute("data-source-grid")).toBe("2:3");
  const savarino = within(home).getByRole("button", { name: "Detalhes de Savarino" });
  savarino.focus(); fireEvent.click(savarino);
  const details = await screen.findByRole("region", { name: "Detalhes de Savarino" });
  await within(details).findByText("Minutos jogados");
  expect(within(details).getByText("90")).toBeTruthy();
  fireEvent.keyDown(details, { key: "Escape" }); expect(document.activeElement).toBe(savarino);
  fireEvent.click(bruno);
  expect(await screen.findByRole("region", { name: "Detalhes de Bruno Gomes" })).toBeTruthy();
  expect(screen.getByText("Estatísticas individuais indisponíveis.")).toBeTruthy();
  expect(screen.getByText("Marcão")).toBeTruthy();
  const reserves = screen.getAllByText("Reservas")[0].closest('summary')!;
  fireEvent.click(reserves);
  expect(screen.getByRole("button", { name: "Vitor Eudes" })).toBeTruthy();
});

it("falls back to lists for missing coordinates or a formation inconsistent with roles", () => {
  const squad = formation321.mandante as MatchCenterResponses["formacao"]["mandante"];
  expect(tacticalRows(squad.titulares, squad.formacao)?.map(row => row.length)).toEqual([1, 4, 3, 3]);
  expect(tacticalRows(squad.titulares, "4-4-2")).toBeNull();
  expect(tacticalRows(squad.titulares.slice(1), "4-3-3")).toBeNull();
  expect(tacticalRows(squad.titulares.map((player, i) => i ? player : { ...player, grid: null, coordenada: null }), squad.formacao)).toBeNull();
  expect(tacticalRows(squad.titulares, null)).toBeNull();
});

it("distinguishes home and away incidents and keeps assists attached to goals", async () => {
  await show(); tab("Sumário");
  const goal = (await screen.findByText("Lucho Acosta")).closest('li')!;
  const substitution = screen.getByText("Entra: Vitinho").closest('li')!;
  expect(goal.getAttribute("data-side")).toBe("mandante");
  expect(substitution.getAttribute("data-side")).toBe("visitante");
  expect(within(goal).getByText("Assistência: Savarino")).toBeTruthy();
});
