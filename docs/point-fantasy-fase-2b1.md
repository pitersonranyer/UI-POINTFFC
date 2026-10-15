# POINT FFC Fantasy — Fase 2B.1

Branch: `codex/point-fantasy-lineup-ux-phase-2b1`, criada a partir de `codex/point-fantasy-lineup-builder-phase-2b`. Escopo exclusivamente frontend. Sem commit, push, merge ou deploy.

## Auditoria e arquivos

Repositório confirmado por origin: `pitersonranyer/UI-POINTFFC`. A branch base continha os arquivos não commitados das fases 1C e 2B; todos foram preservados. Nenhum AGENTS.md foi encontrado pela pesquisa no projeto.

Foram inspecionados FantasyLineupBuilder, LineupEditor, LineupPitch, LineupAthletePicker, useLineupEditor, tipos, estilos e testes. Os filtros estavam no estado interno do seletor e desapareciam ao desmontá-lo. Capitão e Mago eram escolhidos pelos selects no resumo; clicar na camiseta preenchida abria diretamente a substituição.

Arquivos modificados nesta fase:

- `src/types/pointFantasyLineup.ts`: tipo dos filtros de apresentação.
- `src/components/point-fantasy/lineups/lineupPresentation.ts`: fábrica dos filtros padrão, com nova lista de situações por sessão.
- `src/components/point-fantasy/lineups/useLineupEditor.ts`: estado dos filtros elevado para a sessão de edição.
- `src/components/point-fantasy/lineups/LineupAthletePicker.tsx`: filtros controlados, limpeza/restauração e remoção do preço Cartola da apresentação.
- `src/components/point-fantasy/lineups/LineupPitch.tsx`: ações contextuais por atleta e badge M.
- `src/components/point-fantasy/lineups/LineupEditor.tsx`: conexão dos filtros e das escolhas de capitão/Mago ao estado existente.
- `src/components/point-fantasy/lineups/LineupBuilder.module.css`: painel de ações e estilo do badge M.
- `src/components/point-fantasy/lineups/LineupBuilder.test.tsx`: adaptação dos testes anteriores e dez testes novos de UX, incluindo caso parametrizado de remoção.

Criados:

- `src/components/point-fantasy/lineups/LineupAthleteActions.tsx`: painel contextual acessível.
- Este relatório.

Nenhum serviço HTTP, endpoint, contrato de salvamento, autenticação, SVG de uniforme, backend, banco, Prisma ou migration foi alterado. POC `/fantasy/`, módulos financeiros, ligas, desafios e demais módulos existentes preservados.

## Filtros e preço

O seletor recebe `filters` e `onFiltersChange`. `useLineupEditor` mantém busca, clube, categoria e situações enquanto o editor da competição está montado. Fechar o seletor, selecionar/remover atletas, mudar formação, salvar, duplicar, retomar, excluir ou iniciar outro rascunho não reinicia essas preferências. Os filtros não fazem parte da seleção enviada à API e não deixam um rascunho marcado como alterado.

Uma nova sessão de editor começa com busca/clube/categoria vazios e Provável + Dúvida. Recarregar a página, sair do editor da competição ou trocar de sessão de usuário reinicia as preferências. Não há persistência em banco, localStorage ou outro armazenamento de navegador.

A posição continua definida exclusivamente pelo slot; trocar ZAG por MEI muda a posição e conserva os outros filtros. A página visual do seletor volta ao início em nova abertura ou alteração de filtros, evitando páginas vazias antigas. Filtros sem resultados continuam visíveis e não são limpos automaticamente, inclusive quando a seleção de situações está vazia.

Para técnicos, o filtro de categoria é desabilitado e temporariamente não aplicado: técnicos não têm categoria. O valor escolhido fica visível, com uma explicação, e volta a ser aplicado ao selecionar jogadores.

Ações explícitas:

- **Limpar filtros**: limpa busca/clube/categoria e inclui todas as situações, inclusive desconhecidas.
- **Restaurar filtros padrão**: limpa busca/clube/categoria e volta a Provável + Dúvida.
- Controles anteriores de selecionar todas, limpar situações e restaurar Provável + Dúvida continuam disponíveis e alteram somente situações.

Removida a apresentação do preço original e de qualquer símbolo C$ no seletor. Permanecem categoria, POINTCOINS, clube, posição, apelido, situação e SVGs. `precoCartola` continua nos tipos/contratos existentes, sem alteração de preços ou categorias.

## Clique nos atletas e badges

- **Slot vazio:** abre diretamente o seletor da posição em um clique, sem painel contextual.
- **Titular:** abre ações Tornar capitão/Remover capitão, Trocar atleta e Remover atleta.
- **Reserva:** abre ações Tornar Reserva do Mago/Remover título de Reserva do Mago, Trocar atleta e Remover atleta. Goleiro reserva também é elegível.
- **Técnico:** oferece somente troca e remoção.

Existe um único estado de painel no campinho. Escolher qualquer ação fecha o painel; Trocar atleta fecha as ações e abre o seletor. O painel fecha por Esc, botão Fechar e clique no fundo externo. É um dialog nativo com botões semânticos, título acessível, `aria-haspopup="dialog"`/`aria-expanded` nos atletas, circulação de foco com Tab/Shift+Tab e retorno ao controle de origem. Não depende de hover. Bloqueio, salvamento ou alteração da seleção fecha o painel para evitar ações sobre atleta antigo.

Atletas excedentes após mudança de formação continuam removíveis pelo painel; a troca fica indisponível nesses slots até o ajuste da composição, mantendo a validação preventiva existente.

Escolher capitão/Mago substitui o ID anterior sem confirmação extra e marca o rascunho como alterado. Remover o título envia null no próximo salvamento. Trocar/remover o atleta limpa o título correspondente pelo mecanismo já existente. Os selects do resumo foram mantidos como alternativa.

Capitão mantém o círculo com **C**. O Reserva do Mago recebe um badge dourado retangular com **M** e uma estrela pequena, posicionado sobre a camiseta, acima do nome. Usa `role="img"`, `aria-label="Reserva do Mago"` e title com o texto completo. Forma, letra e estrela distinguem o papel sem depender só da cor. Apenas o reserva escolhido recebe o badge.

Nenhum autosave foi introduzido. A próxima ação explícita de salvar envia `capitaoAtletaId` e `reservaMagoAtletaId` pelo contrato existente, com a versão atual. Duplicação, exclusão, bloqueio temporal, 409 e `validacao.completa` continuam no fluxo anterior.

## Testes e verificações

- Suíte completa: **68 arquivos, 827 testes aprovados**, por `npm run test -- --maxWorkers=2 --minWorkers=1`. Dez testes novos de UX em relação aos 817 da Fase 2B.
- Após o ajuste final de circulação de foco no painel, reexecutado o arquivo afetado: **31 testes aprovados**, incluindo as sete formações, filtros, papéis, rascunhos e 409. A checagem em navegador também foi repetida com o ajuste.
- `npm run lint`: aprovado com URL pública definida somente no processo (`NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`), seguindo a configuração preexistente que exige HTTPS pública. Avisos preexistentes de imagens/hooks permanecem em módulos não alterados; nenhum aviso novo nos arquivos desta fase.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado, mantendo exportação estática e as rotas anteriores.
- `git diff --check`: sem erros.

Cobertura de UX: ausência de preço Cartola, categoria/POINTCOINS mantidos, clube/categoria/busca/situações entre aberturas, troca de posição e categoria de técnicos, estado vazio sem limpeza automática, limpeza/restauração explícitas, filtros após salvar/duplicar/retomar/excluir/novo rascunho, slot vazio direto, capitão/Mago por clique, substituição e remoção dos títulos, goleiro como Mago, unicidade do badge M, C preservado, remoção dos atletas com limpeza de papéis, técnico sem ações de título, troca via painel, fechamento por cancelamento/clique externo, Tab/Shift+Tab, ausência de autosave e envio dos novos papéis com versão no PATCH. Testes anteriores continuam cobrindo as sete formações e o controle de concorrência.

Edge headless/Playwright, larguras **320, 390 e 1280 px**, com componentes reais e serviços/dados exclusivos de teste:

- Enter abre ações; Tab circula dentro delas; Esc fecha e devolve o foco; clique fora fecha.
- Capitão e Mago atualizam e entram na seleção salva com a versão correta; goleiro reserva pode receber M.
- Badge M único, sem cobrir o nome do atleta; layout sem overflow horizontal.
- Filtros preservados ao selecionar substituto, salvar, duplicar e abrir outra posição.
- Preço Cartola ausente no seletor; nenhum erro JavaScript.
- Captura mobile inspecionada visualmente. Harness e imagens temporários removidos ao final.

## Pendências e riscos

As quatro melhorias de frontend foram implementadas e verificadas. Permanece a pendência já registrada na Fase 2B de homologar gravações com uma sessão real de participante na API local. Nesta fase, as gravações foram verificadas com serviços controlados de teste; não houve escrita no backend ou no banco real.

A limitação anterior do dicionário de situações permanece: o namespace Fantasy não fornece o dicionário e o frontend usa os códigos já auditados, com opção explícita para desconhecidos. Nenhum código novo foi inventado.

Filtros são preferências em memória da sessão de edição, portanto retornam ao padrão quando o editor é desmontado ou a página é recarregada, conforme o ciclo de vida adotado. Alterações locais de escalação continuam exigindo salvamento explícito. As fases anteriores permanecem não commitadas, como encontradas.

Sem confirmação, inscrição, pagamento, pontuação, ranking ou substituições automáticas. Sem alteração de produção.
