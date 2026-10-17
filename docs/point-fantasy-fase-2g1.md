# Fase 2G.1 — Apresentação do Ranking

O Fantasy reutiliza diretamente as classes do ranking tradicional de `src/components/leagues/PointCompetition.module.css`, usado por `PointCompetitionPage.tsx`. Não houve alteração nesses arquivos tradicionais.

Classes reutilizadas: `panel`, `heading`, `entries`, `entry`, `position`, `teamName`, `ownBadge`, `score` e `own`. Isso preserva o painel compacto, título em maiúsculas, linhas com contorno dourado, posição em quadrado, nome ao lado do brasão, pontuação à direita e destaque dourado com etiqueta “Seu time”. O ícone `RefreshCw` também é o mesmo do ranking tradicional; o brasão permanece `TeamCrest`.

## Arquivos alterados nesta fase

- `src/components/point-fantasy/ranking/CompetitionRanking.tsx`: aplica as classes existentes, move a etiqueta para o lado do nome, apresenta cabeçalho Ranking/quantidade/Atualizar e omite textos explicativos quando há inscritos. Atualizar utiliza o mecanismo existente de recarga da página atual.
- `src/components/point-fantasy/ranking/CompetitionRanking.module.css`: contém somente adaptações do contexto Fantasy, do SVG e da responsividade. Mantém o botão compacto apesar dos estilos herdados do editor; mantém a etiqueta visível e limita nomes longos a duas linhas no mobile, com nome completo preservado no DOM e no atributo `title`.
- `src/components/point-fantasy/ranking/CompetitionRanking.test.tsx`: atualiza apenas expectativas visuais afetadas e acrescenta testes do cabeçalho, ausência de mensagens em ranking ocupado e atualização da página atual.
- `scripts/verify-fantasy-ranking.cjs`: valida etiqueta, cores douradas originais, posição da etiqueta, título, ausência de marcadores e mensagens, alinhamento e botão Atualizar na página atual.
- Este documento.

As alterações anteriores das Fases 2D e 2G presentes no workspace foram preservadas.

## Preservação funcional

Não houve alteração de serviço, endpoint, contrato, paginação, autenticação opcional, cache, cancelamento ou descarte de respostas antigas. A identificação continua usando `meuTime` da API e a sessão existente. Nomes públicos não são transformados nem substituídos por nomes pessoais. Posição e pontuação nulas continuam como `—`.

Navegação entre abas, campinho, inscrições, vitrine, ranking tradicional e Mago permanecem com o comportamento anterior. Nenhum teste de regras de negócio foi alterado.

## Verificação

- Suíte completa Vitest: 87 arquivos e 1.055 testes aprovados, incluindo os testes tradicionais e de regras. Os 18 testes da interface do ranking também passaram na execução específica.
- Lint, typecheck e build de produção.
- `node scripts/verify-fantasy-ranking.cjs`: 320, 360, 390, 768 e 1440 px; sem overflow, marcadores ou desalinhamento. Verifica as cores de borda, fundo, posição e etiqueta contra os valores existentes no CSS tradicional e confirma que Atualizar refaz a página atual.
- Capturas locais geradas em `.next/phase2g-preview/`; um novo build pode limpar esse diretório. O script usa somente fixtures isoladas, sem escrita na API.

Sem branch, PR, commit, push ou deploy.
