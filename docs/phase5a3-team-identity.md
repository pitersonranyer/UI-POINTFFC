# Fase 5A.3 — primeiro salvamento e identidade pública

Branch preservada: `codex/point-fantasy-team-identity-phase5a2`.
As alterações locais da Fase 5A.2 foram auditadas antes da implementação. Não houve troca de branch, descarte do trabalho anterior, alteração no backend, commit, push, merge ou deploy.

## Jornada e estados

O participante começa pela escalação, sem formulário de nome. O salvamento continua abaixo do gramado. O componente `FirstLineupSaveDialog` substitui o formulário antecipado da Fase 5A.2 e reutiliza o `Dialog` existente, com foco contido, Escape, restauração de foco e bloqueio durante a requisição.

| Estado retornado pelo servidor | Comportamento |
| --- | --- |
| `NOVO` | Sem gerenciamento inicial. Ao salvar uma escalação nova, abre o modal com `Meu Time`. |
| `LEGADO` | Mantém IDs, edição via PATCH e exclusão dos rascunhos antigos. Novo POST ou duplicação solicita nome; o original não recebe nome fictício. |
| `DEFINIDA` | Usa a identidade persistida, mesmo sem rascunhos. Novos POSTs e duplicações omitem nome-base; não abrem o modal novamente. |

Cancelar não envia POST nem altera a escalação. Em erro, o nome e a seleção são mantidos. O modal não fecha automaticamente em erro. Conflito definitivo de versão ou renomeação exige cancelar o modal, quando aberto, e recarregar a versão atual; o descarte de alterações depende de confirmação. Apenas o servidor confirma sucesso e fornece o nome público real.

## Contratos utilizados

Referências locais inspecionadas, somente para leitura: `Api-Pointffc/src/point-fantasy/lineups/PHASE5B.md`, `lineup.dto.ts`, `lineup.service.ts` e `team-identity.ts`.

- `GET /point-fantasy/competicoes/:id/escalacoes/minhas?page=N&limit=100`: consome `items`, paginação, `estadoIdentidade`, `identidade` e `rascunhosLegados`. Carrega todas as páginas; rejeita IDs repetidos, páginas incompletas e mudanças de metadados entre páginas. Uma resposta antiga sem identidade não é interpretada como `NOVO`.
- `POST /point-fantasy/competicoes/:id/escalacoes`: seleção completa e `chaveIdempotencia`; inclui `nomeBase` somente quando a identidade ainda não está definida.
- `POST /point-fantasy/escalacoes/:id/duplicar`: `versao`, `chaveIdempotencia` e, para o primeiro novo time de participante legado, `nomeBase`.
- `PATCH /point-fantasy/escalacoes/:id`: somente seleção e versão, sem renomeação.
- `DELETE /point-fantasy/escalacoes/:id?versao=N` e GET individual preservados.
- Respostas de escalação usam `nomePublico`, `sequencial`, `legado` e `identidade`. O frontend não constrói nomes definitivos nem calcula sequenciais.

A validação do nome espelha o backend: NFC, trim, compactação de espaços ASCII, 2–60 caracteres Unicode, limite bruto de 120 unidades UTF-16, início com letra/número e restante com letras, marcas, números, espaço, ponto, apóstrofo e hífen. O servidor permanece a autoridade final. `#CÓDIGO · Nome 01` aparece somente dentro da prévia explicitamente ilustrativa.

## Idempotência e falhas

Cada intenção recebe um UUID. A seleção completa ou a fonte/versão da duplicação, o nome e a chave ficam congelados até a resolução. Duplo clique não dispara outro POST. Criação e duplicação têm timeout de 30 segundos.

Mesmo após rejeição definitiva de validação, repetir os mesmos parâmetros conserva a chave. Corrigir o nome ou iniciar explicitamente outro time constitui nova intenção e recebe uma chave nova.

Falha de rede, timeout, erro de servidor ou 409 concorrente preservam a intenção. Antes de reenviar, a tela consulta novamente todos os rascunhos e a identidade; falha nessa consulta impede o novo POST. O replay usa exatamente os parâmetros e a chave originais, inclusive quando a consulta já mostra identidade definida. Enquanto a confirmação estiver pendente, novas criações, edição, navegação e exclusão ficam bloqueadas para evitar intenções diferentes sobre uma resposta incerta. Fechar o modal apenas o oculta; o retry continua disponível no editor.

Limites: a intenção pendente fica em memória durante a montagem do editor, com aviso nativo antes de sair. Ela não é recuperada após fechar/recarregar a aba. Não há armazenamento local de identidade. Se uma duplicação ficar incerta e outra sessão modificar/excluir sua fonte, o contrato atual pode impedir o replay por versão/propriedade antes de consultar a idempotência; a tela conserva o bloqueio em vez de arriscar outra criação. Da mesma forma, replay cujo resultado já foi excluído não é convertido automaticamente em uma nova operação. Resolver esses casos de forma automática requer consulta de operação por chave ou revisão do contrato no backend.

## Componentes e arquivos

- Criados: `FirstLineupSaveDialog.tsx`, `teamIdentity.ts` e `TeamIdentityFlow.test.tsx`.
- Atualizados: `LineupEditor`, `useLineupEditor`, `LineupTeamNavigation` e `LineupBuilder.module.css`.
- Atualizados: tipos e serviço `pointFantasyLineup`, testes do serviço, fixtures e testes existentes de editor, seleção contínua e navegação.
- Removido da renderização: formulário antecipado de identidade e card grande de gerenciamento. Nenhuma biblioteca de UI foi adicionada.
- A navegação usa seletor nativo e setas com IDs estáveis; nomes vêm da API. Ações compactas mantêm alvos de toque de pelo menos 44 px.
- Corrigida a largura do slot do técnico: uma regra mobile reduzia o slot interno a cerca de 20% da área do técnico e quebrava seu nome por letra. A correção é restrita ao slot do técnico.

Arquivos de código alterados/criados:

```text
src/types/pointFantasyLineup.ts
src/services/pointFantasyLineupService.ts
src/services/pointFantasyLineupService.test.ts
src/components/point-fantasy/lineups/LineupEditor.tsx
src/components/point-fantasy/lineups/useLineupEditor.ts
src/components/point-fantasy/lineups/LineupTeamNavigation.tsx
src/components/point-fantasy/lineups/FirstLineupSaveDialog.tsx
src/components/point-fantasy/lineups/teamIdentity.ts
src/components/point-fantasy/lineups/LineupBuilder.module.css
src/components/point-fantasy/lineups/lineupTestFixtures.ts
src/components/point-fantasy/lineups/TeamIdentityFlow.test.tsx
src/components/point-fantasy/lineups/LineupBuilder.test.tsx
src/components/point-fantasy/lineups/LineupTeamNavigation.test.tsx
src/components/point-fantasy/lineups/ContinuousSelection.test.tsx
```

## Evidências visuais

Chrome headless, viewport de 900 px de altura, componentes e hook reais, serviço substituído por fixtures sintéticas em um harness isolado. Nenhuma gravação foi feita no backend real. O harness usa o CSS global, exercita abertura/cancelamento/confirmação do modal e navegação com escalação completa.

- [Modal 360 px](evidence/phase5a3/modal-360.png)
- [Modal 390 px](evidence/phase5a3/modal-390.png)
- [Modal 768 px](evidence/phase5a3/modal-768.png)
- [Modal 1280 px](evidence/phase5a3/modal-1280.png)
- [Navegação, técnico, capitão e Reserva Power em 360 px](evidence/phase5a3/navigation-360.png)
- [Medições das quatro larguras](evidence/phase5a3/layout-results.json)

Não houve rolagem horizontal da página ou do modal. O técnico ficou dentro do gramado em todas as larguras. As ações de navegação mantiveram alvos de toque de 44 px. A confirmação/cancelamento foi exercitada em cada largura.

## Validação integrada local

Execute `npm.cmd run dev`, abra `/point-fantasy/escalacoes/`, entre com conta ativa e escolha uma competição aberta. A API configurada precisa disponibilizar o contrato da Fase 5B e sua migration. Valide `NOVO`, `LEGADO` e `DEFINIDA`, incluindo identidade sem rascunhos, exclusão confirmada e recarga da página. Confira também teclado virtual, restauração de foco e navegação inferior fixa no app completo.

O harness não inclui a navegação global nem uma sessão real. O teste autenticado contra a API em execução e o comportamento do teclado virtual físico permanecem como conferência de integração local; as evidências não são apresentadas como teste end-to-end do backend.

## Resultados automatizados

- Suíte completa final: **936 testes aprovados em 78 arquivos**.
- Após os ajustes do modal e do layout: **142 testes focados aprovados em 8 arquivos**. A verificação adicional de retries rejeitados passou com **28 testes de identidade/validação**.
- `npm.cmd run lint`: aprovado com avisos preexistentes sobre imagens e cleanup de um hook fora deste escopo. A configuração legítima usada foi `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`.
- `npm.cmd run typecheck`: aprovado após a geração de tipos do Next. Não executar simultaneamente com build, que recria `.next/types`.
- `npm.cmd run build`: compilação e geração das 49 páginas concluídas, com avisos preexistentes.
- `git diff --check`: aprovado.
- Chrome: quatro larguras aprovadas; navegação com altura de 108 px em 360/390 e 52 px em 768/1280, sem card de gerenciamento.
