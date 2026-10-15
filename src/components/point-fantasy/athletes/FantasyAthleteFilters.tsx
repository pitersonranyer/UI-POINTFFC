import React from "react";
import type { AthleteFilters, FantasyReference } from "@/types/pointFantasy";
import { categoryNames, emptyAthleteFilters } from "@/types/pointFantasy";
import { clubUniforms } from "../uniforms/clubUniforms";
import styles from "./FantasyAthleteCatalog.module.css";

export function FantasyAthleteFilters({ value, onChange, clubs, positions }: {
  value: AthleteFilters; onChange: (value: AthleteFilters) => void; clubs: FantasyReference[]; positions: FantasyReference[];
}) {
  const update = (field: keyof AthleteFilters, next: string | boolean) => onChange({ ...value, [field]: next });
  return <div className={styles.filters}>
    <label className={styles.search}>Buscar atleta<input type="search" placeholder="Digite o apelido do atleta" value={value.search} onChange={e => update("search", e.target.value)} /></label>
    <label>Clube<select value={value.club} onChange={e => update("club", e.target.value)}><option value="">Todos os clubes</option>{clubs.map(c => <option key={c.id} value={c.id}>{clubUniforms[c.id]?.name ?? c.dados.nome} · {c.dados.abreviacao}</option>)}</select></label>
    <label>Posição<select value={value.position} onChange={e => update("position", e.target.value)}><option value="">Todas as posições</option>{positions.map(p => <option key={p.id} value={p.id}>{p.dados.nome}</option>)}</select></label>
    <label>Categoria<select value={value.category} onChange={e => update("category", e.target.value)}><option value="">Todas as categorias</option>{Object.entries(categoryNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    <label className={styles.checkbox}><input type="checkbox" checked={value.coaches} onChange={e => update("coaches", e.target.checked)} /> Incluir técnicos</label>
    <button type="button" onClick={() => onChange({ ...emptyAthleteFilters })}>Limpar filtros</button>
  </div>;
}
