import { apiFetch, ApiError } from "./apiClient";
import type { Agenda } from "@/types/agenda";

export class UnsupportedAgendaSeason extends Error {
  constructor(season: number) { super(`A agenda da temporada ${season} não está disponível.`); this.name = "UnsupportedAgendaSeason"; }
}

// Per-page cache shares in-flight requests in StrictMode and reuses visited rounds.
// Failed requests are removed so a deliberate retry always reaches the API.
export function createAgendaLoader(season: number) {
  const requests = new Map<number | "auto", Promise<Agenda>>();
  return (round: number | null = null): Promise<Agenda> => {
    const key = round ?? "auto";
    if (round != null && (!Number.isSafeInteger(round) || round < 1)) return Promise.reject(new Error("Rodada inválida."));
    if (!requests.has(key)) {
      const request = apiFetch<Agenda>(`/fantasy/agenda?temporada=${season}${round == null ? "" : `&rodada=${round}`}`).then(data => {
        if (data?.temporada != null && data.temporada !== season) throw new UnsupportedAgendaSeason(season);
        if (!data || data.fornecedor !== "API_FUTEBOL_V2" || data.temporada !== season || !Number.isSafeInteger(data.rodada) || !Number.isSafeInteger(data.totalRodadas) || data.rodada < 1 || data.rodada > data.totalRodadas || (round != null && data.rodada !== round) || !Array.isArray(data.partidas)) throw new Error("Resposta da agenda indisponível ou incompatível.");
        requests.set(data.rodada, Promise.resolve(data));
        return data;
      }).catch(error => {
        requests.delete(key);
        if (error instanceof ApiError && error.status === 404) throw new UnsupportedAgendaSeason(season);
        throw error;
      });
      requests.set(key, request);
    }
    return requests.get(key)!;
  };
}
