# POINT FFC Fantasy — Fase 1C

Implementação em `codex/point-fantasy-athlete-catalog`, criada a partir da `main` local. Auditoria e validação: 15/10/2026. Sem commit, push, merge ou deploy.

## Auditoria e preservação

- Repositório confirmado: `pitersonranyer/UI-POINTFFC`. Árvore inicialmente limpa; nenhuma alteração preexistente removida.
- A branch solicitada e a experimental `codex/pointffc-fantasy-uniformes-escudos` não estavam nas referências locais/remotas disponíveis. Não houve merge nem reaproveitamento da experimental. Não foi feito fetch; essa constatação não cobre referências ainda não baixadas.
- Não foram encontrados arquivos AGENTS.md na árvore pesquisada do projeto.
- Next.js 13.5.11, App Router, React 18, TypeScript, CSS Modules, Vitest/jsdom. Mantidos `output: "export"` e `trailingSlash: true`.
- POC existente: `src/app/fantasy/layout.tsx`, `src/app/fantasy/partidas/[fixtureId]/page.tsx`, componentes em `src/components/fantasy`, tipos em `src/types/fantasy.ts` e mocks em `src/mocks/fantasy`. Rota exportada existente: `/fantasy/partidas/1180729/`. Todos preservados sem alterações.
- Não existia conflito em `/point-fantasy/atletas/`. A nova página é pública, estática e carrega dados no cliente, sem AuthGuard.
- `apiFetch` reutilizado, com `NEXT_PUBLIC_API_URL`, erros HTTP e sinal de cancelamento. Não envia token de autenticação nas novas consultas públicas.
- Navegação inspecionada e preservada; a nova página é acessível diretamente em `/point-fantasy/atletas/`. Nenhum módulo de ligas, desafios, carteira ou Cartola foi alterado.

## Arquivos criados

- `src/app/point-fantasy/atletas/page.tsx`
- `src/types/pointFantasy.ts`
- `src/services/pointFantasyService.ts`
- `src/services/pointFantasyService.test.ts`
- `src/components/point-fantasy/uniforms/clubUniforms.ts`
- `src/components/point-fantasy/uniforms/UniformPattern.tsx`
- `src/components/point-fantasy/uniforms/ClubJersey.tsx`
- `src/components/point-fantasy/uniforms/ClubShield.tsx`
- `src/components/point-fantasy/athletes/FantasyAthleteCatalog.tsx`
- `src/components/point-fantasy/athletes/FantasyAthleteFilters.tsx`
- `src/components/point-fantasy/athletes/FantasyAthleteRow.tsx`
- `src/components/point-fantasy/athletes/FantasyAthleteCatalog.module.css`
- `src/components/point-fantasy/athletes/FantasyAthleteCatalog.test.tsx`
- Este relatório.

Nenhum arquivo preexistente foi modificado.

## SVGs e clubes

`ClubJersey` e `ClubShield` compartilham `clubUniforms` e `UniformPattern`. Aceitam ID numérico, tamanho, classe CSS e modo decorativo. Têm nomes acessíveis quando usados isoladamente, clipPaths exclusivos por instância e fallback neutro `FFC` para IDs desconhecidos. Não usam imagens, escudos ou vetores de terceiros. Estão disponíveis para reutilização futura sem dependência da página do catálogo.

IDs, siglas e participação dos 20 clubes foram confirmados por SELECT via Prisma no MySQL local, no catálogo 2026/31/1, ID 3, com 787 atletas. A consulta não alterou banco nem backend. Essa identificação serve como evidência de configuração; ID, rodada e versão não estão fixados na lógica de seleção do frontend.

| ID | Clube | Sigla | Primária / secundária / adicional | Padrão |
|---:|---|---|---|---|
| 262 | Flamengo | FLA | #c92332 / #17191c | Horizontal |
| 263 | Botafogo | BOT | #17191c / #ffffff | Vertical |
| 264 | Corinthians | COR | #ffffff / #17191c | Liso |
| 265 | Bahia | BAH | #ffffff / #1563b8 / #d32c36 | Vertical tricolor |
| 266 | Fluminense | FLU | #781f3a / #17694d / #ffffff | Vertical tricolor |
| 267 | Vasco | VAS | #17191c / #ffffff | Diagonal |
| 275 | Palmeiras | PAL | #146340 / #ffffff | Liso |
| 276 | São Paulo | SAO | #ffffff / #d32c36 / #17191c | Faixa dupla no peito |
| 277 | Santos | SAN | #ffffff / #17191c | Liso |
| 280 | RB Bragantino | RBB | #ffffff / #d32c36 | Liso |
| 282 | Atlético-MG | CAM | #17191c / #ffffff | Vertical |
| 283 | Cruzeiro | CRU | #1749a0 / #ffffff | Liso |
| 284 | Grêmio | GRE | #3098d0 / #17191c / #ffffff | Vertical tricolor |
| 285 | Internacional | INT | #c92332 / #ffffff | Liso |
| 287 | Vitória | VIT | #c92332 / #17191c | Horizontal |
| 293 | Athletico-PR | CAP | #c92332 / #17191c | Diagonal |
| 294 | Coritiba | CFC | #ffffff / #146340 | Faixa no peito |
| 315 | Chapecoense | CHA | #16824d / #ffffff | Liso |
| 364 | Remo | REM | #18274d / #ffffff | Liso |
| 2305 | Mirassol | MIR | #f3ce36 / #217347 | Liso |

Não há divergência entre as siglas visuais configuradas e as recebidas na captura. As cores são escolhas ilustrativas; não são especificações oficiais de fabricação dos uniformes.

## Contratos consumidos

Contratos conferidos no código local de `Api-Pointffc/src/point-fantasy` e no schema Prisma:

- `GET /point-fantasy/catalogos?page=N&limit=100`: `{ items, total, page, limit }`. Catálogo: `id`, `temporada`, `rodada`, `versao`, `status`, `capturadoEm`, `congeladoEm`, `criadoEm`.
- `GET /point-fantasy/catalogos/:id/atletas?page=N&limit=100`: mesmo envelope. Atleta: `id`, `catalogoId`, `atletaIdExterno`, `clubeIdExterno`, `posicaoId`, `statusId`, `apelido`, `precoCartola`, `categoriaId`, `pointcoins`.
- `GET /point-fantasy/catalogos/:id/clubes` e `/posicoes`: `{ items: [{ id, dados }] }`. Usados `dados.nome` e `dados.abreviacao`; imagens presentes nas referências não são usadas.
- Categoria 1 = Bronze, 2 = Prata, 3 = Ouro. Posição 6 = técnico, conforme validação do próprio backend. Técnicos não exibem categoria, mesmo que recebam uma categoria inesperada. `pointcoins` é exibido literalmente, sem recálculo ou orçamento máximo.
- O endpoint de atletas não fornece nome civil. A busca cobre o apelido retornado, ignorando caixa e acentos. Para buscar também o nome civil, o contrato precisará fornecê-lo em fase futura.
- Não há consumo de endpoints de competições nesta tela; não são necessários ao catálogo. Nenhuma chamada ao Cartola ou à API-Football foi introduzida.

## Seleção, filtros e paginação

Todos os catálogos disponíveis são carregados em páginas de até 100. A seleção inicial é determinística: temporada, rodada e versão decrescentes, com ID decrescente como desempate. O seletor permite trocar de versão/rodada.

O DTO atual de atletas aceita apenas `page` e `limit`. Por isso, atletas são carregados em páginas sequenciais e referências em paralelo, uma vez por seleção. Só depois de completar o conjunto a interface libera os filtros locais. Há paginação visual de 30 registros após a filtragem, com reset para a primeira página quando os filtros mudam.

Busca, clube, posição, categoria e inclusão de técnicos combinam-se sobre todo o conjunto carregado. Categoria específica exclui técnicos. Limpar filtros restaura a inclusão de técnicos.

AbortController cancela os pedidos na troca de catálogo ou desmontagem. A renderização protege pelo ID selecionado e ignora respostas atrasadas. Falhas não expõem resultados parciais; retry refaz a descoberta. Totais inconsistentes, páginas incompletas, IDs duplicados ou atletas pertencentes a outro catálogo geram erro recuperável. Estados vazios e carregamento são explícitos. Não há polling nem requisições causadas pelos filtros.

## Validação

- `npm run test -- --maxWorkers=2 --minWorkers=1`: **65 arquivos, 764 testes aprovados**, incluindo 21 testes novos e a suíte da POC. Workers limitados para reduzir concorrência de processos durante o build.
- `npm run typecheck`: aprovado.
- `npm run lint`: a execução padrão inicialmente falhou pela proteção preexistente de URL pública no `next.config.mjs` quando `.env.local` aponta para localhost. Reexecutado com `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com` definido somente no processo: aprovado, com avisos preexistentes de imagens e hooks em arquivos não alterados.
- `npm run build`: aprovado; 46 páginas geradas e nova rota estática `/point-fantasy/atletas`. Permanecem avisos preexistentes de CSS, imagens e renderização cliente em outras rotas.
- Edge headless/Playwright sobre `out`: larguras 390 e 1280 px, sem overflow horizontal e sem erros JavaScript. Respostas HTTP interceptadas exclusivamente no teste, usando cópia de leitura do catálogo real: 787 atletas, 20 técnicos, busca por atleta do fim do catálogo e oito páginas HTTP de atletas por carregamento. Essa validação é de interface com fixture, não integração HTTP real.
- Inspeção visual da captura mobile: camisetas, identificação, categorias, filtros e paginação presentes em layout compacto. SVGs não dependem de recursos externos.
- Arquivos da POC e demais módulos existentes preservados; `git diff --check` sem erros.

## Pendências e riscos para a próxima fase

1. A API HTTP em `http://localhost:3001` recusou conexão. A integração ponta a ponta frontend → backend local **não foi validada**. O critério de aceite da integração real permanece pendente, apesar da confirmação do banco por leitura e dos testes de interface. Não foi iniciado o backend, cujo bootstrap executa migrations automaticamente, para preservar a restrição de não alterar banco/backend.
2. Quando a API local estiver ativa, confirmar os quatro endpoints, CORS para a origem do frontend, os totais e a navegação entre catálogos no navegador. Não presumir que a captura já esteja disponível no Render.
3. O catálogo CAPTURADO ainda não está congelado. Se a API mudar totais durante paginação, a tela exige recarregamento; não mistura o resultado parcial.
4. O carregamento completo mantém os filtros corretos para o volume atual (787 atletas), mas usa memória proporcional ao catálogo. Crescimento grande justifica filtros reais no backend em trabalho futuro autorizado.
5. O contrato não inclui nome civil; a busca atual é por apelido. O acesso à nova página é direto, sem alteração dos menus existentes.

Diagnóstico: catálogo visual e exportação estática implementados e verificados; integração HTTP local permanece pendente. Campinho, escalações, inscrições, pagamentos e demais funcionalidades da Fase 2 não foram implementados.
