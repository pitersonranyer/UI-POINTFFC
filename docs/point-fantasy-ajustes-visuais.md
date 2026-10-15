# Ajustes visuais da escalação

Branch mantida: `codex/point-fantasy-continuous-selection-phase-2b2`. Alterações locais anteriores preservadas.

## Alterações

- Abas substituídas pelo select **Time em edição**, com todos os rascunhos da competição atual, em ordem estável de ID real, e **+ Novo time** ao lado.
- Select controlado pelo rascunho efetivamente carregado: cancelar o descarte mantém a seleção anterior; duplicar seleciona a cópia; excluir remove a opção. A paginação HTTP existente continua carregando todos os rascunhos. As opções são agrupadas em páginas de três; Anterior/Próxima abrem o primeiro time do grupo correspondente, passando pela mesma confirmação de descarte.
- Reservas exibem posição e medalha SVG da categoria real: bronze, prata ou ouro. Letras B/P/O, tooltip e identificação acessível complementam as cores. Não há mais texto de teto ou categoria repetida nos cards.
- A medalha circular com fita fica abaixo da posição; a coroa do Mago permanece acima da camiseta. São indicadores distintos. O limite de categoria continua aplicado no seletor e nas validações existentes; nenhum recálculo de categoria ou POINTCOINS foi introduzido.

## Arquivos

Em `src/components/point-fantasy/lineups/`, modificados:

- `LineupTeamNavigation.tsx`
- `LineupTeamNavigation.test.tsx`
- `LineupPitch.tsx`
- `LineupBuilder.module.css`
- `LineupBuilder.test.tsx`

Criados: `ReserveCategoryMedal.tsx`, `ReserveCategoryMedal.test.tsx` e este relatório.

## Validação

- Testes: **71 arquivos, 859 testes aprovados**, incluindo cores/medalhas, categoria real diferente do teto, coroa independente, navegação, cancelamento de descarte, paginação, duplicação e exclusão.
- `npm run lint`: aprovado, com avisos preexistentes fora dos componentes alterados. URL pública definida somente no processo, conforme exigência existente do next.config.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado, mantendo **47 páginas estáticas**.
- Edge/Playwright em **320, 390 e 1280 px**: select e botão lado a lado, fluxo de rascunhos preservado, medalhas de 18 × 23 px separadas do nome/coroa, sem overflow ou erros JavaScript. Captura mobile inspecionada.
- `git diff --check`: aprovado. Harness e capturas temporários removidos.

Navegador validado com fixtures controladas; a homologação autenticada com usuário real continua sendo uma pendência anterior. Nenhuma alteração em backend, banco, contratos HTTP, inscrições, pagamentos ou POC `/fantasy/`. Sem commit, push, merge ou deploy.
