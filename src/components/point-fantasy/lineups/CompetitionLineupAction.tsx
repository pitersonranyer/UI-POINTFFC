"use client";
import React, { useId } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CompetitionDetail } from "@/types/pointFantasyLineup";
import styles from "./LineupBuilder.module.css";

export function competitionLineupPrice(competition: CompetitionDetail): string | null {
  if (competition.tipoAcesso === "FREE") return null;
  const raw = competition.valorInscricao;
  const amount = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
  if (!Number.isFinite(amount) || amount < 0) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export function perLineupPrice(competition: CompetitionDetail): string {
  if (competition.tipoAcesso === "FREE") return "Cada escalação: Grátis";
  const price = competitionLineupPrice(competition);
  return price ? `Cada escalação: ${price}` : "Valor por escalação indisponível";
}

export function publicCreationBlockReason(competition: CompetitionDetail, now: number): string | null {
  if (competition.status !== "PUBLICADA") return "Competição indisponível para novas escalações.";
  const start = Date.parse(competition.inicioInscricao);
  if (!Number.isFinite(start)) return "Período de montagem indisponível.";
  if (start > now) return "A montagem ainda não foi aberta.";
  const end = Date.parse(competition.fimInscricao);
  if (!Number.isFinite(end)) return "Prazo de montagem indisponível.";
  if (end <= now) return "O prazo de montagem está encerrado.";
  if (competition.fechamentoDefinitivoEm) {
    const close = Date.parse(competition.fechamentoDefinitivoEm);
    if (!Number.isFinite(close) || close <= now) return "A competição foi encerrada para novas escalações.";
  }
  const matches = competition.partidas ?? [];
  if (!matches.length) return "Nenhum confronto disponível para montagem.";
  if (matches.some(match => match.status !== "AGENDADA" || match.inicioReal !== null || !Number.isFinite(Date.parse(match.inicioPrevisto)) || Date.parse(match.inicioPrevisto) <= now)) {
    return "A montagem foi bloqueada pelo início ou estado de uma partida.";
  }
  return null;
}

type CompetitionLineupActionProps = {
  competition: CompetitionDetail;
  disabledReason?: string | null;
} & ({ href: string; onStart?: never } | { href?: never; onStart: () => void });

export function CompetitionLineupAction({ competition, disabledReason, href, onStart }: CompetitionLineupActionProps) {
  const descriptionId = useId();
  const blocked = Boolean(disabledReason);
  const className = `${styles.lineupActionButton} ${blocked ? styles.lineupActionButtonDisabled : ""}`;
  const content = <>Escale seu time <ArrowRight size={18} aria-hidden="true" /></>;

  return <div className={styles.lineupAction}>
    <p className={styles.lineupPrice}>{perLineupPrice(competition)}</p>
    {href
      ? blocked
        ? <button className={className} type="button" disabled aria-describedby={descriptionId}>{content}</button>
        : <Link className={className} href={href}>{content}</Link>
      : <button className={className} type="button" disabled={blocked} aria-describedby={blocked ? descriptionId : undefined} onClick={onStart}>{content}</button>}
    {disabledReason && <p className={styles.lineupActionReason} id={descriptionId} role="status">{disabledReason}</p>}
  </div>;
}
