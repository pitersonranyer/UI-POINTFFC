import type { PixCharge, Wallet, WalletTransaction } from "@/types/wallet";

const KEYS = {
  wallet: "fantasypoint_wallet",
  transactions: "fantasypoint_wallet_transactions",
  charges: "fantasypoint_pix_charges",
} as const;
const DELAY = 250;

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, DELAY));
const storage = () => {
  if (typeof window === "undefined") throw new Error("A carteira mockada só está disponível no navegador.");
  return window.localStorage;
};
const read = <T,>(key: string): T | null => {
  try {
    const value = storage().getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};
const write = <T,>(key: string, value: T) => storage().setItem(key, JSON.stringify(value));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function initialState() {
  const now = Date.now();
  const wallet: Wallet = { id: "wallet-demo", userId: "user-demo", balance: 125, blockedBalance: 0, updatedAt: new Date(now).toISOString() };
  const transactions: WalletTransaction[] = [
    { id: "tx-initial-pix", walletId: wallet.id, type: "PIX_CREDITO", amount: 50, description: "Crédito via PIX", status: "CONFIRMADO", createdAt: new Date(now - 45 * 60_000).toISOString() },
    { id: "tx-initial-entry", walletId: wallet.id, type: "INSCRICAO", amount: -20, description: "Inscrição - Liga dos Amigos", status: "CONFIRMADO", createdAt: new Date(now - 24 * 60 * 60_000).toISOString() },
    { id: "tx-initial-prize", walletId: wallet.id, type: "PREMIACAO", amount: 100, description: "Premiação - Mata-Mata", status: "CONFIRMADO", createdAt: new Date(now - 4 * 24 * 60 * 60_000).toISOString() },
  ];
  return { wallet, transactions, charges: [] as PixCharge[] };
}

function ensureData() {
  const defaults = initialState();
  const wallet = read<Wallet>(KEYS.wallet) ?? defaults.wallet;
  const transactions = read<WalletTransaction[]>(KEYS.transactions) ?? defaults.transactions;
  const charges = read<PixCharge[]>(KEYS.charges) ?? defaults.charges;
  if (!read<Wallet>(KEYS.wallet)) write(KEYS.wallet, wallet);
  if (!read<WalletTransaction[]>(KEYS.transactions)) write(KEYS.transactions, transactions);
  if (!read<PixCharge[]>(KEYS.charges)) write(KEYS.charges, charges);
  return { wallet, transactions, charges };
}

function identifier(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}${Date.now().toString(36).toUpperCase()}${random}`;
}

export const walletService = {
  async getWallet() { await wait(); return clone(ensureData().wallet); },
  async getTransactions() { await wait(); return clone(ensureData().transactions.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))); },
  async getPixCharges() { await wait(); return clone(ensureData().charges); },
  async createPixDeposit(value: number) {
    await wait();
    if (!Number.isFinite(value) || value <= 0) throw new Error("Informe um valor maior que zero.");
    const { wallet, charges } = ensureData();
    const txid = identifier("FP");
    const payload = `00020101021226830014BR.GOV.BCB.PIX2561PIX-SIMULADO.FANTASYPOINT/${txid}520400005303986540${value.toFixed(2)}5802BR5913FANTASY POINT6009SAO PAULO62070503***6304MOCK`;
    const charge: PixCharge = { id: identifier("charge-"), walletId: wallet.id, value, txid, pixCopyPaste: payload, qrCodeValue: payload, status: "AGUARDANDO_PAGAMENTO", createdAt: new Date().toISOString() };
    write(KEYS.charges, [charge, ...charges]);
    return clone(charge);
  },
  async simulatePixPayment(id: string) {
    await wait();
    const { wallet, transactions, charges } = ensureData();
    const index = charges.findIndex((charge) => charge.id === id);
    if (index < 0) throw new Error("Cobrança PIX não encontrada.");
    if (charges[index].status !== "AGUARDANDO_PAGAMENTO") throw new Error("Esta cobrança não está disponível para pagamento.");
    const paidAt = new Date().toISOString();
    charges[index] = { ...charges[index], status: "PAGO", paidAt };
    const updatedWallet = { ...wallet, balance: Math.round((wallet.balance + charges[index].value) * 100) / 100, updatedAt: paidAt };
    const transaction: WalletTransaction = { id: identifier("tx-"), walletId: wallet.id, type: "PIX_CREDITO", amount: charges[index].value, description: "Crédito via PIX", status: "CONFIRMADO", reference: charges[index].txid, createdAt: paidAt };
    write(KEYS.wallet, updatedWallet); write(KEYS.transactions, [transaction, ...transactions]); write(KEYS.charges, charges);
    return { wallet: clone(updatedWallet), transaction: clone(transaction), charge: clone(charges[index]) };
  },
  async resetMock() {
    await wait();
    Object.values(KEYS).forEach((key) => storage().removeItem(key));
    return clone(ensureData());
  },
};
