"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./Admin.module.css";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const allowed = user?.tipoUsuario === "PLATFORM_ADMIN" && user.status === "ATIVO";
  useEffect(() => { if (!isLoading && !allowed) router.replace("/dashboard"); }, [allowed, isLoading, router]);
  if (isLoading) return <div className={styles.guardState} role="status"><span />Verificando acesso administrativo...</div>;
  if (!allowed) return <div className={styles.guardState} role="alert"><ShieldAlert />Acesso administrativo não autorizado.</div>;
  return <>{children}</>;
}
