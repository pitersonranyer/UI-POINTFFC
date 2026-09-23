"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminCompetition, type AdminFinancialDashboard, type AdminFinancialFilters, type AdminFinancialItem, type AdminLeague } from "@/services/adminService";
import { Pagination } from "./CompetitionList";
import { statusLabel } from "./adminFormat";
import styles from "./Admin.module.css";
import financial from "./AdminFinancial.module.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
export const financialMoney = (value: string) => currency.format(Number(value));
const errorMessage = (cause: unknown) => cause instanceof ApiError && cause.status === 401
  ? "Sua sessão expirou. Entre novamente para continuar."
  : cause instanceof ApiError && cause.status === 403 ? "Seu usuário não possui acesso administrativo."
    : "Não foi possível carregar o financeiro. Tente novamente.";

function Tax({ tax }: { tax: AdminFinancialItem["taxaPlataforma"] }) {
  if (tax.tipo === null || tax.valor === null) return <>Sem taxa</>;
  return tax.tipo === "PERCENTUAL" ? <>{number.format(Number(tax.valor))}%</>
    : <>{financialMoney(tax.valor)}<small>por inscrição</small></>;
}

export function AdminFinancial() {
  const [filters, setFilters] = useState<AdminFinancialFilters>({ pagina: 1, limite: 20 });
  const [data, setData] = useState<AdminFinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [leagues, setLeagues] = useState<AdminLeague[]>([]);
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsRetry, setOptionsRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError(null);
    async function loadOptions() {
      const [leagueOptions, first] = await Promise.all([
        adminService.getLeagues(), adminService.listCompetitions({ pagina: 1, limite: 100 }),
      ]);
      const all = [...first.itens];
      for (let page = 2; page <= first.paginacao.totalPaginas; page++) {
        if (!active) return;
        const next = await adminService.listCompetitions({ pagina: page, limite: 100 });
        all.push(...next.itens);
      }
      if (active) { setLeagues(leagueOptions); setCompetitions(all); }
    }
    void loadOptions().catch((cause: unknown) => { if (active) setOptionsError(errorMessage(cause)); })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, [optionsRetry]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void adminService.getFinancialDashboard(filters)
      .then((response) => { if (active) setData(response); })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, retry]);

  function changeFilter(key: "ligaId" | "competicaoId" | "rodada", value: string) {
    const selected = value === "" ? undefined : Number(value);
    if (selected !== undefined && (!Number.isInteger(selected) || selected < 1 || (key === "rodada" && selected > 255))) return;
    setLoading(true);
    setFilters((previous) => ({ ...previous, [key]: selected, ...(key === "ligaId" ? { competicaoId: undefined } : {}), pagina: 1 }));
  }

  return <>
    <header className={styles.pageHeader}><p>ADMINISTRAÇÃO</p><h1>Financeiro</h1><span>Acompanhe os valores das competições, inscrições, taxas e premiações.</span></header>
    <p className={financial.notice}>Os valores exibidos são previstos/nominais. Ainda não existe vínculo financeiro entre inscrição e débito da carteira.</p>
    <section className={financial.filters} aria-label="Filtros do financeiro">
      <label>Liga<select value={filters.ligaId ?? ""} disabled={optionsLoading || !!optionsError} onChange={(event) => changeFilter("ligaId", event.target.value)}><option value="">Todas as ligas</option>{leagues.map((league) => <option key={league.id} value={league.id}>{league.nome}</option>)}</select></label>
      <label>Competição<select value={filters.competicaoId ?? ""} disabled={optionsLoading || !!optionsError} onChange={(event) => changeFilter("competicaoId", event.target.value)}><option value="">Todas as competições</option>{competitions.filter((item) => !filters.ligaId || item.liga.id === filters.ligaId).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <label>Rodada<input type="number" min="1" max="255" step="1" placeholder="Todas" value={filters.rodada ?? ""} onChange={(event) => changeFilter("rodada", event.target.value)} /></label>
      <button type="button" onClick={() => { setLoading(true); setFilters({ pagina: 1, limite: 20 }); }}>Limpar filtros</button>
    </section>
    {optionsLoading && <p role="status" className={financial.notice}>Carregando opções dos filtros...</p>}
    {optionsError && <div role="alert" className={styles.feedback}><strong>Filtros indisponíveis: {optionsError}</strong><button type="button" onClick={() => setOptionsRetry((value) => value + 1)}>Tentar carregar filtros novamente</button></div>}
    <div aria-busy={loading}>
      {loading ? <div role="status" className={styles.feedback}>Carregando financeiro...</div>
        : error ? <div role="alert" className={styles.feedback}><strong>{error}</strong><button type="button" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button></div>
          : data && <>
            <section className={financial.cards} aria-label="Totalizadores financeiros">
              {[
                ["Total de inscritos", number.format(data.totalizadores.totalInscritos)],
                ["Valor das inscrições", financialMoney(data.totalizadores.valorInscricoes)],
                ["Receita POINT FFC prevista", financialMoney(data.totalizadores.receitaPointPrevista)],
                ["Premiação total prevista", financialMoney(data.totalizadores.premiacaoCalculada)],
              ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </section>
            <section className={styles.listPanel} aria-labelledby="financial-competitions-title">
              <div className={styles.sectionTitle}><h2 id="financial-competitions-title">Competições ({data.totalizadores.quantidadeCompeticoes})</h2></div>
              {data.itens.length === 0 ? <p className={styles.feedback}>Nenhuma competição encontrada para os filtros selecionados.</p> :
                <div className={financial.tableScroll} role="region" aria-label="Tabela financeira das competições" tabIndex={0}>
                  <table className={financial.table}>
                    <thead><tr>{["Liga", "Competição", "Rodada", "Inscritos", "Valor das inscrições", "Taxa POINT FFC", "Receita POINT FFC", "Premiação", "Saldo após premiação", "Status"].map((title) => <th scope="col" key={title}>{title}</th>)}</tr></thead>
                    <tbody>{data.itens.map((item) => <tr key={item.competicaoId}>
                      <td>{item.liga.nome}</td><th scope="row">{item.nome}</th>
                      <td>{item.rodadaInicio === null ? "—" : item.rodadaFim !== null && item.rodadaFim !== item.rodadaInicio ? `${item.rodadaInicio}–${item.rodadaFim}` : item.rodadaInicio}</td>
                      <td><span>{item.inscritos.ativos} ativos</span><small>{item.inscritos.finalizados} finalizados · {item.inscritos.cancelados} cancelados</small></td>
                      <td>{financialMoney(item.financeiro.valorInscricoes)}</td><td><Tax tax={item.taxaPlataforma} /></td>
                      <td>{financialMoney(item.financeiro.receitaPointPrevista)}</td><td>{financialMoney(item.financeiro.premiacaoCalculada)}</td>
                      <td className={Number(item.financeiro.saldoAposPremiacao) < 0 ? financial.deficit : undefined}>{financialMoney(item.financeiro.saldoAposPremiacao)}{Number(item.financeiro.saldoAposPremiacao) < 0 && <small>Déficit previsto</small>}</td>
                      <td><span className={`${styles.status} ${styles[`status${item.status}`]}`}>{statusLabel(item.status)}</span></td>
                    </tr>)}</tbody>
                  </table>
                </div>}
              <Pagination page={data.paginacao.pagina} totalPages={data.paginacao.totalPaginas} onChange={(pagina) => { setLoading(true); setFilters((previous) => ({ ...previous, pagina })); }} />
            </section>
          </>}
    </div>
  </>;
}
