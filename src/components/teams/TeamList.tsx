"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { UserCartolaTeam } from "@/types/team";
import styles from "./TeamList.module.css";

const PAGE_SIZE = 10;
export function TeamList({ teams }: { teams: UserCartolaTeam[] }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const filtered = useMemo(() => teams.filter((team) => team.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))).sort((a, b) => (order === "asc" ? 1 : -1) * a.name.localeCompare(b.name, "pt-BR")), [teams, query, order]);
  return (
    <section><div className={styles.tools}><label><Search size={18} /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(PAGE_SIZE); }} placeholder="Buscar pelo nome do time" /></label><select value={order} onChange={(event) => setOrder(event.target.value as "asc" | "desc")} aria-label="Ordenar times"><option value="asc">Nome: A–Z</option><option value="desc">Nome: Z–A</option></select></div><p className={styles.count}>{filtered.length} {filtered.length === 1 ? "time vinculado" : "times vinculados"}</p><div className={styles.list}>
      {filtered.slice(0, visible).map((team) => (
        <article className={styles.team} key={team.id}>
          <div className={styles.shield}>{team.shieldUrl ? <img src={team.shieldUrl} alt="" /> : <span>{team.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>}</div>
          <div className={styles.identity}><h2>{team.name}</h2><p>{team.ownerName}</p></div>
        </article>
      ))}
      {!filtered.length && <p className={styles.empty}>Nenhum time encontrado.</p>}</div>{visible < filtered.length && <button className={styles.more} onClick={() => setVisible((value) => value + PAGE_SIZE)}>Carregar mais</button>}</section>
  );
}
