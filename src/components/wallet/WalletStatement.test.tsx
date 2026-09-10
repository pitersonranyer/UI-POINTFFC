import React, { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WalletStatement } from "./WalletStatement";
import { walletService } from "@/services/walletService";
import type { WalletStatementItem, WalletStatementResponse } from "@/types/wallet";
vi.mock("@/services/walletService", () => ({ walletService: { getWalletStatement: vi.fn() } }));
const item: WalletStatementItem = { id: 123, tipo: "CREDITO", origem: "RECARGA_PIX", valor: "10.00", saldoAnterior: "20.00", saldoPosterior: "30.00", descricao: null, status: "CONFIRMADA", criadoEm: "2026-09-10T12:00:00.000Z" };
const response: WalletStatementResponse = { items: [item], page: 1, limit: 20, total: 1, totalPages: 1 };
beforeEach(() => vi.mocked(walletService.getWalletStatement).mockReset().mockResolvedValue(response));
afterEach(cleanup);
it("carrega página inicial uma vez, sem antecipar vazio nem criar movimentações", async () => {
  render(<StrictMode><WalletStatement /></StrictMode>);
  expect(screen.getByText("Carregando extrato...")).toBeTruthy();
  expect(screen.queryByText("Nenhuma movimentação ainda")).toBeNull();
  await screen.findByText("Recarga via Pix");
  expect(walletService.getWalletStatement).toHaveBeenCalledTimes(1);
  expect(walletService.getWalletStatement).toHaveBeenCalledWith(1, 20, expect.any(AbortSignal));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.queryByText(/125,00|Liga dos Amigos|Premiação/)).toBeNull();
  expect(screen.queryByRole("navigation")).toBeNull();
});
it("exibe entrada, saldo posterior, data brasileira e omite campos técnicos", async () => {
  render(<WalletStatement />);
  await screen.findByText("Recarga via Pix");
  expect(screen.getByText(/\+ R\$\s*10,00/)).toBeTruthy();
  expect(screen.getByText(/Saldo após movimentação: R\$\s*30,00/)).toBeTruthy();
  const date = new Date(item.criadoEm);
  expect(screen.getByText(date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))).toBeTruthy();
  expect(screen.queryByText(/CONFIRMADA|RECARGA_PIX|CREDITO|123/)).toBeNull();
});
it.each([
  ["DEBITO", "INSCRICAO", "Descrição recebida", "Descrição recebida", "- R$"],
  ["NOVO_TIPO", "NOVA_ORIGEM", "Descrição recebida", "Descrição recebida", "R$"],
  ["NOVO_TIPO", "NOVA_ORIGEM", null, "Movimentação da carteira", "R$"],
  ["NOVO_TIPO", "NOVA_ORIGEM", "  ", "Movimentação da carteira", "R$"],
])("mapeia %s com fallback seguro", async (tipo, origem, descricao, label, prefix) => {
  vi.mocked(walletService.getWalletStatement).mockResolvedValue({ ...response, items: [{ ...item, tipo: tipo!, origem: origem!, descricao }] });
  render(<WalletStatement />);
  await screen.findByText(label!);
  const amount = screen.getByRole("article").querySelector(":scope > strong");
  expect(amount?.textContent?.replace(/\s/g, " ")).toBe(prefix + " 10,00");
});
it("mantém ordem recebida do backend", async () => {
  vi.mocked(walletService.getWalletStatement).mockResolvedValue({ ...response, items: [{ ...item, id: 124, origem: "OUTRA", descricao: "Mais recente" }, { ...item, origem: "OUTRA", descricao: "Anterior" }] });
  render(<WalletStatement />);
  await screen.findByText("Mais recente");
  expect(screen.getAllByRole("article").map((node) => node.querySelector("strong")?.textContent)).toEqual(["Mais recente", "Anterior"]);
});
it("mostra estado vazio apenas após resposta vazia", async () => {
  vi.mocked(walletService.getWalletStatement).mockResolvedValue({ ...response, items: [], total: 0, totalPages: 0 });
  render(<WalletStatement />);
  await screen.findByText("Nenhuma movimentação ainda");
  expect(screen.getByText("Suas recargas e outras movimentações aparecerão aqui.")).toBeTruthy();
  expect(screen.queryByRole("article")).toBeNull();
});
it("navega somente na página solicitada, respeita limites e repete página atual no erro", async () => {
  vi.mocked(walletService.getWalletStatement)
    .mockResolvedValueOnce({ ...response, total: 21, totalPages: 2 })
    .mockRejectedValueOnce(new Error("private stack"))
    .mockResolvedValueOnce({ ...response, page: 2, total: 21, totalPages: 2 })
    .mockResolvedValueOnce({ ...response, total: 21, totalPages: 2 });
  render(<WalletStatement />);
  await screen.findByText("Página 1 de 2");
  expect((screen.getByText("Anterior") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByText("Próxima"));
  expect(screen.getByText("Carregando extrato...")).toBeTruthy();
  expect(screen.queryByRole("article")).toBeNull();
  await screen.findByText("Não foi possível carregar seu extrato.");
  expect(screen.queryByText(/private stack/)).toBeNull();
  fireEvent.click(screen.getByText("Tentar novamente"));
  await screen.findByText("Recarga via Pix");
  expect((screen.getByText("Próxima") as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Página 2 de 2")).toBeTruthy();
  fireEvent.click(screen.getByText("Anterior"));
  await screen.findByText("Recarga via Pix");
  expect(vi.mocked(walletService.getWalletStatement).mock.calls.map(([page, limit]) => [page, limit])).toEqual([[1, 20], [2, 20], [2, 20], [1, 20]]);
});
it("cancela consulta ao desmontar e ignora resposta atrasada", async () => {
  let resolve!: (value: WalletStatementResponse) => void;
  vi.mocked(walletService.getWalletStatement).mockReturnValue(new Promise((done) => { resolve = done; }));
  const ui = render(<WalletStatement />);
  await waitFor(() => expect(walletService.getWalletStatement).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(walletService.getWalletStatement).mock.calls[0][2];
  ui.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => resolve(response));
  expect(screen.queryByRole("article")).toBeNull();
});
