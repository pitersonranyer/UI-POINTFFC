import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { adminDesafioService as service, type AdminDesafio, type DesafioPartida, type DesafioFixture } from "@/services/adminDesafioService";
import { ApiError } from "@/services/apiClient";
import { AdminDesafios } from "./AdminDesafios";
import { DesafioEditor } from "./DesafioEditor";
import { formPayload, fromDesafio } from "./desafioForm";
import { shortcutPeriod, validPeriod } from "./fixturePeriod";
import { displayDate } from "./desafioForm";

const nav = vi.hoisted(() => ({ replace: vi.fn(), query: "id=7" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: nav.replace }), useSearchParams: () => new URLSearchParams(nav.query) }));
vi.mock("@/services/adminDesafioService", () => ({ adminDesafioService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), publish: vi.fn(), cancel: vi.fn(), fixtures: vi.fn(), matches: vi.fn(), addMatch: vi.fn(), removeMatch: vi.fn(), reorder: vi.fn() } }));
const desafio: AdminDesafio = { id: 7, nome: "Desafio POINT", descricao: null, tipoAcesso: "FREE", valorInscricao: "0.00", inicioInscricao: "2099-10-01T12:00:00.000Z", fimInscricao: "2099-10-02T12:00:00.000Z", dataInicio: "2099-10-03T12:00:00.000Z", dataFim: "2099-10-04T23:00:00.000Z", limiteParticipantes: null, status: "RASCUNHO", criadoPorId: 1, criadoPor: { idUsuario: 1, nome: "Admin" }, publicadoEm: null, criadoEm: "2026-09-29T12:00:00.000Z", atualizadoEm: "2026-09-29T12:00:00.000Z" };
const first: DesafioPartida = { id: 14, desafioId: 7, fixtureIdApiFootball: 123456, leagueIdApiFootball: 2013, nomeCompeticao: "Brasileirão", nomeMandante: "Flamengo", nomeVisitante: "Palmeiras", logoMandanteUrl: null, logoVisitanteUrl: null, dataInicio: "2099-10-03T19:00:00.000Z", status: "AGENDADA", ordem: 1 };
const second: DesafioPartida = { ...first, id: 11, fixtureIdApiFootball: 654321, nomeMandante: "Grêmio", nomeVisitante: "Corinthians", ordem: 2 };
beforeEach(() => {
  vi.stubGlobal("React", React); vi.resetAllMocks(); nav.query = "id=7";
  vi.mocked(service.get).mockResolvedValue(desafio);
  vi.mocked(service.matches).mockResolvedValue([first]);
  vi.mocked(service.list).mockResolvedValue({ itens: [desafio], paginacao: { pagina: 1, limite: 20, total: 21, totalPaginas: 2 } });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

it("envia somente dados básicos, normaliza FREE e valida valor/limites", () => {
  const form = fromDesafio({ ...desafio, dataInicio: "2099-10-03T12:42:37.125Z" });
  expect(formPayload(form)).not.toHaveProperty("dataInicio");
  expect(formPayload({ ...form, valorInscricao: "99" }).valorInscricao).toBe("0.00");
  expect(formPayload({ ...form, tipoAcesso: "PAGO", valorInscricao: "2,50" }).valorInscricao).toBe("2.50");
  for (const value of ["0", "-1", "2.001", "NaN", "10000000000"]) expect(() => formPayload({ ...form, tipoAcesso: "PAGO", valorInscricao: value })).toThrow();
  expect(() => formPayload({ ...form, limiteParticipantes: "1.5" })).toThrow();
});
it("lista com filtros reais e paginação", async () => {
  render(<AdminDesafios />);
  await screen.findByText("Desafio POINT");
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ABERTO" } });
  fireEvent.change(screen.getByLabelText("Acesso"), { target: { value: "PAGO" } });
  fireEvent.click(button("Filtrar"));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith({ pagina: 1, limite: 20, status: "ABERTO", tipoAcesso: "PAGO" }));
  await screen.findByText("Desafio POINT");
  fireEvent.click(button("Próxima página"));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith({ pagina: 2, limite: 20, status: "ABERTO", tipoAcesso: "PAGO" }));
});
it("cria e encaminha à configuração das partidas", async () => {
  vi.mocked(service.create).mockResolvedValue(desafio);
  render(<DesafioEditor mode="create" />);
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Desafio POINT" } });
  expect(screen.queryByLabelText("Valor da inscrição (R$)")).toBeNull();
  expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
  fireEvent.click(button("Criar e selecionar partidas"));
  await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/admin/desafios/editar?id=7&criado=1"));
  expect(service.create).toHaveBeenCalledWith({ nome: "Desafio POINT", descricao: null, tipoAcesso: "FREE", valorInscricao: "0.00", limiteParticipantes: null });
});
it("busca, identifica duplicadas, adiciona, reordena e remove sem IDs inventados", async () => {
  vi.mocked(service.fixtures).mockResolvedValue([first, second].map(item => ({ fixtureId: item.fixtureIdApiFootball, leagueId: 2013, leagueNome: item.nomeCompeticao, dataHoraInicio: item.dataInicio, mandanteId: 1, visitanteId: 2, mandanteNome: item.nomeMandante, visitanteNome: item.nomeVisitante, mandanteLogo: null, visitanteLogo: null, horarioConfirmado: true, statusInterno: "AGENDADA" })));
  vi.mocked(service.addMatch).mockResolvedValue(second);
  vi.mocked(service.reorder).mockResolvedValue([{ ...second, ordem: 1 }, { ...first, ordem: 2 }]);
  vi.mocked(service.removeMatch).mockResolvedValue([{ ...first, ordem: 1 }]);
  render(<DesafioEditor mode="edit" />);
  await screen.findByText("Partidas do Desafio (1)");
  fireEvent.click(button("Buscar"));
  expect(await screen.findByRole("button", { name: "Já adicionada: Flamengo x Palmeiras" })).toHaveProperty("disabled", true);
  expect(service.fixtures).toHaveBeenCalledWith(shortcutPeriod("Hoje"));
  fireEvent.click(button("Adicionar: Grêmio x Corinthians"));
  await screen.findByText("Partidas do Desafio (2)");
  await waitFor(() => expect(button("Subir Grêmio x Corinthians").disabled).toBe(false));
  expect(service.addMatch).toHaveBeenCalledWith(7, 654321);
  fireEvent.click(button("Subir Grêmio x Corinthians"));
  await waitFor(() => expect(service.reorder).toHaveBeenCalledWith(7, [11, 14]));
  await waitFor(() => expect(within(screen.getByRole("list", { name: "Partidas selecionadas" })).getAllByRole("listitem")[0].textContent).toContain("Grêmio"));
  await waitFor(() => expect(button("Descer Grêmio x Corinthians").disabled).toBe(false));
  vi.mocked(service.reorder).mockResolvedValue([first, second]);
  fireEvent.click(button("Descer Grêmio x Corinthians"));
  await waitFor(() => expect(service.reorder).toHaveBeenLastCalledWith(7, [14, 11]));
  await waitFor(() => expect(within(screen.getByRole("list", { name: "Partidas selecionadas" })).getAllByRole("listitem")[0].textContent).toContain("Flamengo"));
  await waitFor(() => expect(button("Remover Grêmio x Corinthians").disabled).toBe(false));
  fireEvent.click(button("Remover Grêmio x Corinthians"));
  await screen.findByText("Partidas do Desafio (1)");
  expect(service.removeMatch).toHaveBeenCalledWith(7, 11);
  await waitFor(() => expect(service.get).toHaveBeenCalledTimes(3));
});
it("exige salvar antes de publicar, confirma e bloqueia edição após sucesso", async () => {
  vi.mocked(service.update).mockResolvedValue({ ...desafio, nome: "Novo nome" });
  vi.mocked(service.publish).mockResolvedValue({ ...desafio, nome: "Novo nome", status: "ABERTO", inicioInscricao: "2026-09-30T12:00:00Z", fimInscricao: first.dataInicio, dataInicio: first.dataInicio });
  render(<DesafioEditor mode="edit" />);
  await screen.findByDisplayValue("Desafio POINT");
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo nome" } });
  expect(button("Publicar Desafio").disabled).toBe(true);
  fireEvent.click(button("Salvar alterações"));
  await screen.findByText("Alterações salvas com sucesso.");
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  fireEvent.click(button("Publicar Desafio"));
  expect(service.publish).not.toHaveBeenCalled();
  fireEvent.click(button("Publicar Desafio"));
  await screen.findByText("Status: Aberto");
  expect(service.publish).toHaveBeenCalledWith(7);
  expect((screen.getByLabelText("Nome").closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  expect(screen.queryByRole("button", { name: /Remover Flamengo/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Publicar Desafio" })).toBeNull();
  expect(service.matches).toHaveBeenCalledTimes(2);
  const period = within(screen.getByRole("region", { name: "Período do Desafio" }));
  expect(period.getAllByText(displayDate(first.dataInicio))).toHaveLength(3);
  expect(period.getByText(`Inscrições abertas em: ${displayDate("2026-09-30T12:00:00Z")}`)).toBeTruthy();
});
it("mantém rascunho em falha de publicação e reflete cancelamento", async () => {
  vi.mocked(service.publish).mockRejectedValue(new ApiError(400, "Partida fora do período."));
  vi.mocked(service.cancel).mockResolvedValue({ ...desafio, status: "CANCELADO" });
  render(<DesafioEditor mode="edit" />);
  await screen.findByText("Partidas do Desafio (1)");
  fireEvent.click(button("Publicar Desafio"));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Partida fora do período.");
  expect(screen.getByText("Status: Rascunho")).toBeTruthy();
  fireEvent.click(button("Cancelar Desafio"));
  await screen.findByText("Status: Cancelado");
  expect(service.cancel).toHaveBeenCalledWith(7);
  expect(screen.queryByRole("button", { name: "Cancelar Desafio" })).toBeNull();
});
it("reconcilia conflito com publicação em outra sessão", async () => {
  vi.mocked(service.update).mockRejectedValue(new ApiError(409, "Operacao permitida somente em RASCUNHO."));
  render(<DesafioEditor mode="edit" />);
  await screen.findByDisplayValue("Desafio POINT");
  vi.mocked(service.get).mockResolvedValue({ ...desafio, status: "ABERTO" });
  fireEvent.click(button("Salvar alterações"));
  await screen.findByText("Status: Aberto");
  expect(screen.queryByRole("button", { name: "Salvar alterações" })).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("RASCUNHO");
});
it.each([401, 403])("trata %s sem liberar formulário", async status => {
  vi.mocked(service.get).mockRejectedValue(new ApiError(status));
  render(<DesafioEditor mode="edit" />);
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", status === 401 ? "Sua sessão expirou. Entre novamente para continuar." : "Seu usuário não possui permissão para esta operação.");
  expect(screen.queryByLabelText("Nome")).toBeNull();
});
it("mostra vazio e permite tentar novamente após erro", async () => {
  vi.mocked(service.list).mockRejectedValueOnce(new ApiError(0)).mockResolvedValueOnce({ itens: [], paginacao: { pagina: 1, limite: 20, total: 0, totalPaginas: 0 } });
  render(<AdminDesafios />);
  await screen.findByRole("alert");
  fireEvent.click(button("Tentar novamente"));
  expect(await screen.findByText("Nenhum desafio encontrado.")).toBeTruthy();
});

it("cria PAGO com valor e limite opcionais sem datas e oculta valor ao voltar para FREE", async () => {
  vi.mocked(service.create).mockResolvedValue(desafio);
  render(<DesafioEditor mode="create" />);
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Copa paga" } });
  fireEvent.change(screen.getByLabelText("Acesso"), { target: { value: "PAGO" } });
  fireEvent.change(screen.getByLabelText("Valor da inscrição (R$)"), { target: { value: "2,50" } });
  fireEvent.change(screen.getByLabelText("Acesso"), { target: { value: "FREE" } });
  expect(screen.queryByLabelText("Valor da inscrição (R$)")).toBeNull();
  fireEvent.change(screen.getByLabelText("Acesso"), { target: { value: "PAGO" } });
  fireEvent.change(screen.getByLabelText("Valor da inscrição (R$)"), { target: { value: "2,50" } });
  fireEvent.change(screen.getByLabelText("Limite de participantes"), { target: { value: "30" } });
  fireEvent.click(button("Criar e selecionar partidas"));
  await waitFor(() => expect(service.create).toHaveBeenCalledWith({ nome: "Copa paga", descricao: null, tipoAcesso: "PAGO", valorInscricao: "2.50", limiteParticipantes: 30 }));
});

it.each([
  ["Hoje", "2026-09-30", "2026-09-30"],
  ["Amanhã", "2026-10-01", "2026-10-01"],
  ["Próximos 3 dias", "2026-09-30", "2026-10-02"],
  ["Fim de semana", "2026-10-03", "2026-10-04"],
])("atalho %s consulta somente as datas inclusivas", async (name, dataInicial, dataFinal) => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
  vi.mocked(service.fixtures).mockResolvedValue([]);
  render(<DesafioEditor mode="edit" />);
  await screen.findByText("Buscar partidas");
  fireEvent.click(button(name));
  expect(screen.queryByLabelText("De")).toBeNull();
  expect(screen.queryByLabelText("ID da competição")).toBeNull();
  expect(screen.queryByLabelText("Temporada")).toBeNull();
  fireEvent.click(button("Buscar"));
  await waitFor(() => expect(service.fixtures).toHaveBeenCalledWith({ dataInicial, dataFinal }));
  await screen.findByText("Nenhuma partida encontrada para os filtros informados.");
});

it("calcula virada de ano e fim de semana em sábado/domingo sem buscar dias passados", () => {
  expect(shortcutPeriod("Próximos 3 dias", new Date("2026-12-31T23:00:00Z"))).toEqual({ dataInicial: "2026-12-31", dataFinal: "2027-01-02" });
  expect(shortcutPeriod("Fim de semana", new Date("2026-10-03T12:00:00Z"))).toEqual({ dataInicial: "2026-10-03", dataFinal: "2026-10-04" });
  expect(shortcutPeriod("Fim de semana", new Date("2026-10-04T12:00:00Z"))).toEqual({ dataInicial: "2026-10-04", dataFinal: "2026-10-04" });
  expect(validPeriod({ dataInicial: "2026-02-30", dataFinal: "2026-03-01" })).toBe(false);
});

it("personalizado aceita sete dias e impede oito dias ou datas invertidas", async () => {
  vi.mocked(service.fixtures).mockResolvedValue([]);
  render(<DesafioEditor mode="edit" />);
  await screen.findByText("Buscar partidas");
  fireEvent.click(button("Personalizado"));
  fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-01" } });
  for (const dataFinal of ["2026-10-08", "2026-09-30"]) {
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: dataFinal } });
    fireEvent.click(button("Buscar"));
    expect(screen.getByRole("alert").textContent).toContain("até sete dias");
    expect(service.fixtures).not.toHaveBeenCalled();
  }
  fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-07" } });
  fireEvent.click(button("Buscar"));
  await waitFor(() => expect(service.fixtures).toHaveBeenCalledWith({ dataInicial: "2026-10-01", dataFinal: "2026-10-07" }));
  await screen.findByText("Nenhuma partida encontrada para os filtros informados.");
});

const fixture: DesafioFixture = { fixtureId: 900001, leagueId: 2013, leagueNome: "Brasileirão", dataHoraInicio: "2099-10-03T19:00:00Z", mandanteId: 1, visitanteId: 2, mandanteNome: "Flamengo", visitanteNome: "Cruzeiro", mandanteLogo: "/escudo.png", visitanteLogo: null, horarioConfirmado: true, statusInterno: "AGENDADA" };

it("agrupa datas e competições em ordem de horário e mostra escudos sem IDs", async () => {
  vi.mocked(service.fixtures).mockResolvedValue([
    { ...fixture, fixtureId: 900004, dataHoraInicio: "2099-10-04T19:00:00Z" },
    { ...fixture, fixtureId: 900003, mandanteNome: "Palmeiras", dataHoraInicio: "2099-10-03T21:30:00Z" },
    { ...fixture, fixtureId: 900002, leagueId: 2021, leagueNome: "Premier League", mandanteNome: "Arsenal", visitanteNome: "Chelsea", dataHoraInicio: "2099-10-03T16:00:00Z" },
    fixture,
  ]);
  render(<DesafioEditor mode="edit" />); await screen.findByText("Buscar partidas");
  fireEvent.click(button("Buscar"));
  const results = await screen.findByRole("region", { name: "Resultados da busca" });
  const day = within(results).getByRole("region", { name: "2099-10-03" });
  const brazil = within(day).getByRole("region", { name: "Brasileirão" });
  expect(within(brazil).getAllByRole("listitem").map(row => row.textContent)).toEqual([expect.stringContaining("19:00"), expect.stringContaining("21:30")]);
  expect(within(day).getByRole("region", { name: "Premier League" }).textContent).toContain("Arsenal");
  expect(within(results).getByRole("region", { name: "2099-10-04" })).toBeTruthy();
  const logos = results.querySelectorAll('img[alt=""]');
  expect(logos).toHaveLength(4);
  fireEvent.error(logos[0]);
  expect(results.querySelectorAll('img[alt=""]')).toHaveLength(3);
  expect(results.textContent).not.toMatch(/900001|2013|2021/);
});

it.each([
  [{ horarioConfirmado: false }, "Horário não confirmado"],
  [{ statusInterno: "EM_ANDAMENTO" }, "Em andamento"],
  [{ statusInterno: "FINALIZADA" }, "Finalizada"],
  [{ statusInterno: "ANULADA" }, "Anulada, adiada ou suspensa"],
  [{ statusInterno: null }, "Estado indisponível"],
  [{ dataHoraInicio: "2000-01-01T12:00:00Z" }, "Horário de início já passou"],
] as [Partial<DesafioFixture>, string][])("mantém inelegível identificável e sem inclusão: %j", async (changes, reason) => {
  vi.mocked(service.fixtures).mockResolvedValue([{ ...fixture, ...changes }]);
  render(<DesafioEditor mode="edit" />); await screen.findByText("Buscar partidas");
  fireEvent.click(button("Buscar"));
  const add = await screen.findByRole("button", { name: "Adicionar: Flamengo x Cruzeiro" });
  expect(add).toHaveProperty("disabled", true);
  expect(screen.getByText(`Indisponível: ${reason}.`)).toBeTruthy();
  fireEvent.click(add); expect(service.addMatch).not.toHaveBeenCalled();
});

it("atualiza período com detalhe do backend após composição, preservando dados básicos não salvos", async () => {
  vi.mocked(service.fixtures).mockResolvedValue([fixture]);
  vi.mocked(service.addMatch).mockResolvedValue(second);
  vi.mocked(service.removeMatch).mockResolvedValue([first]);
  render(<DesafioEditor mode="edit" />); await screen.findByText("Buscar partidas");
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Edição pendente" } });
  fireEvent.click(button("Buscar")); await screen.findByRole("button", { name: "Adicionar: Flamengo x Cruzeiro" });
  const refreshed = { ...desafio, fimInscricao: "2099-10-02T10:15:00Z", dataInicio: "2099-10-02T10:15:00Z" };
  vi.mocked(service.get).mockResolvedValue(refreshed);
  fireEvent.click(button("Adicionar: Flamengo x Cruzeiro"));
  await screen.findByText("Partida adicionada.");
  expect(screen.getByLabelText("Nome")).toHaveProperty("value", "Edição pendente");
  const period = within(screen.getByRole("region", { name: "Período do Desafio" }));
  expect(period.getByText("Período definido automaticamente pelas partidas")).toBeTruthy();
  expect(period.getAllByText(displayDate(refreshed.fimInscricao))).toHaveLength(2);
  expect(period.getByText("Inscrições abertas ao publicar")).toBeTruthy();
  vi.mocked(service.get).mockResolvedValue({ ...refreshed, fimInscricao: first.dataInicio, dataInicio: first.dataInicio });
  fireEvent.click(button("Remover Grêmio x Corinthians"));
  await screen.findByText("Partida removida.");
  expect(period.getAllByText(displayDate(first.dataInicio))).toHaveLength(3);
  expect(service.update).not.toHaveBeenCalled();
});

it("bloqueia publicação se a composição salvar mas a atualização do período falhar", async () => {
  vi.mocked(service.removeMatch).mockResolvedValue([second]);
  render(<DesafioEditor mode="edit" />); await screen.findByText("Buscar partidas");
  vi.mocked(service.get).mockRejectedValue(new Error("offline"));
  fireEvent.click(button("Remover Flamengo x Palmeiras"));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Partidas salvas, mas não foi possível atualizar o período. Recarregue o Desafio antes de continuar.");
  expect(button("Publicar Desafio").disabled).toBe(true);
  expect(screen.getByText("Atualize o Desafio para consultar o período.")).toBeTruthy();
  vi.mocked(service.get).mockResolvedValue(desafio);
  fireEvent.click(button("Recarregar Desafio"));
  await screen.findByText("Buscar partidas");
  expect(button("Publicar Desafio").disabled).toBe(false);
});

it("exibe período antigo sem recriar campos ou reenviar datas ao editar", async () => {
  vi.mocked(service.update).mockResolvedValue({ ...desafio, nome: "Antigo renomeado" });
  render(<DesafioEditor mode="edit" />); await screen.findByDisplayValue(desafio.nome);
  expect(screen.getByText("Período registrado do Desafio")).toBeTruthy();
  expect(screen.getByText(new RegExp(`Fim registrado:`))).toHaveProperty("textContent", expect.stringContaining(displayDate(desafio.dataFim)));
  expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Antigo renomeado" } });
  fireEvent.click(button("Salvar alterações"));
  await screen.findByText("Alterações salvas com sucesso.");
  expect(service.update).toHaveBeenCalledWith(7, { nome: "Antigo renomeado", descricao: null, tipoAcesso: "FREE", valorInscricao: "0.00", limiteParticipantes: null });
});

it("mostra resumo antes da publicação e impede publicar sem partidas", async () => {
  vi.mocked(service.get).mockResolvedValue({ ...desafio, tipoAcesso: "PAGO", valorInscricao: "2.50" });
  vi.mocked(service.removeMatch).mockResolvedValue([]);
  render(<DesafioEditor mode="edit" />); await screen.findByText("Buscar partidas");
  const summary = screen.getByLabelText("Resumo da publicação");
  expect(summary.textContent).toContain("1 partida selecionada");
  expect(summary.textContent).toMatch(/R\$\s*2,50/);
  expect(summary.textContent).toContain(displayDate(desafio.fimInscricao));
  fireEvent.click(button("Remover Flamengo x Palmeiras"));
  await screen.findByText("Partida removida.");
  expect(button("Publicar Desafio").disabled).toBe(true);
  expect(screen.queryByRole("region", { name: "Período do Desafio" })).toBeNull();
});
