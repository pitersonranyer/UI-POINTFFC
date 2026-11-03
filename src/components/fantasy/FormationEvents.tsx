import type { FantasyEvent, FantasyLineup } from "@/types/fantasy";
import styles from "./MatchCenter.module.css";

type Kind = "substitution" | "goal" | "ownGoal" | "yellow" | "red";
export interface FormationIncident { kind: Kind; event: FantasyEvent; direction?: "in" | "out" }
type Side = "mandante" | "visitante";
const descriptions: Record<Kind, string> = { substitution: "Substituição", goal: "Gol", ownGoal: "Gol contra", yellow: "Cartão amarelo", red: "Cartão vermelho" };
const normalize = (value: string | null) => value?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]/g, " ").trim().toLowerCase();
const ownGoal = (value: string | null) => ["gol contra", "own goal", "autogol", "autogolo"].includes(normalize(value) ?? "");
const validId = (id: number | null): id is number => id != null && Number.isSafeInteger(id) && id > 0;

export function formationEventTime(event: FantasyEvent) {
  return event.tempo.exibicao ?? (event.tempo.minuto == null ? "Minuto não informado" : `${event.tempo.minuto}${event.tempo.acrescimo == null ? "" : `+${event.tempo.acrescimo}`}'`);
}

// The formation endpoint also supplies substitutions. Add only ones absent from
// the summary, without collapsing distinct goal/card incidents at the same clock.
export function mergeFormationEvents(summary: FantasyEvent[], substitutions: FantasyEvent[]) {
  const key = (event: FantasyEvent) => JSON.stringify([event.equipe.idExterno, event.jogadorSai?.idExterno, event.jogadorEntra?.idExterno, event.periodo, event.tempo.minuto, event.tempo.acrescimo]);
  const seen = new Set(summary.filter(event => event.tipo === "SUBSTITUICAO").map(key));
  return [...summary, ...substitutions.filter(event => {
    if (event.tipo !== "SUBSTITUICAO" || seen.has(key(event))) return false;
    seen.add(key(event)); return true;
  })];
}

export function formationEventMap(events: FantasyEvent[], teams: Pick<FantasyLineup, Side>) {
  const result: Record<Side, Map<number, FormationIncident[]>> = { mandante: new Map(), visitante: new Map() };
  const sides = ["mandante", "visitante"] as const;
  const add = (side: Side, id: number, incident: FormationIncident) => result[side].set(id, [...(result[side].get(id) ?? []), incident]);
  for (const event of events) {
    const eventSides = sides.filter(side => validId(teams[side].idExterno) && teams[side].idExterno === event.equipe.idExterno);
    if (eventSides.length !== 1) continue;
    const eventSide = eventSides[0];
    const owners = (id: number | null | undefined, candidates: readonly Side[]) => !validId(id ?? null) ? [] : candidates.flatMap(side => [...teams[side].titulares, ...teams[side].reservas].filter(player => player.idExterno === id).map(() => side));
    if (event.tipo === "SUBSTITUICAO") {
      if (event.jogadorSai?.idExterno != null && event.jogadorSai.idExterno === event.jogadorEntra?.idExterno) continue;
      for (const direction of ["out", "in"] as const) {
        const id = (direction === "out" ? event.jogadorSai : event.jogadorEntra)?.idExterno;
        if (id != null && owners(id, [eventSide]).length === 1) add(eventSide, id, { kind: "substitution", direction, event });
      }
      continue;
    }
    const isGoal = event.tipo === "GOL" || ownGoal(event.tipo);
    const isOwnGoal = isGoal && [event.tipo, event.origem.tipo, event.origem.detalhe].some(ownGoal);
    const kind: Kind | null = isGoal ? isOwnGoal ? "ownGoal" : "goal" : event.tipo === "CARTAO_AMARELO" ? "yellow" : event.tipo === "CARTAO_VERMELHO" ? "red" : null;
    if (!kind || !validId(event.jogador?.idExterno ?? null)) continue;
    const id = event.jogador!.idExterno!;
    // Own-goal events may credit the beneficiary club. The explicitly identified
    // scorer must belong uniquely to one of the two supplied match squads.
    const matches = owners(id, isOwnGoal ? sides : [eventSide]);
    if (matches.length === 1) add(matches[0], id, { kind, event });
  }
  return result;
}

function IncidentIcon({ kind }: { kind: Kind }) {
  if (kind === "substitution") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5h11l-3-3" fill="none" stroke="#12853d" strokeWidth="2" /><path d="M14 11H3l3 3" fill="none" stroke="#c62828" strokeWidth="2" /></svg>;
  if (kind === "yellow" || kind === "red") return <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="2" width="8" height="12" rx="1" fill={kind === "yellow" ? "#f4c542" : "#d32f2f"} stroke={kind === "yellow" ? "#876600" : "#981e1e"} /></svg>;
  return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="white" stroke={kind === "ownGoal" ? "#c62828" : "#17271e"} /><path d="m8 4 4 3-2 5H6L4 7Z" fill={kind === "ownGoal" ? "#c62828" : "#17271e"} />{kind === "ownGoal" && <path d="m2 2 12 12" stroke="#c62828" strokeWidth="2" />}</svg>;
}

export function FormationIndicators({ incidents }: { incidents: FormationIncident[] }) {
  const groups = [...new Set(incidents.map(item => item.kind))];
  return <span className={styles.formationIndicators} style={{ gridTemplateColumns: `repeat(${Math.min(groups.length, 3)}, minmax(0, 11px))` }}>{groups.map(kind => {
    const matching = incidents.filter(item => item.kind === kind);
    const description = `${descriptions[kind]}${matching.length > 1 ? ` (${matching.length})` : ""}: ${matching.map(item => formationEventTime(item.event)).join(", ")}`;
    return <span key={kind} className={styles.formationIndicator} data-event-kind={kind} role="img" aria-label={description} title={description}><IncidentIcon kind={kind} />{matching.length > 1 && <sup aria-hidden="true">{matching.length}</sup>}</span>;
  })}</span>;
}

export function AthleteIncidents({ incidents, loading, available }: { incidents: FormationIncident[]; loading: boolean; available: boolean }) {
  return <div className={styles.athleteIncidents}><h4>Eventos na partida</h4>{loading && <p role="status">Carregando eventos...</p>}{!loading && !available && <p>Eventos de gols e cartões indisponíveis.</p>}{!loading && available && !incidents.length && <p>Nenhum evento individual informado.</p>}
    <ul>{incidents.map((incident, index) => <li key={index}><strong>{descriptions[incident.kind]}</strong><span>{formationEventTime(incident.event)}</span>{incident.kind === "substitution" && <p>{incident.direction === "out" ? "Entra" : "Sai"}: {(incident.direction === "out" ? incident.event.jogadorEntra : incident.event.jogadorSai)?.nome ?? "Jogador não informado"}</p>}</li>)}</ul>
  </div>;
}
