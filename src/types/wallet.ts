export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  blockedBalance: number;
  updatedAt: string;
}

export type WalletTransactionType = "PIX_CREDITO" | "INSCRICAO" | "PREMIACAO" | "ESTORNO";
export type WalletTransactionStatus = "PENDENTE" | "CONFIRMADO" | "CANCELADO";

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  status: WalletTransactionStatus;
  reference?: string;
  createdAt: string;
}

export type PixChargeStatus = "AGUARDANDO_PAGAMENTO" | "PAGO" | "EXPIRADO";

export interface PixCharge {
  id: string;
  walletId: string;
  value: number;
  txid: string;
  pixCopyPaste: string;
  qrCodeValue: string;
  status: PixChargeStatus;
  createdAt: string;
  paidAt?: string;
}
