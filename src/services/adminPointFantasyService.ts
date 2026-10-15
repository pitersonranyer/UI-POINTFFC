import { apiFetch } from "@/services/apiClient";
import { loadFantasyPages, sortFantasyCatalogs } from "@/services/pointFantasyService";
import type {
  CaptureCatalogPayload,
  CapturedCatalog,
  CreateFantasyCompetitionPayload,
  FantasyCompetition,
  MarketStatus,
  PointFantasyCatalog,
} from "@/types/adminPointFantasy";

const authenticated = { authenticated: true, preserveSessionOnForbidden: true };

export const getFantasyMarketStatus = () =>
  apiFetch<MarketStatus>("/cartola/mercado/status", { cache: "no-store" });

export const listFantasyCatalogs = (signal: AbortSignal) =>
  loadFantasyPages<PointFantasyCatalog>("/point-fantasy/catalogos", signal).then(sortFantasyCatalogs);

export const captureFantasyCatalog = (payload: CaptureCatalogPayload) =>
  apiFetch<CapturedCatalog>("/admin/point-fantasy/catalogos/capturar", {
    ...authenticated,
    method: "POST",
    body: JSON.stringify(payload),
  });

export const freezeFantasyCatalog = (id: number) =>
  apiFetch<CapturedCatalog>(`/admin/point-fantasy/catalogos/${id}/congelar`, {
    ...authenticated,
    method: "POST",
  });

export const loadCapturedCatalogAthletes = (id: number, signal: AbortSignal) =>
  loadFantasyPages<{ id: number; clubeIdExterno: number }>(
    `/point-fantasy/catalogos/${id}/atletas`, signal,
  );

export const createFantasyCompetition = (payload: CreateFantasyCompetitionPayload) =>
  apiFetch<FantasyCompetition>("/admin/point-fantasy/competicoes", {
    ...authenticated,
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loadAdminFantasyCompetition = (id: number, signal?: AbortSignal) =>
  apiFetch<FantasyCompetition>(`/admin/point-fantasy/competicoes/${id}`, {
    ...authenticated,
    signal,
  });

export const publishFantasyCompetition = (id: number) =>
  apiFetch<FantasyCompetition>(`/admin/point-fantasy/competicoes/${id}/publicar`, {
    ...authenticated,
    method: "POST",
  });
