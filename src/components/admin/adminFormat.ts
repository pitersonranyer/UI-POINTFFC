import type { AdminCompetition, AdminCompetitionStatus } from "@/services/adminService";

export const ADMIN_STATUS_LABELS: Record<AdminCompetitionStatus, string> = {
  RASCUNHO: "Rascunho",
  INSCRICOES_ABERTAS: "Inscrições abertas",
  INSCRICOES_ENCERRADAS: "Inscrições encerradas",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADA: "Encerrada",
  CANCELADA: "Cancelada",
};

export const statusLabel = (status: AdminCompetitionStatus) => ADMIN_STATUS_LABELS[status] ?? "Status não informado";
export const accessLabel = (access: string) => access === "FREE" ? "Grátis" : access === "PAGO" ? "Pago" : "Não informado";
const shortDate = (value: string) => new Date(value).toLocaleDateString("pt-BR");
export function competitionPeriod(item: AdminCompetition) {
  if (item.rodadaInicio !== null) return item.rodadaFim !== null && item.rodadaFim !== item.rodadaInicio ? `Rodadas ${item.rodadaInicio}–${item.rodadaFim}` : `Rodada ${item.rodadaInicio}`;
  if (item.dataInicio) return item.dataFim ? `${shortDate(item.dataInicio)} a ${shortDate(item.dataFim)}` : `A partir de ${shortDate(item.dataInicio)}`;
  return "Não definido";
}
