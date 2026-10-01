# Handler de ações de e-mail

URL pública: **https://pointffc.com.br/auth/action**

Implementa os cinco modos abaixo, usando o `auth` existente de
`src/lib/firebase.ts` (SDK modular; versão instalada na implementação: 12.19.0).
Não modifica envio de e-mails, cadastro, login, backend ou Firebase Console.

| mode | Operação conferida por checkActionCode | API de execução |
| --- | --- | --- |
| verifyEmail | VERIFY_EMAIL | applyActionCode |
| resetPassword | PASSWORD_RESET | verifyPasswordResetCode e confirmPasswordReset |
| recoverEmail | RECOVER_EMAIL | applyActionCode |
| verifyAndChangeEmail | VERIFY_AND_CHANGE_EMAIL | applyActionCode |
| revertSecondFactorAddition | REVERT_SECOND_FACTOR_ADDITION | applyActionCode |

O handler consulta `checkActionCode` e exige a operação correspondente antes de
executar a ação. Sem modo/código válido, não executa a ação.
Confirmação, restauração/troca do e-mail e reversão de segundo fator são aplicadas
ao abrir o link. A redefinição valida o código antes de mostrar o formulário e
só altera a senha após envio. Reutiliza `PasswordField` e `validPassword` do
cadastro (8 caracteres, uma letra e um número), exige confirmação igual e bloqueia
envios concorrentes. A política do servidor Firebase continua sendo aplicada.
Todos os modos têm loading, sucesso, erro amigável e botão para login.
Modos ausentes/desconhecidos mostram “Link inválido”, sem chamadas ao Firebase.
`apiKey`, `continueUrl` e `lang` são lidos, mas não alteram o projeto Firebase,
o destino da navegação nem o idioma pt-BR do site. O botão leva a `/login`.
Não é necessário estar autenticado. Se houver usuário Firebase local, o handler
tenta atualizar seu estado após a confirmação, sem criar uma sessão no backend.

## Configuração manual no Console, após o deploy

Em Authentication → Templates → editar modelo → **Personalizar URL acionável**,
o valor será `https://pointffc.com.br/auth/action`, sem query string.
O Firebase acrescenta os parâmetros ao gerar cada e-mail.

**Atenção à ativação:** essa configuração é compartilhada pelos modelos de e-mail.
Os cinco modos administrativos acima estão cobertos. Faça deploy e valide links
reais antes de ativar. A configuração remota do Console não foi inspecionada.
Não houve alteração de Console nem deploy nesta entrega.

Limitação: `signIn` (EMAIL_SIGNIN) não é suportado. Exige fluxo próprio com
`signInWithEmailLink`, obtenção segura do e-mail e integração da sessão do app.
O frontend atual utiliza senha/Google e não envia nem consome links de login.
Se esse provedor estiver habilitado e direcionar links a esta rota, seu login
ficará indisponível. Nesse cenário, não ative a URL global antes de implementar
esse fluxo. Também não há seleção de tenants a partir dos parâmetros da URL.
Não se cria/revoga sessão do backend, nem se envia automaticamente e-mail de
redefinição após recuperação. Guarde a URL anterior para eventual restauração.

Os modos adicionais foram conferidos no SDK instalado (Firebase 12.19.0,
@firebase/auth 1.13.6), em
`node_modules/firebase/node_modules/@firebase/auth/dist/index.webworker.js`:
o mapeamento de modes e `checkActionCode` reconhecem ambas as operações;
`applyActionCode` aplica o código pela API oficial, sem APIs privadas no app.

Em Authentication → Settings → Authorized domains, confira `pointffc.com.br`.
Se já estiver autorizado para a autenticação atual do site, não há um novo domínio
a adicionar. Se faltar, cadastre o hostname, sem protocolo ou `/auth/action`.
Inclua `www.pointffc.com.br` somente se essa origem também for usada para autenticação.
Para testar o cadastro/login local, confira `localhost` no projeto de testes;
ele pode não estar autorizado por padrão em projetos recentes.
Não é necessário autorizar domínios recebidos em `continueUrl`: este handler os ignora.
Nenhuma mudança de `authDomain`, API key, DNS ou inicialização é introduzida pelo código.

Referências oficiais:
- https://firebase.google.com/docs/auth/custom-email-handler
- https://firebase.google.com/docs/auth/web/passing-state-in-email-actions
- https://firebase.google.com/docs/reference/js/auth
- https://firebase.google.com/docs/auth/web/email-link-auth

## Antes do deploy

1. Use a configuração Firebase já existente em `.env.local`, preferencialmente de
   um projeto de testes. Execute `npm.cmd run dev`.
2. Abra, na porta informada pelo Next:
   - `http://localhost:3000/auth/action`
   - `http://localhost:3000/auth/action?mode=verifyEmail`
   - `http://localhost:3000/auth/action?mode=verifyEmail&oobCode=invalido`
   As duas primeiras devem mostrar link incompleto sem consumir código. A terceira
   deve terminar em erro amigável do Firebase, sem mostrar detalhes internos.
3. Teste os cinco modos sem código e com código inválido: devem mostrar erro
   amigável. Modo ausente/desconhecido deve mostrar “Link inválido”.
   Gere também links reais de redefinição, troca e recuperação de e-mail em um
   projeto de testes. Para reversão de segundo fator, use o link emitido após
   cadastrar um fator em um projeto com MFA habilitado. Adapte a URL como abaixo.
   Na redefinição, confira obrigatoriedade, divergência, senha fraca, visibilidade,
   bloqueio durante envio, sucesso e login com a nova senha.
4. Para o fluxo real, cadastre uma conta de teste pelo fluxo existente e copie o
   link do e-mail **sem abri-lo primeiro**. Troque apenas a origem e o caminho por
   `http://localhost:3000/auth/action`, preservando a query string completa.
   O Firebase local deve apontar para o mesmo projeto que emitiu o código.
5. Abra o link adaptado, confira o loading, sucesso e botão de login. Entre com a
   conta e confira a confirmação no Firebase. Reabra o link consumido: deve haver
   mensagem de link inválido/já utilizado. Faça também o teste em janela anônima.
6. Acrescente `continueUrl=https://example.org` e uma API key fictícia à query de
   um novo link de teste. A configuração deve continuar sendo a do projeto local,
   sem redirecionamento externo ou exibição da chave.
7. Confira desktop e celular (por exemplo, 360px), além dos testes automatizados:

```powershell
npm.cmd test
npm.cmd run typecheck
$env:NEXT_PUBLIC_API_URL='https://api-pointffc.onrender.com'
npm.cmd run lint
npm.cmd run build
git diff --check
```

## Depois do deploy

1. Confira acesso direto HTTPS a `/auth/action` e os três casos inválidos acima.
   O export estático deve conter `out/auth/action/index.html`; não precisa de backend novo.
2. Antes de mudar o Console, valide um link novo substituindo apenas sua base por
   `https://pointffc.com.br/auth/action` e mantendo a query, como no teste local.
3. Confira provedores/tenants e a limitação de `signIn`; após validar os cinco
   modos usados pelo projeto, personalize a URL no
   Console e gere um **novo** e-mail pelo cadastro/reenvio existente.
4. Abra o link recebido no celular e no desktop com contas/códigos distintos,
   confirme sucesso, acesso ao login e rejeição do código reutilizado.
   Links enviados antes da configuração podem continuar apontando para a URL antiga.

Os testes automatizados simulam o SDK; não comprovam a configuração do Console
nem substituem a validação de um e-mail real do projeto. Nenhum e-mail real foi
enviado e nenhuma conta foi alterada durante a implementação automatizada.
