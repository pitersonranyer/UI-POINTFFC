# Fase 5A.4 — ações dos atletas e condição no campo

Registro da implementação inicial. O posicionamento e o cabeçalho foram refinados depois; consulte o [relatório atualizado](phase5a4-refinement.md) e suas novas evidências.

Branch preservada: `codex/point-fantasy-team-identity-phase5a2`.
O status inicial continha as alterações locais das fases 5A.2 e 5A.3. Elas foram preservadas. Não houve troca de branch, commit, push, merge, deploy ou alteração no backend/banco.

## Implementação

`LineupAthleteActions` continua sendo o único componente de ações para titular, reserva e técnico. Recebe os mesmos dados, estados e callbacks. O cabeçalho agora reúne camisa, posição/papel, nome e fechar com X. As ações são linhas sem preenchimento grande, com ícones de `lucide-react`, já instalado. Capitão e Reserva Power ativos usam dourado discreto. A remoção vem por último, em vermelho e com divisor; apenas seu rótulo mudou de “Vender” para “Remover da escalação”. A venda no seletor de atletas permanece intacta.

As informações existentes continuam no mesmo `details` nativo, agora com o rótulo “Informações do atleta”, antes da remoção. Clube, posição, situação capturada, categoria, PointCoins e preço Cartola foram preservados. O técnico não recebe ações de capitão ou Power; a troca continua ausente quando `canReplace` for falso.

O `dialog` nativo mantém fechamento por Escape/cancel, X e backdrop, contenção de Tab/Shift+Tab e restauração de foco no acionador. O foco inicial é explícito no fechar. Alvos de toque têm no mínimo 44 px. O modal usa fundo branco, borda dourada discreta e o comportamento mobile de folha inferior existente.

No `LineupPitch`, a camisa ganhou um contêiner visual: condição no canto superior direito, capitão/Power no esquerdo. Não foi aumentada a área do slot nem alterada a formação. Titulares, reservas e técnico usam o indicador; o técnico já possuía `statusId` e renderização desse conceito. O mapeamento foi centralizado, sem alterar contratos HTTP ou regras de negócio.

## Origem dos dados e mapeamento auditado

O contrato `PointFantasyAthlete` possui `statusId`. O serviço Fantasy já devolve atletas do catálogo em lote. No backend, `point-fantasy.service.ts` captura `statusId` de `a.status_id`; esta fase apenas leu esse código. O dicionário real capturado em `public/data/cartola-market.json` e a auditoria anterior em `docs/point-fantasy-fase-2b.md` confirmam:

| statusId | Condição | SVG | Cor |
| --- | --- | --- | --- |
| 7 | Provável | Check | Verde |
| 2 | Dúvida | Interrogação | Amarelo |
| 5 | Contundido | Cruz | Vermelho |
| 3 | Suspenso | Cartão | Vermelho |
| 6 | Nulo | Traço | Cinza |
| ausente, null, 0 ou desconhecido | Sem condição conhecida | Sem indicador | — |

Ausência não é convertida em Nulo. O indicador aceita ausência defensivamente sem modificar o tipo do contrato oficial. A cada atualização das props, reflete o valor recebido; não mantém condição em estado local, não faz inferências de preço/pontos e não realiza chamadas por jogador. Cada SVG possui nome acessível e `title` “Condição: …”.

Limitações: o Fantasy não fornece um endpoint de dicionário de condições; códigos futuros precisam ser auditados antes de serem adicionados. A condição é a capturada no catálogo, sem promessa de atualização em tempo real. A tentativa de leitura da API pública nesta sessão falhou com `fetch failed`; nenhum valor de resposta ao vivo foi presumido. O mapeamento acima foi confirmado pelos dados locais reais capturados e pelo código de integração existente.

## Arquivos desta fase

```text
src/types/pointFantasy.ts
src/components/point-fantasy/athletes/AthleteStatusIndicator.tsx
src/components/point-fantasy/athletes/AthleteStatusIndicator.test.tsx (novo)
src/components/point-fantasy/lineups/lineupPresentation.ts
src/components/point-fantasy/lineups/LineupPitch.tsx
src/components/point-fantasy/lineups/LineupAthleteActions.tsx
src/components/point-fantasy/lineups/LineupAthleteActions.test.tsx (novo)
src/components/point-fantasy/lineups/LineupBuilder.module.css
src/components/point-fantasy/lineups/LineupBuilder.test.tsx
docs/phase5a4-athlete-actions.md
docs/evidence/phase5a4/*
```

Reutilizados: `LineupAthleteActions`, `AthleteStatusIndicator`, `ClubJersey`, `dialog`/`details` nativos e ícones existentes de `lucide-react`. Nenhuma biblioteca ou novo componente de UI foi necessário.

## Testes e verificações

- Suíte completa: **959 testes aprovados em 80 arquivos**, incluindo os testes da Fase 5A.3.
- Novos testes: 23, cobrindo os cinco status, desconhecidos/ausentes, atualização do catálogo, ações por papel, estados de capitão/Power, troca, remoção, informações, foco, teclado, fechamento e indicadores no campo/banco.
- Lint: aprovado com avisos preexistentes fora deste escopo. Usada a configuração legítima `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`.
- Typecheck: aprovado, executado antes do build para evitar concorrência sobre `.next/types`.
- Build: aprovado, com geração das 49 páginas e avisos preexistentes.
- `git diff --check`: aprovado.

## Responsividade

Chrome, 900 px de altura, componentes reais em um harness isolado com fixtures de atletas identificadas como teste. Não houve gravação no backend. Foram exercitados titular e reserva, abertura de informações, Escape e restauração de foco em cada largura.

| Largura | Modal titular/reserva | Altura fechada | Alvos | Rolagem horizontal | Sobreposição de badges |
| --- | --- | --- | --- | --- | --- |
| 360 px | Inteiro no viewport | 278 px | 44 px | Nenhuma | Nenhuma |
| 390 px | Inteiro no viewport | 278 px | 44 px | Nenhuma | Nenhuma |
| 768 px | Inteiro no viewport | 266 px | 44 px | Nenhuma | Nenhuma |
| 1280 px | Inteiro no viewport | 266 px | 44 px | Nenhuma | Nenhuma |

Indicadores medidos com 16 px. Técnico dentro do gramado em todas as larguras. Informações expandidas também ficaram dentro do viewport. Conferidos visualmente campo em 360 px, titular em 360 px e reserva em 1280 px.

- [Campo e banco em 360 px](evidence/phase5a4/pitch-360.png)
- [Campo e banco em 1280 px](evidence/phase5a4/pitch-1280.png)
- Titulares: [360](evidence/phase5a4/titular-360.png), [390](evidence/phase5a4/titular-390.png), [768](evidence/phase5a4/titular-768.png), [1280](evidence/phase5a4/titular-1280.png)
- Reservas: [360](evidence/phase5a4/reserva-360.png), [390](evidence/phase5a4/reserva-390.png), [768](evidence/phase5a4/reserva-768.png), [1280](evidence/phase5a4/reserva-1280.png)
- [Medições](evidence/phase5a4/layout-results.json)

O harness não inclui autenticação nem a navegação global. Navegação entre times e identidade pública permanecem cobertas pelos testes existentes. A conferência integrada local e o teclado virtual físico não são substituídos pelas capturas.

Para conferir no app completo, execute `npm.cmd run dev`, abra `/point-fantasy/escalacoes/` com conta ativa e competição aberta. Abra as ações de titular, reserva e técnico; alterne capitão/Power, troque/remova atletas, expanda informações e confira o retorno de foco. Valide também alternância entre times, salvamento e os indicadores disponíveis no catálogo configurado.
