"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { AddBalanceModal } from "@/components/wallet/AddBalanceModal";
import { Dialog } from "@/components/ui/Dialog";
import { ApiError } from "@/services/apiClient";
import { desafioService as service, desafioMessage, desafioStatus, insufficientBalance, type DesafioDetalhe, type DesafioInscricao, type DesafioJogo, type Palpite, type SaldoInsuficiente } from "@/services/desafioService";
import { formatWalletCurrency as money } from "@/lib/format";
import { DesafioMatch } from "./DesafioMatch";
import { DesafioRanking } from "./DesafioRanking";
import { DesafioTabs } from "./DesafioTabs";
import { detailPollingInterval, useDesafioPolling } from "./useDesafioPolling";
import styles from "./Desafios.module.css";

export function DesafioDetailPage() {
  const params = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const raw = params.get("id") ?? "", id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(id) || id < 1 || id > 4294967295) return <div className="page-shell"><p role="alert">Desafio inválido.</p><Link href="/desafios">Voltar para Desafios</Link></div>;
  // Ranking remains public after the detail endpoint stops exposing the challenge.
  if (params.get("aba") === "ranking") return <DesafioRanking key={id} id={id} />;
  if (isLoading) return <p className="page-shell" role="status">Carregando Desafio...</p>;
  // Never reuse another user's selections or enrollment on identity/navigation changes.
  return <DesafioDetail key={`${id}:${isAuthenticated ? user?.idUsuario : "public"}`} id={id} authenticated={isAuthenticated} />;
}

function DesafioDetail({ id, authenticated }: { id: number; authenticated: boolean }) {
  const router = useRouter();
  const { refreshWallet } = useWallet();
  const [data, setData] = useState<DesafioDetalhe | null>(null);
  const [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(""), [needsRefresh, setNeedsRefresh] = useState(false);
  const [loadStatus, setLoadStatus] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null), [joining, setJoining] = useState(false);
  const [saved, setSaved] = useState<Record<number, boolean>>({}), [gameErrors, setGameErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [missingIds, setMissingIds] = useState<number[]>([]), [blockedEntry, setBlockedEntry] = useState(false);
  const [balance, setBalance] = useState<SaldoInsuficiente | null>(null), [lowBalance, setLowBalance] = useState(false);
  const [confirm, setConfirm] = useState(false), [pixOpen, setPixOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null), [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState("");
  const creationKey = useRef<string | null>(null);
  const lock = useRef(false), mounted = useRef(true), read = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (read.current && !read.current.signal.aborted) return null;
    const controller = new AbortController(); read.current = controller;
    setRefreshing(true); setLoadError(""); setLoadStatus(null);
    try {
      const result = await service.detail(id, authenticated, controller.signal);
      if (controller.signal.aborted || !mounted.current) return null;
      setData(result); setNeedsRefresh(false);
      setSelectedId(current => result.minhasInscricoes
        ? result.minhasInscricoes.some(item => item.id === current) ? current : result.minhasInscricoes[0]?.id ?? null
        : null);
      return result;
    } catch (cause) {
      if (controller.signal.aborted || !mounted.current) return null;
      setLoadError(desafioMessage(cause)); setNeedsRefresh(true); setLoadStatus(cause instanceof ApiError ? cause.status : null);
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setData(null);
      return null;
    } finally {
      if (read.current === controller) read.current = null;
      if (!controller.signal.aborted && mounted.current) { setRefreshing(false); setLoading(false); }
    }
  }, [id, authenticated]);
  useEffect(() => {
    mounted.current = true; void refresh();
    return () => { mounted.current = false; read.current?.abort(); };
  }, [refresh]);
  useDesafioPolling(async () => {
    if (lock.current || document.hidden) return;
    await refresh();
  }, detailPollingInterval(data));
  const login = () => router.push("/login");
  const multipleContract = Array.isArray(data?.minhasInscricoes);
  const selected = multipleContract ? data?.minhasInscricoes?.find(item => item.id === selectedId) : data?.minhaInscricao;
  const cancelled = selected?.status === "CANCELADA";
  const enrolled = multipleContract ? selected?.status === "ATIVA" : data?.inscrito === true || selected?.status === "ATIVA";
  const games = data?.partidas.map(game => {
    if (!multipleContract) return cancelled ? { ...game, podeAlterarPalpite: false } : game;
    const pick = data?.minhasInscricoes?.find(item => item.id === selectedId)?.palpites.find(item => item.partidaId === game.id);
    return { ...game, meuPalpite: pick?.meuPalpite ?? null, pontos: pick?.pontos ?? null,
      apurado: pick?.apurado ?? false, podeAlterarPalpite: !cancelled && (pick?.podeAlterarPalpite ?? false) };
  }) ?? [];

  function resetFeedback() {
    setSaved({}); setGameErrors({}); setMissingIds([]); setBlockedEntry(false);
    setError(""); setSuccess(""); setBalance(null); setLowBalance(false); setConfirm(false);
  }
  function selectInscricao(inscricaoId: number) {
    if (lock.current || refreshing || pixOpen) return;
    setSelectedId(inscricaoId); resetFeedback();
  }
  function mergeInscricao(current: DesafioDetalhe, item: DesafioInscricao): DesafioDetalhe {
    if (!Array.isArray(current.minhasInscricoes)) return { ...current, inscrito: item.status === "ATIVA", minhaInscricao: item };
    const existing = current.minhasInscricoes.find(entry => entry.id === item.id);
    const updated = { ...existing, ...item, numero: item.numero ?? existing?.numero ?? 1,
      nome: item.nome ?? existing?.nome ?? `Palpite ${item.numero ?? 1}`, palpites: existing?.palpites ?? [] };
    return { ...current, minhasInscricoes: [...current.minhasInscricoes.filter(entry => entry.id !== item.id), updated].sort((a, b) => a.numero - b.numero) };
  }
  async function createInscricao() {
    if (!authenticated) { login(); return; }
    if (!data || !multipleContract || !canCreate || lock.current || refreshing || needsRefresh) return;
    lock.current = true; setCreating(true); setCreationError("");
    try {
      creationKey.current ??= crypto.randomUUID();
      const result = await service.createInscricao(id, creationKey.current);
      if (!mounted.current) return;
      creationKey.current = null;
      setData(current => current && mergeInscricao(current, result));
      setSelectedId(result.id); resetFeedback();
      await refresh();
      if (mounted.current) setSelectedId(result.id);
    } catch (cause) {
      if (!mounted.current) return;
      setCreationError(desafioMessage(cause));
      if (cause instanceof ApiError && cause.status === 401) login();
    } finally { lock.current = false; if (mounted.current) setCreating(false); }
  }

  async function choose(game: DesafioJogo, value: Palpite) {
    if (!authenticated) { login(); return; }
    if (lock.current || refreshing || needsRefresh || cancelled || (multipleContract && !selected) || !game.podeAlterarPalpite || (game.meuPalpite === value && !missingIds.includes(game.id))) return;
    const inscricaoId = selected?.id;
    lock.current = true; setSaving(game.id); setGameErrors(current => ({ ...current, [game.id]: "" }));
    setSaved(current => ({ ...current, [game.id]: false }));
    try {
      const result = inscricaoId !== undefined ? await service.predict(id, game.id, value, inscricaoId) : await service.predict(id, game.id, value);
      if (!mounted.current) return;
      setData(current => current && (Array.isArray(current.minhasInscricoes)
        ? { ...current, minhasInscricoes: current.minhasInscricoes.map(entry => entry.id !== inscricaoId ? entry : { ...entry,
          palpites: entry.palpites.map(pick => pick.partidaId === result.partidaId ? { ...pick, meuPalpite: result.palpite, podeAlterarPalpite: result.podeAlterarPalpite } : pick) }) }
        : { ...current, partidas: current.partidas.map(item => item.id === result.partidaId ? { ...item, meuPalpite: result.palpite, fechamentoEm: result.fechamentoEm, podeAlterarPalpite: result.podeAlterarPalpite } : item) }));
      setSaved(current => ({ ...current, [game.id]: true }));
      setMissingIds(current => current.filter(partidaId => partidaId !== game.id));
    } catch (cause) {
      if (!mounted.current) return;
      setGameErrors(current => ({ ...current, [game.id]: desafioMessage(cause) }));
      if (cause instanceof ApiError && cause.status === 401) login();
      // A stale screen can cross the cutoff; re-read the backend's eligibility.
      await refresh();
    } finally { lock.current = false; if (mounted.current) setSaving(null); }
  }

  async function participate() {
    if (!authenticated) { login(); return; }
    if (!data || lock.current || refreshing || needsRefresh || enrolled || cancelled || (multipleContract && !selected) || data.status !== "ABERTO") return;
    const inscricaoId = selected?.id;
    lock.current = true; setJoining(true); setError(""); setBalance(null); setLowBalance(false); setSuccess("");
    try {
      const result = inscricaoId !== undefined ? await service.participate(id, inscricaoId) : await service.participate(id);
      if (!mounted.current) return;
      // Enrollment only comes from the backend response, never from saved predictions.
      setData(current => current && mergeInscricao(current, result.inscricao));
      setConfirm(false); setSuccess("Participação confirmada!"); setMissingIds([]);
      if (result.tipoAcesso === "PAGO") void refreshWallet();
      await refresh();
    } catch (cause) {
      if (!mounted.current) return;
      setConfirm(false); setError(desafioMessage(cause));
      if (cause instanceof ApiError) {
        const code = cause.details.code;
        if (code === "SALDO_INSUFICIENTE") { setBalance(insufficientBalance(cause)); setLowBalance(true); }
        if (code === "PALPITES_INCOMPLETOS" && Array.isArray(cause.details.partidaIds)) setMissingIds(cause.details.partidaIds.filter((value): value is number => typeof value === "number" && Number.isInteger(value)));
        if (["DESAFIO_INDISPONIVEL", "FORA_JANELA_INSCRICAO", "SEM_PARTIDAS_ELEGIVEIS", "PARTIDAS_INDISPONIVEIS", "LIMITE_PARTICIPANTES_ATINGIDO", "CARTEIRA_BLOQUEADA", "VALOR_INSCRICAO_INVALIDO", "INSCRICAO_CANCELADA"].includes(String(code))) setBlockedEntry(true);
        if (cause.status === 401) login();
      }
      // Recover an existing enrollment after a lost response or concurrent attempt.
      const updated = await refresh();
      const recovered = updated?.minhasInscricoes ? updated.minhasInscricoes.find(item => item.id === inscricaoId)?.status === "ATIVA" : updated?.inscrito || updated?.minhaInscricao?.status === "ATIVA";
      if (updated && recovered) { setError(""); setSuccess("Participação confirmada!"); setLowBalance(false); setBalance(null); if (updated.tipoAcesso === "PAGO") void refreshWallet(); }
    } finally { lock.current = false; if (mounted.current) setJoining(false); }
  }

  const busy = saving !== null || joining || refreshing || creating;
  const missing = games.filter(game => game.status !== "ANULADA" && (!game.meuPalpite || missingIds.includes(game.id)));
  const acceptingEntries = data?.status === "ABERTO" && !cancelled;
  const entryDisabled = busy || needsRefresh || blockedEntry || cancelled || (multipleContract && !selected) || data?.status !== "ABERTO" || (authenticated && (missing.length > 0 || !games.some(game => game.status !== "ANULADA")));
  const canCreate = authenticated && multipleContract && data?.status === "ABERTO" && Date.now() <= Date.parse(data.fimInscricao);
  async function retry() { if (lock.current) return; const result = await refresh(); if (result) setBlockedEntry(false); }
  function beginParticipation() {
    if (!authenticated) { login(); return; }
    if (entryDisabled || enrolled || lock.current) return;
    if (data?.tipoAcesso === "PAGO") setConfirm(true); else void participate();
  }
  return <div className={`page-shell ${styles.palpitePage}`}>
    <Link className={styles.back} href="/desafios">← Desafios</Link>
    {data && <header className={styles.rankHeader}><div><p>DESAFIO / PALPITES</p><h1>{data.nome}</h1><div className={styles.detailMeta}><span className={styles.badge}>{desafioStatus[data.status]}</span><span>{data.tipoAcesso === "PAGO" ? money(data.valorInscricao) : "Gratuito"}</span><span>{data.partidas.length} {data.partidas.length === 1 ? "jogo" : "jogos"}</span></div></div><button className={styles.rankRefresh} aria-label="Atualizar" title={refreshing ? "Atualizando..." : "Atualizar"} disabled={busy} onClick={() => void retry()}><RefreshCw size={18} aria-hidden="true" /></button></header>}
    <DesafioTabs id={id} active="desafio" busy={busy} />
    {success && <p className={styles.success} role="status">{success}</p>}
    {loading ? <p role="status" className={styles.feedback}>Carregando Desafio...</p> : <>
      {loadError && <div className={styles.error} role="alert"><p>{loadError}</p>{loadStatus === 404 && <p>Se o Desafio já encerrou, consulte a aba Ranking.</p>}<button className={styles.secondary} disabled={busy} onClick={() => void retry()}>Tentar novamente</button>{loadStatus === 401 && <Link className={styles.secondary} href="/login">Entrar novamente</Link>}</div>}
      {data && <>
        <h2 className={styles.sectionTitle}>{authenticated ? "Seus palpites" : "Partidas"}</h2>
        {authenticated && multipleContract && ((data.minhasInscricoes?.length ?? 0) > 0 || canCreate) && <div className={styles.pickSelector} role="group" aria-label="Seus palpites no Desafio">
          {data.minhasInscricoes?.map(item => <button type="button" key={item.id} className={styles.secondary} aria-pressed={selectedId === item.id} disabled={busy || pixOpen} onClick={() => selectInscricao(item.id)}>Palpite {item.numero}</button>)}
          {canCreate && <button type="button" className={styles.secondary} disabled={busy || needsRefresh || pixOpen} onClick={() => void createInscricao()}>{creating ? "Criando..." : "+ Novo palpite"}</button>}
        </div>}
        {authenticated && multipleContract && data.quantidadeUtilizada !== undefined && data.limiteInscricoesPorUsuario !== undefined && <p className={styles.pickSummary}>{data.quantidadeUtilizada} de {data.limiteInscricoesPorUsuario} participações confirmadas</p>}
        {creationError && <p className={styles.error} role="alert">{creationError}</p>}
        {!authenticated && <Link className={styles.loginPrompt} href="/login">Entre para fazer seus palpites</Link>}
        {!data.partidas.length ? <p className={styles.feedback}>Nenhuma partida disponível.</p> : <ol className={styles.games} aria-label="Partidas do Desafio">{[...games].sort((a, b) => a.ordem - b.ordem || a.id - b.id).map(game => <DesafioMatch key={`${selectedId}:${game.id}`} game={game} authenticated={authenticated} disabled={busy || needsRefresh} saving={saving === game.id} saved={!!saved[game.id]} error={gameErrors[game.id]} missing={authenticated && acceptingEntries && !enrolled && game.podeAlterarPalpite && missing.some(item => item.id === game.id)} choose={(item, value) => void choose(item, value)} />)}</ol>}
        <section className={styles.participation} aria-label="Participação no Desafio">
          <h2>{enrolled ? "Participando" : acceptingEntries ? "Participar do Desafio" : "Participação"}</h2>
          {enrolled ? <p>Você está participando. Os palpites das partidas abertas continuam editáveis.</p> : <>
            {cancelled ? <p>Este palpite foi cancelado. Não é possível confirmar ou alterar.</p> : data.status !== "ABERTO" ? <p>Novas participações indisponíveis neste estado.</p> : <p>{data.tipoAcesso === "FREE" ? "Participação gratuita." : `Inscrição: ${money(data.valorInscricao)}, debitados da sua carteira ao confirmar.`}</p>}
            {authenticated && acceptingEntries && missing.length > 0 && <div><p>Preencha os palpites destes jogos para participar:</p><ul>{missing.map(game => <li key={game.id}><a href={`#partida-${game.id}`}>{game.mandanteNome ?? game.nomeMandante} × {game.visitanteNome ?? game.nomeVisitante}</a></li>)}</ul></div>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            {lowBalance && <div>{balance && <dl className={styles.balance}><dt>Saldo disponível</dt><dd>{money(balance.saldoDisponivel)}</dd><dt>Valor necessário</dt><dd>{money(balance.valorNecessario)}</dd><dt>Valor faltante</dt><dd>{money(balance.valorFaltante)}</dd></dl>}<button className={styles.secondary} disabled={busy} onClick={() => setPixOpen(true)}>Adicionar saldo</button></div>}
            {acceptingEntries && <div className={styles.actions}><button className={styles.button} disabled={!!entryDisabled} onClick={beginParticipation}>{joining ? "Confirmando..." : "Participar do Desafio"}</button></div>}
          </>}
        </section>
        {confirm && !enrolled && <Dialog title="Confirmar participação" close={() => { if (!lock.current) setConfirm(false); }} busy={joining}><div className={styles.confirmation}><p>Participar de <strong>{data.nome}</strong> por <strong>{money(data.valorInscricao)}</strong>?</p><p>O valor será debitado da sua carteira ao confirmar.</p><div className={styles.actions}><button className={styles.secondary} disabled={joining} onClick={() => setConfirm(false)}>Voltar</button><button className={styles.button} disabled={!!entryDisabled} onClick={() => void participate()}>{joining ? "Confirmando..." : `Confirmar e pagar ${money(data.valorInscricao)}`}</button></div></div></Dialog>}
        {pixOpen && <AddBalanceModal close={() => { setPixOpen(false); setLowBalance(false); setBalance(null); setError(""); void refreshWallet(); void retry(); }} />}
      </>}
    </>}
  </div>;
}
