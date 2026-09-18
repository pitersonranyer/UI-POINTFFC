"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetitionPage, type AdminCompetitionStatus } from "@/services/adminService";
import { CompetitionFeedback, CompetitionFilters, CompetitionRows, Pagination } from "./CompetitionList";
import styles from "./Admin.module.css";

export function AdminCompetitions() {
  const [data, setData] = useState<AdminCompetitionPage | null>(null), [loading, setLoading] = useState(true);
  const [error, setError] = useState<"error" | "unauthorized" | "forbidden" | null>(null);
  const [page, setPage] = useState(1), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const [appliedSearch, setAppliedSearch] = useState(""), [appliedStatus, setAppliedStatus] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData(await adminService.listCompetitions({ pagina: page, limite: 20, busca: appliedSearch, status: appliedStatus as AdminCompetitionStatus | "" })); } catch (cause) { setError(cause instanceof ApiError && cause.status === 401 ? "unauthorized" : cause instanceof ApiError && cause.status === 403 ? "forbidden" : "error"); } finally { setLoading(false); } }, [appliedSearch, appliedStatus, page]);
  useEffect(() => { void load(); }, [load]);
  const apply = () => { setPage(1); setAppliedSearch(search.trim()); setAppliedStatus(status); };
  return <><header className={`${styles.pageHeader} ${styles.listHeader}`}><div><p>ADMINISTRAÇÃO</p><h1>Competições</h1><span>Consulte e acompanhe as competições cadastradas.</span></div><Link href="/admin/competicoes/nova"><Plus />Nova competição</Link></header><section className={styles.listPanel}><CompetitionFilters search={search} status={status} onSearch={setSearch} onStatus={setStatus} onSubmit={apply} />{loading ? <CompetitionFeedback kind="loading" /> : error ? <CompetitionFeedback kind={error} retry={error === "error" ? () => void load() : undefined} /> : data?.itens.length ? <><CompetitionRows items={data.itens} editable /><Pagination page={data.paginacao.pagina} totalPages={data.paginacao.totalPaginas} onChange={setPage} /></> : <CompetitionFeedback kind="empty" />}</section></>;
}
