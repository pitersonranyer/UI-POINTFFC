export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatScore = (value: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

// Keep official decimal balances textual, without floating point arithmetic.
export const formatWalletCurrency = (value: string) => {
  const [integer, cents] = value.split(".");
  return `R$\u00a0${integer.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents}`;
};
