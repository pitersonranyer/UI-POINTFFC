"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Trophy, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminGuard } from "./AdminGuard";
import styles from "./Admin.module.css";

const links = [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }, { href: "/admin/competicoes", label: "Competições", icon: Trophy }];
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return <AdminGuard><div className={styles.shell}>
    {open && <button type="button" aria-label="Fechar menu administrativo" className={styles.backdrop} onClick={() => setOpen(false)} />}
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <div className={styles.brand}><strong>POINT FFC</strong><span>Administração</span><button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)}><X /></button></div>
      <nav aria-label="Navegação administrativa">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href ? styles.navActive : ""}><Icon />{label}</Link>)}</nav>
      <Link href="/dashboard" className={styles.returnLink}>← Voltar ao site</Link>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}><button type="button" aria-label="Abrir menu administrativo" onClick={() => setOpen(true)}><Menu /></button><div><small>Administrador</small><strong>{user?.nome || user?.email}</strong></div></header>
      <main className={styles.content}>{children}</main>
    </div>
  </div></AdminGuard>;
}
