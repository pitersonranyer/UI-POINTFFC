import { apiFetch } from "./apiClient";
import type { AthleteHistory } from "@/types/athlete-history";

const pending = new Map<string, Promise<AthleteHistory>>();
export function fetchAthleteHistory(id: string, season: number, round: number, limit: 5 | 10) {
  const params = new URLSearchParams({ temporada: String(season), rodadaReferencia: String(round), limite: String(limit) });
  const path = `/cartola/atletas/${encodeURIComponent(id)}/historico?${params}`;
  const existing = pending.get(path);
  if (existing) return existing;
  const request = apiFetch<AthleteHistory>(path, { cache: "no-store", signal: AbortSignal.timeout(45_000) })
    .finally(() => pending.delete(path));
  pending.set(path, request);
  return request;
}
