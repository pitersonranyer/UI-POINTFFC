import React, { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FirebaseError } from "firebase/app";
import { ActionCodeOperation, applyActionCode, checkActionCode, confirmPasswordReset, verifyPasswordResetCode, reload, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthActionPage from "@/app/auth/action/page";

const navigation = vi.hoisted(() => ({ query: "" }));
const firebase = vi.hoisted(() => ({ auth: { currentUser: null as User | null } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(navigation.query) }));
vi.mock("@/lib/firebase", () => firebase);
vi.mock("firebase/auth", () => ({
  ActionCodeOperation: { VERIFY_EMAIL: "VERIFY_EMAIL", PASSWORD_RESET: "PASSWORD_RESET", RECOVER_EMAIL: "RECOVER_EMAIL", VERIFY_AND_CHANGE_EMAIL: "VERIFY_AND_CHANGE_EMAIL", REVERT_SECOND_FACTOR_ADDITION: "REVERT_SECOND_FACTOR_ADDITION" },
  applyActionCode: vi.fn(), checkActionCode: vi.fn(), reload: vi.fn(), verifyPasswordResetCode: vi.fn(), confirmPasswordReset: vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal("React", React); vi.resetAllMocks(); navigation.query = ""; firebase.auth.currentUser = null;
  vi.mocked(checkActionCode).mockResolvedValue({ operation: ActionCodeOperation.VERIFY_EMAIL, data: {} });
  vi.mocked(applyActionCode).mockResolvedValue(); vi.mocked(reload).mockResolvedValue();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const additionalModes = [
  ["recoverEmail", ActionCodeOperation.RECOVER_EMAIL, "E-mail restaurado"],
  ["verifyAndChangeEmail", ActionCodeOperation.VERIFY_AND_CHANGE_EMAIL, "E-mail atualizado!"],
  ["revertSecondFactorAddition", ActionCodeOperation.REVERT_SECOND_FACTOR_ADDITION, "Segundo fator removido"],
] as const;

it.each(additionalModes)("aplica %s uma única vez", async (mode, operation, title) => {
  navigation.query = `mode=${mode}&oobCode=code`;
  vi.mocked(checkActionCode).mockResolvedValue({ operation, data: {} });
  render(<StrictMode><AuthActionPage /></StrictMode>);
  expect(screen.getByRole("status")).toBeTruthy();
  await screen.findByRole("heading", { name: title });
  expect(applyActionCode).toHaveBeenCalledTimes(1);
  expect(applyActionCode).toHaveBeenCalledWith(auth, "code");
  expect(screen.getByRole("link", { name: "Entrar no POINT FFC" }).getAttribute("href")).toBe("/login");
});

it.each(["resetPassword", ...additionalModes.map(([mode]) => mode)])("rejeita código ausente e operação incompatível em %s", async mode => {
  navigation.query = `mode=${mode}`;
  const view = render(<AuthActionPage />);
  expect(screen.getByRole("alert")).toBeTruthy();
  expect(checkActionCode).not.toHaveBeenCalled();
  navigation.query += "&oobCode=code";
  view.rerender(<AuthActionPage />);
  await screen.findByRole("alert");
  expect(applyActionCode).not.toHaveBeenCalled();
  expect(verifyPasswordResetCode).not.toHaveBeenCalled();
});

it.each(["resetPassword", ...additionalModes.map(([mode]) => mode)].flatMap(mode => ["auth/invalid-action-code", "auth/expired-action-code"].map(error => [mode, error])))("trata %s com %s", async (mode, error) => {
  navigation.query = `mode=${mode}&oobCode=code`;
  vi.mocked(checkActionCode).mockRejectedValue(new FirebaseError(error, "internal-secret"));
  render(<AuthActionPage />);
  expect((await screen.findByRole("alert")).textContent).toMatch(/inválido|expirou/);
  expect(applyActionCode).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain("internal-secret");
});

async function resetForm() {
  navigation.query = "mode=resetPassword&oobCode=reset-code";
  vi.mocked(checkActionCode).mockResolvedValue({ operation: ActionCodeOperation.PASSWORD_RESET, data: {} });
  vi.mocked(verifyPasswordResetCode).mockResolvedValue("user@example.com");
  render(<StrictMode><AuthActionPage /></StrictMode>);
  expect(screen.getByRole("status").textContent).toContain("Validando");
  await screen.findByLabelText("Nova senha");
  expect(verifyPasswordResetCode).toHaveBeenCalledTimes(1);
  expect(verifyPasswordResetCode).toHaveBeenCalledWith(auth, "reset-code");
  expect(applyActionCode).not.toHaveBeenCalled();
}

function fillPasswords(password = "Password123", confirmation = password) {
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
}

it.each([
  ["", "", "Informe a nova senha"], ["Password123", "", "Confirme a nova senha"],
  ["abc", "abc", "ao menos 8 caracteres"], ["abcdefgh", "abcdefgh", "uma letra e um número"],
  ["Password123", "Password456", "não coincidem"],
])("valida senha e confirmação (%s / %s)", async (password, confirmation, message) => {
  await resetForm(); fillPasswords(password, confirmation);
  expect(screen.getByRole("alert").textContent).toContain(message);
  expect(confirmPasswordReset).not.toHaveBeenCalled();
});

it("redefine senha, permite mostrar/ocultar e bloqueia submits concorrentes", async () => {
  let complete!: () => void;
  vi.mocked(confirmPasswordReset).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  await resetForm();
  fireEvent.click(screen.getAllByRole("button", { name: "Mostrar senha" })[0]);
  expect(screen.getByLabelText("Nova senha").getAttribute("type")).toBe("text");
  fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect(screen.getByLabelText("Nova senha").getAttribute("type")).toBe("password");
  fillPasswords();
  const button = screen.getByRole("button", { name: "Alterando senha..." }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.submit(button.closest("form")!); fireEvent.submit(button.closest("form")!);
  expect(confirmPasswordReset).toHaveBeenCalledTimes(1);
  expect(confirmPasswordReset).toHaveBeenCalledWith(auth, "reset-code", "Password123");
  complete(); await screen.findByRole("heading", { name: "Senha alterada!" });
  expect(screen.getByText("Sua senha foi redefinida com sucesso.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Entrar no POINT FFC" }).getAttribute("href")).toBe("/login");
});

it.each(["auth/weak-password", "auth/password-does-not-meet-requirements", "auth/user-disabled", "auth/user-not-found", "auth/invalid-action-code", "auth/expired-action-code", "auth/network-request-failed", "auth/internal-error"])("trata falha na confirmação %s e permite tentar novamente", async code => {
  vi.mocked(confirmPasswordReset).mockRejectedValueOnce(new FirebaseError(code, "internal-secret"));
  await resetForm(); fillPasswords();
  await screen.findByRole("alert");
  expect(document.body.textContent).not.toMatch(/auth\/|internal-secret/);
  expect((screen.getByRole("button", { name: "Alterar senha" }) as HTMLButtonElement).disabled).toBe(false);
  fillPasswords(); await screen.findByRole("heading", { name: "Senha alterada!" });
});

it.each(["auth/invalid-action-code", "auth/expired-action-code"])("trata falha de verifyPasswordResetCode %s", async code => {
  navigation.query = "mode=resetPassword&oobCode=code";
  vi.mocked(checkActionCode).mockResolvedValue({ operation: ActionCodeOperation.PASSWORD_RESET, data: {} });
  vi.mocked(verifyPasswordResetCode).mockRejectedValue(new FirebaseError(code, "internal"));
  render(<AuthActionPage />); await screen.findByRole("alert");
  expect(screen.queryByLabelText("Nova senha")).toBeNull();
  expect(confirmPasswordReset).not.toHaveBeenCalled();
});

it.each(["mode=verifyEmail", "mode=verifyEmail&oobCode=", "mode=verifyEmail&oobCode=%20%20"])("trata acesso incompleto /auth/action?%s sem executar ação", query => {
  navigation.query = query; render(<AuthActionPage />);
  expect(screen.getByRole("heading", { name: "Não foi possível verificar seu e-mail" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("incompleto ou é inválido");
  expect(screen.getByRole("link", { name: "Voltar ao login" }).getAttribute("href")).toBe("/login");
  expect(checkActionCode).not.toHaveBeenCalled(); expect(applyActionCode).not.toHaveBeenCalled();
});

it.each(["", "desconhecido", "__proto__", "constructor", "signIn"])("trata modo não suportado %s", mode => {
  navigation.query = `mode=${mode}&oobCode=code`; render(<AuthActionPage />);
  expect(screen.getByRole("heading", { name: "Link inválido" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Este link não é válido ou não é mais suportado.");
  expect(screen.getByRole("link", { name: "Voltar para o login" }).getAttribute("href")).toBe("/login");
  expect(verifyPasswordResetCode).not.toHaveBeenCalled(); expect(confirmPasswordReset).not.toHaveBeenCalled();
  expect(applyActionCode).not.toHaveBeenCalled(); expect(checkActionCode).not.toHaveBeenCalled();
});

it("verifica com o auth existente, mostra loading e sucesso sem obedecer query externa", async () => {
  let complete!: () => void;
  vi.mocked(applyActionCode).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  navigation.query = "mode=verifyEmail&oobCode=code-secreto&apiKey=chave-externa&continueUrl=https%3A%2F%2Fevil.example&lang=en";
  render(<StrictMode><AuthActionPage /></StrictMode>);
  expect(screen.getByRole("status").textContent).toContain("Verificando seu e-mail...");
  await waitFor(() => expect(applyActionCode).toHaveBeenCalledTimes(1));
  expect(checkActionCode).toHaveBeenCalledWith(auth, "code-secreto");
  expect(applyActionCode).toHaveBeenCalledWith(auth, "code-secreto");
  complete();
  await screen.findByRole("heading", { name: "E-mail verificado!" });
  expect(screen.getByText("Seu endereço de e-mail foi confirmado com sucesso.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Entrar no POINT FFC" }).getAttribute("href")).toBe("/login");
  expect(document.body.textContent).not.toMatch(/code-secreto|chave-externa|evil.example/);
  expect(screen.getAllByRole("link").every(link => ["/", "/login"].includes(link.getAttribute("href")!))).toBe(true);
  expect(window.location.hostname).not.toBe("evil.example");
});

it.each([
  ["auth/invalid-action-code", "inválido ou já foi utilizado"],
  ["auth/expired-action-code", "expirou"],
  ["auth/network-request-failed", "Verifique sua conexão"],
  ["auth/too-many-requests", "Muitas tentativas"],
  ["auth/internal-error", "Não foi possível concluir a ação"],
])("traduz erro %s sem expor detalhes", async (code, message) => {
  navigation.query = "mode=verifyEmail&oobCode=invalido";
  vi.mocked(applyActionCode).mockRejectedValue(new FirebaseError(code, "segredo-api-key-interna"));
  render(<AuthActionPage />);
  expect((await screen.findByRole("alert")).textContent).toContain(message);
  expect(screen.getByRole("heading", { name: "Não foi possível verificar seu e-mail" })).toBeTruthy();
  expect(document.body.textContent).not.toContain(code); expect(document.body.textContent).not.toContain("segredo-api-key-interna");
});

it("não confia em mode=verifyEmail quando o código pertence a outra operação", async () => {
  navigation.query = "mode=verifyEmail&oobCode=outra-acao";
  vi.mocked(checkActionCode).mockResolvedValue({ operation: ActionCodeOperation.PASSWORD_RESET, data: {} });
  render(<AuthActionPage />);
  expect((await screen.findByRole("alert")).textContent).toContain("inválido ou já foi utilizado");
  expect(applyActionCode).not.toHaveBeenCalled();
});

it("trata código rejeitado na consulta sem tentar aplicá-lo", async () => {
  navigation.query = "mode=verifyEmail&oobCode=invalido";
  vi.mocked(checkActionCode).mockRejectedValue(new FirebaseError("auth/expired-action-code", "internal"));
  render(<AuthActionPage />); await screen.findByRole("alert");
  expect(applyActionCode).not.toHaveBeenCalled();
});

it.each([false, true])("atualiza usuário local sem transformar falha de reload (%s) em falha da ação", async fails => {
  navigation.query = "mode=verifyEmail&oobCode=code";
  firebase.auth.currentUser = { uid: "current", emailVerified: false } as User;
  if (fails) vi.mocked(reload).mockRejectedValue(new Error("offline"));
  render(<AuthActionPage />);
  await screen.findByRole("heading", { name: "E-mail verificado!" });
  expect(reload).toHaveBeenCalledWith(auth.currentUser);
});

it("ignora resposta antiga quando a query muda", async () => {
  let complete!: () => void;
  vi.mocked(applyActionCode).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  navigation.query = "mode=verifyEmail&oobCode=primeiro";
  const view = render(<AuthActionPage />);
  await waitFor(() => expect(applyActionCode).toHaveBeenCalled());
  navigation.query = "mode=verifyEmail"; view.rerender(<AuthActionPage />);
  complete();
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("incompleto"));
  expect(screen.queryByRole("heading", { name: "E-mail verificado!" })).toBeNull();
});
