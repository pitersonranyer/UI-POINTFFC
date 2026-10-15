"use client";
import React, { useId } from "react";
import { getClubUniform } from "./clubUniforms";
import { UniformPattern } from "./UniformPattern";

export interface ClubVisualProps { clubId: number; size?: number; decorative?: boolean; className?: string }
export function ClubJersey({ clubId, size = 62, decorative = false, className }: ClubVisualProps) {
  const id = useId();
  const u = getClubUniform(clubId);
  const outline = "M32 12L44 8Q50 19 56 8L68 12L92 29L80 48L69 41L72 94Q50 100 28 94L31 41L20 48L8 29Z";
  return <svg viewBox="0 0 100 104" width={size} height={size * 1.04} className={className} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `Camiseta ilustrativa: ${u.name}`} aria-hidden={decorative || undefined} focusable="false">
    <defs><clipPath id={id}><path d={outline} /></clipPath></defs>
    <g clipPath={`url(#${id})`}><path d={outline} fill={u.primary} /><UniformPattern uniform={u} /><path d="M8 29L20 36M80 36L92 29M29 90Q50 95 71 90" fill="none" stroke={u.secondary} strokeWidth="4" /></g>
    <path d={outline} fill="none" stroke="#69737b" strokeWidth="1.3" />
    <path d="M43 9Q50 28 57 9" fill="none" stroke={u.secondary} strokeWidth="3" />
    <rect x="33" y="57" width="34" height="16" rx="4" fill="#17211f" />
    <text x="50" y="68.5" textAnchor="middle" fill={u.text} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="800">{u.abbreviation}</text>
  </svg>;
}
