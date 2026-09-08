export type MercadoPagoPixStatus = "PENDENTE" | "PROCESSANDO" | "APROVADO" | "REJEITADO" | "CANCELADO" | "EXPIRADO" | "REEMBOLSADO";

export interface MercadoPagoPix {
  id: string;
  idExterno: string;
  status: MercadoPagoPixStatus;
  valor: number;
  pix?: { copiaCola?: string | null; qrCodeBase64?: string | null; expiracao?: string | null } | null;
  atualizadoEm: string;
}

export const PIX_STATUS_LABELS: Record<MercadoPagoPixStatus, string> = {
  PENDENTE: "Aguardando pagamento",
  PROCESSANDO: "Processando pagamento",
  APROVADO: "Pagamento aprovado",
  REJEITADO: "Pagamento rejeitado",
  CANCELADO: "Pagamento cancelado",
  EXPIRADO: "PIX expirado",
  REEMBOLSADO: "Pagamento reembolsado",
};

export function isPixTerminal(status: MercadoPagoPixStatus) {
  return ["APROVADO", "REJEITADO", "CANCELADO", "EXPIRADO", "REEMBOLSADO"].includes(status);
}
