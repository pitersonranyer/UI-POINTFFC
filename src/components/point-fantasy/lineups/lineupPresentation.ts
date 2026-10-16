import type { PointFantasyAthlete } from "@/types/pointFantasy";
import type { Formation, LineupContext, LineupPickerFilters, LineupPickerSession, LineupSelection, LineupSlot, LineupSlotPlacements } from "@/types/pointFantasyLineup";

// Mirrors the audited 2A contract for preventive UI checks; server validation remains authoritative.
export const formationCounts: Record<Formation, Record<number, number>> = {
  "4-3-3": { 1:1, 2:2, 3:2, 4:3, 5:3 }, "4-4-2": { 1:1, 2:2, 3:2, 4:4, 5:2 },
  "3-5-2": { 1:1, 2:0, 3:3, 4:5, 5:2 }, "3-4-3": { 1:1, 2:0, 3:3, 4:4, 5:3 },
  "4-5-1": { 1:1, 2:2, 3:2, 4:5, 5:1 }, "5-3-2": { 1:1, 2:2, 3:3, 4:3, 5:2 },
  "5-4-1": { 1:1, 2:2, 3:3, 4:4, 5:1 },
};
export const positionLabels: Record<number, string> = { 1:"Goleiro", 2:"Lateral", 3:"Zagueiro", 4:"Meia", 5:"Atacante", 6:"Técnico" };
// Verified against public/data/cartola-market.json status dictionary, not inferred from numbers.
// Fantasy does not currently expose that dictionary. 6 means Nulo, not "Não joga".
export const capturedStatuses: Record<number, string> = { 2:"Dúvida", 3:"Suspenso", 5:"Contundido", 6:"Nulo", 7:"Provável" };
export const defaultStatuses = ["7", "2"];
export const defaultPickerFilters = (): LineupPickerFilters => ({ search:"", club:"", category:"", statuses:[...defaultStatuses] });
export function statusKey(status: number) { return Object.hasOwn(capturedStatuses, status) ? String(status) : "unknown"; }
export function statusLabel(status: number) { return capturedStatuses[status] ?? "Situação desconhecida"; }
export const emptySelection = (): LineupSelection => ({ formacao:"4-3-3", titulares:[], reservas:[], tecnico:null, capitaoAtletaId:null, reservaMagoAtletaId:null });
export function selectionOf(value: LineupSelection): LineupSelection {
  return { formacao:value.formacao, titulares:[...value.titulares], reservas:[...value.reservas], tecnico:value.tecnico, capitaoAtletaId:value.capitaoAtletaId, reservaMagoAtletaId:value.reservaMagoAtletaId };
}
export function removeAthlete(value: LineupSelection, athleteId: number): LineupSelection {
  const result = selectionOf(value);
  result.titulares = result.titulares.filter(id => id !== athleteId);
  result.reservas = result.reservas.filter(id => id !== athleteId);
  if (result.tecnico === athleteId) result.tecnico = null;
  if (result.capitaoAtletaId === athleteId) result.capitaoAtletaId = null;
  if (result.reservaMagoAtletaId === athleteId) result.reservaMagoAtletaId = null;
  return result;
}
export function reserveCounts(formation: Formation): Record<number, number> { return { 1:1, 2:formationCounts[formation][2] ? 1 : 0, 3:formationCounts[formation][2] ? 1 : 2, 4:1, 5:1 }; }
export function selectedIds(value: LineupSelection) { return [...value.titulares, ...value.reservas, ...(value.tecnico === null ? [] : [value.tecnico])]; }
export function positionalAthletes(value: LineupSelection, athletes: PointFantasyAthlete[], role: "titulares" | "reservas", position: number) {
  const byId = new Map(athletes.map(a => [a.id, a]));
  return value[role].map(id => byId.get(id)).filter((a): a is PointFantasyAthlete => !!a && a.posicaoId === position);
}
export function reserveCeiling(value: LineupSelection, athletes: PointFantasyAthlete[], position: number) {
  const matching = positionalAthletes(value, athletes, "titulares", position);
  return matching.length ? Math.min(...matching.map(a => a.categoriaId ?? 0)) : null;
}
export function slotKey(slot: LineupSlot) { return `${slot.role}-${slot.position}-${slot.index}`; }
export function slotCapacity(value: LineupSelection, slot: LineupSlot) {
  return slot.role === "tecnico" ? 1 : (slot.role === "titulares" ? formationCounts[value.formacao] : reserveCounts(value.formacao))[slot.position] ?? 0;
}
export function buildSlotPlacements(value: LineupSelection, athletes: PointFantasyAthlete[], previous: LineupSlotPlacements = {}): LineupSlotPlacements {
  const result: LineupSlotPlacements = {};
  for (const role of ["titulares", "reservas"] as const) for (const position of [1,2,3,4,5]) {
    const matching = positionalAthletes(value, athletes, role, position);
    const size = Math.max(slotCapacity(value, { role, position, index:0 }), matching.length);
    const used = new Set<number>();
    for (let index = 0; index < size; index++) {
      const key = slotKey({ role, position, index }); const id = previous[key];
      if (matching.some(a => a.id === id) && !used.has(id)) { result[key] = id; used.add(id); }
    }
    for (const a of matching) if (!used.has(a.id)) {
      for (let index = 0; index < size; index++) {
        const key = slotKey({ role, position, index });
        if (result[key] === undefined) { result[key] = a.id; used.add(a.id); break; }
      }
    }
  }
  return result;
}
export function athleteInSlot(value: LineupSelection, athletes: PointFantasyAthlete[], slot: LineupSlot, placements?: LineupSlotPlacements) {
  return slot.role === "tecnico" ? athletes.find(a => a.id === value.tecnico) : placements
    ? athletes.find(a => a.id === placements[slotKey(slot)])
    : positionalAthletes(value, athletes, slot.role, slot.position)[slot.index];
}
export function replaceSlot(value: LineupSelection, athletes: PointFantasyAthlete[], slot: LineupSlot, next: PointFantasyAthlete | null, placements?: LineupSlotPlacements): LineupSelection {
  if (next && (next.posicaoId !== slot.position || selectedIds(value).includes(next.id) || !athletes.some(a => a.id === next.id))) return value;
  const previous = athleteInSlot(value, athletes, slot, placements);
  const result = selectionOf(value);
  if (slot.role === "tecnico") result.tecnico = next?.id ?? null;
  else if (previous) result[slot.role] = result[slot.role].flatMap(id => id === previous.id ? next ? [next.id] : [] : [id]);
  else if (next) result[slot.role].push(next.id);
  if (result.capitaoAtletaId !== null && !result.titulares.includes(result.capitaoAtletaId)) result.capitaoAtletaId = null;
  if (result.reservaMagoAtletaId !== null && !result.reservas.includes(result.reservaMagoAtletaId)) result.reservaMagoAtletaId = null;
  return result;
}
export function selectIntoLineupSlot(value: LineupSelection, athletes: PointFantasyAthlete[], session: LineupPickerSession, chosenId: number, previousPlacements: LineupSlotPlacements = {}) {
  const athlete = athletes.find(a => a.id === chosenId);
  const capacity = slotCapacity(value, session);
  if (!athlete || athlete.posicaoId !== session.position || session.index < 0 || session.index >= capacity || selectedIds(value).includes(chosenId)) return null;
  if (session.role !== "tecnico" && (athlete.categoriaId === null || ![1,2,3].includes(athlete.categoriaId))) return null;
  if (session.role === "tecnico" && athlete.posicaoId !== 6) return null;
  if (session.role === "reservas") {
    const ceiling = reserveCeiling(value, athletes, session.position);
    if (ceiling !== null && athlete.categoriaId! > ceiling) return null;
  }
  const placements = buildSlotPlacements(value, athletes, previousPlacements);
  const occupied = athleteInSlot(value, athletes, session, placements);
  if ((session.mode === "fill" && occupied) || (session.mode === "replace" && !occupied)) return null;
  const selection = replaceSlot(value, athletes, session, athlete, placements);
  const nextPlacements = buildSlotPlacements(selection, athletes, { ...placements, [slotKey(session)]:chosenId });
  let nextSlot: LineupPickerSession | null = null;
  if (session.mode === "fill" && session.role !== "tecnico") {
    // Follow visual order after the clicked slot, wrapping to earlier empty slots.
    for (let offset = 1; offset < capacity; offset++) {
      const candidate = { ...session, index:(session.index + offset) % capacity };
      if (!athleteInSlot(selection, athletes, candidate, nextPlacements)) { nextSlot = candidate; break; }
    }
  }
  return { selection, placements:nextPlacements, nextSlot };
}
export function selectionWarnings(value: LineupSelection, athletes: PointFantasyAthlete[]) {
  const warnings: string[] = [];
  if (new Set(selectedIds(value)).size !== selectedIds(value).length) warnings.push("Remova atletas duplicados.");
  if (selectedIds(value).some(id => !athletes.some(a => a.id === id))) warnings.push("Há atleta fora dos elegíveis desta competição. Recarregue a escalação.");
  for (const pos of [1,2,3,4,5]) {
    if (positionalAthletes(value, athletes, "titulares", pos).length > formationCounts[value.formacao][pos]) warnings.push(`Remova titulares excedentes: ${positionLabels[pos]}.`);
    const reserves = positionalAthletes(value, athletes, "reservas", pos);
    if (reserves.length > reserveCounts(value.formacao)[pos]) warnings.push(`Remova reservas excedentes: ${positionLabels[pos]}.`);
    const ceiling = reserveCeiling(value, athletes, pos);
    if (ceiling !== null && reserves.some(a => a.categoriaId === null || a.categoriaId > ceiling)) warnings.push(`Ajuste a categoria dos reservas: ${positionLabels[pos]}.`);
  }
  if (value.capitaoAtletaId !== null && !value.titulares.includes(value.capitaoAtletaId)) warnings.push("O capitão precisa ser titular.");
  if (value.reservaMagoAtletaId !== null && !value.reservas.includes(value.reservaMagoAtletaId)) warnings.push("O Reserva Power precisa estar no banco.");
  return warnings;
}
export function lineupValue(value: LineupSelection, athletes: PointFantasyAthlete[]) {
  return selectedIds(value).reduce((sum, id) => sum + (athletes.find(a => a.id === id)?.pointcoins ?? 0), 0);
}
export function blockingReason(context: LineupContext, now: number): string | null {
  const c = context.competition;
  if (c.status !== "PUBLICADA" || context.catalog.status !== "CONGELADO" || c.temporada !== context.catalog.temporada || c.rodada !== context.catalog.rodada) return "Competição ou catálogo indisponível para edição.";
  if (!Number.isFinite(Date.parse(c.inicioInscricao)) || Date.parse(c.inicioInscricao) > now) return "A montagem ainda não foi aberta.";
  if (c.fechamentoDefinitivoEm && (!Number.isFinite(Date.parse(c.fechamentoDefinitivoEm)) || Date.parse(c.fechamentoDefinitivoEm) <= now)) return "A competição foi encerrada para edição.";
  if (!c.partidas.length || c.partidas.some(m => m.status !== "AGENDADA" || m.inicioReal !== null || !Number.isFinite(Date.parse(m.inicioPrevisto)) || Date.parse(m.inicioPrevisto) <= now)) return "Edição bloqueada pelo início previsto ou registrado de uma partida.";
  return null;
}
export function friendlyPending(message: string) {
  return message.replace(/Completar titulares da posicao (\d)/, (_, p: string) => `Complete os titulares: ${positionLabels[Number(p)] ?? p}`)
    .replace(/Completar reservas da posicao (\d)/, (_, p: string) => `Complete os reservas: ${positionLabels[Number(p)] ?? p}`)
    .replace(/Categoria do reserva \d+ aguarda titulares da posicao (\d)/, (_, p: string) => `Categoria do reserva aguarda titulares: ${positionLabels[Number(p)] ?? p}`)
    .replace("Selecionar tecnico", "Escolha o técnico").replace("Selecionar capitao", "Defina o capitão").replace("Selecionar Reserva do Mago", "Escolha o Reserva Power");
}
