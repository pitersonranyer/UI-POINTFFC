export interface MarketStatus {
  temporada: number;
  rodada_atual: number;
  status_mercado: number;
  bola_rolando: boolean;
}

export interface SnapshotMatch {
  partidaIdExterno: number;
  clubeMandanteId: number;
  clubeVisitanteId: number;
  inicioPrevisto: string;
}

export interface SnapshotClub {
  nome?: string;
  abreviacao?: string;
}

export interface CapturedCatalog {
  id: number;
  temporada: number;
  rodada: number;
  versao: number;
  status: string;
  capturadoEm: string;
  congeladoEm: string | null;
  criadoEm: string;
  referencias: {
    clubes: Record<string, SnapshotClub>;
    posicoes: Record<string, unknown>;
    partidas: SnapshotMatch[];
  };
}

export interface CapturedCatalogWorkspace {
  catalog: CapturedCatalog;
  athleteCount: number;
  clubCount: number;
}

export interface FantasyCompetition {
  id: number;
  catalogoId: number;
  temporada: number;
  rodada: number;
  nome: string;
  tipoAcesso: "FREE" | "PAGO";
  valorInscricao: string;
  status: string;
  inicioInscricao: string;
  fimInscricao: string;
  limiteEscalacoesUsuario: number | null;
  partidas: SnapshotMatch[];
}

export interface CaptureCatalogPayload {
  temporada: number;
  rodada: number;
  versao: number;
}

export interface CreateFantasyCompetitionPayload {
  catalogoId: number;
  nome: string;
  tipoAcesso: "FREE";
  valorInscricao: "0.00";
  inicioInscricao: string;
  fimInscricao: string;
  partidaIds: number[];
  limiteEscalacoesUsuario?: number;
}
