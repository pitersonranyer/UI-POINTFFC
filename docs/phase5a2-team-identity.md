# Fase 5A.2 — gerenciamento compacto de times

Branch: `codex/point-fantasy-team-identity-phase5a2`.

A tela alterna entre “Meu time” (sem rascunhos conhecidos) e “Meus times”. O primeiro estado oferece nome padrão, personalização e prévia explicitamente ilustrativa. O segundo reúne seletor, novo time, duplicação e exclusão confirmada. O salvamento continua abaixo do gramado. IDs e operações dos rascunhos legados foram preservados.

## Contrato atual e limites

`FantasyLineup` não possui nome-base, identificador público, nome público ou sequencial. Criação e atualização recebem somente `LineupSelection`; duplicação recebe versão. Nenhum endpoint, campo de contrato ou armazenamento local foi adicionado.

O nome digitado é somente uma prévia em memória e **não é enviado nem persistido**. A interface informa isso antes do salvamento. `#…` é um marcador ilustrativo, nunca um ID interno ou uma reserva de nome. Rascunhos existentes continuam com seus rótulos legados estáveis; não são apresentados nomes simulados como persistidos.

Depois de observar um rascunho salvo, a tela mantém o gerenciamento mesmo que todos sejam excluídos durante aquela montagem do editor. Ao sair e retornar, se não houver mais rascunhos, a API não permite distinguir um participante novo de alguém que excluiu todos os times. O bloqueio definitivo depende do backend.

## Pendências da Fase 5B

- Persistir identidade por participante autenticado e competição, independentemente da existência de rascunhos.
- Definir o contrato de leitura e gravação de nome-base e identificador público seguro.
- Retornar o nome público real para identificação no seletor e na tela.
- Atribuir sequenciais transacionais e crescentes também na duplicação, sem reutilizar os excluídos.
- Garantir exclusividade na competição e impedir renomeação após o primeiro salvamento.
- Integrar a tela ao contrato aprovado e testar reabertura, concorrência, troca de participante e exclusão de todos os rascunhos.

## Validação visual local

Execute `npm.cmd run dev` e abra `/point-fantasy/escalacoes/` na porta informada pelo Next. Use uma conta ativa e competição aberta. Teste sem rascunhos, altere o nome, salve, crie outro time, navegue, duplique e exclua com confirmação. O campo de nome não deve reaparecer durante essa sessão após excluir o último rascunho. Confira também recusa de confirmação e falha de salvamento.

Em larguras de 360, 390 e 768 px, confira nomes longos, ações por toque, treinador no gramado e acesso ao salvamento acima da navegação inferior. A revisão visual em navegador autenticado permanece necessária.

## Verificações executadas

- Suíte completa: 907 testes aprovados em 77 arquivos.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run lint`: aprovado com avisos preexistentes; executado com `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com`, conforme a validação legítima de configuração do projeto.
- `npm.cmd run build`: compilação, validação de tipos e geração das 49 páginas concluídas, com avisos preexistentes.
- `git diff --check`: aprovado.
- Chrome via Playwright, em harness isolado com componentes reais e dados de teste: estados inicial e com rascunho em 360, 390, 768 e 1280 px sem rolagem horizontal. Captura de 360 px com rascunho inspecionada: ações acessíveis e treinador dentro do gramado. Esse harness não inclui a navegação global nem uma sessão autenticada real; não substitui a conferência integrada local acima.

Não houve commit, push, merge ou deploy.
