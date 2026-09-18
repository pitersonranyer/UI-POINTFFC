"use client";

import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import type { AdminCompetition } from "@/services/adminService";
import { accessLabel, competitionPeriod, statusLabel } from "./adminFormat";
import styles from "./Admin.module.css";

export function CompetitionRows({ items }: { items: AdminCompetition[] }) {
  return <div className={styles.competitionList} role="list">{items.map((item) => <article className={styles.competitionRow} role="listitem" key={item.id}>
    <div className={styles.competitionName}><strong>{item.nome}</strong><small>{item.liga.nome} · {item.modalidade.nome}</small></div>
    <span className={styles.access}>{accessLabel(item.tipoAcesso)}</span>
    <span className={`${styles.status} ${styles[`status${item.status}`]}`}>{statusLabel(item.status)}</span>
    <span className={styles.period}>{competitionPeriod(item)}</span>
    <span className={styles.flag}><i className={item.visivelApp ? styles.yes : ""} />{item.visivelApp ? "Visível" : "Oculta"}</span>
    <span className={styles.flag}><i className={item.destaque ? styles.gold : ""} />{item.destaque ? "Destaque" : "Normal"}</span>
  </article>)}</div>;
}

export function CompetitionFeedback({ kind, retry }: { kind: "loading" | "empty" | "error" | "unauthorized" | "forbidden"; retry?: () => void }) {
  const copy = kind === "loading" ? "Carregando competições..." : kind === "empty" ? "Nenhuma competição encontrada." : kind === "unauthorized" ? "Sua sessão expirou. Entre novamente para continuar." : kind === "forbidden" ? "Seu usuário não possui acesso administrativo." : "Não foi possível carregar as competições.";
  return <div className={styles.feedback} role={kind === "loading" ? "status" : kind === "error" ? "alert" : undefined}><Trophy /><strong>{copy}</strong>{kind === "error" && retry && <button type="button" onClick={retry}>Tentar novamente</button>}</div>;
}

export function CompetitionFilters({ search, status, onSearch, onStatus, onSubmit }: { search: string; status: string; onSearch(value: string): void; onStatus(value: string): void; onSubmit(): void }) {
  return <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><label><Search /><input aria-label="Buscar competições" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nome ou slug" /></label><select aria-label="Filtrar por status" value={status} onChange={(event) => onStatus(event.target.value)}><option value="">Todos os status</option><option value="RASCUNHO">Rascunho</option><option value="INSCRICOES_ABERTAS">Inscrições abertas</option><option value="INSCRICOES_ENCERRADAS">Inscrições encerradas</option><option value="EM_ANDAMENTO">Em andamento</option><option value="ENCERRADA">Encerrada</option><option value="CANCELADA">Cancelada</option></select><button type="submit">Filtrar</button></form>;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange(page: number): void }) {
  if (totalPages <= 1) return null;
  return <nav className={styles.pagination} aria-label="Paginação"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft /></button><span>Página <strong>{page}</strong> de {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Próxima página"><ChevronRight /></button></nav>;
}
