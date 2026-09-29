import { ApiError } from "@/services/apiClient";
import type { AdminDesafio, DesafioPayload, DesafioStatus } from "@/services/adminDesafioService";

export const statusLabels: Record<DesafioStatus, string> = { RASCUNHO: "Rascunho", ABERTO: "Aberto", EM_ANDAMENTO: "Em andamento", ENCERRADO: "Encerrado", CANCELADO: "Cancelado" };
export const dateLabels = { inicioInscricao: "Início das inscrições", fimInscricao: "Fim das inscrições", dataInicio: "Início do Desafio", dataFim: "Fim do Desafio" };
export type DesafioFormState = Omit<DesafioPayload, "descricao" | "limiteParticipantes"> & { descricao: string; limiteParticipantes: string };
export const emptyForm: DesafioFormState = { nome: "", descricao: "", tipoAcesso: "FREE", valorInscricao: "0.00", inicioInscricao: "", fimInscricao: "", dataInicio: "", dataFim: "", limiteParticipantes: "" };
export function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23);
}
export function fromDesafio(item: AdminDesafio): DesafioFormState {
  return { nome: item.nome, descricao: item.descricao ?? "", tipoAcesso: item.tipoAcesso, valorInscricao: item.valorInscricao, limiteParticipantes: item.limiteParticipantes?.toString() ?? "", inicioInscricao: localDate(item.inicioInscricao), fimInscricao: localDate(item.fimInscricao), dataInicio: localDate(item.dataInicio), dataFim: localDate(item.dataFim) };
}
export function formPayload(form: DesafioFormState): DesafioPayload {
  const valor = form.tipoAcesso === "FREE" ? "0.00" : form.valorInscricao.trim().replace(",", ".");
  if (!form.nome.trim() || form.nome.trim().length > 255) throw new Error("Informe um nome com até 255 caracteres.");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(valor) || (form.tipoAcesso === "PAGO" && Number(valor) <= 0)) throw new Error("Informe um valor positivo com até duas casas decimais para PAGO.");
  const dates = Object.keys(dateLabels) as (keyof typeof dateLabels)[];
  if (dates.some(key => !form[key] || !Number.isFinite(new Date(form[key]).getTime()))) throw new Error("Preencha todas as datas e horários.");
  const [inicio, fim, start, end] = dates.map(key => new Date(form[key]).getTime());
  if (!(inicio < fim && fim <= start && start < end)) throw new Error("As inscrições devem iniciar antes de terminar e encerrar até o início do Desafio. O fim do Desafio deve ser posterior ao início.");
  const limite = form.limiteParticipantes === "" ? null : Number(form.limiteParticipantes);
  if (limite !== null && (!Number.isInteger(limite) || limite < 1 || limite > 4294967295)) throw new Error("Informe um limite inteiro entre 1 e 4294967295, ou deixe vazio.");
  return { ...form, nome: form.nome.trim(), descricao: form.descricao.trim() || null, limiteParticipantes: limite, valorInscricao: Number(valor).toFixed(2), inicioInscricao: new Date(form.inicioInscricao).toISOString(), fimInscricao: new Date(form.fimInscricao).toISOString(), dataInicio: new Date(form.dataInicio).toISOString(), dataFim: new Date(form.dataFim).toISOString() };
}
export function desafioError(cause: unknown) {
  if (!(cause instanceof ApiError)) return "Não foi possível concluir a operação. Tente novamente.";
  if (cause.status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
  if (cause.status === 403) return "Seu usuário não possui permissão para esta operação.";
  if ([400, 404, 409].includes(cause.status)) {
    const messages = cause.details.message;
    return Array.isArray(messages) ? messages.join(" · ") : cause.message;
  }
  if ([502, 503, 504].includes(cause.status)) return "A consulta de partidas está indisponível no momento. Tente novamente em instantes.";
  return "Não foi possível concluir a operação. Verifique sua conexão e tente novamente.";
}
export const displayDate = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
