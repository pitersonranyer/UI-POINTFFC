"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LegacyFantasyEntry() {
  const router = useRouter();
  useEffect(() => { router.replace(`/point-fantasy${window.location.search}${window.location.hash}`); }, [router]);
  return <div className="page-shell"><p role="status">Abrindo POINT FFC Fantasy…</p><Link href="/point-fantasy">Ir para as competições</Link></div>;
}
