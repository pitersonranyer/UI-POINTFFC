# SEO básico

O domínio usado é `https://pointffc.com.br`, documentado em
`docs/firebase-email-action.md`. A configuração compartilhada está em
`src/lib/seo.ts` e respeita a barra final da exportação estática.

A home declara seu canonical na própria página. O layout raiz não impõe
canonical nem `og:url` a todas as rotas: isso evita identificar competições,
desafios e outras URLs com parâmetros como versões da home. As oito páginas
do sitemap têm canonical e Open Graph próprios.

`public/robots.txt` permite rastreamento, inclusive dos recursos de renderização.
As páginas de conta, privadas, administrativas, a prova de conceito e o alias
dashboard usam `noindex`. Não bloquear essas rotas no robots permite ao Google
ler o noindex. A proteção de autenticação permanece independente.

`public/sitemap.xml` lista somente as oito páginas públicas trabalhadas nesta
fase. Não inclui parâmetros, páginas privadas nem as sete ligas de dados locais
com datas fixas: estas precisam de revisão de conteúdo antes de inclusão.
Atualize o sitemap quando uma nova página pública canônica for aprovada.

A imagem de compartilhamento reutiliza `public/brand/pointffc-logo.png`
(2172 × 724), sem alterações. É uma logo horizontal; uma imagem dedicada
`pointffc-og.png`, com composição própria para previews, pode ser criada depois.
Não foi criada imagem nesta fase.

A descrição do Mago usa a propriedade `rodada` do mesmo objeto fornecido à
página. Ao trocar a fonte da rodada, mantenha as duas referências alinhadas.

O build copia robots e sitemap para `out`. Nenhum servidor, SSR ou ISR é
necessário. Validar em produção e enviar o sitemap ao Search Console são
etapas posteriores à publicação; esta fase não realiza deploy.
