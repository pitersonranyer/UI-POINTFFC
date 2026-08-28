import { apiFetch } from "@/services/apiClient";
import { teams } from "@/data/teams";
import type { AddTeamResult, CartolaTeam, FindByIdsResult, ImportResult } from "@/types/team";
import type { UserCartolaTeam } from "@/types/team";
type Json = Record<string, unknown>;
const object = (value: unknown): Json => value && typeof value === "object" ? value as Json : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const numberList = (value: unknown): number[] => array(value).map((item) => Number(typeof item === "object" && item !== null ? (item as Json).timeId : item)).filter(Number.isFinite);
export function normalizeTeam(value: unknown): CartolaTeam {
  const team = object(value), nested = object(team.time ?? team.team), source = Object.keys(nested).length ? { ...team, ...nested } : team;
  return {
    timeId: Number(source.timeId ?? source.time_id ?? source.TIME_ID ?? source.id),
    nome: String(source.nome ?? source.nomeTime ?? source.nome_time ?? source.name ?? "Time sem nome"),
    nomeCartoleiro: String(source.nomeCartola ?? source.nome_cartola ?? source.nomeCartoleiro ?? source.nome_cartoleiro ?? source.cartoleiro ?? source.cartoleiro_nome ?? source.ownerName ?? source.owner_name ?? "Cartoleiro não informado"),
    escudoUrl: String(source.urlEscudoPng ?? source.url_escudo_png ?? source.escudo ?? source.escudoUrl ?? source.escudo_url ?? source.urlEscudo ?? source.shieldUrl ?? source.shield_url ?? ""),
    slug: typeof source.slug === "string" ? source.slug : undefined,
    fotoPerfil: typeof (source.fotoPerfil ?? source.foto_perfil) === "string" ? String(source.fotoPerfil ?? source.foto_perfil) : undefined,
    assinante: typeof source.assinante === "boolean" ? source.assinante : undefined,
  };
}
const teamList = (value: unknown): CartolaTeam[] => { const body = object(value); const candidate = Array.isArray(value) ? value : body.times ?? body.data ?? body.resultados ?? body.items; return array(candidate).map(normalizeTeam).filter((team) => Number.isFinite(team.timeId)); };
const payload = (team: CartolaTeam) => ({
  timeId: team.timeId,
  nome: team.nome,
  ...(team.nomeCartoleiro && team.nomeCartoleiro !== "Cartoleiro não informado" ? { nomeCartola: team.nomeCartoleiro } : {}),
  ...(team.slug ? { slug: team.slug } : {}),
  ...(team.escudoUrl ? { urlEscudoPng: team.escudoUrl } : {}),
  ...(team.fotoPerfil ? { fotoPerfil: team.fotoPerfil } : {}),
  ...(typeof team.assinante === "boolean" ? { assinante: team.assinante } : {}),
});
export const teamService = {
  getByUserId: (userId: string): UserCartolaTeam[] => teams.filter((team) => team.userId === userId && team.active),
  buscarMeusTimes: async () => teamList(await apiFetch<unknown>("/meus-times", { authenticated: true })),
  buscarTimesPorNome: async (nome: string) => teamList(await apiFetch<unknown>(`/cartola/times?nome=${encodeURIComponent(nome)}`, { authenticated: true })),
  buscarTimesPorIds: async (ids: string): Promise<FindByIdsResult> => { const raw = await apiFetch<unknown>("/cartola/times/buscar-por-ids", { method: "POST", authenticated: true, body: JSON.stringify({ timeIds: ids }) }); const body = object(raw); return { times: teamList(raw), naoEncontrados: numberList(body.idsNaoEncontrados ?? body.naoEncontrados ?? body.nao_encontrados ?? body.notFound), tentarNovamente: numberList(body.erros ?? body.tentarNovamente ?? body.falhasTemporarias ?? body.naoProcessados ?? body.retryIds) }; },
  adicionarMeuTime: async (team: CartolaTeam): Promise<AddTeamResult> => { const raw = await apiFetch<unknown>("/meus-times", { method: "POST", authenticated: true, body: JSON.stringify(payload(team)) }); const body = object(raw); return { status: typeof body.status === "string" ? body.status : undefined, time: normalizeTeam(body.time ?? body.data ?? team) }; },
  importarMeusTimes: async (times: CartolaTeam[]): Promise<ImportResult> => { const raw = await apiFetch<unknown>("/meus-times/importar", { method: "POST", authenticated: true, body: JSON.stringify({ times: times.map(payload) }) }); const body = object(raw); const falhas = numberList(body.falhas); return { adicionados: Number(body.adicionados ?? body.added ?? 0), jaExistentes: Number(body.jaExistentes ?? body.ja_existentes ?? body.existing ?? 0), naoEncontrados: numberList(body.naoEncontrados ?? body.nao_encontrados ?? body.notFound), tentarNovamente: numberList(body.tentarNovamente ?? body.falhasTemporarias ?? body.retryIds ?? body.falhas), naoProcessados: Number(body.naoProcessados ?? body.nao_processados ?? body.failed ?? falhas.length), times: teamList(body.times ?? body.adicionadosTimes) }; },
  removerMeuTime: (timeId: number) => apiFetch<unknown>(`/meus-times/${timeId}`, { method: "DELETE", authenticated: true }),
};
