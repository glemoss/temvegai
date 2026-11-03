# Tem Veg Aí?

Mapa de restaurantes veganos de Florianópolis. Este repositório tem a API (`/backend`) e o site (`/frontend`), que ainda está em construção.

O que o produto faz e o que está fora do escopo: [`docs/SPEC.md`](docs/SPEC.md). Etapas de construção: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Pré-requisitos

- [nvm](https://github.com/nvm-sh/nvm) (ou Node 24 instalado de outro jeito)
- [Docker](https://docs.docker.com/get-docker/) com Docker Compose
- `git`

## Rodando a API pela primeira vez

Todos os comandos partem da raiz do repositório.

1. **Node na versão certa.** O `.nvmrc` fixa o Node 24:

   ```sh
   nvm install
   nvm use
   ```

2. **Banco de dados.** Sobe um Postgres na porta 5432:

   ```sh
   docker compose up -d
   ```

3. **Variáveis de ambiente.** Copie o exemplo:

   ```sh
   cd backend
   cp .env.example .env
   ```

   Os valores padrão já funcionam com o banco do Docker. Só troque o `JWT_SECRET` por um valor aleatório:

   ```sh
   openssl rand -base64 48
   ```

   | Variável | O que é |
   |---|---|
   | `PORT` | Porta da API (padrão `3000`) |
   | `DATABASE_URL` | Conexão com o Postgres |
   | `JWT_SECRET` | Segredo que assina o cookie de sessão, com pelo menos 32 caracteres |
   | `NODE_ENV` | `development` ou `production`; em produção o cookie só é enviado por HTTPS |
   | `CORS_ORIGIN` | Endereço do frontend autorizado a chamar a API com cookies (padrão: o Vite em `http://localhost:5173`) |
   | `TRUST_PROXY` | Quantos proxies ficam na frente da API e acrescentam o `X-Forwarded-For`; o limite de tentativas do login conta pelo IP que eles informam (padrão `0`: nenhum, usa o endereço da conexão) |

   A API não inicia se alguma variável estiver faltando ou inválida, e diz qual é.

4. **Dependências, tabelas e dados de exemplo.** Ainda dentro de `backend`:

   ```sh
   npm install
   npm run migrate
   npm run seed
   ```

   O `seed` apaga os restaurantes e recria os de exemplo. Use só em desenvolvimento: com `NODE_ENV=production` ele recusa rodar e não apaga nada.

5. **Conta de admin** (opcional, só para testar as rotas de escrita). O comando pede e-mail e senha no terminal; a senha precisa de pelo menos 12 caracteres:

   ```sh
   npm run create-admin
   ```

6. **Subir a API:**

   ```sh
   npm run dev
   ```

   A API fica em `http://localhost:3000` e recarrega sozinha quando o código muda.

## Rodando o site

Em outro terminal, a partir da raiz do repositório:

```sh
nvm use
cd frontend
npm install
cp .env.example .env
npm run dev
```

O `.env` do frontend tem uma variável:

| Variável | Para que serve |
|---|---|
| `VITE_API_URL` | Endereço da API (padrão: `http://localhost:3000`). O site não abre se ela estiver faltando |

O site fica em `http://localhost:5173` e busca os restaurantes na API, então a API precisa estar no ar. Sem ela, o mapa abre com uma mensagem de erro.

## Conferindo se funcionou

- `http://localhost:3000/health` deve responder `{"status":"ok","database":"up"}`. Se aparecer `"database":"down"`, o Postgres não está no ar (passo 2).
- `http://localhost:3000/restaurants` lista os restaurantes do seed.
- `http://localhost:3000/docs` abre a documentação da API, com todas as rotas e o que cada uma aceita.

### Testando as rotas de admin pela documentação

Em `/docs`, abra `POST /auth/login`, clique em **Try it out** e envie o e-mail e a senha criados no passo 5. O navegador guarda o cookie de sessão, e as rotas de criar, editar e remover restaurante passam a funcionar na mesma página.

## Produção

### Banco no Neon

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

### Migrations e conta de admin no Neon

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

### API na Vercel

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
| `TRUST_PROXY` | `1` |
| `NODE_OPTIONS` | `--experimental-require-module`. O carregador de funções da Vercel desliga o `require()` de pacotes ESM, que o Node 24 aceita; sem a flag, o `@fastify/static` (usado pelo `/docs`) quebra ao carregar o `content-disposition` |

Para publicar, a partir da **raiz** do repositório (a Root Directory já aponta para `backend`), com o projeto ligado por `npx vercel link`:

```sh
npx vercel deploy --prod
```

O CLI não lê o `.gitignore`: o `.vercelignore` da raiz impede que os `.env` locais, `node_modules` e `dist` sejam enviados. Para conferir a lista antes de publicar, use `npx vercel deploy --dry`.

## Comandos

### API

Rodar dentro de `backend`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em `http://localhost:3000` com recarga automática |
| `npm test` | Roda os testes (não precisam do banco) |
| `npm run lint` | ESLint e verificação de formatação do Prettier |
| `npm run typecheck` | Checagem de tipos |
| `npm run format` | Formata o código com Prettier |
| `npm run migrate` | Aplica as migrations pendentes |
| `npm run migrate:rollback` | Desfaz o último lote de migrations |
| `npm run seed` | Apaga e recria os dados de exemplo (recusa rodar com `NODE_ENV=production`) |
| `npm run create-admin` | Cria uma conta de admin |

### Site

Rodar dentro de `frontend`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o site em `http://localhost:5173` com recarga automática |
| `npm test` | Roda os testes |
| `npm run lint` | ESLint e verificação de formatação do Prettier |
| `npm run typecheck` | Checagem de tipos |
| `npm run format` | Formata o código com Prettier |

## Problemas comuns

- **`require() of ES Module ... not supported` ou erros estranhos nos testes:** o terminal está usando outro Node. Rode `nvm use` na raiz do repositório e confira `node -v` (deve ser 24).
- **Porta 5432 ocupada ao subir o Docker:** já existe outro Postgres rodando na máquina. Pare esse Postgres ou mude a porta no `docker-compose.yml` e no `DATABASE_URL`.
- **Apagar o banco e começar do zero:** `docker compose down -v` remove o volume com os dados; depois repita a partir do passo 2.
