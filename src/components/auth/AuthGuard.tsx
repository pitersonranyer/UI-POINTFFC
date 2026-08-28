"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./AuthGuard.module.css";

export function AuthGuard({ children, guestOnly = false }: { children: React.ReactNode; guestOnly?: boolean }) {
  const { firebaseUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const canRender = guestOnly ? !isAuthenticated : isAuthenticated;

  useEffect(() => {
    if (isLoading) return;
    if (firebaseUser && !firebaseUser.emailVerified) {
      router.replace("/confirmar-email");
      return;
    }
    if (!canRender) router.replace(guestOnly ? "/dashboard" : "/login");
  }, [canRender, firebaseUser, guestOnly, isLoading, router]);

  if (isLoading || !canRender) return <div className={styles.loading} role="status"><span />Verificando sua sessão...</div>;
  return <>{children}</>;
}
