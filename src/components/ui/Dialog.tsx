"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import styles from "@/components/teams/MyTeamsManager.module.css";

export function Dialog({ title, close, children, wide = false, busy = false }: {
  title: string; close: () => void; children: React.ReactNode; wide?: boolean; busy?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); if (!busy) close(); }
      if (event.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, a[href], [tabindex="0"]');
        if (!items?.length) { event.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [busy, close]);
  return <div className={styles.backdrop} onMouseDown={() => { if (!busy) close(); }}>
    <section ref={ref} tabIndex={-1} className={`${styles.dialog} ${wide ? styles.wide : ""}`} role="dialog" aria-modal="true" aria-labelledby={id} aria-busy={busy} onMouseDown={(event) => event.stopPropagation()}>
      <header><h2 id={id}>{title}</h2><button type="button" onClick={close} disabled={busy} aria-label="Fechar"><X /></button></header>{children}
    </section>
  </div>;
}
