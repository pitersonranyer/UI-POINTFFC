import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FantasyAthleteCatalog } from "./FantasyAthleteCatalog";
import { FantasyAthleteRow } from "./FantasyAthleteRow";
import { ClubJersey } from "../uniforms/ClubJersey";
import { ClubShield } from "../uniforms/ClubShield";
import { clubUniforms, getClubUniform } from "../uniforms/clubUniforms";
import { loadFantasyCatalog, loadFantasyPages } from "@/services/pointFantasyService";
import type { FantasyCatalogData, PointFantasyAthlete } from "@/types/pointFantasy";
vi.mock("@/services/pointFantasyService", async original => ({ ...await original<typeof import("@/services/pointFantasyService")>(), loadFantasyCatalog: vi.fn(), loadFantasyPages: vi.fn() }));
afterEach(cleanup);
const athlete = (id: number, extra: Partial<PointFantasyAthlete> = {}): PointFantasyAthlete => ({ id, catalogoId: 3, atletaIdExterno: id, clubeIdExterno: 262, posicaoId: 5, statusId: 7, apelido: `Atleta ${id}`, precoCartola: "9.00", categoriaId: 2, pointcoins: 77, ...extra });
const catalog = { id: 3, temporada: 2026, rodada: 31, versao: 1, status: "CAPTURADO", capturadoEm: "", congeladoEm: null, criadoEm: "" };
const dataset: FantasyCatalogData = { athletes: Array.from({ length: 35 }, (_, i) => athlete(i)), clubs: [{ id: 262, dados: { nome: "FLA", abreviacao: "FLA" } }], positions: [{ id: 5, dados: { nome: "Atacante", abreviacao: "ata" } }] };
function setup() { vi.mocked(loadFantasyPages).mockResolvedValue([catalog]); vi.mocked(loadFantasyCatalog).mockResolvedValue(dataset); }
describe("Fantasy visuals", () => {
  it("covers the 20 verified IDs with readable original jerseys and shields", () => {
    expect(Object.keys(clubUniforms).map(Number)).toEqual([262,263,264,265,266,267,275,276,277,280,282,283,284,285,287,293,294,315,364,2305]);
    for (const u of Object.values(clubUniforms)) {
      const { unmount } = render(<><ClubJersey clubId={u.id} /><ClubShield clubId={u.id} /></>);
      expect(screen.getAllByRole("img")).toHaveLength(2);
      expect(screen.getAllByText(u.abbreviation)).toHaveLength(2);
      expect(document.querySelector(`path[fill="${u.primary}"]`)).not.toBeNull();
      expect(document.querySelector(`[data-pattern="${u.pattern}"]`)).not.toBeNull();
      unmount();
    }
  });
  it.each([265, 266, 284])("preserves three colors and vertical stripes for %i", id => {
    const u = getClubUniform(id);
    render(<ClubJersey clubId={id} />);
    expect(u.pattern).toBe("vertical"); expect(u.additional).toBeTruthy();
    expect(document.querySelector(`rect[fill="${u.additional}"]`)).not.toBeNull();
  });
  it("uses neutral fallback and unique clipping IDs", () => {
    render(<><ClubJersey clubId={999} /><ClubJersey clubId={999} /><ClubShield clubId={999} /></>);
    expect(screen.getAllByText("FFC")).toHaveLength(3);
    expect(new Set([...document.querySelectorAll("clipPath")].map(n => n.id)).size).toBe(3);
    expect(getClubUniform(999).primary).toBe("#737b85");
  });
  it("shows backend coins verbatim and omits coach category even if supplied", () => {
    render(<ul><FantasyAthleteRow athlete={athlete(1, { posicaoId: 6, categoriaId: 3 })} /></ul>);
    expect(screen.getByText("Técnico")).toBeTruthy(); expect(screen.queryByText("Ouro")).toBeNull(); expect(screen.getByText("PC$ 77")).toBeTruthy();
  });
});
describe("Fantasy catalog interface", () => {
  it("loads, paginates and searches beyond the first page", async () => {
    setup(); render(<FantasyAthleteCatalog />);
    expect(screen.getByRole("status").textContent).toContain("Carregando");
    await screen.findByText("Atleta 0");
    expect(screen.queryByText("Atleta 34")).toBeNull();
    fireEvent.click(screen.getByText("Próxima")); expect(screen.getByText("Atleta 34")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Atleta 34" } });
    expect(screen.getByText("Atleta 34")).toBeTruthy(); expect(screen.queryByText("Próxima")).toBeNull();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ninguém" } });
    expect(screen.getByText(/Nenhum atleta corresponde/)).toBeTruthy();
    fireEvent.click(screen.getByText("Limpar filtros")); expect(screen.getByText("Atleta 0")).toBeTruthy();
  });
  it("shows empty catalog discovery", async () => {
    vi.mocked(loadFantasyPages).mockResolvedValue([]); render(<FantasyAthleteCatalog />);
    expect(await screen.findByText(/Nenhum catálogo disponível/)).toBeTruthy();
  });
  it("shows errors and retries", async () => {
    setup(); vi.mocked(loadFantasyPages).mockRejectedValueOnce(new Error("API indisponível")); render(<FantasyAthleteCatalog />);
    expect(await screen.findByRole("alert")).toBeTruthy(); fireEvent.click(screen.getByText("Tentar novamente"));
    expect(await screen.findByText("Atleta 0")).toBeTruthy();
  });
  it("hides old athletes and ignores late responses when switching catalogs", async () => {
    setup(); vi.mocked(loadFantasyPages).mockResolvedValue([catalog, { ...catalog, id: 4, versao: 2 }]);
    let resolveOld!: (value: FantasyCatalogData) => void;
    vi.mocked(loadFantasyCatalog).mockImplementation(id => id === 4 ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(dataset));
    render(<FantasyAthleteCatalog />);
    await waitFor(() => expect(loadFantasyCatalog).toHaveBeenCalledWith(4, expect.any(AbortSignal)));
    fireEvent.change(screen.getByLabelText("Catálogo"), { target: { value: "3" } });
    await screen.findByText("Atleta 0");
    resolveOld({ ...dataset, athletes: [athlete(99, { apelido: "Resposta atrasada", catalogoId: 4 })] });
    await waitFor(() => expect(screen.queryByText("Resposta atrasada")).toBeNull());
    expect(screen.getByText("Atleta 0")).toBeTruthy();
  });
});
