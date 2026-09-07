"use client";

import { Check, Clipboard, Download, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CARTOLA_CURRENT_ROUND, CARTOLA_SEASON } from "@/config/cartola";
import { partialScoreService } from "@/services/partialScoreService";
import { teamService } from "@/services/teamService";
import type { TeamPartialScore } from "@/types/partial-score";
import type { CartolaTeam, FindByIdsResult, ImportResult } from "@/types/team";
import { normalizeImportIds } from "./teamImport";
import { PartialScore } from "./PartialScore";
import { Dialog } from "@/components/ui/Dialog";
import styles from "./MyTeamsManager.module.css";

type Modal = "add" | "import" | "export" | null;
const message = (error: unknown, fallback: string) => error instanceof Error && error.message ? error.message : fallback;

function Shield({ team }: { team: CartolaTeam }) {
  return <span className={styles.shield}>{team.escudoUrl ? <img src={team.escudoUrl} alt={`Escudo do ${team.nome}`} /> : team.nome.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>;
}

function CopyId({ id }: { id: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(String(id)); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <span className={styles.id}>ID {id}<button type="button" onClick={copy} aria-label={`Copiar ID ${id}`} title="Copiar TIME_ID"><Clipboard size={14} /></button>{copied && <small>✓ ID copiado</small>}</span>;
}

export function MyTeamsManager() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [teams, setTeams] = useState<CartolaTeam[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [partials, setPartials] = useState<Map<number, TeamPartialScore>>(new Map()), [partialsLoading, setPartialsLoading] = useState(false), [partialsError, setPartialsError] = useState(false), [partialAttempt, setPartialAttempt] = useState(0);
  const [modal, setModal] = useState<Modal>(null), [removing, setRemoving] = useState<number | null>(null), [confirm, setConfirm] = useState<CartolaTeam | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(""); try { setTeams(await teamService.buscarMeusTimes()); } catch (e) { setError(message(e, "Não foi possível carregar seus times.")); } finally { setLoading(false); } }, []);
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { setLoading(false); setTeams([]); return; }
    void load();
  }, [isAuthenticated, isAuthLoading, load]);
  useEffect(() => {
    if (!teams.length) { setPartials(new Map()); setPartialsLoading(false); setPartialsError(false); return; }
    let active = true;
    setPartialsLoading(true);
    setPartialsError(false);
    void partialScoreService.buscarParciais(CARTOLA_SEASON, CARTOLA_CURRENT_ROUND, teams.map((team) => team.timeId))
      .then((items) => { if (active) setPartials(new Map(items.map((item) => [item.timeId, item]))); })
      .catch(() => { if (active) { setPartials(new Map()); setPartialsError(true); } })
      .finally(() => { if (active) setPartialsLoading(false); });
    return () => { active = false; };
  }, [teams, partialAttempt]);
  const remove = async () => { if (!confirm) return; setRemoving(confirm.timeId); try { await teamService.removerMeuTime(confirm.timeId); setTeams((list) => list.filter((team) => team.timeId !== confirm.timeId)); setConfirm(null); } catch (e) { setError(message(e, "Não foi possível remover o time.")); } finally { setRemoving(null); } };
  if (isAuthLoading) return <main className="page-shell"><div className={styles.loading}><Loader2 className={styles.spin} /> Verificando sua sessão...</div></main>;

  if (!isAuthenticated) return <main className="page-shell">
    <header className={styles.pageHeader}><div><p className="eyebrow">Times vinculados</p><h1 className="page-title">Meus Times</h1><p className="page-subtitle">Seus times cadastrados no Fantasy Point</p></div></header>
    <section className={styles.guest}>
      <span className={styles.guestIcon}><Plus /></span>
      <h2>Entre para acessar seus times</h2>
      <p>Faça login para visualizar, adicionar, importar e gerenciar seus times do Cartola.</p>
      <Link className={styles.loginLink} href="/login">Fazer login</Link>
    </section>
  </main>;

  return <main className="page-shell">
    <header className={styles.pageHeader}><div><p className="eyebrow">Times vinculados</p><h1 className="page-title">Meus Times</h1><p className="page-subtitle">Seus times cadastrados no Fantasy Point</p></div><div className={styles.actions}><button className={styles.primary} onClick={() => setModal("add")}><Plus /> <span>Adicionar time</span></button><button onClick={() => setModal("import")}><Download /> <span>Importar</span></button><button onClick={() => setModal("export")} disabled={!teams.length}><Upload /> <span>Exportar</span></button></div></header>
    <div className={styles.sectionTitle}><h2>Meus Times</h2><span>{teams.length} {teams.length === 1 ? "time" : "times"}</span></div>
    {error && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className={styles.spin} /> : null}Tentar novamente</button></div>}
    {loading ? <div className={styles.loading}><Loader2 className={styles.spin} /> Carregando seus times...</div> : teams.length ? <><div className={styles.grid}>{teams.map((team) => <article className={styles.card} key={team.timeId}><Shield team={team} /><div className={styles.identity}><h3>{team.nome}</h3><p>{team.nomeCartoleiro}</p><CopyId id={team.timeId} /></div><PartialScore partial={partials.get(team.timeId)} loading={partialsLoading} unavailable={partialsError} /><button className={styles.remove} onClick={() => setConfirm(team)} disabled={removing === team.timeId}><Trash2 size={17} /><span>Remover</span></button></article>)}</div>{partialsError && <button className={styles.partialRetry} type="button" onClick={() => setPartialAttempt((value) => value + 1)}>Tentar carregar parciais novamente</button>}</> : <section className={styles.empty}><span><Plus /></span><h2>Você ainda não adicionou times.</h2><p>Adicione seus times do Cartola para participar das funcionalidades do Fantasy Point.</p><button className={styles.primary} onClick={() => setModal("add")}><Plus /> Adicionar meu primeiro time</button></section>}
    {modal === "add" && <AddDialog teams={teams} close={() => setModal(null)} onAdded={(team) => setTeams((list) => list.some((item) => item.timeId === team.timeId) ? list : [...list, team])} />}
    {modal === "import" && <ImportDialog close={() => setModal(null)} onImported={load} />}
    {modal === "export" && <ExportDialog teams={teams} close={() => setModal(null)} />}
    {confirm && <Dialog title={`Remover ${confirm.nome}?`} close={() => !removing && setConfirm(null)}><p className={styles.helper}>Este time será removido da sua lista.</p><div className={styles.footer}><button onClick={() => setConfirm(null)} disabled={!!removing}>Cancelar</button><button className={styles.danger} onClick={remove} disabled={!!removing}>{removing ? <Loader2 className={styles.spin} /> : <Trash2 />} Remover</button></div></Dialog>}
  </main>;
}

function AddDialog({ teams, close, onAdded }: { teams: CartolaTeam[]; close: () => void; onAdded: (team: CartolaTeam) => void }) {
  const [query, setQuery] = useState(""), [results, setResults] = useState<CartolaTeam[]>([]), [searching, setSearching] = useState(false), [adding, setAdding] = useState<number | null>(null), [added, setAdded] = useState(() => new Set(teams.map((team) => team.timeId))), [error, setError] = useState("");
  useEffect(() => { const name = query.trim(); if (!name) { setResults([]); setSearching(false); setError(""); return; } setSearching(true); const timer = window.setTimeout(async () => { try { setResults(await teamService.buscarTimesPorNome(name)); setError(""); } catch (e) { setError(message(e, "Não foi possível buscar os times.")); } finally { setSearching(false); } }, 400); return () => window.clearTimeout(timer); }, [query]);
  const add = async (team: CartolaTeam) => { if (added.has(team.timeId)) return; setAdding(team.timeId); try { const result = await teamService.adicionarMeuTime(team); setAdded((ids) => new Set(ids).add(team.timeId)); onAdded(result.time ?? team); setError(""); } catch (e) { setError(message(e, "Não foi possível adicionar este time.")); } finally { setAdding(null); } };
  return <Dialog title="Adicionar time" close={close} wide><label className={styles.search}><Search /><input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite o nome do time" /></label>{error && <p className={styles.inlineError}>{error}</p>}<div className={styles.results}>{searching ? <p className={styles.loading}><Loader2 className={styles.spin} /> Pesquisando...</p> : results.map((team) => <article className={styles.result} key={team.timeId}><Shield team={team} /><div className={styles.identity}><h3>{team.nome}</h3><p>{team.nomeCartoleiro}</p><CopyId id={team.timeId} /></div><button className={`${styles.circle} ${added.has(team.timeId) ? styles.checked : ""}`} onClick={() => add(team)} disabled={added.has(team.timeId) || adding === team.timeId} aria-label={added.has(team.timeId) ? "Time adicionado" : `Adicionar ${team.nome}`}>{adding === team.timeId ? <Loader2 className={styles.spin} /> : added.has(team.timeId) ? <Check /> : <Plus />}</button></article>)}{query.trim() && !searching && !results.length && !error && <p className={styles.noResults}>Nenhum time encontrado.</p>}</div></Dialog>;
}

function ImportDialog({ close, onImported }: { close: () => void; onImported: () => Promise<void> }) {
  const [text, setText] = useState(""), [preview, setPreview] = useState<FindByIdsResult | null>(null), [result, setResult] = useState<ImportResult | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [copied, setCopied] = useState(false);
  const ids = normalizeImportIds(text);
  const find = async () => { if (!ids) { setError("Informe ao menos um TIME_ID válido."); return; } setBusy(true); try { setPreview(await teamService.buscarTimesPorIds(ids)); setError(""); } catch (e) { setError(message(e, "Não foi possível buscar a lista de times.")); } finally { setBusy(false); } };
  const run = async () => { if (!preview?.times.length) return; setBusy(true); try { const response = await teamService.importarMeusTimes(preview.times); setResult(response); setError(""); await onImported(); } catch (e) { setError(message(e, "Não foi possível concluir toda a importação.")); } finally { setBusy(false); } };
  const retry = result?.tentarNovamente ?? preview?.tentarNovamente ?? [];
  const copyRetry = async () => { await navigator.clipboard.writeText(retry.join(";")); setCopied(true); };
  return <Dialog title={result ? "Importação concluída" : "Importar times"} close={close} wide>{result ? <div className={styles.summary}><p>✓ {result.adicionados} times adicionados</p><p>✓ {result.jaExistentes} já estavam cadastrados</p><p>⚠ {result.naoEncontrados.length} não encontrados</p><p>⚠ {result.naoProcessados || result.tentarNovamente.length} não puderam ser processados</p></div> : !preview ? <><p className={styles.helper}>Cole sua lista de times.</p><textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} placeholder="Meus Favoritos=>44566162;30157334;13933388" /></> : <><p className={styles.found}>{preview.times.length} {preview.times.length === 1 ? "time encontrado" : "times encontrados"}</p><div className={styles.preview}>{preview.times.map((team) => <div key={team.timeId}><Check /><span><strong>{team.nome}</strong><small>{team.nomeCartoleiro} · ID {team.timeId}</small></span></div>)}</div></>}{(result?.naoEncontrados ?? preview?.naoEncontrados ?? []).length > 0 && <div className={styles.notice}><strong>Não encontrados</strong><p>{(result?.naoEncontrados ?? preview?.naoEncontrados ?? []).join(";")}</p></div>}{retry.length > 0 && <div className={styles.notice}><strong>Alguns times não puderam ser processados agora.</strong><p>{retry.join(";")}</p><button onClick={copyRetry}><Clipboard />{copied ? "IDs copiados" : "Copiar IDs para tentar novamente"}</button></div>}{error && <p className={styles.inlineError}>{error}</p>}<div className={styles.footer}><button onClick={close}>Cancelar</button>{!result && (!preview ? <button className={styles.primary} onClick={find} disabled={busy || !ids}>{busy ? <Loader2 className={styles.spin} /> : <Search />} Buscar times</button> : <button className={styles.primary} onClick={run} disabled={busy || !preview.times.length}>{busy ? <Loader2 className={styles.spin} /> : <Plus />} Adicionar {preview.times.length} times</button>)}</div></Dialog>;
}

function ExportDialog({ teams, close }: { teams: CartolaTeam[]; close: () => void }) {
  const [name, setName] = useState("Meus Favoritos"), [copied, setCopied] = useState(false);
  const value = useMemo(() => `${name.trim() || "Meus Favoritos"}=>${teams.map((team) => team.timeId).join(";")}`, [name, teams]);
  const copy = async () => { await navigator.clipboard.writeText(value); setCopied(true); };
  return <Dialog title="Exportar meus times" close={close}><label className={styles.field}>Nome da lista<input value={name} onChange={(e) => { setName(e.target.value); setCopied(false); }} /></label><output className={styles.export}>{value}</output><div className={styles.footer}><button onClick={close}>Fechar</button><button className={styles.primary} onClick={copy}>{copied ? <Check /> : <Clipboard />}{copied ? "Lista copiada" : "Copiar lista"}</button></div></Dialog>;
}
