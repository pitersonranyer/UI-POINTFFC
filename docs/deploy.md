# Publicação no Firebase

Execute `npm run deploy`. O hook `predeploy` do Firebase executa `npm run build`
antes de enviar a pasta `out`, inclusive quando o deploy é iniciado diretamente
pela CLI do Firebase.

O build usa `https://api-pointffc.onrender.com` como API de produção. O script
define esse endereço antes de o Next carregar `.env.local`, permitindo manter
`http://localhost:3001` no desenvolvimento sem incluí-lo na publicação.

Para usar outra API, defina `NEXT_PUBLIC_API_URL` no ambiente do processo de
build. A configuração do Next rejeita endereços HTTP e hosts de loopback durante
o build de produção. Não basta alterar variáveis depois do build: a URL fica
gravada no JavaScript exportado.

Antes de publicar alterações, execute `npm test` e `npm run build`.
