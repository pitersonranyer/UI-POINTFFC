export interface Wallet {
  saldoDisponivel: string;
  saldoBloqueado: string;
  status: "ATIVA" | "BLOQUEADA";
}
