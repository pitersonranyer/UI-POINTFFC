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
export const ordenarPartidas = (partidas: CartolaMatch[]) => [...partidas].sort((a, b) => (dataPartida(a)?.getTime() ?? Infinity) - (dataPartida(b)?.getTime() ?? Infinity));
export const obterClube = (clubes: Record<string, CartolaClub>, id: number) => clubes[String(id)] ?? {};
export const escudoClube = (clube: CartolaClub) => clube.escudos?.["60x60"] ?? clube.escudos?.["45x45"] ?? clube.escudos?.["30x30"];
export const nomeClube = (clube: CartolaClub, id: number) => clube.abreviacao ?? clube.nome_fantasia ?? clube.nome ?? `Clube ${id}`;
export function fechamentoEm(status: CartolaMarketStatus): number | null {
  const f = status.fechamento; if (!f) return null; if (typeof f.timestamp === "number") return f.timestamp * 1000;
  if ([f.ano, f.mes, f.dia, f.hora, f.minuto].every(value => typeof value === "number")) return new Date(f.ano!, f.mes! - 1, f.dia!, f.hora!, f.minuto!).getTime(); return null;
}
