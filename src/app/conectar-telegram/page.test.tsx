import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { telegramLinkService } from "@/services/telegramLinkService";
import ConnectTelegramPage from "./page";

const auth = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false, firebaseUser: null as { emailVerified: boolean } | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/services/telegramLinkService", () => ({
  telegramLinkService: { status: vi.fn(), confirm: vi.fn(), disconnect: vi.fn() },
}));
vi.mock("@/components/auth/AuthLayout", () => ({
  AuthLayout: ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <main><h1>{title}</h1><p>{subtitle}</p>{children}</main>
  ),
}));

beforeEach(() => {
  vi.resetAllMocks();
  auth.isAuthenticated = false;
  auth.isLoading = false;
  auth.firebaseUser = null;
  vi.mocked(telegramLinkService.status).mockResolvedValue({ linked: false });
  vi.mocked(telegramLinkService.confirm).mockResolvedValue({ linked: true, linkedAt: "2026-10-14T12:00:00.000Z" });
  vi.mocked(telegramLinkService.disconnect).mockResolvedValue({ linked: false });
});
afterEach(cleanup);

it("orienta usuário não autenticado ao login e ao bot sem chamar endpoints privados", () => {
  render(<ConnectTelegramPage />);
  expect(screen.getByRole("heading", { name: "Conectar ao Telegram" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Entrar no POINT FFC" }).getAttribute("href"))
    .toBe("/login?returnTo=%2Fconectar-telegram%2F");
  expect(screen.getByRole("link", { name: "@PointFFCConnectBot" }).getAttribute("href"))
    .toBe("https://t.me/PointFFCConnectBot");
  expect(telegramLinkService.status).not.toHaveBeenCalled();
});

it("encaminha usuário sem e-mail verificado para a confirmação preservando o retorno", () => {
  auth.firebaseUser = { emailVerified: false };
  render(<ConnectTelegramPage />);
  expect(screen.getByRole("link", { name: "Continuar para confirmação de e-mail" }).getAttribute("href"))
    .toBe("/confirmar-email?returnTo=%2Fconectar-telegram%2F");
});

it("confirma somente após confirmação explícita, limpa o código e mostra o vínculo", async () => {
  auth.isAuthenticated = true;
  render(<ConnectTelegramPage />);
  await screen.findByLabelText("Código recebido no Telegram");
  const input = screen.getByLabelText("Código recebido no Telegram") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "A".repeat(48) } });
  const submit = screen.getByRole("button", { name: "Confirmar vínculo" }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  expect(telegramLinkService.confirm).not.toHaveBeenCalled();

  fireEvent.click(screen.getByLabelText(/Confirmo que solicitei este código/));
  fireEvent.click(submit);
  await screen.findByRole("heading", { name: "Conta conectada ao Telegram" });
  expect(telegramLinkService.confirm).toHaveBeenCalledWith("a".repeat(48));
  expect(screen.queryByLabelText("Código recebido no Telegram")).toBeNull();
  expect(screen.getByText(/Conectada em/)).toBeTruthy();
});

it.each([
  [400, "Código inválido, expirado ou já utilizado"],
  [409, "Não foi possível concluir este vínculo"],
  [429, "Limite de tentativas atingido"],
  [0, "Sem conexão com o servidor"],
])("exibe mensagem segura para falha %s", async (status, message) => {
  auth.isAuthenticated = true;
  vi.mocked(telegramLinkService.confirm).mockRejectedValueOnce(new ApiError(status, "diagnóstico interno"));
  render(<ConnectTelegramPage />);
  const input = await screen.findByLabelText("Código recebido no Telegram");
  fireEvent.change(input, { target: { value: "b".repeat(48) } });
  fireEvent.click(screen.getByLabelText(/Confirmo que solicitei este código/));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar vínculo" }));
  expect((await screen.findByRole("alert")).textContent).toContain(message);
  expect(document.body.textContent).not.toContain("diagnóstico interno");
});

it("consulta um vínculo existente e desconecta somente após nova confirmação", async () => {
  auth.isAuthenticated = true;
  vi.mocked(telegramLinkService.status).mockResolvedValueOnce({ linked: true, linkedAt: "2026-10-14T12:00:00.000Z" });
  render(<ConnectTelegramPage />);
  await screen.findByRole("heading", { name: "Conta conectada ao Telegram" });
  fireEvent.click(screen.getByRole("button", { name: "Desconectar Telegram" }));
  expect(telegramLinkService.disconnect).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar desconexão" }));
  await waitFor(() => expect(telegramLinkService.disconnect).toHaveBeenCalledTimes(1));
  expect(await screen.findByLabelText("Código recebido no Telegram")).toBeTruthy();
});

it("não mostra formulário após falha no status e recupera ao tentar novamente", async () => {
  auth.isAuthenticated = true;
  vi.mocked(telegramLinkService.status).mockRejectedValueOnce(new Error("diagnóstico interno"));
  render(<ConnectTelegramPage />);
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível concluir a solicitação");
  expect(document.body.textContent).not.toContain("diagnóstico interno");
  expect(screen.queryByLabelText("Código recebido no Telegram")).toBeNull();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(telegramLinkService.status).toHaveBeenCalledTimes(2));
  expect(await screen.findByLabelText("Código recebido no Telegram")).toBeTruthy();
});
