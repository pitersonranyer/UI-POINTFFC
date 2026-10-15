import React from "react";
import styles from "./LineupBuilder.module.css";

const medals: Record<number, { name: string; color: string; outline: string; initial: string }> = {
  1:{ name:"Bronze", color:"#bc8050", outline:"#694023", initial:"B" },
  2:{ name:"Prata", color:"#c1ccd5", outline:"#4a5c6b", initial:"P" },
  3:{ name:"Ouro", color:"#e7bf4e", outline:"#755515", initial:"O" },
};
export function ReserveCategoryMedal({ categoryId }: { categoryId: number | null }) {
  const medal = categoryId === null ? undefined : medals[categoryId];
  if (!medal) return null;
  const label = `Categoria do reserva: ${medal.name}`;
  return <svg className={styles.categoryMedal} viewBox="0 0 20 25" width="18" height="23" role="img" aria-label={label} focusable="false">
    <title>{label}</title><path d="M3 1H7L12 11L8 13Z" fill="#28734d"/><path d="M13 1H17L12 13L8 11Z" fill="#d0b26c"/>
    <circle cx="10" cy="16" r="8" fill={medal.color} stroke={medal.outline} strokeWidth="1.2"/>
    <circle cx="10" cy="16" r="5.7" fill="none" stroke={medal.outline} strokeWidth=".7"/>
    <text x="10" y="18.8" textAnchor="middle" fill={medal.outline} fontSize="8" fontFamily="Arial, sans-serif" fontWeight="800">{medal.initial}</text>
  </svg>;
}
