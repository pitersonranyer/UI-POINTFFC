import { apiFetch } from "./apiClient";
import type { MatchCenterResponses } from "@/types/fantasy";
export function validFixtureId(id: string) { return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)); }
// Per-visit cache shares in-flight and completed requests; no polling or retries.
export function createMatchCenterLoader(fixtureId: string) {
  const requests = new Map<keyof MatchCenterResponses, Promise<MatchCenterResponses[keyof MatchCenterResponses]>>();
  return <K extends keyof MatchCenterResponses>(tab: K): Promise<MatchCenterResponses[K]> => {
    if (!validFixtureId(fixtureId)) return Promise.reject(new Error("ID da API Futebol V2 inválido."));
    if (!requests.has(tab)) requests.set(tab, apiFetch<MatchCenterResponses[K]>(`/fantasy/partidas/${fixtureId}/${tab}`).then(data => {
      if (!data || data.partida?.fornecedor !== "API_FUTEBOL_V2" || data.partida.idExterno !== Number(fixtureId)) throw new Error("Resposta da partida incompatível com a API Futebol V2.");
      return data;
    }));
    return requests.get(tab)! as Promise<MatchCenterResponses[K]>;
  };
}
