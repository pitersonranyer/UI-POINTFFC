import React from "react";
import type { TeamPartialScore } from "@/types/partial-score";
import styles from "./MyTeamsManager.module.css";

const points = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PartialScore({ partial, loading, unavailable = false }: { partial?: TeamPartialScore; loading: boolean; unavailable?: boolean }) {
  if (loading) return <div className={`${styles.partial} ${styles.partialLoading}`} aria-label="Carregando pontuacao parcial"><strong>--,-- pts</strong><small>Carregando parcial</small></div>;
  if (unavailable || !partial || partial.status === "NAO_ENCONTRADO") return <div className={styles.partial}><strong className={styles.unavailable}>Parcial indisponível</strong></div>;
  if (partial.status === "AGUARDANDO" || partial.pontuacao === null) return <div className={styles.partial}><strong>-- pts</strong><small>Aguardando parcial</small></div>;
  return <div className={styles.partial}><strong>{points.format(partial.pontuacao)} pts</strong><small className={styles.partialBadge}>Parcial</small></div>;
}
