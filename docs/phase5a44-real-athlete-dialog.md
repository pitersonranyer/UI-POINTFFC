# Fase 5A.4.4 — modal efetivamente renderizada pelo editor

Ajuste posterior solicitado: o rótulo de remoção passou a **“Vender”** e o símbolo de capitão passou a **C**, no selo do cabeçalho e na ação, mantendo os callbacks. As capturas abaixo registram o layout anterior a esse ajuste de rótulo/símbolo.

Branch preservada: `codex/point-fantasy-team-identity-phase5a2`. As alterações locais anteriores foram mantidas. Não houve alteração de backend, banco, contratos ou indicadores do campinho.

## Componente real e estilos

O fluxo auditado é `src/app/point-fantasy/escalacoes/page.tsx` → `FantasyLineupBuilder` → `LineupEditor` → `LineupPitch` → **`LineupAthleteActions`**, tanto para titular quanto para reserva. A abertura continua sendo feita pelos botões dos atletas no campo/banco.

A modal agora importa **`LineupAthleteActions.module.css`**, um módulo exclusivo. Foram removidas da folha `LineupBuilder.module.css` as regras antigas e duplicadas específicas da modal (`athleteActions`, `actionContent`, cabeçalho, ações e informações). Regras do campo, indicadores e formação não foram alteradas.

O editor tem um estilo geral `.builder button`, com preenchimento verde claro, padding e borda de botão. No módulo novo, `.athleteActions .athleteActionRow` e `.athleteActions .actionClose` têm maior especificidade, portanto definem o visual da modal independentemente da ordem de carregamento desse estilo geral. Ícones também possuem limites explícitos de tamanho. Não há dependência de uma classe `.builder` para a modal ficar correta.

O JSX real recebeu um grupo de ações e a marca `data-fantasy-athlete-actions`, permitindo confirmar no DOM que o componente aberto é o mesmo auditado. Não foi criado outro componente de demonstração para substituir a modal.

### Limite do diagnóstico anterior

As 16 capturas anteriores à edição foram feitas nesta árvore local. Nelas, os estilos locais já exibiam ações claras e ícones de até 18 px; os grandes botões verdes relatados **não foram reproduzidos no harness local**. Assim, não se afirma uma causa para uma versão externa ou sessão diferente. A alteração efetiva foi isolar e aplicar o novo visual no componente usado pelo editor, remover o acoplamento legado e comprovar os estilos computados após a alteração.

## Apresentação atual

- Cabeçalho horizontal: camisa em área de 48 px, posição/papel discreto acima do nome, nome de 17 px e X de 18 px em alvo de 44 px.
- Selo dourado pequeno no cabeçalho para capitão ou Reserva Power ativo.
- Ação especial com fundo neutro `rgb(247, 246, 242)`; destaque dourado somente quando ativo.
- Troca, informações e remoção com fundo branco computado `rgb(255, 255, 255)`.
- Remoção por último, vermelha, separada por linha discreta.
- Ícones de ação de 17 px; alvos de pelo menos 44 px.
- Fundo branco, borda superior dourada, cantos arredondados, sem sombra exagerada. No celular, mantém a folha inferior.

Callbacks, seleção de capitão/Power, substituição, informações em `details`, remoção, regras de técnico, fechamento por X/backdrop/Escape, contenção de foco e retorno ao acionador foram preservados.

## Validação visual obrigatória: 16 casos

Chrome, viewport de 900 px de altura. O harness **renderizou o `LineupEditor` e o hook reais**, selecionou o rascunho pelo seletor real e clicou nos atletas para abrir `LineupPitch → LineupAthleteActions`. Foram importados o CSS global, o CSS do editor e o novo módulo real da modal.

**Limitação:** autenticação e serviços de API foram substituídos por fixtures sintéticas identificadas como teste. Não houve autenticação real nem escrita no backend. Estas evidências validam o frontend real renderizado, mas não uma sessão autenticada no aplicativo completo.

| Largura | Titular comum | Titular capitão | Reserva comum | Reserva Power |
| --- | --- | --- | --- | --- |
| 360 | [captura](evidence/phase5a44/after-titular-comum-360.png) | [captura](evidence/phase5a44/after-titular-capitao-360.png) | [captura](evidence/phase5a44/after-reserva-comum-360.png) | [captura](evidence/phase5a44/after-reserva-power-360.png) |
| 390 | [captura](evidence/phase5a44/after-titular-comum-390.png) | [captura](evidence/phase5a44/after-titular-capitao-390.png) | [captura](evidence/phase5a44/after-reserva-comum-390.png) | [captura](evidence/phase5a44/after-reserva-power-390.png) |
| 768 | [captura](evidence/phase5a44/after-titular-comum-768.png) | [captura](evidence/phase5a44/after-titular-capitao-768.png) | [captura](evidence/phase5a44/after-reserva-comum-768.png) | [captura](evidence/phase5a44/after-reserva-power-768.png) |
| 1280 | [captura](evidence/phase5a44/after-titular-comum-1280.png) | [captura](evidence/phase5a44/after-titular-capitao-1280.png) | [captura](evidence/phase5a44/after-reserva-comum-1280.png) | [captura](evidence/phase5a44/after-reserva-power-1280.png) |

- [Modal aberta no editor, com o contexto da página visível](evidence/phase5a44/editor-real-360.png)
- [Antes: titular capitão em 360 px](evidence/phase5a44/before-titular-capitao-360.png) · [Depois](evidence/phase5a44/after-titular-capitao-360.png)
- [Antes: reserva Power em 1280 px](evidence/phase5a44/before-reserva-power-1280.png) · [Depois](evidence/phase5a44/after-reserva-power-1280.png)
- [Medições e estilos computados anteriores, 16 casos](evidence/phase5a44/before-results.json)
- [Medições e estilos computados posteriores, 16 casos](evidence/phase5a44/after-results.json)

Em todos os 16 casos posteriores, foram verificados: módulo exclusivo no elemento renderizado, fundo branco das três ações secundárias, fundo neutro da ação especial, ícones entre 17 e 18 px, alvos de 44 px, estado correto do selo, modal inteira no viewport e ausência de rolagem horizontal. Informações foram expandidas e Escape/restauração de foco foram exercitados em cada caso. As quatro combinações de estado foram inspecionadas visualmente.

A altura com as fixtures foi de 281 px em 360/390 e 285 px em 768/1280. As capturas anteriores correspondentes mediam 294 e 282 px. A revisão não se baseou apenas nos testes automatizados.

## Preservação do campinho

Os arquivos abaixo mantiveram o mesmo SHA-256 antes e depois desta fase:

```text
LineupPitch.tsx
25E9BCF09FFF16FF839AF0139754BC2FF0156E5630215EC881829D0E05F83692
AthleteStatusIndicator.tsx
35EEF99F09C109311DF94ED8B71537BFACD918DC9CD190F0E50DEBF3B6A94B8E
```

As regras `athleteVisual` e `athleteCondition` do campo também foram mantidas, inclusive o selo de 13 px da Fase 5A.4.3.

## Arquivos desta fase

```text
src/components/point-fantasy/lineups/LineupAthleteActions.tsx
src/components/point-fantasy/lineups/LineupAthleteActions.module.css (novo)
src/components/point-fantasy/lineups/LineupBuilder.module.css (remoção de estilos obsoletos da modal)
src/components/point-fantasy/lineups/LineupAthleteActions.test.tsx
docs/phase5a44-real-athlete-dialog.md
docs/phase5a4-refinement.md (link para o relatório atual)
docs/evidence/phase5a44/*
```

## Verificações

- 154 testes relevantes aprovados em 9 arquivos.
- Após incluir as verificações de componente/grupo, 11 testes específicos da modal aprovados.
- Lint aprovado com avisos preexistentes fora deste escopo, usando a configuração legítima `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`.
- Typecheck aprovado.
- Build aprovado, com geração das 49 páginas. O CSS de produção gerado contém o módulo `LineupAthleteActions`, confirmando sua inclusão na aplicação.
- `git diff --check` aprovado.

Para conferir nesta árvore local: execute `npm.cmd run dev`, abra `/point-fantasy/escalacoes/`, autentique-se e selecione uma competição aberta. Ao abrir um atleta, o `dialog` deve conter `data-fantasy-athlete-actions="titulares"` ou `"reservas"` e classes do módulo `LineupAthleteActions`.

Não houve commit, push, merge ou deploy. As evidências não representam uma atualização do ambiente hospedado.
