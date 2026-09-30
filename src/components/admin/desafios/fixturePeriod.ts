import type { DesafioFixture, FixtureFilters } from "@/services/adminDesafioService";

export const periodShortcuts = ["Hoje", "Amanhã", "Próximos 3 dias", "Fim de semana", "Personalizado"] as const;
export type PeriodShortcut = typeof periodShortcuts[number];
// The endpoint uses inclusive UTC calendar days.
export function shortcutPeriod(shortcut: PeriodShortcut, now = new Date()): FixtureFilters {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let length = 1;
  if (shortcut === "Amanhã") start.setUTCDate(start.getUTCDate() + 1);
  if (shortcut === "Próximos 3 dias") length = 3;
  if (shortcut === "Fim de semana") {
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() + (day === 0 ? 0 : (6 - day + 7) % 7));
    length = day === 0 ? 1 : 2;
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + length - 1);
  return { dataInicial: start.toISOString().slice(0, 10), dataFinal: end.toISOString().slice(0, 10) };
}
export function validPeriod({ dataInicial, dataFinal }: FixtureFilters) {
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const days = (Date.parse(dataFinal) - Date.parse(dataInicial)) / 86400000;
  return validDate(dataInicial) && validDate(dataFinal) && days >= 0 && days <= 6;
}
export function unavailableReason(fixture: DesafioFixture) {
  if (fixture.statusInterno === "EM_ANDAMENTO") return "Em andamento";
  if (fixture.statusInterno === "FINALIZADA") return "Finalizada";
  if (fixture.statusInterno === "ANULADA") return "Anulada, adiada ou suspensa";
  if (fixture.statusInterno !== "AGENDADA") return "Estado indisponível";
  if (!fixture.horarioConfirmado) return "Horário não confirmado";
  if (!Number.isFinite(Date.parse(fixture.dataHoraInicio))) return "Horário indisponível";
  if (Date.parse(fixture.dataHoraInicio) <= Date.now()) return "Horário de início já passou";
  return "";
}
export function groupFixtures(fixtures: DesafioFixture[]) {
  const dates = new Map<string, Map<number, { name: string; fixtures: DesafioFixture[] }>>();
  for (const fixture of [...fixtures].sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))) {
    const day = fixture.dataHoraInicio.slice(0, 10);
    if (!dates.has(day)) dates.set(day, new Map());
    const competitions = dates.get(day)!;
    if (!competitions.has(fixture.leagueId)) competitions.set(fixture.leagueId, { name: fixture.leagueNome, fixtures: [] });
    competitions.get(fixture.leagueId)!.fixtures.push(fixture);
  }
  return [...dates].map(([date, competitions]) => ({ date, competitions: [...competitions].map(([id, group]) => ({ id, ...group })) }));
}
