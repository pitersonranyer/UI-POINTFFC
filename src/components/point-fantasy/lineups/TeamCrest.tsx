import React from "react";
import type { FantasyLineup } from "@/types/pointFantasyLineup";
export type CrestTeam = Pick<FantasyLineup, "id" | "competicaoId" | "sequencial"> & {
 identidade: { identificadorPublico: string } | null;
};
export function crestIdentity(team?: CrestTeam | null) {
 const key = team ? `v1:${team.competicaoId}:${team.identidade?.identificadorPublico ?? "legado"}:${team.id}` : "v1:preview";
 let hash = 2166136261; for (const c of key) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
 return { key, color:["#146b46", "#1b3028", "#a77c20", "#222222"][(hash >>> 0) % 4], variant:(hash >>> 4) % 3 };
}
export function TeamCrest({ team }: { team?: CrestTeam | null }) {
 const { key, color, variant } = crestIdentity(team);
 return <svg width="44" height="50" viewBox="0 0 44 50" role="img" aria-label={team ? "Brasão do time" : "Prévia provisória do brasão"} data-identity={key}><path d="M3 3H41V29Q39 40 22 47Q5 40 3 29Z" fill={color} stroke="#d8b85c" strokeWidth="3"/>{variant === 0 ? <path d="M8 9L36 32M8 18L31 39" stroke="#d8b85c" strokeWidth="4"/> : variant === 1 ? <path d="M16 5V40M28 5V40" stroke="#d8b85c" strokeWidth="4"/> : <path d="M5 17H39V27H5Z" fill="#d8b85c"/>}<text x="22" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">FFC</text><text x="22" y="39" textAnchor="middle" fill="white" fontSize="8">{team ? team.sequencial ?? team.id : "★"}</text></svg>;
}
