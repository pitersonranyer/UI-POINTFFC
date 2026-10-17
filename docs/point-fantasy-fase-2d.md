# Fase 2D — Meus times e inscrição integrada

A entrada da vitrine mantém `/point-fantasy?competicao=<id>` e abre Meus times. O login preserva esse destino na allowlist existente. Ranking e Premiação são reservas sem dados fictícios. Partidas permanecem nos detalhes da competição.

O participante abre diretamente o campinho existente em 4-3-3. O primeiro nome fica local, com sugestões predefinidas, até Salvar time; nenhum POST ocorre na abertura. A identidade pública e a sequência posteriores vêm da API. As sete formações, capitão, Reserva Power, categorias e PointCoins usam as funções existentes.

Salvar time fica abaixo dos cinco reservas. Um elenco incompleto é salvo como Em montagem. Para FREE, a validação completa do servidor permite confirmar a inscrição na mesma ação; o sucesso depende do recibo validado pelo serviço e da recuperação da escalação atualizada. Times já inscritos usam PATCH sem reinscrição. PAGO salva e informa a necessidade de confirmação específica, sem cobrança.

## Arquivos

- `FantasyLineupBuilder.tsx`: ativa a jornada integrada e preserva o retorno pelo login.
- `LineupEditor.tsx`: abas, lista real, vazio, identidade local, edição e salvamento integrado.
- `useLineupEditor.ts`: reutiliza persistência e controle de versão; integra confirmação, reconciliação e retry.
- `LineupTeamNavigation.tsx`: vocabulário público e duplicação restrita a times em montagem.
- `LineupBuilder.module.css`: abas, identidade e listagem compactas e responsivas.
- `TeamCrest.tsx`: SVG determinístico v1 usando competição, identidade persistida e ID; fallback legado e prévia provisória. Padrões visuais podem se repetir; o número diferencia os times, sem promessa de unicidade global.
- `lineupPresentation.ts`: bloqueio também ao fim do prazo de inscrição.
- `postAuthRedirect.ts`: permite somente o destino Fantasy conhecido e ID numérico positivo.
- `ParticipantJourney.test.tsx`: nove testes de jornada, confirmação, erros, identidade, autenticação, bloqueio, duplicação e recarga.
- Testes existentes de jornada e apresentação: expectativas atualizadas para a entrada em Meus times e prazo.
- `scripts/verify-fantasy-journey.cjs`: harness isolado com fixtures exclusivamente de teste para navegador, sem autenticação ou escritas reais.

## Endpoints existentes

- GET `/point-fantasy/competicoes`, `/competicoes/:id`, `/competicoes/:id/atletas`.
- GET `/point-fantasy/catalogos`, `/catalogos/:id/clubes`, `/catalogos/:id/posicoes`.
- GET `/point-fantasy/competicoes/:id/escalacoes/minhas` com paginação.
- GET `/point-fantasy/escalacoes/:id`.
- POST `/point-fantasy/competicoes/:id/escalacoes` com nome-base quando necessário e chave idempotente.
- PATCH `/point-fantasy/escalacoes/:id` com versão.
- POST `/point-fantasy/escalacoes/:id/duplicar` com versão e chave idempotente, somente para times não inscritos.
- POST `/point-fantasy/competicoes/:id/inscricoes` com `{ escalacaoIds: [id], chaveIdempotencia }`.

## Falhas e limites

O bloqueio síncrono existente impede cliques duplicados. Criações com resposta incerta mantêm seleção, nome e chave para replay. A chave de confirmação FREE é persistida em localStorage por competição e escalação antes do envio; retries e recargas reutilizam a mesma chave. O retry consulta o servidor antes de reenviar e não reinscreve um time já confirmado. Falhas de inscrição preservam o time salvo. Enquanto uma confirmação está pendente, o editor impede alterar o elenco até reconciliar a operação.

Conflitos 409 recuperam o estado do servidor para a lista, preservando escolhas locais. A substituição do editor exige recarregar e confirmar o descarte. Bloqueios do backend e erros de acesso são apresentados; o servidor continua sendo a autoridade final para prazo, versão, validação e permissão de edição de inscritos FREE.

O contrato atual não oferece campeonato: esse campo não é inferido. Ranking, premiação e pagamentos continuam fora desta fase. A confirmação requer armazenamento local disponível para conservar sua chave de retry. Nenhum contrato, endpoint, backend, banco, migration, Firebase Authentication ou configuração de produção foi alterado. Vitrine, campinho, Mago e POC `/fantasy` foram preservados. Sem branch, commit, push, PR ou deploy.

## Verificação

- Suíte completa Vitest: 84 arquivos e 1.017 testes aprovados, incluindo nove testes novos da jornada.
- `npm.cmd run typecheck`.
- `npm.cmd run lint` com `NEXT_PUBLIC_API_URL` HTTPS pública somente no processo; avisos existentes em outros módulos.
- `npm.cmd run build`: exportação estática, sem deploy.
- `node scripts/verify-fantasy-journey.cjs`: 320, 360, 390, 768 e 1440 px; três abas, vazio, abertura do campinho, ausência de overflow e botão abaixo do banco. Capturas locais em `.next/phase2d-preview/`.
- Testes automatizados utilizam fixtures isoladas. Não foi feita inscrição contra a API real nem validação de conta real.
