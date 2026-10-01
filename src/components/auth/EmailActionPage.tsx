"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { AuthLayout } from "./AuthLayout";
import { emailActionError, isEmailActionMode, resetPasswordAction, runEmailAction, type EmailActionMode } from "@/services/emailActionService";
import { validPassword } from "@/lib/authValidation";
import { PasswordField } from "./PasswordField";
import styles from "./AuthLayout.module.css";

const outcomes: Record<EmailActionMode, { title: string; message: string }> = {
  verifyEmail: { title: "E-mail verificado!", message: "Seu endereço de e-mail foi confirmado com sucesso." },
  resetPassword: { title: "Senha alterada!", message: "Sua senha foi redefinida com sucesso." },
  recoverEmail: { title: "E-mail restaurado", message: "Seu endereço de e-mail anterior foi restaurado com sucesso." },
  verifyAndChangeEmail: { title: "E-mail atualizado!", message: "Seu novo endereço de e-mail foi confirmado e atualizado com sucesso." },
  revertSecondFactorAddition: { title: "Segundo fator removido", message: "A adição do segundo fator de autenticação foi desfeita. Se você não reconhece essa alteração, redefina sua senha." },
};

export function EmailActionLoading({ mode }: { mode?: string | null }) {
  const title = mode === "verifyEmail" ? "Verificando seu e-mail..." : mode === "resetPassword" ? "Validando seu link..." : "Processando seu link...";
  return <AuthLayout eyebrow="SEGURANÇA DA CONTA" title={title} subtitle="Aguarde um instante enquanto validamos sua solicitação.">
    <div className={`${styles.success} ${styles.actionLoading}`} role="status"><span className={styles.spinner} aria-hidden="true" /> {title}</div>
  </AuthLayout>;
}

export function EmailActionPage() {
  const params = useSearchParams();
  const action = {
    mode: params.get("mode"), oobCode: params.get("oobCode"),
    apiKey: params.get("apiKey"), continueUrl: params.get("continueUrl"), lang: params.get("lang"),
  };
  // apiKey never configures Firebase; continueUrl never controls navigation.
  // Keep the site's pt-BR UI regardless of the untrusted lang parameter.
  return <EmailAction key={JSON.stringify([action.mode, action.oobCode])} mode={action.mode} code={action.oobCode} />;
}

function EmailAction({ mode, code }: { mode: string | null; code: string | null }) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const request = useRef<Promise<void> | null>(null);
  const supported = isEmailActionMode(mode);
  const hasCode = !!code?.trim();

  useEffect(() => {
    if (!supported || !hasCode) return;
    let active = true;
    // Reuse the operation when StrictMode replays effects: codes are single-use.
    request.current ??= runEmailAction(mode as EmailActionMode, code!);
    request.current.then(() => {
      if (active) setResult({ success: true, message: outcomes[mode as EmailActionMode].message });
    }, error => {
      if (active) setResult({ success: false, message: emailActionError(error) });
    });
    return () => { active = false; };
  }, [supported, hasCode, code, mode]);

  if (supported && hasCode && !result) return <EmailActionLoading mode={mode} />;
  if (mode === "resetPassword" && result?.success) return <ResetPassword code={code!} />;
  const success = result?.success === true;
  const message = !supported ? "Este link não é válido ou não é mais suportado."
    : result?.message ?? "Este link de confirmação está incompleto ou é inválido. Abra o link completo recebido por e-mail.";
  return <AuthLayout eyebrow="SEGURANÇA DA CONTA" title={success && supported ? outcomes[mode].title : !supported ? "Link inválido" : mode === "verifyEmail" ? "Não foi possível verificar seu e-mail" : "Não foi possível concluir a ação"} subtitle={success ? result.message : "Confira as orientações abaixo para continuar."}>
    <div className={styles.form}>
      {!success && <div className={styles.error} role="alert">{message}</div>}
      {success && <span role="status" className={styles.success}>Tudo pronto para entrar no POINT FFC.</span>}
      <Link href="/login" className={styles.submit}>{success ? "Entrar no POINT FFC" : !supported ? "Voltar para o login" : "Voltar ao login"}</Link>
    </div>
  </AuthLayout>;
}

function ResetPassword({ code }: { code: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submitting = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!password) return setError("Informe a nova senha.");
    if (!confirmation) return setError("Confirme a nova senha.");
    if (!validPassword(password)) return setError("A senha deve ter ao menos 8 caracteres, uma letra e um número.");
    if (password !== confirmation) return setError("As senhas não coincidem.");
    submitting.current = true;
    setBusy(true);
    try {
      await resetPasswordAction(code, password);
      setPassword(""); setConfirmation(""); setDone(true);
    } catch (failure) {
      setError(emailActionError(failure));
      submitting.current = false;
    } finally { setBusy(false); }
  }

  return <AuthLayout eyebrow="REDEFINIÇÃO DE SENHA" title={done ? outcomes.resetPassword.title : "Crie sua nova senha"} subtitle={done ? outcomes.resetPassword.message : "Use ao menos 8 caracteres, uma letra e um número."}>
    {done ? <div className={styles.form}><span role="status" className={styles.success}>Tudo pronto para entrar no POINT FFC.</span><Link href="/login" className={styles.submit}>Entrar no POINT FFC</Link></div> : <form className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
      <PasswordField id="new-password" label="Nova senha" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" autoComplete="new-password" disabled={busy} />
      <PasswordField id="confirm-password" label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} placeholder="Repita sua nova senha" autoComplete="new-password" disabled={busy} />
      {error && <div role="alert" className={styles.error}>{error}</div>}
      <button className={styles.submit} disabled={busy} type="submit">{busy && <span className={styles.spinner} aria-hidden="true" />}{busy ? "Alterando senha..." : "Alterar senha"}</button>
      <Link href="/login">Voltar ao login</Link>
    </form>}
  </AuthLayout>;
}
