import { FirebaseError } from "firebase/app";
import { ActionCodeOperation, applyActionCode, checkActionCode, confirmPasswordReset, reload, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

const operations = {
  verifyEmail: ActionCodeOperation.VERIFY_EMAIL,
  recoverEmail: ActionCodeOperation.RECOVER_EMAIL,
  verifyAndChangeEmail: ActionCodeOperation.VERIFY_AND_CHANGE_EMAIL,
  revertSecondFactorAddition: ActionCodeOperation.REVERT_SECOND_FACTOR_ADDITION,
  resetPassword: ActionCodeOperation.PASSWORD_RESET,
};
export type EmailActionMode = keyof typeof operations;
export function isEmailActionMode(mode: string | null): mode is EmailActionMode {
  return mode !== null && Object.prototype.hasOwnProperty.call(operations, mode);
}

export async function runEmailAction(mode: EmailActionMode, code: string): Promise<void> {
  // The query's mode is not proof of the action encoded by Firebase.
  const info = await checkActionCode(auth, code);
  if (info.operation !== operations[mode]) {
    throw new FirebaseError("auth/invalid-action-code", "Unsupported email action");
  }
  if (mode === "resetPassword") {
    await verifyPasswordResetCode(auth, code);
    return;
  }
  await applyActionCode(auth, code);
  // Keep the existing login guard from using stale emailVerified state in this tab.
  if (auth.currentUser) {
    try { await reload(auth.currentUser); }
    catch { /* The action already succeeded; login can refresh the identity. */ }
  }
}

export const verifyEmailAction = (code: string) => runEmailAction("verifyEmail", code);
export const resetPasswordAction = (code: string, password: string) => confirmPasswordReset(auth, code, password);

export function emailActionError(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  if (code === "auth/invalid-action-code") return "Este link é inválido ou já foi utilizado. Solicite um novo e-mail para a ação desejada.";
  if (code === "auth/expired-action-code") return "Este link expirou. Solicite um novo e-mail para a ação desejada.";
  if (code === "auth/user-disabled") return "Esta conta está desativada. Entre em contato com o suporte.";
  if (code === "auth/user-not-found") return "Não foi possível localizar a conta deste link.";
  if (code === "auth/weak-password" || code === "auth/password-does-not-meet-requirements") return "A senha não atende aos requisitos de segurança. Escolha uma senha mais forte.";
  if (code === "auth/network-request-failed") return "Não foi possível conectar. Verifique sua conexão e abra o link novamente.";
  if (code === "auth/too-many-requests") return "Muitas tentativas. Aguarde alguns minutos e abra o link novamente.";
  return "Não foi possível concluir a ação. Tente novamente ou solicite um novo e-mail.";
}
