import type { CartolaClubsResponse, CartolaDashboardResponse, CartolaMarket, CartolaMatchesResponse, CartolaScoredAthletesResponse } from "@/types/cartola";
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
