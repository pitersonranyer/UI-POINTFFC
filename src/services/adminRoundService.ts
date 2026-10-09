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

export interface SimulationReplacement {
  atletaSaiuId: number; atletaEntrouId: number; posicaoId: number;
  reservaLuxo: boolean; herdouCapitao: boolean;
}
export interface TeamDiagnostic {
  timeId: number; nomeTime: string | null;
  classificacao: "CONSISTENTE" | "DIVERGENTE" | "PENDENTE_DE_DADOS" | "NÃO_VERIFICÁVEL";
  pontuacaoPersistida: number | null; pontuacaoRecalculada: number | null; diferenca: number | null;
  jogadoresParticiparam: number | null; capitaoEfetivoId: number | null; motivo: string | null;
  substituicoesPersistidas: SimulationReplacement[];
  substituicoesEsperadas: SimulationReplacement[] | null;
}
export interface RoundSimulation {
  temporada: number; rodada: number;
  statusRodada: "AGUARDANDO_ESCALACOES" | "ESCALACOES_CARREGADAS" | "EM_ANDAMENTO" | "AGUARDANDO_CONSOLIDACAO" | "CONSOLIDADA";
  totalTimes: number; consistentes: number; divergentes: number; pendentesDeDados: number;
  naoVerificaveis: number; timesSemSnapshot: number;
  diagnosticoDefinitivo: boolean; processamentoEmAndamento: boolean; times: TeamDiagnostic[];
}

export function simulationError(error: unknown) {
  if (error instanceof RangeError || (error instanceof ApiError && error.status === 400)) return "Selecione uma temporada e rodada válidas.";
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403 || error.status === 404) return reprocessError(error);
    if (error.status === 409) return "Existe um conflito ao consultar esta rodada. Tente novamente.";
  }
  return "Não foi possível simular a reconsolidação. Tente novamente.";
}

export async function simulateReconsolidation(temporada: number, rodada: number) {
  if (!validRound(temporada, rodada)) throw new RangeError("Rodada inválida");
  return apiFetch<RoundSimulation>(`/admin/rodadas/${rodada}/simular-reconsolidacao?temporada=${temporada}`, {
    method: "GET", authenticated: true, preserveSessionOnForbidden: true,
  });
}

export function validRound(temporada: number, rodada: number) {
  return Number.isInteger(temporada) && temporada >= 1 && temporada <= 65535 &&
    Number.isInteger(rodada) && rodada >= 1 && rodada <= 38;
}

export function reprocessError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sua sessão expirou. Entre novamente para executar esta operação.";
    if (error.status === 403) return "Você não possui permissão para executar esta operação.";
    if (error.status === 404) return "A rodada selecionada não foi encontrada nesta temporada.";
    if (error.status === 409) {
      if (/consolidad/i.test(error.message)) return "Esta rodada já está consolidada e não pode ter suas parciais reprocessadas.";
      if (/envelope/i.test(error.message)) return "Os dados persistidos desta rodada estão indisponíveis ou inválidos.";
      if (/snapshot/i.test(error.message)) return "As escalações congeladas desta rodada estão indisponíveis ou incompletas.";
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
