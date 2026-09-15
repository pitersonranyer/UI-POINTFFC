import type { FutebolJogo } from "@/types/futebol";

const labels: Record<string, string> = { IN_PLAY: "Ao vivo", PAUSED: "Intervalo", FINISHED: "Encerrado", AWARDED: "Encerrado", POSTPONED: "Adiado", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };

export function futebolStatus(jogo: FutebolJogo) {
  return {
    label: labels[jogo.status] ?? "A definir",
    scheduled: jogo.status === "TIMED" || jogo.status === "SCHEDULED",
    score: ["IN_PLAY", "PAUSED", "FINISHED", "AWARDED", "SUSPENDED"].includes(jogo.status) && jogo.placar.mandante != null && jogo.placar.visitante != null,
  };
}
