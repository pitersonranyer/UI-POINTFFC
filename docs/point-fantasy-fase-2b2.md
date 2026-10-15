# POINT FFC Fantasy — Fase 2B.2

Branch utilizada: `codex/point-fantasy-continuous-selection-phase-2b2`, criada a partir de `codex/point-fantasy-lineup-ux-phase-2b1`. Implementação exclusivamente frontend, sem commit, push, merge ou deploy.

## Auditoria e alterações

Repositório confirmado por origin: `pitersonranyer/UI-POINTFFC`. As alterações locais não commitadas das fases anteriores foram preservadas. Nenhum AGENTS.md foi encontrado pela pesquisa no projeto.

Inspecionados LineupEditor, LineupPitch, LineupAthletePicker, useLineupEditor, LineupAthleteActions, tipos, regras de formação/reservas e testes. Antes desta fase, cada escolha limpava `slot` e a chave do componente incluía o índice do slot, provocando fechamento/remontagem. Os filtros já estavam corretamente no estado do editor pela Fase 2B.1.

Arquivos modificados nesta fase:

- `src/types/pointFantasyLineup.ts`: sessão de seleção com modo preenchimento/troca e tipo do mapeamento visual local.
- `src/components/point-fantasy/lineups/lineupPresentation.ts`: capacidade por posição/papel, associação visual às vagas e transição de seleção/avanço.
- `src/components/point-fantasy/lineups/useLineupEditor.ts`: abertura com modo explícito, atualização local por seleção, avanço e preservação da ocupação visual.
- `src/components/point-fantasy/lineups/LineupEditor.tsx`: conexão do fluxo contínuo e remoção da chave que remontava o seletor.
- `src/components/point-fantasy/lineups/LineupPitch.tsx`: leitura da ocupação visual local, preservando camisetas, papéis e ações existentes.
- `src/components/point-fantasy/lineups/LineupAthletePicker.tsx`: progresso acessível, Concluir, gerenciamento de foco e diálogo estável.
- `src/components/point-fantasy/lineups/LineupBuilder.module.css`: indicador compacto e cabeçalho fixo dentro do seletor para manter as ações de fechamento acessíveis durante a rolagem.
- `src/components/point-fantasy/lineups/LineupBuilder.test.tsx`: adaptação do fechamento manual e da localização de vagas aos novos comportamentos.

Arquivos criados:

- `src/components/point-fantasy/lineups/ContinuousSelection.test.tsx`: 18 testes novos.
- Este relatório.

Sem alterações em backend, banco, Prisma, migrations, serviços HTTP, autenticação, uniformes, contratos de salvamento ou POC `/fantasy/`.

## Funcionamento do modo contínuo

Ao abrir uma vaga vazia, a sessão recebe modo `fill`, posição, papel e índice. A seleção preenche essa vaga, atualiza o elenco local e procura a próxima vaga vazia da mesma posição e do mesmo papel. A ordem segue os índices visuais depois da vaga atual; se necessário, retorna ao início do grupo e ignora vagas ocupadas. Não avança para outra posição nem troca titular por reserva.

Exemplo: em 4-3-3, clicar ATA 1 permite escolher três atacantes consecutivos; o seletor fecha após o terceiro. Se a abertura começar em ATA 3, o primeiro atleta ocupa ATA 3 e o avanço segue ATA 1 e ATA 2, sem sobrescrever jogadores existentes.

As seleções do contrato HTTP são arrays de IDs internos, sem coordenadas/índices físicos de vagas. Para respeitar a vaga clicada mesmo quando ela não é a primeira vazia, um mapeamento exclusivamente visual associa posição/papel/índice ao ID do atleta durante a sessão. Remover um atleta não desloca silenciosamente os outros atletas enquanto o editor está aberto. Esse mapeamento não entra no corpo de POST/PATCH nem altera os IDs salvos.

Os filtros de busca, clube, categoria e situações continuam no useLineupEditor. Selecionar um atleta não altera filtros nem reinicia a paginação; o número da página só é limitado ao total disponível se a remoção do atleta da lista reduzir o número de páginas. Filtros sem resultados permanecem como escolhidos, com o estado vazio e as ações anteriores de ajuste/restauração.

O diálogo permanece montado entre vagas. Após cada escolha, o foco vai para uma opção habilitada próxima da anterior na página atual. Se não houver candidatos habilitados, vai para Concluir. Não há perda de foco para o fundo da página. Tab/Shift+Tab circulam dentro do diálogo.

Indicador compacto com `role="status"`, `aria-live="polite"` e `aria-atomic="true"`: por exemplo, **Atacantes: 1 de 3. Selecionando vaga 2.** Quando resta uma vaga, acrescenta **Só falta uma vaga.** O cálculo inclui atletas escolhidos antes da abertura atual.

## Titulares, reservas e substituições

- Titulares seguem as quantidades já definidas pelas sete formações. Goleiro e técnico encerram após a escolha única; o técnico continua separado dos onze titulares.
- Reservas usam somente as capacidades do banco. Em 3-5-2 e 3-4-3, os dois zagueiros reservas podem ser escolhidos na mesma abertura. Não há avanço de zagueiro reserva para lateral, meia, goleiro ou atacante, nem para titulares.
- A seleção usa o atleta canônico dos elegíveis pelo ID interno. Rejeita duplicatas, posição incompatível, ID fora dos elegíveis, vaga já ocupada no modo preenchimento e categoria inválida/superior ao teto do reserva. O seletor continua desabilitando opções de reserva com categoria superior. Sem titular de referência, a categoria permanece pendente como na fase anterior.
- **Trocar atleta** abre modo `replace` para aquela vaga. Substitui uma única seleção e fecha, mesmo quando existem outras vagas vazias da posição. O painel informa **Substituição individual.** Os filtros ficam preservados.
- Capitão e Reserva do Mago permanecem nas seleções que não os afetam. Substituir/remover o atleta com um desses títulos limpa somente o título correspondente pelo mecanismo existente. Os badges e ações da Fase 2B.1 permanecem.

## Fechamento e integridade

O seletor fecha ao completar o grupo, por Concluir, pelo botão Fechar ou por Esc. Interromper uma sequência mantém tudo que já foi escolhido. O foco retorna ao controle de origem ao fechar.

Cada seleção altera apenas o estado local. **Não há POST/PATCH por atleta nem autosave.** Persistência exige Salvar rascunho. Controle de versão, operações de rascunho, tratamento de 409 e validação final pelo servidor continuam no fluxo anterior.

A ação de seleção também verifica o bloqueio temporal imediatamente, além da atualização visual periódica já existente. Se o horário de bloqueio for atingido durante a sequência, novas escolhas são recusadas e a interface preserva as escolhas anteriores, fechando o seletor ao atualizar o estado de bloqueio. O relógio/validação definitivos continuam sendo do backend.

## Resultados das verificações

- `npm run test -- --maxWorkers=2 --minWorkers=1`: **69 arquivos, 845 testes aprovados**; 18 testes novos em relação aos 827 da fase anterior.
- Testes específicos de escalação: **72 testes aprovados** nos três arquivos de UI/regras, incluindo os anteriores de sete formações, categorias, capitão/Mago, salvamento, versões e 409.
- `npm run lint`: aprovado com `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com` definida somente no processo, conforme exigência da configuração preexistente. Permanecem avisos anteriores de imagens/hooks em módulos não alterados; sem novos avisos nos arquivos desta fase.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; exportação estática preservada, com as 47 páginas e rotas das fases anteriores. Avisos preexistentes em outros módulos permanecem.
- `git diff --check`: sem erros.

Cobertura nova: três atacantes, cinco meias, zagueiros, laterais, goleiro/técnico únicos, grupos parciais, início por vaga não inicial, ordem circular previsível, filtros preservados, progresso e última vaga, identidade do diálogo, foco após escolha, fechamento completo/manual por três mecanismos, substituição sem avanço, dois zagueiros reservas nas duas formações aplicáveis, duplicatas/cliques repetidos, inelegibilidade/posição, categoria dos reservas, preservação e limpeza de papéis, bloqueio durante a sequência e ausência de autosave.

Edge headless/Playwright em **320, 390 e 1280 px**, usando componentes reais com serviços e dados explicitamente de teste:

- Três atacantes escolhidos com Enter, numa única abertura, começando por ATA 3.
- Mesmos nós de diálogo e campo de busca durante o avanço; foco mantido nos controles e filtros preservados.
- Vaga clicada respeitada, progresso atualizado, aviso de última vaga e fechamento automático ao completar a posição.
- Concluir/Esc mantêm seleções parciais; reabertura mostra o progresso acumulado.
- Substituição fecha após uma escolha, inclusive em grupo ainda incompleto.
- Dois zagueiros reservas preenchidos em sequência, sem misturar papéis/posições.
- Zero salvamentos automáticos, zero erros JavaScript e ausência de overflow horizontal.
- Captura mobile de 320 px inspecionada visualmente: progresso compacto, filtros visíveis e ações de fechamento legíveis.

Harness e capturas temporários foram removidos ao final. Não há identidade fictícia ou bypass de autenticação na aplicação entregue.

## Pendências e riscos

As melhorias de seleção contínua foram concluídas no frontend. A homologação autenticada com usuário real na API local continua como pendência das fases anteriores; esta fase não alterou contratos nem realizou gravações no backend real. As verificações de interação usaram fixtures controladas.

O posicionamento físico dentro do grupo fica em memória, pois o contrato atual salva a composição por arrays de IDs. Após desmontar/recarregar o editor, a composição e os títulos são reconstituídos pelos dados do servidor em ordem canônica. Não foi adicionado campo de coordenada ou índice ao backend.

Persistem as limitações anteriores do dicionário de situações e do relógio local para prevenção visual de bloqueio; o backend permanece a autoridade final. Os arquivos não commitados das fases anteriores foram preservados.

Sem confirmação, inscrição, pagamento, pontuação, ranking, substituição automática ou alteração de produção.
