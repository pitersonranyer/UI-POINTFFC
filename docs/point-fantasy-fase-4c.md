# Fase 4C — resultados oficiais

## Contrato inspecionado

Fonte: checkout local `Api-Pointffc`, arquivos `src/point-fantasy/lineups/lineup-result.dto.ts`, `lineup-result.read.ts`, `lineup.service.ts`, `lineup.controller.ts` e `point-fantasy.service.ts`. Nenhuma alteração no backend. A implantação desse contrato em produção não foi homologada com sessão real.

Consultas existentes utilizadas:

- `GET /point-fantasy/competicoes/:id/escalacoes/minhas?page=:page&limit=100`: resumos opcionais em `resultado`, exclusivamente para times do usuário autenticado. Não busca detalhes de cada time na listagem.
- `GET /point-fantasy/escalacoes/:id`: detalhe opcional em `resultado`, incluindo atletas, contribuições e substituições. Consulta ao abrir o time e na atualização manual. Usa autenticação, preservação da sessão em 403 e `no-store`.
- `GET /point-fantasy/competicoes/:id/ranking?page=:page&limit=50`: mantém ordem, posições, empates, identificação pública e paginação do servidor. Aceita strings decimais oficiais e números suportados pelo frontend anterior; não transforma null em zero.

O contexto continua usando as consultas existentes de competição, atletas, catálogo, clubes e posições. Não foram criadas rotas de resultado, polling ou consultas a Cartola no frontend.

## Visibilidade

A API permite ao proprietário consultar seu time. Para terceiros, exige conta autenticada ativa, time `INSCRITA`, competição `PUBLICADA` e `fechamentoDefinitivoEm` não nulo e vencido. Antes disso retorna 404. A implementação mantém a navegação de escalações restrita aos próprios times; não acrescenta acesso a escalações de terceiros pelo ranking. Visitantes continuam com o ambiente público existente. Rascunhos não recebem apresentação de resultado; alterações locais não salvas ocultam os dados da versão inscrita.

## Apresentação

- Meus times mostra total e estado oficiais somente para inscritos.
- Campinho preserva atletas e posições originais; mostra pontos oficiais e contabilizados separadamente, capitão efetivo com multiplicador retornado, treinador, Mago designado/utilizado e substituições.
- Resumo descreve quem saiu, quem entrou, regra comum/Mago, pontos contabilizados e herança de capitão.
- Atualização manual consulta apenas o detalhe selecionado. Falhas usam o erro existente e preservam o último resultado carregado. Nenhum cálculo de total, scouts, desempate ou substituição.

## Limites do contrato

O backend atual só emite `PARCIAL` e `INDISPONIVEL`. A apresentação reconhece explicitamente `DEFINITIVO` quando fornecido, mas não o deduz de partidas encerradas, posição ou total. Ausência de `resultado` significa indisponibilidade, nunca zero.

`pontuacaoOficial: null` e `entrouEmCampo: null` não comprovam que o atleta ainda vai jogar. São exibidos como pontuação/participação não informada. `entrouEmCampo: false` aparece como não entrou em campo; zero numérico mantém sua identidade de pontuação oficial. A API não oferece um estado específico de atleta aguardando jogo neste DTO.

O impacto de uma substituição é apresentado como contribuição oficial do reserva. Não é calculada diferença hipotética contra o titular.

## Verificação

Testes de resultado, campinho, jornadas, serviços e ranking cobrem valores positivos/zero/negativos, capitão, treinador, substituições comuns/Mago, Mago não utilizado, estados parcial/definitivo/ausente, empate, consultas sob demanda e falha temporária. Os testes existentes de autenticação, visibilidade, cancelamento, carregamento e erro do ranking foram preservados.

Executar `npm run lint` com `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`, `npm run typecheck`, testes Fantasy e `npm run build`. Não há commit, push, merge ou deploy nesta fase.

## Validação final

Arquivos da entrega (todos restritos a Fantasy e sua documentação):

- `src/components/point-fantasy/lineups/LineupBuilder.module.css`
- `src/components/point-fantasy/lineups/LineupEditor.tsx`
- `src/components/point-fantasy/lineups/LineupPitch.tsx`
- `src/components/point-fantasy/lineups/LineupResult.tsx`
- `src/components/point-fantasy/lineups/LineupResult.test.tsx`
- `src/components/point-fantasy/lineups/ParticipantJourney.test.tsx`
- `src/components/point-fantasy/lineups/useLineupEditor.ts`
- `src/components/point-fantasy/ranking/CompetitionRanking.tsx`
- `src/components/point-fantasy/ranking/CompetitionRanking.test.tsx`
- `src/services/pointFantasyLineupService.ts`
- `src/services/pointFantasyRankingService.ts`
- `src/services/pointFantasyRankingService.test.ts`
- `src/types/pointFantasyLineup.ts`
- `src/types/pointFantasyRanking.ts`
- `src/types/pointFantasyResult.ts`
- `src/lib/fantasyScore.ts`
- `scripts/verify-fantasy-results.cjs`
- `docs/point-fantasy-fase-4c.md`

A comparação automatizada dos DTOs locais confirmou igualdade, com as adaptações documentadas de `Date` para string ISO no JSON e suporte antecipado ao estado `DEFINITIVO`.

O teste de navegador `node scripts/verify-fantasy-results.cjs` usa componentes reais e dados sintéticos isolados, sem escrita na API. Verifica 320, 360, 390, 768 e 1440 px, valores negativos, capitão efetivo, Mago utilizado, substituições comuns/Mago e ranking com posições empatadas na ordem do servidor. Verifica também ausência de erros JavaScript, overflow horizontal, sobreposição dos cartões e texto de resultado fora dos cartões. Capturas de tela e relatório são gerados em `.next-dev/phase4c-validation/` (artefatos locais ignorados pelo Git). As capturas mobile e desktop foram inspecionadas visualmente.

Durante a validação, foi restringida a largura do bloco de pontuação ao cartão para melhorar a quebra de texto no mobile. Foi acrescentado teste integrado comprovando que mudar a formação local oculta o resultado da versão inscrita sem gravar na API.

Configuração: `.env.example` e o padrão do script de build usam `https://api-pointffc.onrender.com`. `.env.local` usa `http://localhost:3001` exclusivamente no ambiente de desenvolvimento; não foi alterado. O bundle de produção foi inspecionado: contém o host correto, sem a API local e sem sintaxe Markdown na URL.

Uma consulta somente leitura à lista pública de competições em produção expirou por timeout de 30 segundos. Isso não comprova indisponibilidade do serviço para outros clientes. Não foi possível confirmar os campos de resultado implantados em produção, nem fazer homologação com uma sessão autenticada real. A publicação funcional continua dependente da implantação do contrato inspecionado e de dados oficiais atuais retornados pelo backend. A implementação não fabrica resultado quando esses dados faltam.

Resultados finais: lint aprovado com avisos preexistentes; build aprovado (50 páginas, código de saída zero); 301 testes aprovados em 19 arquivos (290 da suíte de componentes/serviços de escalações/ranking e 11 do catálogo). A execução isolada inicial de typecheck passou; uma repetição simultânea ao build encontrou arquivos `.next/types` em regeneração, por isso a confirmação final foi executada sequencialmente após o build. O teste de navegador passou nas cinco larguras. `git diff --check` passou. A branch atual é `main`; todas as alterações permanecem sem commit.

Confirmação: o typecheck final sequencial também passou, com código de saída zero.

## Preparação da publicação autorizada

Antes do commit, `origin/main` foi atualizado de `bede7c4` para `d5a3630`, incorporando exclusivamente os ajustes Fantasy já publicados. Os conflitos em CSS, listagem de times e testes foram resolvidos preservando o layout remoto e acrescentando somente a apresentação de resultados da Fase 4C. O script visual foi adaptado ao retorno para Meus times do editor focado. A suíte atualizada passou com 322 testes em 20 arquivos; lint e typecheck passaram e a verificação visual continuou aprovada nas cinco larguras. O conjunto continua limitado aos mesmos 18 arquivos. A autorização de publicação abrange commit, push normal para `origin/main` e acompanhamento do workflow existente de Firebase; nenhum deploy manual deve ser executado.
