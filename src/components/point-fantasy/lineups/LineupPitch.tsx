import React, { useEffect, useState } from "react";
import type { FantasyReference, PointFantasyAthlete } from "@/types/pointFantasy";
import type { LineupSelection, LineupSlot, LineupSlotPlacements } from "@/types/pointFantasyLineup";
import { ClubJersey } from "../uniforms/ClubJersey";
import { AthleteStatusIndicator } from "../athletes/AthleteStatusIndicator";
import { LineupAthleteActions } from "./LineupAthleteActions";
import { ReserveCategoryMedal } from "./ReserveCategoryMedal";
import { athleteInSlot, formationCounts, positionalAthletes, positionLabels, reserveCeiling, reserveCounts } from "./lineupPresentation";
import styles from "./LineupBuilder.module.css";

interface Props { value: LineupSelection; athletes: PointFantasyAthlete[]; clubs?: FantasyReference[]; placements?: LineupSlotPlacements; disabled: boolean; onOpen: (slot: LineupSlot) => void; onRemove: (slot: LineupSlot) => void; onCaptain: (id: number | null) => void; onPowerReserve: (id: number | null) => void }
function AthleteSlot({ slot, excess, expanded, onActions, ...props }: Props & { slot: LineupSlot; excess?: boolean; expanded: boolean; onActions: (slot: LineupSlot, id: number, excess: boolean) => void }) {
  const athlete = athleteInSlot(props.value, props.athletes, slot, props.placements);
  const captain = slot.role === "titulares" && athlete?.id === props.value.capitaoAtletaId;
  const powerReserve = slot.role === "reservas" && athlete?.id === props.value.reservaMagoAtletaId;
  const ceiling = slot.role === "reservas" ? reserveCeiling(props.value, props.athletes, slot.position) : undefined;
  const invalid = excess || (athlete && ceiling != null && (athlete.categoriaId ?? 0) > ceiling);
  return <div className={styles.slot} data-position={slot.position} data-excess={excess || undefined}>
    <button type="button" className={styles.pickSlot} disabled={props.disabled} onClick={() => athlete ? onActions(slot, athlete.id, !!excess) : props.onOpen(slot)} aria-label={athlete ? `Ações de ${athlete.apelido}` : `Adicionar ${positionLabels[slot.position]} ${slot.index + 1}`} aria-haspopup={athlete ? "dialog" : undefined} aria-expanded={athlete ? expanded : undefined}>
      {athlete ? <ClubJersey clubId={athlete.clubeIdExterno} size={45} decorative /> : <span className={styles.emptyShirt} aria-hidden="true">+</span>}
      <strong>{athlete?.apelido ?? positionLabels[slot.position]}</strong>
      {athlete && <AthleteStatusIndicator statusId={athlete.statusId} size={13} />}
      {captain && <span className={styles.roleBadge} aria-label="Capitão">C</span>}
      {powerReserve && <svg className={styles.powerBolt} viewBox="0 0 24 24" width="23" height="24" role="img" aria-label="Reserva Power" focusable="false"><title>Reserva Power</title><path d="M13.2 2.5 4.5 13h6.1l-.7 8.5L19.5 11h-6.2l-.1-8.5Z" fill="#e9bd42" stroke="#795719" strokeWidth="1.2" strokeLinejoin="round"/></svg>}
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
    {actions && actionAthlete?.id === actions.id && !props.disabled && <LineupAthleteActions athlete={actionAthlete} clubName={props.clubs?.find(club => club.id === actionAthlete.clubeIdExterno)?.dados.nome} role={actions.slot.role} captain={props.value.capitaoAtletaId === actionAthlete.id} powerReserve={props.value.reservaMagoAtletaId === actionAthlete.id} canReplace={!actions.excess}
      onClose={() => setActions(null)} onCaptain={() => act(() => props.onCaptain(props.value.capitaoAtletaId === actionAthlete.id ? null : actionAthlete.id))}
      onPowerReserve={() => act(() => props.onPowerReserve(props.value.reservaMagoAtletaId === actionAthlete.id ? null : actionAthlete.id))}
      onReplace={() => act(() => props.onOpen(actions.slot))} onRemove={() => act(() => props.onRemove(actions.slot))} />}
  </div>;
}
