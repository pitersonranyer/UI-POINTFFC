export interface FantasyPage<T> { items: T[]; total: number; page: number; limit: number }
export interface PointFantasyCatalog {
  id: number; temporada: number; rodada: number; versao: number; status: string;
  capturadoEm: string; congeladoEm: string | null; criadoEm: string;
}
export interface PointFantasyAthlete {
  id: number; catalogoId: number; atletaIdExterno: number; clubeIdExterno: number;
  posicaoId: number; statusId: number; apelido: string; precoCartola: string;
  categoriaId: number | null; pointcoins: number;
}
export interface FantasyReference { id: number; dados: { nome: string; abreviacao: string; slug?: string } }
export interface FantasyCatalogData { athletes: PointFantasyAthlete[]; clubs: FantasyReference[]; positions: FantasyReference[] }
export interface AthleteFilters { search: string; club: string; position: string; category: string; coaches: boolean }
export const emptyAthleteFilters: AthleteFilters = { search: "", club: "", position: "", category: "", coaches: true };
export const categoryNames: Record<number, string> = { 1: "Bronze", 2: "Prata", 3: "Ouro" };
// Audited Cartola status dictionary in public/data/cartola-market.json.
// Fantasy snapshots carry statusId; absent/unknown values are not status 6 (Nulo).
export const capturedAthleteStatuses = { 2:"Dúvida", 3:"Suspenso", 5:"Contundido", 6:"Nulo", 7:"Provável" } as const;
