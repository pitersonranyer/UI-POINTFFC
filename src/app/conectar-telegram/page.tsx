"use client";

import Link from "next/link";
import React, { type FormEvent, useEffect, useRef, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { telegramLinkService, TelegramLinkStatus } from "@/services/telegramLinkService";
import { getEmailVerificationHref, getLoginHref, TELEGRAM_LINK_PATH } from "@/lib/postAuthRedirect";
import styles from "./page.module.css";

const BOT_URL = "https://t.me/PointFFCConnectBot";
const CODE_PATTERN = /^[a-f0-9]{48}$/i;

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Não foi possível concluir a solicitação. Tente novamente.";
  if (error.status === 0) return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
  if (error.status === 400) return "Código inválido, expirado ou já utilizado. Gere outro código pelo bot e tente novamente.";
  if (error.status === 409) return "Não foi possível concluir este vínculo. Confira se esta conta já possui um Telegram conectado.";
  if (error.status === 429) return "Limite de tentativas atingido. Aguarde um pouco antes de tentar novamente.";
  if (error.status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
  if (error.status === 403) return "Esta conta não está disponível para realizar a vinculação.";
  return "O serviço está temporariamente indisponível. Tente novamente.";
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default function ConnectTelegramPage() {
  const { firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [linkStatus, setLinkStatus] = useState<TelegramLinkStatus | null>(null);
  const [statusState, setStatusState] = useState<"idle" | "loading" | "ready" | "error">("loading");
  const [statusError, setStatusError] = useState("");
  const [statusRetry, setStatusRetry] = useState(0);
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [disconnectPrompt, setDisconnectPrompt] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const disconnectingRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLinkStatus(null);
      setStatusState("idle");
      setStatusError("");
      return;
    }

    let current = true;
    setStatusState("loading");
    setStatusError("");
    setLinkStatus(null);
    telegramLinkService.status()
      .then((status) => {
        if (!status || typeof status.linked !== "boolean") throw new Error("Resposta de status inválida");
        if (current) {
          setLinkStatus(status);
          setStatusState("ready");
        }
      })
      .catch((requestError: unknown) => {
        if (current) {
          setStatusError(errorMessage(requestError));
          setStatusState("error");
        }
      });

    return () => { current = false; };
  }, [authLoading, isAuthenticated, statusRetry]);

  function normalizeCode(value: string): string {
    return value.replace(/\s/g, "").slice(0, 48).toLowerCase();
  }

  async function confirmLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || !confirmed) return;
    const normalizedCode = normalizeCode(code);
    if (!CODE_PATTERN.test(normalizedCode)) {
      setError("Informe o código de 48 caracteres recebido pelo bot.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await telegramLinkService.confirm(normalizedCode);
      setCode("");
      setConfirmed(false);
      setLinkStatus(result);
      setStatusState("ready");
      setNotice("Sua conta POINT FFC foi conectada ao Telegram.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function disconnect() {
    if (disconnectingRef.current || !disconnectPrompt) return;
    disconnectingRef.current = true;
    setDisconnecting(true);
    setError("");
    setNotice("");
    try {
      await telegramLinkService.disconnect();
      setLinkStatus({ linked: false });
      setStatusState("ready");
      setDisconnectPrompt(false);
      setNotice("A conexão com o Telegram foi removida.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      disconnectingRef.current = false;
      setDisconnecting(false);
    }
  }

  const linkedDate = formatDate(linkStatus?.linkedAt);
  const verificationHref = getEmailVerificationHref(TELEGRAM_LINK_PATH);

  return (
    <AuthLayout
      eyebrow="POINT FFC CONNECT"
      title="Conectar ao Telegram"
      subtitle="Vincule sua conta POINT FFC ao bot oficial com segurança."
    >
      <p className={styles.intro}>
        A vinculação associa seu Telegram à conta POINT FFC em que você entrou. O código é temporário e não substitui sua senha.
      </p>

      <ol className={styles.steps}>
        <li>Abra <a className={styles.botLink} href={BOT_URL} target="_blank" rel="noopener noreferrer">@PointFFCConnectBot</a>.</li>
        <li>Envie <strong>/vincular</strong> no chat privado para receber um código.</li>
        <li>Volte aqui e confirme o código antes de ele expirar em 10 minutos.</li>
      </ol>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.success} role="status">{notice}</p>}

      {authLoading ? (
        <p className={styles.loading} role="status"><span className={styles.spinner} />Verificando sua sessão...</p>
      ) : !isAuthenticated ? (
        <div className={styles.field}>
          {firebaseUser && !firebaseUser.emailVerified ? (
            <>
              <p className={styles.message}>Confirme seu e-mail para entrar na conta POINT FFC e continuar a vinculação.</p>
              <Link className={styles.submit} href={verificationHref}>Continuar para confirmação de e-mail</Link>
            </>
          ) : (
            <>
              <p className={styles.message}>Entre na sua conta POINT FFC. Depois do login, você voltará para esta página.</p>
              <Link className={styles.submit} href={getLoginHref(TELEGRAM_LINK_PATH)}>Entrar no POINT FFC</Link>
            </>
          )}
        </div>
      ) : statusState === "loading" || statusState === "idle" ? (
        <p className={styles.loading} role="status"><span className={styles.spinner} />Consultando o vínculo...</p>
      ) : statusState === "error" || !linkStatus ? (
        <div className={styles.field}>
          <p className={styles.error} role="alert">{statusError || "Não foi possível confirmar o status da conexão. Tente novamente."}</p>
          <button className={styles.secondary} type="button" onClick={() => setStatusRetry((retry) => retry + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : linkStatus.linked === true ? (
        <section aria-labelledby="linked-heading">
          <h2 id="linked-heading">Conta conectada ao Telegram</h2>
          {linkedDate && <p className={styles.date}>Conectada em {linkedDate}</p>}
          {!disconnectPrompt ? (
            <button className={styles.secondary} type="button" onClick={() => { setDisconnectPrompt(true); setNotice(""); setError(""); }}>
              Desconectar Telegram
            </button>
          ) : (
            <div className={styles.field} role="group" aria-labelledby="disconnect-heading">
              <p id="disconnect-heading" className={styles.message}>Confirme para remover a conexão entre sua conta POINT FFC e o Telegram.</p>
              <div className={styles.buttonRow}>
                <button className={styles.submit} type="button" onClick={disconnect} disabled={disconnecting}>
                  {disconnecting ? "Desconectando..." : "Confirmar desconexão"}
                </button>
                <button className={styles.quiet} type="button" onClick={() => setDisconnectPrompt(false)} disabled={disconnecting}>Cancelar</button>
              </div>
            </div>
          )}
        </section>
      ) : linkStatus.linked === false ? (
        <form className={styles.field} onSubmit={confirmLink} noValidate>
          <label htmlFor="telegram-link-code">Código recebido no Telegram</label>
          <input
            id="telegram-link-code"
            type="text"
            name="telegram-link-code"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={48}
            inputMode="text"
            placeholder="48 caracteres hexadecimais"
            value={code}
            onChange={(event) => { setCode(normalizeCode(event.target.value)); setError(""); }}
            disabled={submitting}
            aria-describedby="telegram-code-help"
          />
          <p id="telegram-code-help" className={styles.message}>O código é usado somente nesta confirmação e não fica salvo no navegador.</p>
          <label className={styles.confirmation}>
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={submitting} />
            Confirmo que solicitei este código ao bot e quero vincular esta conta.
          </label>
          <button className={styles.submit} type="submit" disabled={submitting || !confirmed || !code.trim()}>
            {submitting && <span className={styles.spinner} />}
            {submitting ? "Conectando..." : "Confirmar vínculo"}
          </button>
        </form>
      ) : (
        <div className={styles.field}>
          <p className={styles.error} role="alert">Não foi possível confirmar o status da conexão. Tente novamente.</p>
          <button className={styles.secondary} type="button" onClick={() => setStatusRetry((retry) => retry + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
