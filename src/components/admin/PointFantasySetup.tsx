"use client";

import Link from "next/link";
import { Check, ExternalLink, LoaderCircle, Plus, Send, Snowflake } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/services/apiClient";
import {
  captureFantasyCatalog,
  createFantasyCompetition,
  freezeFantasyCatalog,
  getFantasyMarketStatus,
  listFantasyCatalogs,
  loadAdminFantasyCompetition,
  loadCapturedCatalogAthletes,
  publishFantasyCompetition,
} from "@/services/adminPointFantasyService";
import type {
  CapturedCatalogWorkspace,
  CreateFantasyCompetitionPayload,
  FantasyCompetition,
  MarketStatus,
  PointFantasyCatalog,
  SnapshotMatch,
} from "@/types/adminPointFantasy";
import styles from "./PointFantasySetup.module.css";

const storageKey = "pointffc.admin.pointFantasy.catalog";
const competitionStorageKey = "pointffc.admin.pointFantasy.competitionId";
const asLocalInput = (value: Date) => {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};
const isoDate = (value: string) => new Date(value).toISOString();
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    const messages: Record<number, string> = {
      400: "Confira os dados obrigatórios e a janela de inscrição.",
      401: "Sua sessão expirou. Entre novamente para continuar.",
      403: "Sua conta não tem permissão administrativa ativa.",
      409: "O estado do mercado, catálogo ou competição mudou. Atualize os dados antes de tentar novamente.",
      502: "A fonte do Cartola retornou dados inválidos.",
      503: "A fonte do Cartola está temporariamente indisponível.",
    };
    return `${messages[error.status] ?? "Não foi possível concluir a operação."} ${error.message}`;
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
};
const validWorkspace = (value: unknown): value is CapturedCatalogWorkspace => {
  if (!value || typeof value !== "object") return false;
  const item = value as CapturedCatalogWorkspace;
  return Number.isInteger(item.catalog?.id)
    && Array.isArray(item.catalog?.referencias?.partidas)
    && item.catalog.referencias.partidas.length > 0
    && Number.isInteger(item.athleteCount)
    && Number.isInteger(item.clubCount);
};
function clubName(catalog: CapturedCatalogWorkspace["catalog"], id: number) {
  const club = catalog.referencias.clubes[String(id)];
  return club?.nome ?? club?.abreviacao ?? `Clube ${id}`;
}
function matchLabel(match: SnapshotMatch, catalog: CapturedCatalogWorkspace["catalog"]) {
  return `${clubName(catalog, match.clubeMandanteId)} x ${clubName(catalog, match.clubeVisitanteId)}`;
}
function newCompetitionDates(matches: SnapshotMatch[]) {
  const start = new Date(Date.now() + 5 * 60_000);
  const firstKickoff = matches.map(m => new Date(m.inicioPrevisto).getTime()).filter(Number.isFinite).sort((a, b) => a - b)[0];
  const end = new Date(Math.max(start.getTime() + 60_000, (firstKickoff ?? start.getTime() + 3_600_000) - 3_600_000));
  return { start: asLocalInput(start), end: asLocalInput(end) };
}

export function PointFantasySetup() {
  const [market, setMarket] = useState<MarketStatus | null>(null);
  const [temporada, setTemporada] = useState(String(new Date().getFullYear()));
  const [rodada, setRodada] = useState("1");
  const [versao, setVersao] = useState("1");
  const [catalogs, setCatalogs] = useState<PointFantasyCatalog[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [workspace, setWorkspace] = useState<CapturedCatalogWorkspace | null>(null);
  const [selectedMatchIds, setSelectedMatchIds] = useState<number[]>([]);
  const [nome, setNome] = useState("");
  const [inicioInscricao, setInicioInscricao] = useState("");
  const [fimInscricao, setFimInscricao] = useState("");
  const [limite, setLimite] = useState("1");
  const [competition, setCompetition] = useState<FantasyCompetition | null>(null);
  const [busy, setBusy] = useState<"capture" | "count" | "freeze" | "create" | "publish" | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const initializedCatalogId = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void getFantasyMarketStatus().then(value => {
      if (!active) return;
      setMarket(value);
      setTemporada(String(value.temporada));
      setRodada(String(value.rodada_atual));
    }).catch(cause => { if (active) setError(errorMessage(cause)); });
    void listFantasyCatalogs(controller.signal).then(items => {
      if (active) setCatalogs(items);
    }).catch(cause => { if (active) setError(errorMessage(cause)); });
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (validWorkspace(parsed)) {
          setWorkspace(parsed);
          setSelectedCatalogId(String(parsed.catalog.id));
          setTemporada(String(parsed.catalog.temporada));
          setRodada(String(parsed.catalog.rodada));
          setVersao(String(parsed.catalog.versao));
        }
      }
      const storedCompetitionId = Number(sessionStorage.getItem(competitionStorageKey));
      if (Number.isInteger(storedCompetitionId) && storedCompetitionId > 0) {
        void loadAdminFantasyCompetition(storedCompetitionId, controller.signal).then(value => {
          if (active) setCompetition(value);
        }).catch(() => {
          if (active) {
            sessionStorage.removeItem(competitionStorageKey);
            setError("Não foi possível recuperar o rascunho da competição nesta sessão.");
          }
        });
      }
    } catch { try { sessionStorage.removeItem(storageKey); } catch { /* Ignore unavailable browser storage. */ } }
    return () => { active = false; controller.abort(); };
  }, []);

  const availableCatalogs = useMemo(() => {
    const values = new Map(catalogs.map(catalog => [catalog.id, catalog]));
    if (workspace) values.set(workspace.catalog.id, workspace.catalog);
    return [...values.values()].filter(catalog => catalog.status === "CONGELADO");
  }, [catalogs, workspace]);
  useEffect(() => {
    if (!availableCatalogs.length || availableCatalogs.some(catalog => catalog.id === Number(selectedCatalogId))) return;
    setSelectedCatalogId(String(workspace && availableCatalogs.some(catalog => catalog.id === workspace.catalog.id)
      ? workspace.catalog.id : availableCatalogs[0].id));
  }, [availableCatalogs, selectedCatalogId, workspace]);

  const matches = useMemo(() => workspace?.catalog.referencias.partidas ?? [], [workspace]);
  const selectedMatches = useMemo(() => matches.filter(m => selectedMatchIds.includes(m.partidaIdExterno)), [matches, selectedMatchIds]);
  useEffect(() => {
    if (!workspace || initializedCatalogId.current === workspace.catalog.id) return;
    initializedCatalogId.current = workspace.catalog.id;
    setSelectedMatchIds(matches.map(m => m.partidaIdExterno));
    const dates = newCompetitionDates(matches);
    setInicioInscricao(dates.start);
    setFimInscricao(dates.end);
  }, [workspace, matches]);

  const storeWorkspace = useCallback((next: CapturedCatalogWorkspace) => {
    setWorkspace(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* The in-memory flow remains available. */ }
  }, []);

  async function capture() {
    if (lock.current || !market) return;
    lock.current = true; setBusy("capture"); setError(""); setMessage("");
    try {
      const catalog = await captureFantasyCatalog({ temporada: Number(temporada), rodada: Number(rodada), versao: Number(versao) });
      setCatalogs(current => [catalog, ...current.filter(item => item.id !== catalog.id)]);
      storeWorkspace({ catalog, athleteCount: 0, clubCount: 0 });
      setSelectedMatchIds([]);
      const athletes = await loadCapturedCatalogAthletes(catalog.id, new AbortController().signal);
      storeWorkspace({ catalog, athleteCount: athletes.length, clubCount: new Set(athletes.map(a => a.clubeIdExterno)).size });
      setMessage("Catálogo capturado. Revise o snapshot e congele para habilitar a criação da competição.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(""); }
  }

  async function refreshCounts() {
    if (lock.current || !workspace) return;
    lock.current = true; setBusy("count"); setError(""); setMessage("");
    try {
      const athletes = await loadCapturedCatalogAthletes(workspace.catalog.id, new AbortController().signal);
      const next = { ...workspace, athleteCount: athletes.length, clubCount: new Set(athletes.map(a => a.clubeIdExterno)).size };
      storeWorkspace(next);
      setMessage("Contagens do catálogo atualizadas.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(""); }
  }

  async function loadSelectedCatalog() {
    const catalog = availableCatalogs.find(item => item.id === Number(selectedCatalogId));
    if (lock.current || !catalog) return;
    lock.current = true; setBusy("capture"); setError(""); setMessage("");
    try {
      // Capture is idempotent by temporada/rodada/versao, so this returns the stored snapshot.
      const snapshot = await captureFantasyCatalog({ temporada: catalog.temporada, rodada: catalog.rodada, versao: catalog.versao });
      const athletes = await loadCapturedCatalogAthletes(snapshot.id, new AbortController().signal);
      storeWorkspace({ catalog: snapshot, athleteCount: athletes.length, clubCount: new Set(athletes.map(a => a.clubeIdExterno)).size });
      setMessage("Snapshot congelado carregado. As partidas vêm do próprio catálogo selecionado.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(""); }
  }

  async function freeze() {
    if (lock.current || !workspace || workspace.catalog.status === "CONGELADO") return;
    lock.current = true; setBusy("freeze"); setError(""); setMessage("");
    try {
      const catalog = await freezeFantasyCatalog(workspace.catalog.id);
      setCatalogs(current => [catalog, ...current.filter(item => item.id !== catalog.id)]);
      storeWorkspace({ ...workspace, catalog });
      setMessage("Catálogo congelado e pronto para uso.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(""); }
  }

  function toggleMatch(id: number) {
    setSelectedMatchIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }

  async function create() {
    if (lock.current || !workspace) return;
    setError(""); setMessage("");
    if (workspace.catalog.status !== "CONGELADO") { setError("Congele o catálogo antes de criar a competição."); return; }
    if (!nome.trim() || !selectedMatches.length || !inicioInscricao || !fimInscricao) {
      setError("Informe o nome, a janela de inscrição e selecione ao menos uma partida."); return;
    }
    if (limite.trim() && (!Number.isInteger(Number(limite)) || Number(limite) < 1 || Number(limite) > 4294967295)) {
      setError("O limite de escalações deve ser um número inteiro positivo ou ficar vazio."); return;
    }
    const start = new Date(inicioInscricao);
    const end = new Date(fimInscricao);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end
      || end <= new Date() || selectedMatches.some(match => new Date(match.inicioPrevisto) <= end)) {
      setError("A janela deve ser futura e terminar antes do início de todas as partidas selecionadas."); return;
    }
    lock.current = true; setBusy("create");
    try {
      const payload: CreateFantasyCompetitionPayload = {
        catalogoId: workspace.catalog.id,
        nome: nome.trim(),
        tipoAcesso: "FREE",
        valorInscricao: "0.00",
        inicioInscricao: isoDate(inicioInscricao),
        fimInscricao: isoDate(fimInscricao),
        partidaIds: selectedMatches.map(match => match.partidaIdExterno),
        ...(limite.trim() ? { limiteEscalacoesUsuario: Number(limite) } : {}),
      };
      const created = await createFantasyCompetition(payload);
      setCompetition(created);
      try { sessionStorage.setItem(competitionStorageKey, String(created.id)); } catch { /* Keep the current flow available if storage is blocked. */ }
      setMessage("Competição criada como rascunho. Confira o resumo antes de publicar.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(""); }
  }

  async function publish() {
    if (lock.current || !competition || competition.status === "PUBLICADA") return;
    lock.current = true; setBusy("publish"); setError(""); setMessage("");
    try {
      setCompetition(await publishFantasyCompetition(competition.id));
      setMessage("Competição publicada. A tela de escalações está liberada para o teste de aceitação.");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(""); }
  }

  function resetCompetition() {
    setCompetition(null); setNome(""); setError(""); setMessage("");
    try { sessionStorage.removeItem(competitionStorageKey); } catch { /* Ignore unavailable browser storage. */ }
    if (workspace) {
      setSelectedMatchIds(matches.map(m => m.partidaIdExterno));
      const dates = newCompetitionDates(matches);
      setInicioInscricao(dates.start); setFimInscricao(dates.end);
    }
  }

  function resetCatalogCapture() {
    if (competition) return;
    initializedCatalogId.current = null;
    setWorkspace(null); setSelectedCatalogId(""); setSelectedMatchIds([]); setError(""); setMessage("");
    setTemporada(String(market?.temporada ?? new Date().getFullYear()));
    setRodada(String(market?.rodada_atual ?? 1)); setVersao("1");
    try { sessionStorage.removeItem(storageKey); } catch { /* Ignore unavailable browser storage. */ }
  }

  const working = busy !== "";
  const selectedFrozenCatalog = availableCatalogs.find(catalog => catalog.id === Number(selectedCatalogId));
  const workspaceMatchesSelection = Boolean(workspace && workspace.catalog.id === Number(selectedCatalogId));
  return <div className={styles.page}>
    <header className={styles.intro}><div><p>POINT FFC FANTASY · HOMOLOGAÇÃO</p><h1>Preparar competição</h1><span>Capture um catálogo, escolha partidas e publique uma competição gratuita.</span></div></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {message && <p className={styles.success} role="status">{message}</p>}
    {!market && !error && <p className={styles.notice} role="status">Consultando o estado do mercado Cartola…</p>}

    <section className={styles.step} aria-labelledby="step-catalog">
      <div className={styles.stepHead}><span className={styles.stepNumber}>1</span><div><h2 id="step-catalog">Catálogo de atletas</h2><p>Capture o snapshot oficial da rodada e congele os dados para a competição.</p></div></div>
      <div className={styles.grid}>
        <label className={styles.field}>Temporada<input type="number" min="2000" max="65535" value={temporada} onChange={e=>setTemporada(e.target.value)} disabled={working || Boolean(workspace)} /></label>
        <label className={styles.field}>Rodada<select value={rodada} onChange={e=>setRodada(e.target.value)} disabled={working || Boolean(workspace)}>{Array.from({length:38},(_,i)=><option key={i+1} value={i+1}>Rodada {i+1}</option>)}</select></label>
        <label className={styles.field}>Versão<input type="number" min="1" max="4294967295" value={versao} onChange={e=>setVersao(e.target.value)} disabled={working || Boolean(workspace)} /></label>
      </div>
      {market && <p className={styles.hint}>Mercado Cartola: temporada {market.temporada}, rodada {market.rodada_atual} · {market.status_mercado === 1 && !market.bola_rolando ? "aberto e sem partidas em andamento" : "fora da janela de captura"}.</p>}
      {!workspace && <div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>void capture()} disabled={working || !market || Number(temporada)<2000 || Number(rodada)<1 || Number(versao)<1}>{busy==="capture"?<LoaderCircle className="spin"/>:<Plus/>}Capturar ou carregar atletas</button></div>}
      {workspace && <>
        <div className={styles.stats}><span className={styles.stat}>Catálogo <strong>#{workspace.catalog.id}</strong></span><span className={styles.stat}>Status <strong>{workspace.catalog.status}</strong></span><span className={styles.stat}><strong>{workspace.athleteCount}</strong> atletas</span><span className={styles.stat}><strong>{workspace.clubCount}</strong> clubes</span><span className={styles.stat}>Temporada/Rodada <strong>{workspace.catalog.temporada}/{workspace.catalog.rodada}</strong></span></div>
        {workspace.athleteCount < 1 && <div className={styles.actions}><button className={styles.secondary} type="button" onClick={()=>void refreshCounts()} disabled={working}>{busy==="count"?<LoaderCircle className="spin"/>:<Plus/>}Carregar contagens</button></div>}
        {workspace.catalog.status !== "CONGELADO" && <div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>void freeze()} disabled={working || workspace.athleteCount < 1}>{busy==="freeze"?<LoaderCircle className="spin"/>:<Snowflake/>}Congelar catálogo</button></div>}
        {workspace.catalog.status === "CONGELADO" && <p className={styles.notice}>Catálogo congelado. A competição usará exclusivamente as partidas capturadas neste snapshot.</p>}
        {!competition && <div className={styles.actions}><button className={styles.secondary} type="button" onClick={resetCatalogCapture} disabled={working}><Plus/>Iniciar outra captura</button></div>}
      </>}
    </section>

    <section className={styles.step} aria-labelledby="step-competition">
      <div className={styles.stepHead}><span className={styles.stepNumber}>2</span><div><h2 id="step-competition">Criar competição</h2><p>Defina nome, janela de inscrição e partidas. O acesso será FREE, sem cobrança.</p></div></div>
      {availableCatalogs.length === 0 ? <p className={styles.notice}>Capture e congele um catálogo para habilitar esta etapa.</p> : <>
        <label className={styles.field}>Catálogo congelado<select value={selectedFrozenCatalog?.id ?? ""} onChange={event=>setSelectedCatalogId(event.target.value)} disabled={working}>
          {availableCatalogs.map(catalog=><option key={catalog.id} value={catalog.id}>Temporada {catalog.temporada} · Rodada {catalog.rodada} · Versão {catalog.versao}</option>)}
        </select></label>
        {!workspaceMatchesSelection ? <div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>void loadSelectedCatalog()} disabled={working || !selectedFrozenCatalog}>{busy==="capture"?<LoaderCircle className="spin"/>:<Plus/>}Carregar catálogo selecionado</button></div>
          : competition ? <div className={styles.actions}><button className={styles.secondary} type="button" onClick={resetCompetition} disabled={working}><Plus/>Preparar outra competição</button></div> : <>
          <label className={styles.field} style={{marginTop:10}}>Nome da competição<input maxLength={255} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Fantasy de homologação" disabled={working}/></label>
          <div className={styles.grid} style={{marginTop:10}}>
            <label className={styles.field}>Início das inscrições<input type="datetime-local" value={inicioInscricao} onChange={e=>setInicioInscricao(e.target.value)} disabled={working}/></label>
            <label className={styles.field}>Fim das inscrições<input type="datetime-local" value={fimInscricao} onChange={e=>setFimInscricao(e.target.value)} disabled={working}/></label>
            <label className={styles.field}>Limite de escalações por usuário<input type="number" min="1" max="4294967295" value={limite} onChange={e=>setLimite(e.target.value)} placeholder="Opcional" disabled={working}/></label>
          </div>
          <p className={styles.hint}>O limite é opcional. As partidas disponíveis vêm do snapshot congelado selecionado.</p>
          <div className={styles.matches} aria-label="Partidas do snapshot">
            {matches.map(match=><label key={match.partidaIdExterno} className={styles.match}><input type="checkbox" checked={selectedMatchIds.includes(match.partidaIdExterno)} onChange={()=>toggleMatch(match.partidaIdExterno)} disabled={working}/><span>{matchLabel(match,workspace!.catalog)}<small>{formatDate(match.inicioPrevisto)}</small></span></label>)}
          </div>
          <div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>void create()} disabled={working || !selectedMatchIds.length}>{busy==="create"?<LoaderCircle className="spin"/>:<Plus/>}Criar competição FREE</button></div>
        </>}
      </>}
    </section>

    <section className={styles.step} aria-labelledby="step-publish">
      <div className={styles.stepHead}><span className={styles.stepNumber}>3</span><div><h2 id="step-publish">Revisar e publicar</h2><p>Confirme o resumo do rascunho antes de torná-lo disponível.</p></div></div>
      {!competition ? <p className={styles.notice}>Crie a competição para revisar os dados e publicar.</p> : <>
        <div className={styles.summary}>
          <div><small>Nome</small><strong>{competition.nome}</strong></div>
          <div><small>Status</small><strong>{competition.status}</strong></div>
          <div><small>Acesso</small><strong>FREE · R$ 0,00</strong></div>
          <div><small>Catálogo / rodada</small><strong>#{competition.catalogoId} · {competition.temporada}/{competition.rodada}</strong></div>
          <div><small>Período de inscrição</small><strong>{formatDate(competition.inicioInscricao)} até {formatDate(competition.fimInscricao)}</strong></div>
          <div><small>Partidas</small><strong>{competition.partidas?.length ?? selectedMatches.length}</strong></div>
        </div>
        {competition.status !== "PUBLICADA" ? <div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>void publish()} disabled={working}>{busy==="publish"?<LoaderCircle className="spin"/>:<Send/>}Publicar competição</button></div> : <div className={styles.published}><div><strong><Check size={14}/> Competição publicada</strong><p>Abra a montagem de escalações para testar o fluxo de aceitação.</p></div><Link className={styles.linkButton} href="/point-fantasy"><ExternalLink/>Ver competições</Link></div>}
      </>}
    </section>
  </div>;
}
