import React from "react";
import styles from "./AthleteStatusIndicator.module.css";

export type AthleteCatalogStatus = "Suspenso" | "Contundido";

export function athleteCatalogStatus(statusId: number): AthleteCatalogStatus | null {
  if (statusId === 3) return "Suspenso";
  if (statusId === 5) return "Contundido";
  return null;
}

export function AthleteStatusIndicator({ statusId, size = 15 }: { statusId: number; size?: number }) {
  const status = athleteCatalogStatus(statusId);
  if (!status) return null;
  if (status === "Suspenso") return <svg className={styles.indicator} width={size} height={size * 1.22} viewBox="0 0 14 18" role="img" aria-label="Suspenso" focusable="false"><title>Suspenso</title><rect x="1" y="1" width="12" height="16" rx="2" fill="#d83a36" stroke="#8c211f" strokeWidth="1.4" /></svg>;
  return <svg className={styles.indicator} width={size} height={size} viewBox="0 0 18 18" role="img" aria-label="Contundido" focusable="false"><title>Contundido</title><path d="M7 1h4v6h6v4h-6v6H7v-6H1V7h6z" fill="#c92f34" stroke="#821d22" strokeWidth="1.2" strokeLinejoin="round" /></svg>;
}
