import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); sessionStorage.clear(); });

const detail = (changes: Record<string, unknown> = {}) => ({
  id: 8, catalogoId: 4, nome: "Disputa pública", temporada: 2026, rodada: 31, tipoAcesso: "FREE", valorInscricao: "0",
  status: "PUBLICADA", inicioInscricao: "", fimInscricao: "", fechamentoDefinitivoEm: null, limiteEscalacoesUsuario: null,
  criadoEm: "", atualizadoEm: "", partidas: [{ id: 10, competicaoId: 8, partidaIdExterno: 100, clubeMandanteId: 262, clubeVisitanteId: 263,
    inicioPrevisto: "2026-10-18T19:00:00.000Z", inicioReal: null, status: "AGENDADA" }], ...changes,
});
const clubs = { items: [{ id: 262, dados: { nome: "FLA", abreviacao: "FLA", slug: "flamengo", escudos: { "45x45": "https://img.example/flamengo.png" } } }] };
async function service() { vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test"); return import("./pointFantasyShowcaseService"); }

it("consulta somente detalhe e clubes públicos da competição selecionada", async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(detail())))
    .mockResolvedValueOnce(new Response(JSON.stringify(clubs)));
  vi.stubGlobal("fetch", fetcher);
  const { getFantasyShowcaseMatchups } = await service();
  const signal = new AbortController().signal;
  expect(await getFantasyShowcaseMatchups(8, 4, signal)).toEqual({ partidas: detail().partidas, clubes: clubs.items });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    "https://api.example.test/point-fantasy/competicoes/8",
    "https://api.example.test/point-fantasy/catalogos/4/clubes",
  ]);
  expect(fetcher.mock.calls.every(([, options]) => options.signal === signal && !options.headers.get("Authorization"))).toBe(true);
});

it("does not fetch club data when the competition has no matchups", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(detail({ partidas: [] }))));
  vi.stubGlobal("fetch", fetcher);
  const { getFantasyShowcaseMatchups } = await service();
  expect(await getFantasyShowcaseMatchups(8, 4, new AbortController().signal)).toEqual({ partidas: [], clubes: [] });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each([
  detail({ id: 9 }), detail({ catalogoId: 5 }), detail({ partidas: null }),
])("rejects a mismatched or incomplete competition response", async response => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response))));
  const { getFantasyShowcaseMatchups } = await service();
  await expect(getFantasyShowcaseMatchups(8, 4, new AbortController().signal)).rejects.toThrow("incompleta");
});

it("returns only matches whose competition ID matches the requested competition", async () => {
  const response = detail({ partidas: [...detail().partidas, { ...detail().partidas[0], id: 11, competicaoId: 9 }] });
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(response)))
    .mockResolvedValueOnce(new Response(JSON.stringify(clubs)));
  vi.stubGlobal("fetch", fetcher);
  const { getFantasyShowcaseMatchups } = await service();
  expect((await getFantasyShowcaseMatchups(8, 4, new AbortController().signal)).partidas.map(match => match.id)).toEqual([10]);
});
