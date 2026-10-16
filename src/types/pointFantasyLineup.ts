import type { FantasyReference, PointFantasyAthlete, PointFantasyCatalog } from "./pointFantasy";

export type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "3-4-3" | "4-5-1" | "5-3-2" | "5-4-1";
export interface FantasyMatch {
  id: number; competicaoId: number; partidaIdExterno: number; clubeMandanteId: number; clubeVisitanteId: number;
  inicioPrevisto: string; inicioReal: string | null; status: string;
}
export interface FantasyCompetition {
  id: number; catalogoId: number; nome: string; temporada: number; rodada: number; tipoAcesso: "FREE" | "PAGO";
  valorInscricao: string; status: string; inicioInscricao: string; fimInscricao: string;
  fechamentoDefinitivoEm: string | null; limiteEscalacoesUsuario: number | null; criadoEm: string; atualizadoEm: string;
}
export interface CompetitionDetail extends FantasyCompetition { partidas: FantasyMatch[] }
export interface LineupSelection {
  formacao: Formation; titulares: number[]; tecnico: number | null; reservas: number[];
  capitaoAtletaId: number | null; reservaMagoAtletaId: number | null;
}
export interface FantasyLineup extends LineupSelection {
  id: number; competicaoId: number; status: "RASCUNHO"; versao: number; criadoEm: string; atualizadoEm: string;
  atletas: { catalogoAtletaId: number; papel: "TITULAR" | "TECNICO" | "RESERVA"; atleta: PointFantasyAthlete }[];
  validacao: { completa: boolean; pendencias: string[] };
}
export interface LineupContext {
  competition: CompetitionDetail; catalog: PointFantasyCatalog; athletes: PointFantasyAthlete[];
  clubs: FantasyReference[]; positions: FantasyReference[];
}
export type SlotRole = "titulares" | "reservas" | "tecnico";
export interface LineupSlot { role: SlotRole; position: number; index: number }
export interface LineupPickerSession extends LineupSlot { mode: "fill" | "replace" }
// Visual placement only; never serialized in the HTTP selection.
export type LineupSlotPlacements = Record<string, number>;
export interface LineupPickerFilters {
  search: string;
  clubs: string[] | null;
  categories: string[] | null;
  statuses: string[];
  sort: "desc" | "asc";
}
