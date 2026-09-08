import type { CartolaClubsResponse, CartolaDashboardResponse, CartolaMarket, CartolaMatchesResponse, CartolaScoredAthletesResponse, CartolaTeamLineupResponse } from "@/types/cartola";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
export type CartolaResult<T> = { data: T; stale: boolean };
async function request<T>(path: string): Promise<CartolaResult<T>> {
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" }, cache: "no-store" }); }
  catch { throw new Error("Não foi possível conectar ao servidor."); }
  if (!response.ok) throw new Error(`Falha ao carregar dados do Cartola: HTTP ${response.status}`);
  return { data: await response.json() as T, stale: response.headers.get("X-Cartola-Stale")?.toLowerCase() === "true" };
}
export const buscarDashboardComMetadados = () => request<CartolaDashboardResponse>("/cartola/dashboard");
export const buscarDashboard = async () => (await buscarDashboardComMetadados()).data;
export const buscarStatusMercado = async () => (await request<CartolaDashboardResponse["mercado"]>("/cartola/mercado/status")).data;
export const buscarClubes = async () => (await request<CartolaClubsResponse>("/cartola/clubes")).data;
export const buscarPartidas = async () => (await request<CartolaMatchesResponse>("/cartola/partidas")).data;
export const buscarEscalacaoTime = async (timeId: number) => {
  if (!Number.isInteger(timeId) || timeId < 1) throw new RangeError("O ID do time deve ser um inteiro positivo.");
  return (await request<CartolaTeamLineupResponse>(`/cartola/times/${timeId}`)).data;
};
export async function buscarPartidasRodada(rodada: number) {
  if (!Number.isInteger(rodada) || rodada < 1 || rodada > 38) throw new RangeError("A rodada deve estar entre 1 e 38.");
  return (await request<CartolaMatchesResponse>(`/cartola/partidas/${rodada}`)).data;
}
export const buscarAtletasMercado = async () => (await request<CartolaMarket>("/cartola/atletas/mercado")).data;
export const buscarAtletasPontuados = async () => (await request<CartolaScoredAthletesResponse>("/cartola/atletas/pontuados")).data;
export async function buscarAtletasPontuadosRodada(rodada:number){
  if(!Number.isInteger(rodada)||rodada<1||rodada>38)throw new RangeError("A rodada deve estar entre 1 e 38.");
  return (await request<CartolaScoredAthletesResponse>(`/cartola/atletas/pontuados/${rodada}`)).data;
}

export async function buscarPontuacaoEscalacao(team: CartolaTeamLineupResponse, rodada: number): Promise<CartolaTeamLineupResponse> {
  const scored = await buscarAtletasPontuadosRodada(rodada);
  if (scored.rodada != null && scored.rodada !== rodada) throw new Error("Pontuação de outra rodada.");
  const merge = (players: CartolaTeamLineupResponse["atletas"]) => players.map((player) => {
    const athlete = scored.atletas[String(player.atleta_id)];
    const points = athlete?.pontuacao;
    return {
      ...player,
      ...(typeof points === "number" && Number.isFinite(points) ? { pontos_num: points } : {}),
      ...(typeof athlete?.entrou_em_campo === "boolean" ? { entrou_em_campo: athlete.entrou_em_campo } : {}),
      ...(athlete?.scout != null ? { scout: athlete.scout } : {}),
    };
  });
  const played = (team.atletas ?? []).filter((player) => {
    const athlete = scored.atletas[String(player.atleta_id)];
    return athlete?.entrou_em_campo === true || (player.posicao_id === 6 && athlete != null && athlete.entrou_em_campo !== false && typeof athlete.pontuacao === "number");
  }).length;
  return { ...team, atletas: merge(team.atletas ?? []), reservas: merge(team.reservas ?? []), jogadores_jogaram: played };
}
