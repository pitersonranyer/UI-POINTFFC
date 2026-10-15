import React, { useEffect, useState } from "react";
import type { PointFantasyAthlete } from "@/types/pointFantasy";
import type { LineupSelection, LineupSlot, LineupSlotPlacements } from "@/types/pointFantasyLineup";
import { ClubJersey } from "../uniforms/ClubJersey";
import { LineupAthleteActions } from "./LineupAthleteActions";
import { ReserveCategoryMedal } from "./ReserveCategoryMedal";
import { athleteInSlot, formationCounts, positionalAthletes, positionLabels, reserveCeiling, reserveCounts } from "./lineupPresentation";
import styles from "./LineupBuilder.module.css";

interface Props { value: LineupSelection; athletes: PointFantasyAthlete[]; placements?: LineupSlotPlacements; disabled: boolean; onOpen: (slot: LineupSlot) => void; onRemove: (slot: LineupSlot) => void; onCaptain: (id: number | null) => void; onMago: (id: number | null) => void }
function AthleteSlot({ slot, excess, expanded, onActions, ...props }: Props & { slot: LineupSlot; excess?: boolean; expanded: boolean; onActions: (slot: LineupSlot, id: number, excess: boolean) => void }) {
  const athlete = athleteInSlot(props.value, props.athletes, slot, props.placements);
  const captain = slot.role === "titulares" && athlete?.id === props.value.capitaoAtletaId;
  const mago = slot.role === "reservas" && athlete?.id === props.value.reservaMagoAtletaId;
  const ceiling = slot.role === "reservas" ? reserveCeiling(props.value, props.athletes, slot.position) : undefined;
  const invalid = excess || (athlete && ceiling != null && (athlete.categoriaId ?? 0) > ceiling);
  return <div className={styles.slot} data-position={slot.position} data-excess={excess || undefined}>
    <button type="button" className={styles.pickSlot} disabled={props.disabled} onClick={() => athlete ? onActions(slot, athlete.id, !!excess) : props.onOpen(slot)} aria-label={athlete ? `Ações de ${athlete.apelido}` : `Adicionar ${positionLabels[slot.position]} ${slot.index + 1}`} aria-haspopup={athlete ? "dialog" : undefined} aria-expanded={athlete ? expanded : undefined}>
      {athlete ? <ClubJersey clubId={athlete.clubeIdExterno} size={45} decorative /> : <span className={styles.emptyShirt} aria-hidden="true">+</span>}
      <strong>{athlete?.apelido ?? positionLabels[slot.position]}</strong>
      {captain && <span className={styles.roleBadge} aria-label="Capitão">C</span>}
      {mago && <svg className={styles.magoCrown} viewBox="0 0 24 24" width="26" height="24" role="img" aria-label="Reserva do Mago" focusable="false"><title>Reserva do Mago</title><path d="M3 6L7 11L12 3L17 11L21 6L19 18H5Z" fill="#e9bd42" stroke="#795719" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 21H19" stroke="#b38420" strokeWidth="2" strokeLinecap="round"/><path d="M8 15H16" stroke="#fff0b5" strokeWidth="1.3" strokeLinecap="round"/></svg>}
    </button>
    {slot.role === "reservas" && athlete && <div className={styles.reserveMeta}><small>{positionLabels[slot.position]}</small><ReserveCategoryMedal categoryId={athlete.categoriaId} /></div>}
    {invalid && <small className={styles.invalid}>Ajuste necessário</small>}
  </div>;
}
export function LineupPitch(props: Props) {
  const [actions, setActions] = useState<{ slot: LineupSlot; id: number; excess: boolean } | null>(null);
  useEffect(() => { setActions(null); }, [props.value, props.disabled]);
  const actionAthlete = actions ? athleteInSlot(props.value, props.athletes, actions.slot, props.placements) : undefined;
  function openActions(slot: LineupSlot, id: number, excess: boolean) { setActions({ slot, id, excess }); }
  function isExpanded(slot: LineupSlot) { return !!actions && actions.slot.role === slot.role && actions.slot.position === slot.position && actions.slot.index === slot.index; }
  function act(callback: () => void) { setActions(null); callback(); }
  const counts = formationCounts[props.value.formacao];
  function slots(position: number, role: "titulares" | "reservas" = "titulares") {
    const expected = role === "titulares" ? counts[position] : reserveCounts(props.value.formacao)[position];
    const actual = positionalAthletes(props.value, props.athletes, role, position).length;
    return Array.from({ length:Math.max(expected, actual) }, (_, index) => {
      const slot = { role, position, index };
      return <AthleteSlot key={`${position}-${index}`} {...props} slot={slot} excess={index >= expected} expanded={isExpanded(slot)} onActions={openActions} />;
    });
  }
  // Defensive row places fullbacks at the edges, including five-defender formations.
  const laterals = slots(2);
  return <div>
    <section className={styles.pitch} aria-label={`Campinho ${props.value.formacao}`}>
      <div className={styles.pitchLines} aria-hidden="true"><i /><b /><em /></div>
      <div className={styles.pitchRow} data-line="attack">{slots(5)}</div>
      <div className={styles.pitchRow} data-line="midfield">{slots(4)}</div>
      <div className={styles.pitchRow} data-line="defense">{laterals[0]}{slots(3)}{laterals.slice(1)}</div>
      <div className={styles.pitchRow} data-line="goalkeeper">{slots(1)}</div>
      <div className={styles.coach} data-testid="coach-slot"><AthleteSlot {...props} slot={{ role:"tecnico", position:6, index:0 }} expanded={isExpanded({ role:"tecnico", position:6, index:0 })} onActions={openActions} /></div>
    </section>
    <section className={styles.benchSection} aria-label="Banco de reservas"><h3>Banco de reservas <small>5 atletas</small></h3><div className={styles.bench}>{[1,2,3,4,5].map(pos => <React.Fragment key={pos}>{slots(pos, "reservas")}</React.Fragment>)}</div></section>
    {actions && actionAthlete?.id === actions.id && !props.disabled && <LineupAthleteActions athlete={actionAthlete} role={actions.slot.role} captain={props.value.capitaoAtletaId === actionAthlete.id} mago={props.value.reservaMagoAtletaId === actionAthlete.id} canReplace={!actions.excess}
      onClose={() => setActions(null)} onCaptain={() => act(() => props.onCaptain(props.value.capitaoAtletaId === actionAthlete.id ? null : actionAthlete.id))}
      onMago={() => act(() => props.onMago(props.value.reservaMagoAtletaId === actionAthlete.id ? null : actionAthlete.id))}
      onReplace={() => act(() => props.onOpen(actions.slot))} onRemove={() => act(() => props.onRemove(actions.slot))} />}
  </div>;
}
