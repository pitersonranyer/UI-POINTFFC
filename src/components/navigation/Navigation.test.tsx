import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Navigation } from "./Navigation";

const auth = vi.hoisted(() => ({ loggedIn: false }));
const nav = vi.hoisted(() => ({ pathname: "/mago" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname, useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.loggedIn ? { nome: "Jogador", email: "jogador@example.com" } : null, isLoading: false, logout: vi.fn() }) }));
vi.mock("@/contexts/WalletContext", () => ({ useWallet: () => ({ wallet: null, isLoading: false, error: null }) }));
beforeEach(() => { vi.stubGlobal("React", React); nav.pathname = "/mago"; });
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

it.each(["/auth/action", "/auth/action/"])("mantém %s sem os menus desktop e mobile", pathname => {
  nav.pathname = pathname;
  render(<Navigation />);
  expect(screen.queryByRole("navigation")).toBeNull();
});
