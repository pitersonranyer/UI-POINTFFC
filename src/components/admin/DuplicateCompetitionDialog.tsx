"use client";

import React, { FormEvent, useRef, useState } from "react";
import { Copy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetition, type DuplicateCompetitionPayload } from "@/services/adminService";
import styles from "./Admin.module.css";

type DuplicateForm = Record<keyof DuplicateCompetitionPayload, string>;

const replaceRoundInName = (name: string, round: number, next: number) => name.replace(new RegExp(`(\\brodada\\s*)${round}\\b`, "i"), `$1${next}`);
const replaceRoundInSlug = (slug: string, round: number, next: number) => slug.replace(new RegExp(`(^|-)rodada-${round}(?=-|$)`, "i"), `$1rodada-${next}`);
const localReference = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Não informada";
const iso = (value: string) => new Date(value).toISOString();

export function duplicateSuggestion(source: AdminCompetition): DuplicateForm {
  const singleRound = source.rodadaInicio !== null && source.rodadaInicio === source.rodadaFim;
  const round = singleRound ? source.rodadaInicio! : null;
  const next = round === null ? null : round + 1;
  return {
    nome: next === null ? source.nome : replaceRoundInName(source.nome, round!, next),
    slug: next === null ? source.slug : replaceRoundInSlug(source.slug, round!, next),
    rodadaInicio: next?.toString() ?? "",
    rodadaFim: next?.toString() ?? "",
    inicioInscricao: "",
    fimInscricao: "",
    dataInicio: "",
    dataFim: "",
  };
}

function duplicateError(cause: unknown) {
  if (!(cause instanceof ApiError)) return "Não foi possível duplicar a competição. Tente novamente.";
  if (cause.status === 400) return "Revise os dados da nova competição.";
  if (cause.status === 403) return "Acesso não autorizado.";
  if (cause.status === 404) return "Competição de origem não encontrada.";
  if (cause.status === 409) return "Já existe uma competição utilizando este slug.";
  return "Não foi possível duplicar a competição. Tente novamente.";
}

export function DuplicateCompetitionDialog({ source, close }: { source: AdminCompetition; close: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(() => duplicateSuggestion(source));
  const [error, setError] = useState(""), [submitting, setSubmitting] = useState(false);
  const running = useRef(false);
  const update = (key: keyof DuplicateForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const validate = () => {
    if (!form.nome.trim() || !form.slug.trim() || !form.rodadaInicio || !form.rodadaFim || !form.inicioInscricao || !form.fimInscricao || !form.dataInicio || !form.dataFim) return "Preencha os oito campos da nova competição.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return "Use apenas letras minúsculas, números e hífens no slug.";
    if (![form.rodadaInicio, form.rodadaFim].every((value) => Number.isInteger(Number(value)) && Number(value) > 0)) return "Informe rodadas válidas.";
    if (Number(form.rodadaFim) < Number(form.rodadaInicio)) return "A rodada final não pode ser anterior à rodada inicial.";
    if (form.inicioInscricao > form.fimInscricao) return "O início das inscrições deve ocorrer antes do fim.";
    if (form.fimInscricao > form.dataInicio) return "O fim das inscrições deve ocorrer antes do início da competição.";
    if (form.dataInicio > form.dataFim) return "O início da competição deve ocorrer antes do fim.";
    return "";
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (running.current) return;
    const validation = validate();
    if (validation) { setError(validation); return; }
    running.current = true; setSubmitting(true); setError("");
    const payload: DuplicateCompetitionPayload = {
      nome: form.nome.trim(), slug: form.slug.trim(), rodadaInicio: Number(form.rodadaInicio), rodadaFim: Number(form.rodadaFim),
      inicioInscricao: iso(form.inicioInscricao), fimInscricao: iso(form.fimInscricao), dataInicio: iso(form.dataInicio), dataFim: iso(form.dataFim),
    };
    try {
      const created = await adminService.duplicateCompetition(source.id, payload);
      router.replace(`/admin/competicoes/editar?id=${created.id}`);
    } catch (cause) {
      setError(duplicateError(cause)); running.current = false; setSubmitting(false);
    }
  };
  const field = (label: string, key: keyof DuplicateForm, type = "text") => <label><span>{label}</span><input aria-label={label} type={type} min={type === "number" ? 1 : undefined} required value={form[key]} onChange={(event) => update(key, event.target.value)} /></label>;
  return <div className={styles.duplicateBackdrop} role="presentation"><section className={styles.duplicateDialog} role="dialog" aria-modal="true" aria-labelledby="duplicate-title">
    <header><div><p>DUPLICAR COMPETIÇÃO</p><h2 id="duplicate-title">Criar a partir de {source.nome}</h2></div><button type="button" onClick={close} disabled={submitting} aria-label="Fechar duplicação"><X /></button></header>
    <form onSubmit={submit} noValidate>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      <div className={styles.duplicateGrid}>{field("Nome", "nome")}{field("Slug", "slug")}{field("Rodada inicial", "rodadaInicio", "number")}{field("Rodada final", "rodadaFim", "number")}{field("Início das inscrições", "inicioInscricao", "datetime-local")}{field("Fim das inscrições", "fimInscricao", "datetime-local")}{field("Início da competição", "dataInicio", "datetime-local")}{field("Fim da competição", "dataFim", "datetime-local")}</div>
      <aside className={styles.dateReference}><strong>Datas anteriores — somente referência</strong><span>Inscrições: {localReference(source.inicioInscricao)} até {localReference(source.fimInscricao)}</span><span>Competição: {localReference(source.dataInicio)} até {localReference(source.dataFim)}</span></aside>
      <aside className={styles.duplicateSummary}><strong>O que será herdado da competição original</strong><p>Liga/modalidade, descrição, tipo de acesso, valor da inscrição, taxa da plataforma, limites, visibilidade e destaque.</p><b>A nova competição será criada como Rascunho.</b><p>Inscrições, participantes, pontuações, ranking e premiações não serão copiados.</p></aside>
      <footer><button type="button" onClick={close} disabled={submitting}>Cancelar</button><button type="submit" disabled={submitting}><Copy />{submitting ? "DUPLICANDO..." : "DUPLICAR COMPETIÇÃO"}</button></footer>
    </form>
  </section></div>;
}
