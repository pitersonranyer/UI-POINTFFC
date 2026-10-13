# GitHub Actions → Firebase Hosting — preparação

## Estado desta fase

- Repositório: `pitersonranyer/UI-POINTFFC` (público; ID imutável `1349709751`).
- Branch auditada: `main`.
- Commit auditado: `786a7234fdb5c19c048854c1474655a1fd0d0f69` (11/10/2026 18:43 UTC), igual ao commit do diagnóstico anterior.
- O repositório não tinha workflows em `.github/workflows`; `main` está sem proteção.
- Acesso de escrita ao repositório está disponível. Os arquivos desta fase foram preparados em `codex/pointffc-github-actions-phase-2`, branch separada do commit auditado. Nenhum PR foi criado, nenhum commit foi feito em `main` e nada foi publicado.
- Não há ferramenta Firebase/Google Cloud conectada nesta sessão. A tela do Console informada anteriormente prova que o domínio personalizado está conectado, mas não expõe aqui o identificador do Hosting Site via API/CLI.
- **Hosting Site ID ainda pendente de confirmação.** `app-pointdojogador` é o valor esperado, não confirmado nesta sessão. O .firebaserc aponta apenas o Firebase Project ID, o que não substitui uma consulta de Hosting Site ID.

## Auditoria do build

- `package.json`: `npm test` executa `vitest run --pool=forks`; `npm run lint` executa `next lint`; `npm run typecheck` executa `tsc --noEmit`; `npm run build` executa `scripts/build-production.mjs`.
- `package-lock.json` trava as dependências; a versão de Firebase CLI registrada no diagnóstico é 14.27.0. A validação não executa a CLI Firebase.
- `next.config.mjs`: exportação estática (`output: "export"`) e valida que `NEXT_PUBLIC_API_URL` seja HTTPS pública no build de produção.
- `scripts/build-production.mjs` define, antes de iniciar Next, o fallback já versionado `https://api-pointffc.onrender.com`. Logo, o workflow não precisa de variável/secreto para a URL da API. Um `.env.local` não é trazido pelo checkout e não será criado.
- `firebase.json` usa `public: "out"`, `cleanUrls: true` e `predeploy: ["npm run build"]`. Foi preservado.
- `.firebaserc` define o alias default como `app-pointdojogador`; isso identifica o projeto Firebase, mas não valida o Site ID nem seleciona sites adicionais.

## Variáveis de build

Todas as variáveis abaixo são configurações cliente `NEXT_PUBLIC_*` e entram no JavaScript exportado. Não são segredos de servidor; use GitHub **Actions Variables**, não Secrets, e não imprima os valores nos logs.

| Nome da Actions Variable | Uso / regra observada | Origem |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web SDK; necessária para inicializar o app Firebase. | Firebase Console → configuração do app Web deste projeto. Não disponível nesta sessão. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio do Firebase Auth usado pelo SDK. O valor esperado informado para o projeto é `pointffc.com.br`; o workflow falha se outro valor estiver configurado. | Confirmar na configuração real do app Web / Firebase Authentication antes de cadastrar. |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database; o app instancia `getDatabase(firebaseApp)`. | Firebase Console → Realtime Database / configuração do app Web. Não disponível nesta sessão. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Web SDK. Deve ser o ID do projeto, esperado como `app-pointdojogador`. | Configuração real do app Web; comparar com .firebaserc. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Web SDK / Storage. | Configuração real do app Web. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Web SDK. | Configuração real do app Web. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web SDK. | Configuração real do app Web. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Opcional; configuração de Analytics. | Configuração do app Web, se Analytics estiver ativado. |
| `NEXT_PUBLIC_CARTOLA_SEASON` | `src/config/cartola.ts`; sem valor o código usa 2026. A variável do exemplo também está desatualizável; workflow exige valor para evitar embutir fallback sem revisão. | Temporada correta para a versão que será validada, definida pelo responsável pelo produto. |
| `NEXT_PUBLIC_CARTOLA_ROUND` | `src/config/cartola.ts`; sem valor o código usa rodada 25. O workflow exige valor para não compilar silenciosamente um fallback possivelmente obsoleto. | Rodada correta para a versão que será validada. |
| `NEXT_PUBLIC_CARTOLA_ADMIN_SEASONS` | Opcional; temporadas adicionais no seletor administrativo. Sem valor, lista somente a temporada configurada. | Configuração aprovada do produto, se aplicável. |
| `NEXT_PUBLIC_WHATSAPP_SUPORTE_URL` | Opcional. `src/config/whatsappSupport.ts` valida convites HTTPS de grupo e tem fallback versionado para o convite atual; sem Actions Variable o build ainda tem URL definida. | Link de suporte aprovado. Não é necessário cadastrar nesta fase. |

O arquivo `.env.example` deixa em branco as variáveis Firebase e traz valores de exemplo de temporada/rodada; nenhum valor de exemplo foi copiado para o workflow. As configurações Firebase reais precisam ser fornecidas pelo Console autorizado. A variável `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` será validada contra `pointffc.com.br`, mas não foi confirmada por consulta live nesta execução.

## Workflow de validação preparado

Arquivo: `.github/workflows/pointffc-validate.yml`.

- Disparo somente manual (`workflow_dispatch`); sem `push`, `pull_request` ou agendamento.
- Permissão única: `contents: read`. Não tem `id-token: write`, login Google, token Firebase, secretos, etapa de deploy ou upload de artefatos.
- Usa Node.js 22, cache npm, `npm ci`, testes, lint, typecheck e build estático; timeout de 30 minutos e grupo de concorrência que serializa execuções por ref.
- Testes/lint/typecheck rodam antes do gate de configuração e do build. Se os valores obrigatórios não estiverem cadastrados, o job falha de modo explícito antes do build, em vez de compilar com config Firebase incompleta ou rodada/temporada fallback.
- Nenhum artefato é publicado ou persistido. O build estático é usado apenas dentro do runner efêmero.
- A validação de YAML e do conteúdo é estática nesta preparação. Não foi possível executar o workflow real: o arquivo ainda não está na branch default, o GitHub exige que `workflow_dispatch` esteja disponível na branch default, e nenhuma execução pode ocorrer sem integrar a alteração. Também não foi possível executar `npm ci` ou os scripts sem checkout local do repositório e sem as variáveis Firebase reais.

## Plano WIF para deploy futuro (não configurado)

A arquitetura planejada é GitHub Actions → GitHub OIDC → Workload Identity Federation → Service Account dedicada → Firebase Hosting, usando credenciais curtas. Não criar chave JSON.

**Pool e provider propostos**

- Pool global: `github-pointffc-prod`.
- Provider OIDC: `github-pointffc-main`.
- Issuer: `https://token.actions.githubusercontent.com`.
- Mapeamento: `google.subject=assertion.sub`, `attribute.repository=assertion.repository`, `attribute.repository_id=assertion.repository_id`, `attribute.repository_owner_id=assertion.repository_owner_id`, `attribute.ref=assertion.ref`, `attribute.event_name=assertion.event_name`.
- Condição de atributo do provider: exigir simultaneamente repository ID `1349709751`, nome `pitersonranyer/UI-POINTFFC`, owner ID `33806295`, `ref == refs/heads/main` e `event_name == push`. Isso limita a federação ao repositório imutável validado e à branch/ação pretendidas.
- Criar uma Service Account dedicada, por exemplo `github-pointffc-deploy@app-pointdojogador.iam.gserviceaccount.com`; permitir que o principal federado do repositório a impersonifique com `roles/iam.workloadIdentityUser`. Mapear também o atributo de ref e aplicar a restrição main no provider. Não conceder Owner ou Editor.
- Em workflows que chamam WIF, GitHub precisa conceder `id-token: write` apenas ao job de deploy e `contents: read`; o workflow de validação não recebe essas permissões.

**Permissões Firebase a avaliar para a Service Account**

A documentação atual do Firebase diz que papéis personalizados não podem controlar acesso aos recursos Firebase Hosting. O menor papel predefinido específico de Hosting para publicar é `roles/firebasehosting.admin`, mais `roles/serviceusage.apiKeysViewer`, exigido pelo Firebase CLI para visualizar chaves de API. O papel Hosting Admin também inclui criação e remoção de sites; isso não será usado pelo workflow. A publicação deve usar exclusivamente `firebase deploy --only hosting`, sem comandos de criar site/target, e só depois de confirmar o site de destino. Nunca conceder Owner/Editor.

Antes da implantação, habilitar/revisar as APIs do Firebase Hosting e as APIs de suporte que o CLI reportar (Firebase Management, Service Usage e API Keys), usando uma identidade administrativa separada; a Service Account de deploy não deve poder habilitar APIs. Confirmar as permissões da versão travada 14.27.0 durante a preparação da Fase 3, pois o CLI e as funções da Hosting API podem mudar.

**GitHub Actions Variables futuras para WIF/deploy**

| Nome | Finalidade / origem |
| --- | --- |
| `GCP_WIF_PROVIDER` | Nome completo do provider, incluindo número do projeto WIF, pool e provider; copiar do recurso efetivamente criado no Google Cloud. |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | E-mail da Service Account dedicada. |
| `GCP_PROJECT_ID` | `app-pointdojogador`, conferido com .firebaserc e projeto Firebase. |
| `FIREBASE_HOSTING_SITE_ID` | O ID retornado pela consulta autorizada de Hosting; permanece pendente. Se não for igual ao site default do projeto, pausar e definir uma seleção explícita de site antes de publicar. |

Nenhuma destas variáveis WIF foi cadastrada.

## Desenho proposto do workflow futuro de deploy

Arquivo planejado, **não criado**: `.github/workflows/pointffc-deploy.yml`.

1. Gatilho `push` apenas na branch `main`; job de produção com concorrência única e sem cancelamento de deploy em andamento.
2. Checkout do SHA do push, Node.js 22, `npm ci`, testes, lint e typecheck.
3. Verificar que `GCP_PROJECT_ID` e o Site ID foram confirmados e correspondem à seleção do Hosting.
4. Executar `npm run build` uma única vez; autenticar via WIF somente depois das validações/build (job recebe `id-token: write`).
5. Publicar com `firebase deploy --only hosting --project app-pointdojogador --non-interactive`, sem deploy de Auth, banco, Storage ou backend.
6. Registrar o SHA completo no resumo/log da implantação e reter o link/identificador de release conforme a saída da CLI, sem artefatos contendo configurações sensíveis.
7. A reversão ficará disponível pelo rollback de release no Firebase Hosting.

**Build duplicado no estado atual:** `firebase.json` executa `npm run build` no hook `predeploy`. Se o workflow fizer o build explícito antes do deploy, a CLI o executará novamente. O desenho recomendado para a Fase 3 é remover o hook `predeploy` de `firebase.json` e deixar o workflow ser o único dono do build. Essa mudança é necessária e fica fora desta fase; alternativamente, manter o hook e omitir o passo explícito de build, aceitando que o build ocorra dentro da CLI depois das validações. Nesta fase o arquivo Firebase foi preservado.

## Proteção recomendada para `main`

A API do GitHub confirmou que `main` está desprotegida e que a branch atual permite push direto. Recomendo aplicar uma ruleset em `main` com:

- exigir Pull Request para alterações;
- exigir o check da validação depois que o workflow for convertido em check aplicável a PR/branch protection;
- bloquear force push e exclusão;
- uma aprovação independente quando houver outro revisor; para repositório de responsável único, revisão por outra pessoa pode não ser praticável.

O repositório é público. A documentação do GitHub informa que branch protection e rulesets estão disponíveis em repositórios públicos no GitHub Free; para privados, disponibilidade depende do plano. O plano atual não foi lido. Status checks obrigatórios precisam primeiro produzir um check reconhecido em uma execução compatível; este workflow manual, sozinho, não valida PRs. Nenhuma regra foi aplicada.

## Pendências antes da Fase 3

1. Confirmar via Firebase Console/API/CLI autorizado o Hosting Site ID de `pointffc.com.br` e que ele corresponde ao site default que o Firebase CLI selecionará. O identificador esperado, ainda pendente, é `app-pointdojogador`.
2. Obter do app Web Firebase os valores reais das variáveis listadas; cadastrar as Actions Variables apenas com autorização e sem copiar `.env`.
3. Definir a temporada e rodada válidas para a versão de validação.
4. Autorizar a criação do pool/provider WIF, Service Account e bindings IAM mínimos.
5. Autorizar eventual alteração de `firebase.json` para retirar o hook de build duplicado.
6. Integrar o workflow de validação por PR/branch default antes de torná-lo check obrigatório; a Fase 3 de deploy precisará de autorização expressa específica.

## Referências técnicas

- [Google Cloud: Workload Identity Federation com GitHub Actions](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Google Cloud: boas práticas de Workload Identity Federation](https://cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation)
- [Firebase: permissões IAM e Hosting](https://firebase.google.com/docs/projects/iam/permissions)
- [Google Cloud: papéis e permissões Firebase Hosting](https://cloud.google.com/iam/docs/roles-permissions/firebasehosting)
- [Firebase CLI: deploy, hooks e rollback Hosting](https://firebase.google.com/docs/cli)
- [GitHub: proteção de branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
