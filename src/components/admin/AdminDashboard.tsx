"use client";

import Link from "next/link";
import { ArrowRight, Gift, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetitionPage } from "@/services/adminService";
import { CompetitionFeedback, CompetitionRows } from "./CompetitionList";
import styles from "./Admin.module.css";

export function AdminDashboard() {
  const [data, setData] = useState<AdminCompetitionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"error" | "unauthorized" | "forbidden" | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData(await adminService.listCompetitions({ pagina: 1, limite: 5 })); } catch (cause) { setError(cause instanceof ApiError && cause.status === 401 ? "unauthorized" : cause instanceof ApiError && cause.status === 403 ? "forbidden" : "error"); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <>
    <header className={styles.pageHeader}><p>PAINEL ADMINISTRATIVO</p><h1>Bem-vindo, Admin</h1><span>Gerencie competições e acompanhe a operação do POINT FFC.</span></header>
    <section className={styles.actionGrid} aria-label="Ações administrativas"><Link href="/admin/competicoes"><i><Trophy /></i><span><strong>Gerenciar competições</strong><small>Crie, edite e acompanhe as competições.</small></span><ArrowRight /></Link><Link href="/admin/competicoes"><i><Gift /></i><span><strong>Configurar premiações</strong><small>Defina a distribuição de premiação de cada competição.</small></span><ArrowRight /></Link></section>
    <section className={styles.recent}><div className={styles.sectionTitle}><div><h2>Competições recentes</h2><p>Dados administrativos atualizados pela API.</p></div><Link href="/admin/competicoes">Ver todas <ArrowRight /></Link></div>{loading ? <CompetitionFeedback kind="loading" /> : error ? <CompetitionFeedback kind={error} retry={error === "error" ? () => void load() : undefined} /> : data?.itens.length ? <CompetitionRows items={data.itens} /> : <CompetitionFeedback kind="empty" />}</section>
  </>;
}
