# Fase 5A.4 — refinamento visual das modais e selos

A modal foi posteriormente isolada em seu próprio módulo e validada pelo editor real em 16 casos. Consulte a [Fase 5A.4.4](phase5a44-real-athlete-dialog.md) para o visual atual e as evidências.

O selo recebeu um ajuste posterior de 13 px, mantendo a geometria dos atletas. Consulte a [comparação DOM da Fase 5A.4.3](phase5a43-indicator-geometry.md). As modais descritas neste relatório foram preservadas.

Branch mantida: `codex/point-fantasy-team-identity-phase5a2`. Todas as alterações locais das fases anteriores foram preservadas. Este refinamento substitui o posicionamento superior dos indicadores descrito no relatório inicial da Fase 5A.4.

## Modais

- O mesmo `LineupAthleteActions` continua atendendo titular, reserva e técnico, com os callbacks e restrições existentes.
- Cabeçalho em grid: área de camisa de 52 × 54 px, identidade a 8 px dessa área e fechar com alvo de 44 px. A camisa tem 42 px, com posição/papel acima do nome.
- Pequeno selo dourado de 18 px junto ao nome indica capitão ou Reserva Power ativo. O selo não recebe interação nem substitui a ação de ativar/remover.
- Ação especial com fundo neutro suave. Ações secundárias brancas, separadores discretos e remoção vermelha por último. Ícones de 17 px; X de 18 px. Altura mínima de toque de 44 px.
- Mantidos fundo branco, borda superior dourada e informações em `details` nativo. Nenhum botão grande verde foi introduzido.
- Mantidos foco inicial, Tab/Shift+Tab, Escape, X, backdrop e retorno de foco ao atleta.

## Selos no campo e no banco

O indicador tem 15 × 15 px e fica em posição absoluta em relação à representação da camisa, a 2 px da borda esquerda e 3 px da borda inferior do contêiner. Ele ocupa o canto inferior esquerdo, sem criar linha adicional ou participar do fluxo do slot. Capitão e Power continuam no canto superior esquerdo e não se sobrepõem à condição.

Dimensões explícitas no SVG protegem o indicador contra regras genéricas que ampliam SVGs. O slot, a camisa, o nome, a formação, o técnico e o banco mantêm suas dimensões e regras. O mesmo tratamento abrange titulares, reservas e o técnico, que já possuía condição aplicável.

O campo oficial `statusId`, o mapeamento e a acessibilidade foram preservados: 7 Provável, 2 Dúvida, 5 Contundido, 3 Suspenso e 6 Nulo. Desconhecido/ausente continua sem indicador; nenhum estado fictício foi criado. Não houve alteração de API, backend ou banco.

## Arquivos deste refinamento

```text
src/components/point-fantasy/lineups/LineupAthleteActions.tsx
src/components/point-fantasy/lineups/LineupBuilder.module.css
src/components/point-fantasy/lineups/LineupPitch.tsx
src/components/point-fantasy/athletes/AthleteStatusIndicator.tsx
src/components/point-fantasy/lineups/LineupAthleteActions.test.tsx
docs/phase5a4-refinement.md
docs/evidence/phase5a4-refinement/*
```

## Verificações

- **154 testes relevantes aprovados em 9 arquivos**, incluindo identidade pública, seleção contínua, modais, navegação e condições. Os testes verificam também os novos selos do cabeçalho ativos/inativos.
- Lint aprovado, com avisos preexistentes fora deste escopo. Executado com a configuração legítima `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`.
- Typecheck aprovado.
- Build final aprovado, com geração das 49 páginas e avisos preexistentes fora deste escopo.
- `git diff --check` aprovado.
- Chrome com componentes reais, CSS global e fixtures sintéticas identificadas como teste: 360, 390, 768 e 1280 px, com altura de viewport de 900 px.

Em todas as larguras: sem rolagem horizontal; modal inteira visível; ícones entre 17 e 18 px; camisa em área de 52 px; nome a 8 px dessa área; alvos de 44 px; selos de capitão/Power visíveis. Escape e restauração de foco foram exercitados para titular e reserva.

Foram medidos 17 indicadores em cada largura, incluindo o técnico: todos com 15 px, posicionamento absoluto inferior esquerdo, sem tocar no nome ou nos selos de função. Ocultar o indicador não alterou a altura de nenhum slot. O técnico permaneceu dentro do campo.

| Largura | Altura da modal de titular/reserva | Indicadores | Rolagem horizontal |
| --- | --- | --- | --- |
| 360 px | 294 px | 15 px | Nenhuma |
| 390 px | 294 px | 15 px | Nenhuma |
| 768 px | 282 px | 15 px | Nenhuma |
| 1280 px | 282 px | 15 px | Nenhuma |

## Evidências

- [Campinho e banco em 360 px](evidence/phase5a4-refinement/pitch-360.png)
- [Campinho e banco em 1280 px](evidence/phase5a4-refinement/pitch-1280.png)
- Titular: [360](evidence/phase5a4-refinement/titular-360.png), [390](evidence/phase5a4-refinement/titular-390.png), [768](evidence/phase5a4-refinement/titular-768.png), [1280](evidence/phase5a4-refinement/titular-1280.png)
- Reserva: [360](evidence/phase5a4-refinement/reserva-360.png), [390](evidence/phase5a4-refinement/reserva-390.png), [768](evidence/phase5a4-refinement/reserva-768.png), [1280](evidence/phase5a4-refinement/reserva-1280.png)
- [Medições detalhadas](evidence/phase5a4-refinement/layout-results.json)

As capturas usam um harness isolado, sem autenticação ou escrita no backend. Não substituem uma conferência no aplicativo completo com navegação global e teclado virtual físico. Para essa conferência, execute `npm.cmd run dev` e abra `/point-fantasy/escalacoes/` com conta ativa e competição aberta.

Não houve commit, push, merge ou deploy.
