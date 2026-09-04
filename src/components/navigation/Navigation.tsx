"use client";
import Image from "next/image";
import Link from "next/link";
import { Home, LogOut, Menu, Shirt, Trophy, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency } from "@/lib/format";
import styles from "./Navigation.module.css";
const publicLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/provaveis", label: "Prováveis", icon: Shirt },
  { href: "/ligas", label: "Ligas", icon: Trophy },
];
export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { wallet } = useWallet();
  const [signingOut, setSigningOut] = useState(false);
  const links = user ? [...publicLinks, { href: "/perfil", label: "Perfil", icon: UserRound }] : publicLinks;
  if (
    [
      "/login",
      "/cadastro",
      "/esqueci-senha",
      "/redefinir-senha",
      "/confirmar-email",
    ].includes(pathname)
  )
    return null;
  const active = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname === "/dashboard"
      : pathname.startsWith(href);
  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.menu} aria-label="Abrir menu">
            <Menu />
          </button>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>P</span>
            <span>
              <strong>
                POINT <b>FFC</b>
              </strong>
              <small>Fantasy Football Club</small>
            </span>
          </Link>
          <nav className={styles.desktopNav}>
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={active(href) ? styles.activeDesktop : ""}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className={styles.account}>
            {!isLoading &&
              (user ? (
                <>
                  <Link href="/perfil" className={styles.profile}>
                    {user.fotoUrl ? (
                      <Image
                        src={user.fotoUrl}
                        alt=""
                        width={34}
                        height={34}
                        unoptimized
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <i>{(user.nome || user.email).charAt(0).toUpperCase()}</i>
                    )}
                    <span>
                      <strong>{user.nome || user.email.split("@")[0]}</strong>
                      <small>
                        {formatCurrency(wallet?.balance ?? 0)}
                      </small>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className={styles.logout}
                    onClick={handleLogout}
                    disabled={signingOut}
                    aria-label="Sair da conta"
                  >
                    <LogOut />
                    <span>{signingOut ? "Saindo..." : "Sair"}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.login}>
                    Entrar
                  </Link>
                  <Link href="/cadastro" className={styles.signup}>
                    Criar conta
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>
      <nav className={styles.mobileNav}>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={active(href) ? styles.activeMobile : ""}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
        {!isLoading && !user && <Link href="/login" className={active("/login") ? styles.activeMobile : ""}><UserRound size={19} /><span>Entrar</span></Link>}
      </nav>
    </>
  );
}
