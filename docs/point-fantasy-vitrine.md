# POINT FFC Fantasy — vitrine e navegação

## Estrutura

- Entrada pública: `/point-fantasy`, título `POINT FFC Fantasy` e canonical `https://pointffc.com.br/point-fantasy`.
- Competição selecionada: `/point-fantasy?competicao=19`. A seleção passa o ID ao `FantasyLineupBuilder`, que mantém a autenticação e abre o `LineupEditor` existente. Não cria rascunhos ou inscrições ao entrar.
- Voltar às competições remove apenas `competicao`; demais parâmetros e hash são preservados. A navegação do histórico também sincroniza a seleção.
- Catálogo permanece em `/point-fantasy/atletas/`.
- Menus, link do catálogo e link administrativo apontam para a nova vitrine.
- Nenhum endpoint, contrato de backend, regra de inscrição ou comportamento de edição foi alterado. Login e destino após autenticação mantêm o comportamento existente.

## Dados e limites do contrato

A listagem reutiliza `listFantasyCompetitions`, inclusive paginação e validação existentes. O DTO `FantasyCompetition` não contém identificador/nome de campeonato, premiação ou partidas. Não se infere campeonato pelo título nem por `catalogoId`.

Assim, a aba disponível é **Todas**. Não há alternância entre campeonatos fictícios. Abas adicionais exigem um vínculo de campeonato na resposta da API. Premiação e número de confrontos também não são exibidos sem esses dados. A implementação não altera o backend para suprir essa limitação.

Os cards usam nome, temporada, rodada, FREE/PAGO, valor, prazo em Brasília e limite por usuário. As competições publicadas com prazo expirado continuam visíveis, com participação desabilitada. Estados encerrados retornados pela API também não oferecem participação.

A interface reavalia os prazos a cada segundo e atualiza a listagem ao recuperar foco, a cada minuto enquanto visível e pelo botão Atualizar. Requisições obsoletas são canceladas. O servidor continua sendo a autoridade final sobre disponibilidade e elegibilidade.

## Carrossel e acessibilidade

CSS scroll-snap, rolagem nativa, sem dependências novas e sem autoplay. Uma competição não mostra controles. Múltiplas competições têm anterior/próxima, posição e suporte a setas, Home e End quando o carrossel está focado. Botões internos mantêm seu comportamento de teclado. Há foco visível, estados de carregamento/erro/vazio e preferência por movimento reduzido.

## Firebase Hosting e exportação estática

`firebase.json` define dois redirects 301 por regex ancorada:

1. `^/point-fantasy/escalacoes/?$` → `/point-fantasy`.
2. `^/point-fantasy/$` → `/point-fantasy`.

Não existe wildcard para subrotas. Os caminhos de API `/point-fantasy/escalacoes/:id` não são alterados. Na auditoria, não havia páginas de editor em subrotas Next: vitrine e editor compartilhavam a mesma página e a seleção era interna. Nenhuma subrota existente foi removida.

Os redirects têm precedência sobre arquivos estáticos e rewrites, conforme a [documentação do Firebase](https://firebase.google.com/docs/hosting/full-config#hosting_priority_order). A query original é preservada pelo Hosting; hashes são tratados pelo navegador. O fallback da rota antiga, para Next local ou servidor estático simples, usa navegação cliente com query e hash intactos, `noindex` e canonical da nova entrada. O sitemap inclui somente a nova entrada.

As regex também evitam a normalização indevida de separadores de caminho encontrada no auxiliar Superstatic sob Windows. A validação usa a configuração real de Hosting, sem substituí-la por regras de teste. Não foi necessário adicionar rewrites ou alterar `next.config.mjs`.

## Verificação local

Regressão: 207 testes aprovados em 16 arquivos, incluindo editor, inscrições e histórico do Mago. Após os ajustes finais de Hosting/menu, os 15 testes específicos de vitrine e navegação também passaram. Typecheck e lint aprovados; o lint contém avisos já existentes em módulos fora deste escopo.

Build final aprovado, com 50 páginas exportadas. A configuração real de Hosting passou localmente com status 301, query intacta, canonical 200 sem loop e subrotas fora dos redirects. A exportação final passou no navegador em 320/360/768/1440 px, incluindo menu em uma linha, ausência de overflow horizontal da página, chegada ao último card por teclado e ausência de mutações ao participar. Essas verificações usam fixtures locais; não houve deploy nem validação contra alterações em produção.

- `npm.cmd run test -- src/components/point-fantasy/lineups src/components/point-fantasy/showcase src/components/navigation/Navigation.test.tsx src/data/mago src/components/mago src/components/dashboard/CartolaDashboard.test.tsx`
- `npm.cmd run typecheck`
- `npm.cmd run lint` (configuração local exige `NEXT_PUBLIC_API_URL` HTTPS pública no ambiente do comando).
- `npm.cmd run build`
- `node scripts/verify-fantasy-showcase.cjs` após o build.

O script de navegador usa Superstatic instalado com Firebase Tools e fixtures sintéticas exclusivamente locais. Verifica status 301, query preservada, canonical sem loop, exclusão das subrotas dos redirects, layout em 320/360/768/1440 px, card único, múltiplos cards, teclado, estados FREE/PAGO/encerrado, entrada autenticada e ausência de mutações. Capturas ficam em `.next/fantasy-showcase-validation/`.

Trabalho local na `main`, preservando as alterações anteriores do Mago. Nenhum commit, push, merge, PR ou deploy faz parte desta entrega.

## Arquivos desta implementação

Criados:

- `src/app/point-fantasy/page.tsx`
- `src/components/point-fantasy/showcase/FantasyShowcase.tsx`
- `src/components/point-fantasy/showcase/FantasyShowcase.module.css`
- `src/components/point-fantasy/showcase/competitionPresentation.ts`
- `src/components/point-fantasy/showcase/LegacyFantasyEntry.tsx`
- `src/components/point-fantasy/showcase/FantasyShowcase.test.tsx`
- `scripts/verify-fantasy-showcase.cjs`
- `docs/point-fantasy-vitrine.md`

Alterados:

- `firebase.json`
- `public/sitemap.xml`
- `src/app/point-fantasy/escalacoes/page.tsx`
- `src/app/point-fantasy/atletas/page.tsx`
- `src/components/admin/PointFantasySetup.tsx` (somente link)
- `src/components/navigation/Navigation.tsx`
- `src/components/navigation/Navigation.test.tsx`
- `src/components/point-fantasy/lineups/FantasyLineupBuilder.tsx` (entrada por ID, mantendo editor e autenticação)
- `src/components/point-fantasy/lineups/LineupBuilder.test.tsx`

As alterações do Mago e `docs/evidence/` já estavam presentes e foram preservadas.
