export interface Wallet {
  saldoDisponivel: string;
  saldoBloqueado: string;
  status: "ATIVA" | "BLOQUEADA";
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
