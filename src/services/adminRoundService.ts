import { ApiError, apiFetch } from "./apiClient";
import { partialScoreService } from "./partialScoreService";

export interface ReprocessResult {
  temporada: number;
  rodada: number;
  status: "PARCIAL";
  timesProcessados: number;
  timesComErro: number;
  substituicoesAlteradas: number;
  duracaoMs: number;
  processadoEm: string;
}

export function validRound(temporada: number, rodada: number) {
  return Number.isInteger(temporada) && temporada >= 1 && temporada <= 65535 &&
    Number.isInteger(rodada) && rodada >= 1 && rodada <= 38;
}

export function reprocessError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Você não possui permissão para executar esta operação.";
    if (error.status === 409) {
      if (/consolidad/i.test(error.message)) return "Esta rodada já está consolidada e não pode ter suas parciais reprocessadas.";
      if (/andamento|concorr|lease|lock/i.test(error.message)) return "Já existe um processamento em andamento para esta rodada.";
    }
  }
  return "Não foi possível reprocessar as parciais. Tente novamente.";
}

export async function reprocessPartials(temporada: number, rodada: number) {
  if (!validRound(temporada, rodada)) throw new RangeError("Rodada inválida");
  const result = await apiFetch<ReprocessResult>(`/admin/rodadas/${rodada}/reprocessar-parciais?temporada=${temporada}`, {
    method: "POST", authenticated: true, preserveSessionOnForbidden: true,
  });
  partialScoreService.clearCache();
  return result;
}
