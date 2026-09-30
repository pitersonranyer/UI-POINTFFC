import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Navigation } from "./Navigation";

const auth = vi.hoisted(() => ({ loggedIn: false }));
vi.mock("next/navigation", () => ({ usePathname: () => "/mago", useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.loggedIn ? { nome: "Jogador", email: "jogador@example.com" } : null, isLoading: false, logout: vi.fn() }) }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ wallet: null, isLoading: false, error: null }) }));
beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each([false, true])("mantém menus sem Mago e Desafios, com autenticação %s", loggedIn => {
  auth.loggedIn = loggedIn;
  render(<Navigation />);
  expect(screen.getAllByRole("navigation")).toHaveLength(2);
  for (const nav of screen.getAllByRole("navigation")) {
    expect(within(nav).queryByRole("link", { name: "Mago" })).toBeNull();
    expect(nav.querySelector('a[href="/mago"]')).toBeNull();
    expect(within(nav).queryByRole("link", { name: "Desafios" })).toBeNull();
    expect(nav.querySelector('a[href="/desafios"]')).toBeNull();
    for (const name of ["Dashboard", "Prováveis", "Ligas"]) expect(within(nav).getByRole("link", { name })).toBeTruthy();
  }
});
