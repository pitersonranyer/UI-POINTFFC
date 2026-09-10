export interface Wallet {
  saldoDisponivel: string;
  saldoBloqueado: string;
  status: "ATIVA" | "BLOQUEADA";
}

export interface WalletStatementItem {
  id: number;
  tipo: string;
  origem: string;
  valor: string;
  saldoAnterior: string;
  saldoPosterior: string;
  descricao: string | null;
  status: string;
  criadoEm: string;
}

export interface WalletStatementResponse {
  items: WalletStatementItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PixStatus = "PENDENTE" | "PROCESSANDO" | "APROVADA" | "REJEITADA" | "CANCELADA" | "EXPIRADA" | "REEMBOLSADA";
export interface WalletPix {
  id: number;
  valor: string;
  status: PixStatus;
  idPagamentoExterno: string | null;
  pixCopiaCola: string | null;
  qrCode: string | null;
  expiracao: string | null;
  criadoEm: string;
  atualizadoEm: string;
  aprovadoEm: string | null;
}
