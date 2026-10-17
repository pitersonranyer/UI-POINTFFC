# Fase 2G — Ranking de participantes

A aba Ranking do ambiente da competição consulta todos os times inscritos, preservando a ordem da API. A identificação de times próprios usa exclusivamente `meuTime === true`, com fundo verde suave, borda verde e indicação “Meu time”. Visitantes anônimos podem consultar o ranking sem destaques; Meus times continua exigindo login com retorno à competição.

## Arquivos desta fase

- `src/types/pointFantasyRanking.ts`: contrato de resposta e identidade do ranking, conforme o contrato fornecido na solicitação. Não existe cliente gerado nem tipo de ranking anterior neste repositório.
- `src/services/pointFantasyRankingService.ts`: consulta paginada, autenticação existente, `cache: no-store`, sinal de cancelamento e validação da resposta.
- `src/components/point-fantasy/ranking/CompetitionRanking.tsx` e `.module.css`: linhas compactas, total, destaques, pontuação/posição, paginação, carregamento, vazio, erros e retry.
- `src/components/point-fantasy/ranking/CompetitionTabs.tsx`: as três abas existentes, compartilhadas entre o ambiente autenticado e público, com navegação por teclado.
- `src/components/point-fantasy/ranking/PublicCompetitionEnvironment.tsx`: consulta pública do ambiente sem buscar escalações privadas nem inicializar o editor.
- `src/components/point-fantasy/lineups/FantasyLineupBuilder.tsx`: mantém o editor autenticado e oferece o ambiente público aos visitantes.
- `src/components/point-fantasy/lineups/LineupEditor.tsx`: monta o ranking somente na aba ativa, preservando o elenco local ao trocar de aba.
- `src/components/point-fantasy/lineups/TeamCrest.tsx`: aceita somente os identificadores necessários ao brasão. Algoritmo v1 e SVG permanecem os mesmos; não foram criados gerador alternativo nem escalações simuladas para adaptar o ranking.
- `src/components/point-fantasy/lineups/ParticipantJourney.test.tsx`: verifica a reserva futura em Premiação, já que Ranking agora funciona.
- `src/services/pointFantasyRankingService.test.ts`, `CompetitionRanking.test.tsx` e `RankingEnvironment.test.tsx`: testes novos de contrato, sessão, consulta, interface e integração das abas.
- `scripts/verify-fantasy-ranking.cjs`: validação isolada no navegador, utilizando somente fixtures de teste e interceptação de HTTP.

Os demais arquivos modificados presentes no workspace pertencem à Fase 2D anterior e foram preservados.

## API e personalização

Endpoint consumido: `GET /point-fantasy/competicoes/:id/ranking?page=<page>&limit=50`.

A consulta usa `apiFetch` com `authenticated: true` e o bearer token existente quando disponível, sem enviar `usuarioId`. O mecanismo existente de renovação de sessão trata credenciais expiradas; falhas 401 oferecem login e retorno à competição. Respostas personalizadas não entram em cache de módulo, cache compartilhado, localStorage ou sessionStorage. Cada consulta usa `cache: no-store`.

Uma página é buscada por vez, somente enquanto Ranking estiver aberta. A paginação usa `page`, `limit` e `total` da resposta. Não há carregamento integral, reordenação ou cálculo de classificação no cliente.

O cabeçalho do ambiente anônimo reutiliza a consulta pública `GET /point-fantasy/competicoes/:id`. Não consulta `/escalacoes/minhas` nem o contexto do campinho.

## Estados e integridade

Posição e pontuação nulas aparecem como traços; nunca são substituídas por índices da lista ou zeros. Valores numéricos futuros são apresentados como recebidos, com formatação pt-BR, sem cálculo. Os estados `NAO_INICIADA` e `INDISPONIVEL` exibem as mensagens pedidas; outros estados do servidor são preservados sem inferências.

O serviço rejeita competição/página divergente, paginação inválida, IDs duplicados e campos incompatíveis, sem corrigir silenciosamente o contrato. A identidade nula usa o fallback legado do mesmo `TeamCrest`. Os testes comparam o SVG de um mesmo time nas duas apresentações.

Carregamento, lista vazia, página esvaziada, falha de conexão, acesso indisponível e credencial inválida têm mensagens e retry. Mudanças de competição, página, sessão e aba desmontam a consulta anterior, abortam a requisição e descartam respostas tardias. A consulta possui limite de 30 segundos. Durante uma nova consulta, linhas da anterior não permanecem visíveis.

## Validação

- 35 testes novos: 17 de HTTP/contrato, 15 de interface e 3 de integração do ambiente.
- Suíte completa Vitest: 87 arquivos e 1.052 testes aprovados, incluindo regressões da vitrine, navegação, campinho e Mago.
- `npm.cmd run typecheck`.
- `npm.cmd run lint`, com URL HTTPS pública definida apenas no processo.
- `npm.cmd run build`, sem deploy.
- `node scripts/verify-fantasy-ranking.cjs`: 320, 360, 390, 768 e 1440 px, nomes longos, destaque de múltiplos times, consulta anônima, paginação real por parâmetros, alinhamento de pontuação, tamanho proporcional do brasão e ausência de overflow. Capturas locais em `.next/phase2g-preview/` após executar o script; um novo build pode limpar esse diretório.

## Dependências e limites

A validação de integração HTTP utiliza o contrato fornecido e respostas isoladas de teste; não foram usadas contas reais nem consultada uma sessão de produção. A API deve expor esse endpoint para visitantes, identificar `meuTime` pela sessão válida e retornar os campos contratados. Uma alteração futura do formato de pontuação deve ser refletida nos tipos, sem coerção silenciosa.

Sem alteração de backend, banco, migrations, Firebase Authentication ou configurações de produção. Vitrine, Mago, rankings tradicionais e POC `/fantasy` permanecem intactos. Premiação continua reservada. Sem branch, PR, commit, push ou deploy.
