import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Login from "./page";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
const auth = vi.hoisted(() => ({
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/auth/AuthGuard", () => ({ AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/auth/AuthLayout", () => ({
  AuthLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
}));
vi.mock("@/components/auth/PasswordField", () => ({
  PasswordField: ({ id, label, value, onChange, disabled }: { id: string; label: string; value: string; onChange(value: string): void; disabled?: boolean }) => (
    <label htmlFor={id}>{label}<input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></label>
  ),
}));

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState({}, "", "/login");
  sessionStorage.clear();
  auth.login.mockResolvedValue(true);
  auth.loginWithGoogle.mockResolvedValue(undefined);
});
afterEach(cleanup);

async function submitEmailLogin() {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Password123" } });
  fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);
}

it("retorna para a rota fixa de vinculação após login por e-mail", async () => {
  window.history.replaceState({}, "", "/login?returnTo=%2Fconectar-telegram%2F");
  render(<Login />);
  await submitEmailLogin();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/conectar-telegram/"));
});

it("mantém o retorno após login Google e ignora um destino externo", async () => {
  window.history.replaceState({}, "", "/login?returnTo=https%3A%2F%2Fevil.example");
  render(<Login />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
});

it("preserva o retorno permitido durante confirmação de e-mail não verificado", async () => {
  window.history.replaceState({}, "", "/login?returnTo=%2Fconectar-telegram%2F");
  auth.login.mockResolvedValueOnce(false);
  render(<Login />);
  await submitEmailLogin();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/confirmar-email?returnTo=%2Fconectar-telegram%2F"));
});
