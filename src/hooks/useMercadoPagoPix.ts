"use client";

import { useEffect, useRef, useState } from "react";
import { mercadoPagoPocService } from "@/services/mercadoPagoPocService";
import { isPixTerminal, type MercadoPagoPix } from "@/types/mercado-pago-poc";

export function useMercadoPagoPix() {
  const [charge, setCharge] = useState<MercadoPagoPix | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const running = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);

  function stop() {
    generation.current += 1;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    request.current?.abort();
    request.current = null;
  }

  useEffect(() => () => { stop(); }, []);

  function schedule(id: string, version: number) {
    timer.current = setTimeout(async () => {
      if (version !== generation.current) return;
      const controller = new AbortController();
      request.current = controller;
      let terminal = false;
      try {
        const next = await mercadoPagoPocService.status(id, controller.signal);
        if (version !== generation.current) return;
        setCharge(next);
        setPollError("");
        terminal = isPixTerminal(next.status);
      } catch {
        if (version === generation.current) setPollError("Não foi possível atualizar o status. Tentando novamente...");
      } finally {
        if (version === generation.current) {
          request.current = null;
          timer.current = null;
          if (!terminal) schedule(id, version);
        }
      }
    }, 2500);
  }

  async function create(valor: number) {
    if (running.current) return;
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    running.current = true;
    stop();
    const version = generation.current;
    const controller = new AbortController();
    request.current = controller;
    setCreating(true);
    setError("");
    setPollError("");
    setCharge(null);
    try {
      const next = await mercadoPagoPocService.create(valor, controller.signal);
      if (version !== generation.current) return;
      setCharge(next);
      if (!isPixTerminal(next.status)) schedule(next.id, version);
    } catch (cause) {
      if (version === generation.current) setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PIX.");
    } finally {
      running.current = false;
      if (version === generation.current) {
        request.current = null;
        setCreating(false);
      }
    }
  }

  return { charge, creating, error, pollError, create };
}
