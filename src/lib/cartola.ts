import type { CartolaClub, CartolaMatch, CartolaMarketStatus } from "@/types/cartola";
export function dataPartida(partida: CartolaMatch): Date | null {
  if (typeof partida.timestamp === "number") return new Date(partida.timestamp * 1000);
  if (!partida.partida_data) return null; const date = new Date(partida.partida_data.replace(" ", "T")); return Number.isNaN(date.getTime()) ? null : date;
}
export function formatarPartida(partida: CartolaMatch) {
  const date = dataPartida(partida); if (!date) return { data: "Data a definir", hora: "Horário a definir", completa: "Data a definir" };
  const data = date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  const hora = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); return { data, hora, completa: `${data} • ${hora}` };
}
function normalizarStatus(valor?: string) {
  return valor?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toUpperCase() ?? "";
}
function inicioCronometroEm(valor?: string): number | null {
  if (!valor) return null;
  const numerico = Number(valor);
  if (Number.isFinite(numerico)) return numerico < 10_000_000_000 ? numerico * 1000 : numerico;
  const data = new Date(valor).getTime();
  return Number.isNaN(data) ? null : data;
}
export function statusPartida(partida: CartolaMatch, agora = Date.now()): { label: string; live: boolean } | null {
  const status = normalizarStatus(partida.status_cronometro_tr);
  const periodo = normalizarStatus(partida.periodo_tr);
  if (/ENCERR|FINAL|FIM/.test(status) || /ENCERR|FINAL|FIM/.test(periodo)) return { label: "Encerrado", live: false };
  if (/INTERVAL|HALF_TIME/.test(status) || /INTERVAL|HALF_TIME/.test(periodo)) return { label: "Intervalo", live: true };

  const emAndamento = /ANDAMENTO|ROLANDO|RUNNING|PROGRESS/.test(status);
  const primeiroTempo = /PRIMEIRO|1T|FIRST|^1$/.test(periodo);
  const segundoTempo = /SEGUNDO|2T|SECOND|^2$/.test(periodo);
  if (!emAndamento && !primeiroTempo && !segundoTempo) return null;

  const inicio = inicioCronometroEm(partida.inicio_cronometro_tr);
  if (inicio !== null) {
    const decorridos = Math.max(0, Math.floor((agora - inicio) / 60_000));
    const minuto = Math.min(120, decorridos + (segundoTempo ? 45 : 0));
    return { label: `${minuto}'`, live: true };
  }
  return { label: segundoTempo ? "2º tempo" : primeiroTempo ? "1º tempo" : "Ao vivo", live: true };
}
export const ordenarPartidas = (partidas: CartolaMatch[]) => [...partidas].sort((a, b) => (dataPartida(a)?.getTime() ?? Infinity) - (dataPartida(b)?.getTime() ?? Infinity));
export const obterClube = (clubes: Record<string, CartolaClub>, id: number) => clubes[String(id)] ?? {};
export const escudoClube = (clube: CartolaClub) => clube.escudos?.["60x60"] ?? clube.escudos?.["45x45"] ?? clube.escudos?.["30x30"];
export const rodadaDeEscalacao = (rodadaAtual: number, mercadoAberto: boolean) => mercadoAberto ? Math.max(1, rodadaAtual - 1) : rodadaAtual;
export const nomeClube = (clube: CartolaClub, id: number) => clube.abreviacao ?? clube.nome_fantasia ?? clube.nome ?? `Clube ${id}`;
export function fechamentoEm(status: CartolaMarketStatus): number | null {
  const f = status.fechamento; if (!f) return null; if (typeof f.timestamp === "number") return f.timestamp * 1000;
  if ([f.ano, f.mes, f.dia, f.hora, f.minuto].every(value => typeof value === "number")) return new Date(f.ano!, f.mes! - 1, f.dia!, f.hora!, f.minuto!).getTime(); return null;
}
