# POINT FFC Fantasy — Fase 2B

Diagnóstico: montagem de rascunhos implementada, com leitura pública validada na API local, 53 testes novos e exportação estática aprovada. A homologação das mutações com uma sessão real de participante permanece pendente. Nenhum commit, push, merge, deploy, alteração de backend, migration ou escrita direta no banco foi realizado.

## Auditoria e branch

- Repositório confirmado: `pitersonranyer/UI-POINTFFC`.
- Base encontrada: `codex/point-fantasy-athlete-catalog`. Branch criada: `codex/point-fantasy-lineup-builder-phase-2b`.
- A Fase 1C estava presente em arquivos não rastreados. Todos foram mantidos na mudança de branch; nenhum commit intermediário foi criado. Assim, esta entrega local contém também os arquivos anteriores ainda não commitados.
- App Router, exportação estática, CSS Modules, apiFetch, AuthContext, AuthGuard, SVGs e testes existentes foram inspecionados. Nenhum AGENTS.md foi encontrado pela pesquisa no projeto.
- Contratos reais conferidos nos arquivos `API-POINTFFC/src/point-fantasy/lineups/{lineup.controller.ts,lineup.dto.ts,lineup.rules.ts,lineup.service.ts,README.md}` e no schema Prisma, sem modificá-los.
- POC `/fantasy/partidas/[fixtureId]/`, autenticação existente, Cartola, ligas, desafios, carteira, PIX e navegação global preservados.

## Arquivos desta fase

Criados:

- `src/app/point-fantasy/escalacoes/page.tsx`
- `src/types/pointFantasyLineup.ts`
- `src/services/pointFantasyLineupService.ts`
- `src/services/pointFantasyLineupService.test.ts`
- `src/components/point-fantasy/lineups/FantasyLineupBuilder.tsx`
- `src/components/point-fantasy/lineups/LineupEditor.tsx`
- `src/components/point-fantasy/lineups/LineupPitch.tsx`
- `src/components/point-fantasy/lineups/LineupAthletePicker.tsx`
- `src/components/point-fantasy/lineups/useLineupEditor.ts`
- `src/components/point-fantasy/lineups/lineupPresentation.ts`
- `src/components/point-fantasy/lineups/LineupBuilder.module.css`
- `src/components/point-fantasy/lineups/LineupBuilder.test.tsx`
- `src/components/point-fantasy/lineups/lineupPresentation.test.ts`
- `src/components/point-fantasy/lineups/lineupTestFixtures.ts` — dados sintéticos exclusivos dos testes; não importados pelo fluxo real.
- Este relatório.

Arquivos da Fase 1C modificados nesta fase:

- `src/app/point-fantasy/atletas/page.tsx`: link para montar escalação.
- `src/services/pointFantasyService.ts`: opção adicional de autenticação no paginador compartilhado; comportamento público preservado.

Os quatro componentes/configurações de uniformes da Fase 1C foram reutilizados sem alteração: ClubJersey, ClubShield, UniformPattern e clubUniforms.

## Rotas e autenticação

Rota nova: `/point-fantasy/escalacoes/`, com metadata noindex, exportação estática e montagem no cliente. A página consulta o AuthContext existente. Enquanto a sessão carrega, mostra estado de verificação; sem autenticação, orienta login em `/login/` e oferece acesso ao catálogo público. Não carrega competição/rascunhos pelo novo fluxo antes da autenticação. A autorização definitiva é da API.

Não foi criado login paralelo nem armazenamento adicional de JWT. apiFetch usa a sessão existente. Requisições privadas não enviam proprietário no corpo. A identificação do usuário funciona como chave do componente para descartar estado de outra sessão. O serviço preserva a sessão em 403 para apresentar a mensagem de conta bloqueada/inativa; 401 continua no fluxo existente de renovação/invalidação.

## APIs

Leituras públicas consumidas:

- GET `/point-fantasy/competicoes?page=N&limit=100`: descobre todas as competições; interface lista somente PUBLICADA.
- GET `/point-fantasy/competicoes/:id`: dados da competição e `partidas` incluídas na resposta real. Não há chamada adicional desnecessária ao endpoint de partidas.
- GET `/point-fantasy/competicoes/:id/atletas?page=N&limit=100`: carrega todos os elegíveis antes de liberar a montagem.
- GET `/point-fantasy/catalogos?page=N&limit=100`: confirma o catálogo vinculado e seu estado de congelamento.
- GET `/point-fantasy/catalogos/:id/clubes` e `/posicoes`: referências do catálogo. Clubes apresentados são restritos aos participantes das partidas.

Respostas são conferidas por catálogo e clube; um atleta incompatível com a competição causa erro, em vez de entrar no seletor. Não há uso do catálogo completo como substituto dos elegíveis.

Mutações e leituras autenticadas:

| Método | Rota | Entrada |
|---|---|---|
| POST | `/point-fantasy/competicoes/:id/escalacoes` | seleção, incluindo formação |
| GET | `/point-fantasy/competicoes/:id/escalacoes/minhas` | page/limit, todas as páginas |
| GET | `/point-fantasy/escalacoes/:id` | retoma a versão atual |
| PATCH | `/point-fantasy/escalacoes/:id` | seleção e `versao` atual |
| POST | `/point-fantasy/escalacoes/:id/duplicar` | `{ versao }` |
| DELETE | `/point-fantasy/escalacoes/:id?versao=N` | versão na query |

Seleção: `{ formacao, titulares, tecnico, reservas, capitaoAtletaId, reservaMagoAtletaId }`. Todos os IDs de atleta são `FANTASY_CATALOGO_ATLETA.id`, nunca `atletaIdExterno`.

Resposta individual real tipada: `{ id, competicaoId, status, versao, criadoEm, atualizadoEm, formacao, titulares, tecnico, reservas, capitaoAtletaId, reservaMagoAtletaId, atletas, validacao }`; `atletas` contém `{ catalogoAtletaId, papel, atleta }`. Listas usam `{ items, total, page, limit }`.

## Campinho e sete formações

| Formação | GOL | LAT | ZAG | MEI | ATA | Reservas por posição |
|---|---:|---:|---:|---:|---:|---|
| 4-3-3 | 1 | 2 | 2 | 3 | 3 | GOL, ZAG, MEI, ATA, LAT |
| 4-4-2 | 1 | 2 | 2 | 4 | 2 | GOL, ZAG, MEI, ATA, LAT |
| 3-5-2 | 1 | 0 | 3 | 5 | 2 | GOL, ZAG, ZAG, MEI, ATA |
| 3-4-3 | 1 | 0 | 3 | 4 | 3 | GOL, ZAG, ZAG, MEI, ATA |
| 4-5-1 | 1 | 2 | 2 | 5 | 1 | GOL, ZAG, MEI, ATA, LAT |
| 5-3-2 | 1 | 2 | 3 | 3 | 2 | GOL, ZAG, MEI, ATA, LAT |
| 5-4-1 | 1 | 2 | 3 | 4 | 1 | GOL, ZAG, MEI, ATA, LAT |

Onze titulares e técnico separado, no canto inferior esquerdo, sem entrar na contagem. Laterais ocupam as extremidades da linha defensiva. Reservas ficam abaixo do campo. Slots abrem seletor com posição fixa e controles acessíveis de substituição e remoção.

Mudança de formação mantém toda a seleção, expõe excedentes e impede salvar uma composição inválida até o ajuste explícito. Não remove atletas silenciosamente. Reservas apresentam categoria e teto preventivo pela menor categoria dos titulares da mesma posição; sem titular, a referência fica pendente, sem impedir salvar um rascunho incompleto. Se uma alteração dos titulares invalida um reserva, o ajuste é sinalizado antes de salvar. O backend continua como autoridade final.

Capitão é escolhido somente entre os titulares e marcado com C. Reserva do Mago é escolhido somente entre os reservas, inclusive goleiro, e recebe identificação pelo nome completo. Cada papel tem um único ID. Remover/substituir um atleta que ocupa um desses papéis limpa a escolha correspondente.

Valor do elenco soma os `pointcoins` recebidos para titulares, técnico e reservas. Não há teto, carteira, saldo, multiplicação de pontos ou recálculo de categoria pelo preço Cartola.

## Seletor e situações

Seletor em dialog nativo lateral no desktop e adaptado à largura mobile, com foco contido, fechamento por Esc e retorno de foco. Busca por apelido normalizada por caixa/acentos, filtros de clube, posição fixa, categoria e múltiplas situações. Filtra sobre todos os atletas elegíveis antes de paginar visualmente em grupos de 20. Atletas já usados não aparecem como opções.

Padrão ao abrir cada seletor: **Provável + Dúvida**. OR entre situações e AND com os outros filtros. Preferências mantidas entre páginas do seletor; uma nova abertura restaura o padrão. Há selecionar todas, limpar, restaurar padrão e opção explícita para desconhecida/sem situação. Limpar situações produz mensagem clara de estado vazio.

Códigos verificados no dicionário existente em `public/data/cartola-market.json`, sem nova consulta de navegador ao Cartola:

| statusId | Rótulo confirmado |
|---:|---|
| 2 | Dúvida |
| 3 | Suspenso |
| 5 | Contundido |
| 6 | Nulo |
| 7 | Provável |
| desconhecido ou ausente | Situação desconhecida |

Limitação: o backend Fantasy não expõe endpoint de dicionário de situações e a captura guarda clubes/posições/partidas, mas não esse dicionário. A interface usa somente o mapeamento local auditado. **6 não foi renomeado para Não joga**, pois o dicionário confirma Nulo. Não joga não é apresentado como situação conhecida. Códigos novos ficam explicitamente acessíveis como desconhecidos até haver contrato atualizado. A situação é identificada como capturada no catálogo, sem promessa de tempo real.

## Rascunhos, pendências e concorrência

- Cria rascunhos vazios ou incompletos via POST; não exige capitão ou reservas para começar.
- Minhas escalações lista os próprios rascunhos e retoma por GET individual, evitando usar versão antiga da listagem.
- PATCH envia a versão atual e a seleção inteira. Após sucesso, substitui o estado pela resposta do servidor.
- Duplicação chama o endpoint com a versão da origem e aceita o novo ID. Alterações locais precisam ser salvas antes de duplicar.
- Exclusão pede confirmação, envia a versão e só remove o item após confirmação do servidor.
- Uma operação por vez, protegida também por ref síncrona contra cliques repetidos. Não há retry automático de mutações.
- Trocar rascunho/competição ou recarregar versão com alterações locais exige confirmação de descarte. beforeunload alerta ao sair com alterações ou uma operação em andamento. Alterações não são persistidas localmente.
- Enquanto há edição não salva, a UI não apresenta a validação antiga como atual. Pendências vêm exclusivamente de `validacao.pendencias`, com tradução dos textos conhecidos por posição e preservação de mensagens novas.
- Somente `validacao.completa=true` em resposta salva sem edição posterior produz **Escalação completa — rascunho salvo**. Isso não é inscrição.
- 400, 401, 403, 404 e 409 têm mensagens específicas. Falhas mantêm a seleção em memória enquanto a sessão/componente continua ativo.
- Em 409, suspende escrita, mantém a edição local e oferece recarregar versão atual com confirmação. Não repete PATCH silenciosamente.
- Bloqueio temporal retornado pelo servidor é mantido, sem reabertura presumida. Conta bloqueada/inativa impede escrita.
- Prevenção visual usa abertura, catálogo CONGELADO correspondente, status PUBLICADA, fechamento definitivo e a primeira partida: todos precisam estar AGENDADA, sem início real e com horário futuro. A UI reavalia o tempo a cada segundo. O relógio e a decisão finais são do servidor. `fimInscricao` não é indevidamente usado como prazo de montagem, conforme contrato 2A.
- Após bloqueio, a escalação continua visível e os rascunhos podem ser lidos quando a conta tem acesso.

## Validação realizada em 15/10/2026

**API HTTP local real, somente leitura:**

- Descoberta da competição publicada sem IDs fixos na implementação.
- Competição retornada: ID 1, catálogo 3, 2026/31, três partidas, seis clubes, **241 atletas elegíveis**, carregados em três páginas.
- Situações observadas entre os elegíveis: 2, 3, 5, 6 e 7.
- GET autenticado de minhas escalações sem sessão: **401**.
- Preflight CORS para `http://localhost:3000`: **204**, origem permitida e métodos GET/POST/PATCH/PUT/DELETE.
- Não houve POST/PATCH/DELETE na API real durante os testes. Não foi criado usuário, token ou rascunho real por este trabalho.

**Testes automatizados:**

- `npm run test -- --maxWorkers=2 --minWorkers=1`: **68 arquivos, 817 testes aprovados**, incluindo 53 novos da Fase 2B e os testes anteriores da Fase 1C e POC.
- Cobertura nova: sete composições e posições, técnico separado, banco, seleção/IDs internos/duplicatas, elegibilidade por clube e catálogo, busca e filtros, situações OR e desconhecidas, paginação, categorias dos reservas, capitão/Mago, valores recebidos, criação incompleta, resposta completa, retomada/edição, versões, duplicação, exclusão confirmada, falhas HTTP, 409, bloqueio e gate de autenticação.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com` apenas no processo, necessário pela proteção preexistente de URL pública no next.config. Avisos preexistentes de imagens/hooks em módulos não alterados permanecem; sem novos avisos nos arquivos da Fase 2B.
- `npm run build`: aprovado, **47 páginas estáticas**, incluindo `/point-fantasy/escalacoes`. Permanecem avisos preexistentes de imagens/CSS e CSR em outras rotas. Nenhuma configuração de exportação foi alterada.

**Navegador Edge headless/Playwright:**

- Harness temporário usando os componentes reais, leituras públicas encaminhadas à API local, identidade e endpoints privados substituídos exclusivamente por fixtures de teste. Nenhum bypass foi adicionado à aplicação entregue.
- Sete formações em **320, 390 e 1280 px**, onze titulares, cinco reservas, sem overflow horizontal ou sobreposição entre slots; técnico confirmado no canto inferior esquerdo.
- Situações padrão, seleção de atleta elegível real, capitão, criação/edição com versão, duplicação e exclusão exercitados com respostas privadas controladas.
- Dialog nativo recebeu e conteve foco por Tab, fechou por Esc e permitiu reabertura. Sem erros JavaScript.
- Inspeção visual de captura mobile: campo e cinco reservas cabem na largura, controles legíveis, resumo e ações abaixo do campo.
- Página **Next exportada real**, sem sessão: título, orientação de login, ausência de overflow e nenhum erro JavaScript.
- POC exportada `/fantasy/partidas/1180729/`: **HTTP 200**.
- Harness e artefatos temporários removidos ao final. Não fazem parte do fluxo real.

## Pendências, riscos e Fase 2C

1. Homologar POST/PATCH/duplicação/DELETE com login real de participante na API local, incluindo concorrência entre duas abas. As mutações e os erros foram testados com contratos e respostas controladas, não com JWT real. Não declarar essa integração autenticada concluída.
2. Backend Fantasy ainda não fornece dicionário de situações. A solução usa o mapeamento verificado, com desconhecidos explícitos, mas uma versão futura deve oferecer o dicionário do próprio catálogo. Não é necessário alterar backend nesta fase.
3. A API precisa manter sincronizados os estados/horários das partidas. O frontend não presume atrasos nem busca fontes paralelas. Diferença no relógio do dispositivo pode antecipar ou atrasar a prevenção visual; o servidor continua impondo o bloqueio real.
4. Não há autosave ou persistência local. Alertas de descarte/saída reduzem perda acidental; encerramento do processo ou expiração de sessão pode perder edições ainda não salvas. Antes de duplicar, é necessário salvar.
5. Em falha de rede durante uma mutação, o cliente não pode garantir se o servidor concluiu a operação. Não há retry automático; consultar os próprios rascunhos antes de repetir criação/duplicação evita cópias por tentativa manual.
6. A base da Fase 1C continua não commitada, como encontrada. Revisar os arquivos das duas fases antes de qualquer futura autorização para commit.

Para a Fase 2C, definir o contrato autorizado de confirmação/inscrição e seus estados, após homologar os rascunhos autenticados. Não inferir confirmação de `validacao.completa`. Pagamentos, carteira, pontuação, apuração, ranking e substituições não foram implementados.
