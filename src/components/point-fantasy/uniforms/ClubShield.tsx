"use client";
import React, { useId } from "react";
import { getClubUniform } from "./clubUniforms";
import { UniformPattern } from "./UniformPattern";
import type { ClubVisualProps } from "./ClubJersey";

export function ClubShield({ clubId, size = 28, decorative = false, className }: ClubVisualProps) {
  const id = useId();
  const u = getClubUniform(clubId);
  const outline = "M14 12Q50 0 86 12L82 57Q78 83 50 99Q22 83 18 57Z";
  return <svg viewBox="0 0 100 104" width={size} height={size * 1.04} className={className} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `Escudo ilustrativo: ${u.name}`} aria-hidden={decorative || undefined} focusable="false">
    <defs><clipPath id={id}><path d={outline} /></clipPath></defs>
    <g clipPath={`url(#${id})`}><path d={outline} fill={u.primary} /><UniformPattern uniform={u} /></g>
    <path d={outline} stroke="#69737b" strokeWidth="3" fill="none" />
    <rect x="19" y="37" width="62" height="27" rx="5" fill="#17211f" />
    <text x="50" y="56" textAnchor="middle" fill={u.text} fontSize="19" fontFamily="Arial, sans-serif" fontWeight="800">{u.abbreviation}</text>
  </svg>;
}
