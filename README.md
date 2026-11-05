<h1 align="center">
  <img src="frontend/src/assets/logo.svg" alt="Tem Veg Aí?" width="360">
</h1>

Mapa dos restaurantes veganos e com opções veganas de Florianópolis.

**[temvegai-app.vercel.app](https://temvegai-app.vercel.app)** · [documentação da API](https://temvegai-api.vercel.app/docs)

O visitante abre o mapa, filtra por tipo, bairro ou nome e clica num restaurante para ver endereço, contato, horário e se ele está aberto agora. Os restaurantes são cadastrados por admins num painel em `/admin`.

É um projeto pessoal, feito de ponta a ponta: API, site, painel admin, banco, CI e deploy.

## O que tem

**Site público**

- Mapa vetorial (MapLibre sobre Leaflet) com paleta própria, aplicada por cima do estilo da CARTO.
- Filtros por tipo e bairro, e busca por nome com sugestões navegáveis pelo teclado.
- O mapa busca só os restaurantes da área visível.
- Painel de detalhes com "Aberto agora" ou "Fechado agora" pelo horário de Florianópolis, inclusive em horários que passam da meia-noite, e botão "Como chegar".
- Layout para desktop e celular: o restaurante escolhido fica centralizado na parte do mapa que o painel não cobre.

**Painel admin**

- Login com sessão em cookie `httpOnly` e limite de tentativas.
- Lista com busca, criação e edição em modal, remoção com confirmação.
- Localização pelo endereço ou clicando no mapa (Nominatim/OpenStreetMap), com aviso quando o bairro ainda não existe, para não criar grafias diferentes do mesmo bairro.
- Horário semanal estruturado, com vários intervalos por dia.

**API**

- REST com Fastify, entrada validada com Zod e documentação OpenAPI gerada a partir dos mesmos schemas (um teste garante que toda rota está documentada).
- Busca por nome e bairro sem diferenciar maiúsculas e acentos (`unaccent`), com a mesma ordenação em qualquer Postgres.
- Erros de negócio em classes próprias, convertidos em um único error handler com formato padronizado e mensagens em português.

## Stack

| Camada | Tecnologias |
|---|---|
| Linguagem | TypeScript `strict` em tudo |
| API | Node 24, Fastify, Zod, Knex, PostgreSQL, argon2, JWT em cookie |
| Site e painel | React, Vite, React Router, Tailwind CSS, shadcn/ui, Leaflet, MapLibre GL |
| Testes | Vitest (use cases com repositórios em memória, rotas com `app.inject`, componentes com Testing Library) |
| Infra | Docker Compose (desenvolvimento), Neon (banco), Vercel (API e site), GitHub Actions (CI e deploy) |

## Arquitetura

```
/backend    API
/frontend   site público e painel admin
/docs       especificação, roadmap e deploy
```

A API é separada em camadas, com a dependência sempre de fora para dentro:

```
routes  →  controllers  →  use cases  →  repositories (interfaces)
                                              ↑
                                  implementações com Knex
```

- **Controllers** validam a entrada com Zod e traduzem HTTP para a chamada do use case. Sem regra de negócio.
- **Use cases**, um por operação (`ListRestaurantsUseCase`, `LoginUseCase`...), têm a regra de negócio e não conhecem Fastify nem Knex.
- **Repositórios**, hash de senha e emissão de token ficam atrás de interfaces. Os use cases recebem as implementações pelo construtor, montadas num único lugar (`compose-app.ts`), sem container de injeção de dependência. Nos testes, entram as versões em memória.

A API é independente do site, pensando num app mobile no futuro.

## Decisões que valem conhecer

- **Um domínio só, sem domínio próprio.** Os endereços `*.vercel.app` estão na Public Suffix List, então um cookie da API não valeria para o site. O site repassa `/api/*` para a API, o navegador vê um domínio só, e o cookie de sessão continua `httpOnly` e `sameSite: lax`, funcionando também no Firefox, que bloqueia cookies de terceiros.
- **Migrations antes do código, compatíveis com a versão anterior.** No deploy automático, as migrations rodam no Neon antes de a API nova entrar no ar. Por isso cada uma precisa funcionar com a API que ainda está rodando; mudanças que quebrariam isso são divididas em dois deploys.
- **Deploy só com CI verde.** Todo push na `main` passa por testes, lint, typecheck e build do backend e do frontend; só então o workflow de deploy aplica as migrations e publica a API e o site. Os secrets ficam num environment do GitHub liberado só para a `main`, com um token da Vercel por projeto.
- **API pronta para sair da Vercel.** Ela não usa nenhum serviço próprio da plataforma, tem build próprio com `tsc` e lê toda a configuração de variáveis de ambiente validadas na inicialização. Trocar por um container é mudar o ponto de entrada.
- **Construído em etapas.** O projeto foi feito em etapas pequenas, cada uma com critério de "pronto", testes e um commit. O que ficou para depois, e por quê, está registrado nas pendências do roadmap.

Mais detalhes: [especificação](docs/SPEC.md) (o que está e o que não está no escopo), [roadmap](docs/ROADMAP.md) (as etapas e as decisões de cada uma) e [deploy](docs/DEPLOY.md) (como a produção está montada).

## Rodando localmente

### Pré-requisitos

- [nvm](https://github.com/nvm-sh/nvm) (ou Node 24 instalado de outro jeito)
- [Docker](https://docs.docker.com/get-docker/) com Docker Compose
- `git`

### Rodando a API pela primeira vez

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

### Rodando o site

Em outro terminal, a partir da raiz do repositório:

```sh
nvm use
cd frontend
npm install
cp .env.example .env
npm run dev
```

O `.env` do frontend tem duas variáveis:

| Variável | Para que serve |
|---|---|
| `VITE_API_URL` | Endereço da API (padrão: `http://localhost:3000`). O site não abre se ela estiver faltando |
| `VITE_CARTO_KEY` | Chave dos tiles do mapa da CARTO, grátis em [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey) (chega por e-mail, sem conta). O site não abre se ela estiver faltando |

O site fica em `http://localhost:5173` e busca os restaurantes na API, então a API precisa estar no ar. Sem ela, o mapa abre com uma mensagem de erro.

### Conferindo se funcionou

- `http://localhost:3000/health` deve responder `{"status":"ok","database":"up"}`. Se aparecer `"database":"down"`, o Postgres não está no ar (passo 2).
- `http://localhost:3000/restaurants` lista os restaurantes do seed.
- `http://localhost:3000/docs` abre a documentação da API, com todas as rotas e o que cada uma aceita.

#### Testando as rotas de admin pela documentação

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
