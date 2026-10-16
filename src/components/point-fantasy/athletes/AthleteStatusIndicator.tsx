import React from "react";
import { capturedAthleteStatuses } from "@/types/pointFantasy";
import styles from "./AthleteStatusIndicator.module.css";

export type AthleteCatalogStatus = typeof capturedAthleteStatuses[keyof typeof capturedAthleteStatuses];

export function athleteCatalogStatus(statusId?: number | null): AthleteCatalogStatus | null {
  return typeof statusId === "number" && Object.hasOwn(capturedAthleteStatuses, statusId)
    ? capturedAthleteStatuses[statusId as keyof typeof capturedAthleteStatuses] : null;
}

export function AthleteStatusIndicator({ statusId, size = 16 }: { statusId?: number | null; size?: number }) {
  const status = athleteCatalogStatus(statusId);
  if (!status) return null;
  const color = statusId === 7 ? "#218249" : statusId === 2 ? "#946400" : statusId === 6 ? "#66716c" : "#c92f34";
  return <svg className={styles.indicator} width={size} height={size} style={{ width:size, height:size, flexShrink:0 }} viewBox="0 0 20 20" role="img" aria-label={status} focusable="false">
    <title>{`Condição: ${status}`}</title>
    <circle cx="10" cy="10" r="9" fill={statusId === 2 ? "#fff3b0" : "#fff"} stroke={color} strokeWidth="1.2" />
    {statusId === 7 && <path d="m5.5 10 3 3 6-6" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
    {statusId === 2 && <path d="M7.3 7a2.8 2.8 0 0 1 5.4.7c0 2-2.7 2-2.7 4M10 15h.01" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />}
    {statusId === 5 && <path d="M10 5v10M5 10h10" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" />}
    {statusId === 3 && <rect x="6" y="4.5" width="8" height="11" rx="1" fill={color} />}
    {statusId === 6 && <path d="M5.5 10h9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />}
  </svg>;
}
