"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { futebolStatus } from "@/lib/futebolStatus";
import type { FutebolJogo, FutebolTime } from "@/types/futebol";
import styles from "./FutebolMatches.module.css";

export function FutebolShield({ team }: { team: FutebolTime }) {
  const [failed, setFailed] = useState<string | null>(null);
  return team.escudoUrl?.trim() && failed !== team.escudoUrl
    ? <img className={styles.shield} src={team.escudoUrl} alt={`Escudo do ${team.nome}`} onError={() => setFailed(team.escudoUrl)} />
    : <span className={styles.shield} role="img" aria-label={`Escudo do ${team.nome} indisponível`}><ImageOff /></span>;
}

export function FutebolMatchInfo({ jogo }: { jogo: FutebolJogo }) {
  const { label, scheduled, score } = futebolStatus(jogo);
  const date = new Date(jogo.dataHoraUtc);
  return <div className={styles.info}>
    {scheduled ? <time dateTime={jogo.dataHoraUtc}>{Number.isNaN(date.getTime()) ? "Horário a definir" : `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}</time> : <>
      {score && <strong>{jogo.placar.mandante} × {jogo.placar.visitante}</strong>}
      <small className={jogo.status === "IN_PLAY" ? styles.live : undefined}>{label}</small>
    </>}
  </div>;
}
