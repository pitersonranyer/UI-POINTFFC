import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import AdminFinancialPage from "@/app/admin/financeiro/page";
import { AdminFinancial, financialMoney } from "./AdminFinancial";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetition, type AdminFinancialDashboard, type AdminFinancialItem } from "@/services/adminService";

const auth = vi.hoisted(() => ({ user: { tipoUsuario: "PLATFORM_ADMIN", status: "ATIVO", nome: "Admin" } as { tipoUsuario: string; status: string; nome: string } | null, loading: false, replace: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user, isLoading: auth.loading }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/financeiro", useRouter: () => ({ replace: auth.replace }) }));
vi.mock("@/services/adminService", () => ({ adminService: { getFinancialDashboard: vi.fn(), getLeagues: vi.fn(), listCompetitions: vi.fn() } }));

const values = { valorInscricoes: "1234.56", receitaPointPrevista: "123.46", basePremiacao: "1111.10", premiacaoCalculada: "1200.00", saldoAposPremiacao: "-88.90" };
const item: AdminFinancialItem = { competicaoId: 10, nome: "Copa paga", liga: { id: 1, nome: "Liga A" }, modalidade: { id: 1, nome: "Rodada", codigo: "RODADA" }, rodadaInicio: 27, rodadaFim: 30, status: "INSCRICOES_ABERTAS", tipoAcesso: "PAGO", valorInscricao: "10.00", inscritos: { ativos: 8, finalizados: 2, cancelados: 1, totalConsiderado: 10 }, taxaPlataforma: { tipo: "PERCENTUAL", valor: "10.00" }, financeiro: values, premiacoes: [] };
const response = (overrides: Partial<AdminFinancialDashboard> = {}): AdminFinancialDashboard => ({ natureza: "PREVISTO_NOMINAL", totalizadores: { ...values, quantidadeCompeticoes: 25, totalInscritos: 250, inscricoesCanceladas: 3 }, itens: [item], paginacao: { pagina: 1, limite: 20, total: 25, totalPaginas: 2 }, ...overrides });
const option = (id: number, liga: number, nome: string) => ({ id, nome, liga: { id: liga } }) as AdminCompetition;
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.resetAllMocks();
  auth.user = { tipoUsuario: "PLATFORM_ADMIN", status: "ATIVO", nome: "Admin" }; auth.loading = false;
  vi.mocked(adminService.getLeagues).mockResolvedValue([{ id: 1, nome: "Liga A", slug: "a", tipo: "PUBLICA", status: "ATIVA", visivelApp: true, imagemUrl: null }]);
  vi.mocked(adminService.listCompetitions).mockResolvedValue({ itens: [option(10, 1, "Opção A"), option(20, 2, "Opção B")], paginacao: { pagina: 1, limite: 100, total: 2, totalPaginas: 1 } });
  vi.mocked(adminService.getFinancialDashboard).mockImplementation(async (filters) => response({ paginacao: { pagina: filters?.pagina ?? 1, limite: 20, total: 25, totalPaginas: 2 } }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("renderiza quatro totalizadores da resposta, moeda, inscritos, rodada, taxa percentual e déficit", async () => {
  render(<AdminFinancial />);
  expect(screen.getByText("Carregando financeiro...")).toBeTruthy();
  const cards = await screen.findByRole("region", { name: "Totalizadores financeiros" });
  expect(cards.children).toHaveLength(4);
  for (const text of ["Total de inscritos", "Valor das inscrições", "Receita POINT FFC prevista", "Premiação total prevista", "250", "R$ 1.234,56", "R$ 123,46", "R$ 1.200,00"]) expect(within(cards).getByText(text)).toBeTruthy();
  expect(financialMoney("1234.56").replace(/\s/g, " ")).toBe("R$ 1.234,56");
  const table = screen.getByRole("table");
  for (const text of ["27–30", "8 ativos", "2 finalizados · 1 cancelados", "10%", "Inscrições abertas", "Déficit previsto", "-R$ 88,90"]) expect(within(table).getByText(text)).toBeTruthy();
  expect(within(table).getByText("Déficit previsto").parentElement?.className).toContain("deficit");
  expect(screen.getByText("Competições (25)")).toBeTruthy();
});

it("combina Liga, Competição e Rodada, reinicia paginação, limpa filtros e mantém totais globais ao paginar", async () => {
  render(<AdminFinancial />);
  await screen.findByText("Copa paga");
  await waitFor(() => expect((screen.getByLabelText("Liga") as HTMLSelectElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText("Liga"), { target: { value: "1" } });
  expect(screen.queryByRole("option", { name: "Opção B" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Competição"), { target: { value: "10" } });
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "27" } });
  await waitFor(() => expect(adminService.getFinancialDashboard).toHaveBeenLastCalledWith({ ligaId: 1, competicaoId: 10, rodada: 27, pagina: 1, limite: 20 }));
  await screen.findByText("Copa paga");
  const totals = screen.getByRole("region", { name: "Totalizadores financeiros" }).textContent;
  fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
  await screen.findByText("Copa paga");
  expect(adminService.getFinancialDashboard).toHaveBeenLastCalledWith({ ligaId: 1, competicaoId: 10, rodada: 27, pagina: 2, limite: 20 });
  expect(screen.getByRole("region", { name: "Totalizadores financeiros" }).textContent).toBe(totals);
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "28" } });
  await screen.findByText("Copa paga");
  expect(adminService.getFinancialDashboard).toHaveBeenLastCalledWith({ ligaId: 1, competicaoId: 10, rodada: 28, pagina: 1, limite: 20 });
  fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
  await screen.findByText("Copa paga");
  expect(adminService.getFinancialDashboard).toHaveBeenLastCalledWith({ pagina: 1, limite: 20 });
  for (const label of ["Liga", "Competição", "Rodada"]) expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe("");
});

it("atualiza totais, contagem, tabela e paginação juntos e limpa competição ao trocar liga", async () => {
  render(<AdminFinancial />); await screen.findByText("Copa paga");
  await waitFor(() => expect((screen.getByLabelText("Competição") as HTMLSelectElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText("Competição"), { target: { value: "20" } });
  await screen.findByText("Copa paga");
  vi.mocked(adminService.getFinancialDashboard).mockResolvedValue(response({ totalizadores: { ...values, quantidadeCompeticoes: 1, totalInscritos: 5, inscricoesCanceladas: 0 }, itens: [{ ...item, nome: "Resultado filtrado" }], paginacao: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 } }));
  fireEvent.change(screen.getByLabelText("Liga"), { target: { value: "1" } });
  await screen.findByText("Resultado filtrado");
  expect(screen.getByText("Competições (1)")).toBeTruthy();
  expect(within(screen.getByRole("region", { name: "Totalizadores financeiros" })).getByText("5")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Paginação" })).toBeNull();
  expect(adminService.getFinancialDashboard).toHaveBeenLastCalledWith({ ligaId: 1, competicaoId: undefined, pagina: 1, limite: 20 });
});

it("exibe taxa fixa por inscrição, FREE com zeros, rodada única e sem rodada", async () => {
  const zero = { valorInscricoes: "0.00", receitaPointPrevista: "0.00", basePremiacao: "0.00", premiacaoCalculada: "0.00", saldoAposPremiacao: "0.00" };
  vi.mocked(adminService.getFinancialDashboard).mockResolvedValue(response({ itens: [{ ...item, rodadaFim: 27, taxaPlataforma: { tipo: "VALOR_FIXO", valor: "2.50" } }, { ...item, competicaoId: 11, nome: "Copa FREE", tipoAcesso: "FREE", valorInscricao: "0.00", rodadaInicio: null, rodadaFim: null, taxaPlataforma: { tipo: null, valor: null }, financeiro: zero }], totalizadores: { ...zero, quantidadeCompeticoes: 2, totalInscritos: 0, inscricoesCanceladas: 0 } }));
  render(<AdminFinancial />); await screen.findByText("Copa FREE");
  expect(screen.getByText("por inscrição")).toBeTruthy();
  expect(screen.getByText("R$ 2,50")).toBeTruthy();
  expect(screen.getByText("27")).toBeTruthy();
  const free = screen.getByRole("row", { name: /Copa FREE/ });
  expect(within(free).getAllByText("R$ 0,00")).toHaveLength(4);
  expect(within(free).getByText("Sem taxa")).toBeTruthy(); expect(within(free).getByText("—")).toBeTruthy();
  expect(within(free).queryByText("Déficit previsto")).toBeNull();
});

it("exibe estado vazio sem inventar registros", async () => {
  vi.mocked(adminService.getFinancialDashboard).mockResolvedValue(response({ itens: [], totalizadores: { ...values, quantidadeCompeticoes: 0, totalInscritos: 0, inscricoesCanceladas: 0 }, paginacao: { pagina: 1, limite: 20, total: 0, totalPaginas: 0 } }));
  render(<AdminFinancial />);
  expect(await screen.findByText("Nenhuma competição encontrada para os filtros selecionados.")).toBeTruthy();
  expect(screen.getByText("Competições (0)")).toBeTruthy();
});

it.each([401, 403, 500])("exibe erro amigável %s e permite tentar novamente", async (status) => {
  vi.mocked(adminService.getFinancialDashboard).mockRejectedValueOnce(new ApiError(status, "detalhe privado"));
  render(<AdminFinancial />);
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain(status === 401 ? "Sua sessão expirou" : status === 403 ? "não possui acesso administrativo" : "Não foi possível carregar o financeiro");
  expect(screen.queryByText("detalhe privado")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Copa paga")).toBeTruthy();
});

it("carrega todas as páginas de opções e permite recuperar erro dos filtros", async () => {
  vi.mocked(adminService.getLeagues).mockRejectedValueOnce(new Error("offline"));
  render(<AdminFinancial />);
  await screen.findByRole("alert");
  vi.mocked(adminService.listCompetitions).mockResolvedValueOnce({ itens: [option(10, 1, "Primeira")], paginacao: { pagina: 1, limite: 100, total: 101, totalPaginas: 2 } }).mockResolvedValueOnce({ itens: [option(11, 1, "Última")], paginacao: { pagina: 2, limite: 100, total: 101, totalPaginas: 2 } });
  fireEvent.click(screen.getByRole("button", { name: "Tentar carregar filtros novamente" }));
  expect(await screen.findByRole("option", { name: "Última" })).toBeTruthy();
  expect(adminService.listCompetitions).toHaveBeenLastCalledWith({ pagina: 2, limite: 100 });
});

it("ignora resposta atrasada de filtros anteriores", async () => {
  let resolveOld!: (data: AdminFinancialDashboard) => void;
  vi.mocked(adminService.getFinancialDashboard).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
  render(<AdminFinancial />);
  fireEvent.change(screen.getByLabelText("Rodada"), { target: { value: "27" } });
  await screen.findByText("Copa paga");
  resolveOld(response({ itens: [{ ...item, nome: "Resposta antiga" }] }));
  await waitFor(() => expect(screen.queryByText("Resposta antiga")).toBeNull());
});

it.each(["PLAYER", "inactive", "anonymous", "loading"])("rota usa AdminShell e impede consulta para acesso %s", async (mode) => {
  if (mode === "anonymous") auth.user = null;
  else if (mode === "loading") auth.loading = true;
  else auth.user = { tipoUsuario: mode === "PLAYER" ? "PLAYER" : "PLATFORM_ADMIN", status: mode === "inactive" ? "INATIVO" : "ATIVO", nome: "Usuário" };
  render(<AdminLayout><AdminFinancialPage /></AdminLayout>);
  expect(adminService.getFinancialDashboard).not.toHaveBeenCalled();
  expect(screen.queryByRole("heading", { name: "Financeiro" })).toBeNull();
  if (mode !== "loading") await waitFor(() => expect(auth.replace).toHaveBeenCalledWith("/dashboard"));
});

it("integra rota e menu ao shell para admin ativo", async () => {
  render(<AdminLayout><AdminFinancialPage /></AdminLayout>);
  await screen.findByRole("heading", { name: "Financeiro" });
  expect(screen.getByRole("link", { name: "Financeiro" }).getAttribute("href")).toBe("/admin/financeiro");
  fireEvent.click(screen.getByRole("button", { name: "Abrir menu administrativo" }));
  expect(screen.getByRole("button", { name: "Fechar menu administrativo" })).toBeTruthy();
  const link = screen.getByRole("link", { name: "Financeiro" });
  link.addEventListener("click", (event) => event.preventDefault(), { once: true });
  fireEvent.click(link);
  expect(screen.queryByRole("button", { name: "Fechar menu administrativo" })).toBeNull();
  await screen.findByText("Copa paga");
});
