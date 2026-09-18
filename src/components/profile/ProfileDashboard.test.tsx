import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UserType } from "@/types/auth";
import { ProfileDashboard } from "./ProfileDashboard";

let tipoUsuario: UserType = "PLAYER";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { idUsuario: "user-1", nome: "Pessoa Teste", email: "pessoa@pointffc.com", fotoUrl: null, tipoUsuario, status: "ATIVO" } }),
}));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ wallet: null, isLoading: false, error: null }) }));
vi.mock("./AdminRoundActions", () => ({ AdminRoundActions: () => <div>Ações de rodada</div> }));

afterEach(cleanup);

describe("atalhos do Perfil", () => {
  it("mostra Administração para PLATFORM_ADMIN com destino /admin", () => {
    tipoUsuario = "PLATFORM_ADMIN";
    render(<ProfileDashboard />);
    const admin = screen.getByRole("link", { name: /Administração/ });
    expect(admin.getAttribute("href")).toBe("/admin");
    expect(screen.getByText("Gerenciar competições e premiações")).toBeTruthy();
  });

  it.each<UserType>(["PLAYER", "ORGANIZER"])("não mostra Administração para %s", (role) => {
    tipoUsuario = role;
    render(<ProfileDashboard />);
    expect(screen.queryByRole("link", { name: /Administração/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Área administrativa" })).toBeNull();
  });

  it("preserva os atalhos comuns do Perfil", () => {
    tipoUsuario = "PLAYER";
    render(<ProfileDashboard />);
    expect(screen.getByRole("link", { name: /Meus Times/ }).getAttribute("href")).toBe("/meus-times");
    expect(screen.getByRole("link", { name: /Carteira/ }).getAttribute("href")).toBe("/carteira");
    expect(screen.getByText("Ações de rodada")).toBeTruthy();
  });
});
