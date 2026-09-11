"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { FutebolJogo, FutebolTime } from "@/types/futebol";
import styles from "./FutebolMatches.module.css";

export function FutebolShield({ team }: { team: FutebolTime }) {
  const [failed, setFailed] = useState<string | null>(null);
  return team.escudoUrl?.trim() && failed !== team.escudoUrl
    ? <img className={styles.shield} src={team.escudoUrl} alt={`Escudo do ${team.nome}`} onError={() => setFailed(team.escudoUrl)} />
    : <span className={styles.shield} role="img" aria-label={`Escudo do ${team.nome} indisponível`}><ImageOff /></span>;
}

export function FutebolMatchInfo({ jogo }: { jogo: FutebolJogo }) {
  const labels: Record<string, string> = { IN_PLAY: "Ao vivo", PAUSED: "Intervalo", FINISHED: "Encerrado", AWARDED: "Encerrado", POSTPONED: "Adiado", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };
  const scheduled = jogo.status === "TIMED" || jogo.status === "SCHEDULED";
  const date = new Date(jogo.dataHoraUtc);
  const score = ["IN_PLAY", "PAUSED", "FINISHED", "AWARDED", "SUSPENDED"].includes(jogo.status) && jogo.placar.mandante != null && jogo.placar.visitante != null;
  return <div className={styles.info}>
    {scheduled ? <time dateTime={jogo.dataHoraUtc}>{Number.isNaN(date.getTime()) ? "Horário a definir" : `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}</time> : <>
      {score && <strong>{jogo.placar.mandante} × {jogo.placar.visitante}</strong>}
      <small className={jogo.status === "IN_PLAY" ? styles.live : undefined}>{labels[jogo.status] ?? "A definir"}</small>
    </>}
  </div>;
}
