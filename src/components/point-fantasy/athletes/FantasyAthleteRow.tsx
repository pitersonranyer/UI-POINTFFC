import React from "react";
import type { FantasyReference, PointFantasyAthlete } from "@/types/pointFantasy";
import { categoryNames } from "@/types/pointFantasy";
import { ClubJersey } from "../uniforms/ClubJersey";
import { ClubShield } from "../uniforms/ClubShield";
import { clubUniforms } from "../uniforms/clubUniforms";
import styles from "./FantasyAthleteCatalog.module.css";

export function FantasyAthleteRow({ athlete: a, club, position }: { athlete: PointFantasyAthlete; club?: FantasyReference; position?: FantasyReference }) {
  const coach = a.posicaoId === 6;
  const category = !coach && a.categoriaId !== null ? categoryNames[a.categoriaId] : undefined;
  return <li className={styles.row}>
    <ClubJersey clubId={a.clubeIdExterno} decorative />
    <div className={styles.identity}><strong>{a.apelido}</strong><span><ClubShield clubId={a.clubeIdExterno} size={20} decorative />{clubUniforms[a.clubeIdExterno]?.name ?? club?.dados.nome ?? `Clube ${a.clubeIdExterno}`}</span></div>
    <span className={styles.position}>{coach ? "Técnico" : position?.dados.nome ?? "Posição não informada"}</span>
    <span className={styles.category} data-category={category}>{coach ? "Comissão técnica" : category ?? "Sem categoria"}</span>
    <span className={styles.coins}><strong>PC$ {a.pointcoins}</strong><small>PointCoins</small></span>
  </li>;
}
