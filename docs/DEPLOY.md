# Deploy

Como o Tem Veg Aí? roda em produção: banco no Neon, API e site em dois projetos da Vercel, publicados pelo GitHub Actions. Para rodar localmente, veja o [README](../README.md).

## Banco no Neon

O banco de produção fica no [Neon](https://neon.com), no plano gratuito, num projeto na região **AWS São Paulo** (`aws-sa-east-1`). Limites do plano gratuito que importam aqui:

- 1 GB de armazenamento por projeto e 5 GB de transferência por mês.
- 100 CU-horas de processamento por mês. O banco desliga depois de 5 minutos sem uso (não dá para mudar no plano gratuito), e a primeira consulta depois disso demora um pouco mais.
- 6 horas de histórico para restaurar o banco a um momento anterior.

O painel do Neon mostra dois endereços de conexão (**Connect**, opção **Connection pooling**):

| Endereço | Host | Uso |
|---|---|---|
| Direto | sem `-pooler` | `migrate` e `create-admin`, rodados da sua máquina |
| Com pooler | com `-pooler` | a API na Vercel |

Os dois terminam em `?sslmode=require&channel_binding=require` e funcionam assim: o `pg` 8 trata o `require` como `verify-full` (verifica o certificado do Neon) e ignora o `channel_binding`. Ele avisa que no `pg` 9 o `require` deixará de verificar o certificado; para manter a verificação e não ver o aviso, troque `sslmode=require` por `sslmode=verify-full` no endereço.

## Migrations e conta de admin no Neon

Dentro de `backend`. O endereço é passado só para estes comandos, sem mexer no `.env`: o Node não troca uma variável que já existe pelo valor do `.env`. O `read -rs` lê o endereço sem mostrar na tela e sem gravar no histórico do terminal. Cole o endereço **direto** e aperte Enter:

```sh
read -rs DATABASE_URL && export DATABASE_URL
npm run migrate
npm run create-admin
unset DATABASE_URL
```

Para conferir, abra o **SQL Editor** do Neon e rode:

```sql
select extname from pg_extension where extname = 'unaccent';
select name from knex_migrations order by id;
select email from users;
```

**Não rode o `seed` no Neon.** Ele apaga os restaurantes, e o bloqueio dele olha só o `NODE_ENV`, que continua `development` no `.env` local. Por isso o `unset DATABASE_URL` logo depois dos comandos. Em produção, os restaurantes entram pelo painel admin.

## API na Vercel

A API fica no projeto `temvegai-api` da Vercel, em `https://temvegai-api.vercel.app`, no plano gratuito (Hobby). A entrada é o `backend/api/index.ts`, uma função que monta o app (o mesmo `composeApp` do `server.ts`) sem chamar `listen`. O `backend/vercel.json` manda todos os caminhos para ela, põe a função em São Paulo (`gru1`), perto do banco, e desliga o deploy automático pelo Git, para que nenhum deploy de prévia use o banco de produção. O único arquivo estático é o `backend/public/robots.txt`: sem uma pasta `public`, a Vercel serviria a pasta `backend` inteira como arquivos.

Configuração do projeto (**Settings**):

| Onde | Valor |
|---|---|
| Root Directory | `backend` |
| Framework Preset | Other |
| Node.js Version | 24.x (o `engines` do `package.json` também fixa `24.x`, e ele vence o painel) |

Variáveis de ambiente, só em **Production**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Endereço **com pooler** do Neon, com `sslmode=verify-full` |
| `JWT_SECRET` | Segredo próprio de produção, diferente do local (`openssl rand -base64 48`) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Endereço do site |
| `TRUST_PROXY` | `1`. Conferido com o caminho completo: também pelo repasse do site, a API vê o IP de quem acessa |
| `NODE_OPTIONS` | `--experimental-require-module`. O carregador de funções da Vercel desliga o `require()` de pacotes ESM, que o Node 24 aceita; sem a flag, o `@fastify/static` (usado pelo `/docs`) quebra ao carregar o `content-disposition` |

Para publicar, a partir da **raiz** do repositório (a Root Directory já aponta para `backend`), com o projeto da API ligado (veja [Qual projeto está ligado](#qual-projeto-está-ligado)):

```sh
npx vercel link --yes --project temvegai-api
npx vercel deploy --prod
```

O CLI não lê o `.gitignore`: o `.vercelignore` da raiz impede que os `.env` locais, `node_modules` e `dist` sejam enviados. Para conferir a lista antes de publicar, use `npx vercel deploy --dry`.

## Site na Vercel

O site fica no projeto `temvegai-app` da Vercel, no plano gratuito (Hobby). O `frontend/vercel.json` faz duas coisas:

- repassa `/api/*` para a API (`/api/restaurants` vira `https://temvegai-api.vercel.app/restaurants`). O navegador vê um domínio só, e o cookie de sessão é gravado no domínio do site, inclusive no Firefox, que bloqueia cookies de terceiros. Os endereços `*.vercel.app` estão na Public Suffix List, então sem o repasse o cookie da API não valeria para o site;
- manda qualquer outro caminho que não seja arquivo do `dist` para o `index.html`, para que recarregar `/admin` abra o painel em vez de dar 404.

Ele também desliga o deploy automático pelo Git, como na API.

Para criar o projeto, a partir da **raiz** do repositório:

```sh
npx vercel link
```

| Pergunta | Resposta |
|---|---|
| Set up "…/temvegai"? | `yes` |
| Which scope? | o mesmo time da API |
| Link to existing project? | `no` |
| What's your project's name? | `temvegai-app` |
| In which directory is your code located? | `./frontend` |
| Want to modify these settings? | `no` (ele detecta o Vite, com `vite build` e saída `dist`) |

Depois, confira no painel (**Settings**):

| Onde | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Node.js Version | 24.x |
| Git | nenhum repositório conectado |

Variáveis de ambiente, só em **Production** (não são sensíveis: os valores vão no JavaScript público):

```sh
npx vercel env add VITE_API_URL production --no-sensitive     # valor: /api
npx vercel env add VITE_CARTO_KEY production --no-sensitive   # valor: a chave da CARTO
```

A Vercel recusa guardar como secreta (`--sensitive`) uma variável com o prefixo `VITE_`, porque o valor vai para o JavaScript público.

Uma variável nova precisa estar na Vercel antes do merge na `main`: sem ela, o deploy automático publica um site que não abre.

O Vite lê a variável no build, que roda na Vercel; o `frontend/.env` local não é enviado. Para publicar:

```sh
npx vercel link --yes --project temvegai-app
npx vercel deploy --prod
```

Na primeira vez, troque o `CORS_ORIGIN` da API pelo endereço de produção do site (linha **Aliased** do deploy, sem barra no final) e publique a API de novo, porque a variável só vale num deploy novo:

```sh
npx vercel link --yes --project temvegai-api
npx vercel env rm CORS_ORIGIN production
npx vercel env add CORS_ORIGIN production
npx vercel deploy --prod
```

## Qual projeto está ligado

O CLI liga um projeto por pasta, no `.vercel/project.json`, e os dois projetos são publicados a partir da raiz. Ligar um desliga o outro. Por isso cada publicação acima começa com `npx vercel link --yes --project <nome>`. Para ver qual está ligado agora: `cat .vercel/project.json`.

## Deploy automático

Todo push na `main` com os checks verdes é publicado sozinho pelo workflow `Deploy` (`.github/workflows/deploy.yml`). Ele roda depois que o workflow `CI` termina e, nesta ordem:

1. aplica as migrations pendentes no Neon, pela conexão **direta**;
2. publica a API;
3. publica o site.

Se o CI falhar, o `Deploy` aparece como pulado. Se um passo falhar, os seguintes não rodam: uma migration com erro não deixa a API nova entrar no ar. Pull requests rodam só o CI.

**Cada migration precisa funcionar também com a versão anterior da API**, porque ela é aplicada enquanto a API antiga ainda está no ar. Para renomear ou remover uma coluna, por exemplo, primeiro uma etapa cria a nova e passa a usar só ela; a remoção da antiga fica para um deploy seguinte.

Os secrets ficam no environment `production` do GitHub (**Settings → Environments → New environment**), com **Deployment branches and tags** limitado à `main`, para que um workflow de outra branch não leia o endereço do banco nem o token:

| Secret | Valor |
|---|---|
| `VERCEL_API_TOKEN` | Token criado em **Vercel → Account Settings → Tokens**, com acesso só ao `temvegai-api` |
| `VERCEL_APP_TOKEN` | Outro token, com acesso só ao `temvegai-app` |
| `VERCEL_ORG_ID` | `orgId` do `.vercel/project.json` (o mesmo nos dois projetos) |
| `VERCEL_API_PROJECT_ID` | `projectId` do `.vercel/project.json` com o `temvegai-api` ligado |
| `VERCEL_APP_PROJECT_ID` | `projectId` do `.vercel/project.json` com o `temvegai-app` ligado |
| `DATABASE_URL` | Endereço **direto** do Neon (sem `-pooler`), com `sslmode=verify-full` |

Com `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` no ambiente, o CLI publica no projeto indicado sem precisar do `vercel link`. Cada token só alcança o seu projeto; quando um vencer, o passo de deploy dele falha com erro de autenticação, e basta criar outro e trocar o secret. A versão do CLI fica fixa no workflow. Os comandos manuais acima continuam valendo, por exemplo para publicar sem passar por um commit.
