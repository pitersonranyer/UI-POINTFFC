export interface CartolaMarketStatus {
  rodada_atual: number; status_mercado: number;
  fechamento?: { dia?: number; mes?: number; ano?: number; hora?: number; minuto?: number; timestamp?: number; [key: string]: unknown };
  bola_rolando: boolean; game_over?: boolean; temporada?: number; nome_rodada?: string; rodada_final?: number;
  [key: string]: unknown;
}
export interface CartolaMatch {
  partida_id: number; clube_casa_id: number; clube_visitante_id: number; partida_data?: string; timestamp?: number; local?: string;
  placar_oficial_mandante?: number | null; placar_oficial_visitante?: number | null;
  periodo_tr?: string; status_cronometro_tr?: string; inicio_cronometro_tr?: string; valida?: boolean;
  [key: string]: unknown;
}
export interface CartolaClub {
  id?: number; nome?: string; abreviacao?: string; nome_fantasia?: string;
  escudos?: { "30x30"?: string; "45x45"?: string; "60x60"?: string; [key: string]: unknown };
  [key: string]: unknown;
}
export interface CartolaDashboardResponse {
  mercado: CartolaMarketStatus; rodada: number; mercadoAberto: boolean; bolaRolando: boolean;
  partidas: CartolaMatch[]; clubes: Record<string, CartolaClub>;
}
export interface CartolaScoredAthlete { apelido:string; foto?:string; pontuacao:number; posicao_id:number; clube_id?:number; entrou_em_campo?:boolean; scout?:Record<string,number>; isMagoPick?:boolean; [key:string]:unknown }
export interface CartolaScoredAthletesResponse { atletas:Record<string,CartolaScoredAthlete>; clubes?:Record<string,CartolaClub>; posicoes?:Record<string,{id:number;nome:string;abreviacao:string}>; rodada?:number; total_atletas?:number; [key:string]:unknown }
export type CartolaAthletesResponse = Record<string, unknown>;
export type CartolaClubsResponse = Record<string, CartolaClub>;
export type CartolaMatchesResponse = { partidas?: CartolaMatch[]; clubes?: CartolaClubsResponse; [key: string]: unknown };
// Contrato legado do JSON estático da tela de prováveis (fora desta integração).
export type CartolaAthlete = { atleta_id:number; clube_id:number; posicao_id:number; status_id:number; apelido:string; apelido_abreviado:string; nome:string; foto:string; preco_num:number; media_num:number };
export type CartolaLegacyClub = { id:number; nome:string; abreviacao:string; slug:string; apelido:string; escudos:Record<string,string> };
export type CartolaMarket = { atletas:CartolaAthlete[]; clubes:Record<string,CartolaLegacyClub>; posicoes:Record<string,{id:number;nome:string;abreviacao:string}>; status:Record<string,{id:number;nome:string}> };
