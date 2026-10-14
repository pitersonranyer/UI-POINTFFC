"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authError } from "@/lib/authErrors";
import { getLoginHref, getPostAuthRedirect } from "@/lib/postAuthRedirect";
import styles from "@/components/auth/AuthLayout.module.css";

export default function ConfirmarEmail() {
  const { firebaseUser, isAuthenticated, isLoading, checkEmailVerification, resendVerification, logout } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [returnTo, setReturnTo] = useState("/dashboard");
  const [returnReady, setReturnReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReturnTo(getPostAuthRedirect(params.get("returnTo")));
    setReturnReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || !returnReady) return;
    if (isAuthenticated) router.replace(returnTo);
    else if (!firebaseUser) router.replace(getLoginHref(returnTo));
  }, [firebaseUser, isAuthenticated, isLoading, returnReady, returnTo, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function check() {
    if (checking) return;
    setChecking(true);
    setError("");
    setMessage("");
    try {
      if (await checkEmailVerification()) router.replace(returnTo);
      else setError("Seu e-mail ainda não foi confirmado.");
    } catch (requestError) {
      setError(authError(requestError));
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    if (resending || cooldown) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      await resendVerification();
      setMessage("E-mail de confirmação reenviado.");
      setCooldown(30);
    } catch (requestError) {
      setError(authError(requestError));
    } finally {
      setResending(false);
    }
  }

  async function leave() {
    await logout();
    router.replace(getLoginHref(returnTo));
  }

  return (
    <AuthLayout
      eyebrow="ÚLTIMO PASSO"
      title="Confirme seu e-mail"
      subtitle={`Enviamos um link de confirmação para ${firebaseUser?.email || "seu e-mail"}. Acesse sua caixa de entrada e confirme seu cadastro para continuar.`}
    >
      <div className={styles.form}>
        {error && <div className={styles.error} role="alert">{error}</div>}
        {message && <div className={styles.success} role="status">{message}</div>}
        <div className={styles.success}>Não encontrou? Verifique também sua caixa de spam.</div>
        <button className={styles.submit} onClick={check} disabled={checking || resending}>
          {checking && <span className={styles.spinner} />}{checking ? "Verificando..." : "Já confirmei meu e-mail"}
        </button>
        <button className={styles.google} onClick={resend} disabled={checking || resending || cooldown > 0}>
          {resending ? "Reenviando..." : cooldown ? `Reenviar em ${cooldown}s` : "Reenviar e-mail de confirmação"}
        </button>
        <button className={styles.google} onClick={leave} disabled={checking || resending}>Sair</button>
      </div>
    </AuthLayout>
  );
}
