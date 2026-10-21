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

   A API não inicia se alguma variável estiver faltando ou inválida, e diz qual é.

4. **Dependências, tabelas e dados de exemplo.** Ainda dentro de `backend`:

   ```sh
   npm install
   npm run migrate
   npm run seed
   ```

   O `seed` apaga os restaurantes e recria 5 de exemplo. Use só em desenvolvimento.

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
| `npm run seed` | Apaga e recria os dados de exemplo |
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
