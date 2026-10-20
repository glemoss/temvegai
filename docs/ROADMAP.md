# Roadmap

Uma etapa por sessão da CLI. Cada etapa termina com revisão do dono e um commit.

## Como pedir cada etapa

Abra a CLI na raiz do repositório, entre em modo de planejamento (Shift+Tab até aparecer "plan mode") e envie:

```
Execute apenas a etapa B0 do docs/ROADMAP.md. Apresente o plano antes de escrever código. Ao terminar, mostre como verificar o critério de pronto e pare.
```

Troque `B0` pelo código da etapa. Depois de revisar e fazer o commit, use `/clear` antes da próxima etapa para começar com contexto limpo.

Se o plano apresentado tiver algo a mais do que a etapa pede, recuse e diga o que cortar antes de aprovar.

---

## Fase B — Backend

### [x] B0 — Esqueleto do backend
Repositório git, pasta `/backend`, TypeScript, Fastify com `GET /health`, ESLint, Prettier, Vitest e scripts npm.
**Pronto quando:** `npm run dev` sobe o servidor, `GET /health` responde 200, e `npm test`, `npm run lint` e `npm run typecheck` passam. Seção "Comandos" do `CLAUDE.md` preenchida.

### [x] B1 — Banco de dados e configuração
Docker Compose com Postgres (banco de desenvolvimento), Knex configurado, variáveis de ambiente validadas na inicialização, `.env.example`.
**Pronto quando:** `docker compose up` sobe o banco, o servidor recusa iniciar com variável faltando, e `GET /health` informa se o banco está acessível.

### [x] B2 — Tabela de restaurantes
Migration da tabela `restaurants` conforme o `SPEC.md` e seed com 5 restaurantes de exemplo em Florianópolis.
**Pronto quando:** `migrate` e `seed` rodam do zero sem erro, e o rollback da migration funciona.

### [x] B3 — Entidade e repositório
Tipo `Restaurant`, interface `RestaurantRepository` com `findAll` e `findById`, implementação com Knex e implementação em memória para testes.
**Pronto quando:** o repositório em memória e a conversão de linha do banco para `Restaurant` têm testes unitários, e `test`, `lint` e `typecheck` passam. O repositório Knex é verificado contra o banco pelos critérios da B4 (`findAll`) e da B5 (`findById`). Nenhuma rota nova nesta etapa.

### [x] B4 — Listar restaurantes
`ListRestaurantsUseCase` e `GET /restaurants`, passando por route, controller e use case. Ponto único de composição das dependências.
**Pronto quando:** `GET /restaurants` devolve os restaurantes do seed, com teste unitário do use case.

### [x] B5 — Detalhe e tratamento de erros
`GetRestaurantUseCase`, `GET /restaurants/:id`, `RestaurantNotFoundError` e error handler único com formato de erro padronizado.
**Pronto quando:** id existente devolve 200, id inexistente devolve 404 e id inválido devolve 400, os erros no mesmo formato, com teste unitário do use case.

### [x] B6 — Filtros
Parâmetros em `GET /restaurants`: `type`, `neighborhood`, `q` (busca por nome) e área visível do mapa (`minLat`, `maxLat`, `minLng`, `maxLng`).
**Pronto quando:** cada filtro funciona sozinho e combinado, parâmetros inválidos devolvem 400, com teste unitário do use case. A busca por nome ignora maiúsculas e acentos (extensão `unaccent`).

### [x] B7 — Contas de admin
Migration da tabela `users` conforme o `SPEC.md`, interface `UserRepository` com implementação Knex e em memória, interface `PasswordHasher` com implementação argon2, `CreateAdminUseCase` e o comando `npm run create-admin` (pede e-mail e senha no terminal).
**Pronto quando:** o comando cria um admin com a senha salva como hash, recusa e-mail repetido e senha com menos de 12 caracteres, com testes. Nenhuma rota nova nesta etapa.

### [x] B8 — Login
`LoginUseCase`, `POST /auth/login`, `POST /auth/logout` e `GET /auth/me`. O login grava um JWT em cookie `httpOnly`. Hook de autenticação reutilizável para proteger rotas. Limite de tentativas na rota de login.
**Pronto quando:** credenciais certas devolvem 200 e gravam o cookie; e-mail inexistente e senha errada devolvem o mesmo 401 com a mesma mensagem; `GET /auth/me` devolve o admin com cookie válido e 401 sem cookie ou com cookie expirado; logout apaga o cookie; excesso de tentativas devolve 429. Tudo com testes.

### [x] B9 — Escrita protegida
`POST /restaurants`, `PUT /restaurants/:id` e `DELETE /restaurants/:id`, um use case para cada, usando o hook de autenticação da B8.
**Pronto quando:** sem login devolve 401, com login as três operações funcionam e validam a entrada, e as rotas de leitura continuam públicas. Com testes.

### [x] B10 — Acabamento da API
CORS para o frontend com envio de cookies habilitado, documentação OpenAPI gerada a partir dos schemas, README com passo a passo para rodar o projeto.
**Pronto quando:** a documentação abre no navegador listando todas as rotas, e alguém consegue rodar o projeto seguindo só o README.

---

## Fase F — Frontend

Só começa com a fase B inteira concluída.

### [x] F0 — Esqueleto do frontend
Pasta `/frontend` com Vite, React, TypeScript, ESLint e Vitest. Uma página com o título do projeto.
**Pronto quando:** `npm run dev` abre a página, e `lint`, `typecheck` e `test` passam.

### [x] F1 — Mapa
Mapa em tela cheia centrado em Florianópolis, com zoom e arraste. Sem dados ainda.
**Pronto quando:** o mapa carrega e é navegável no desktop e no celular.

### [x] F2 — Marcadores
Cliente da API e marcadores dos restaurantes vindos de `GET /restaurants`, com estados de carregando e de erro.
**Pronto quando:** os restaurantes do seed aparecem no lugar certo, e derrubar a API mostra a mensagem de erro.

### [x] F3 — Detalhes do restaurante
Clicar em um marcador abre um painel com os dados do restaurante.
**Pronto quando:** o painel abre, fecha e troca de restaurante corretamente, no desktop e no celular.

### [ ] F4 — Filtros e busca
Filtro por tipo e bairro, busca por nome, e recarga dos marcadores conforme a área visível do mapa.
**Pronto quando:** os filtros atualizam o mapa, e mover o mapa busca só os restaurantes da área visível.

### [ ] F5 — Acabamento visual
Identidade visual, responsividade, estado vazio (nenhum resultado) e acessibilidade básica.
**Pronto quando:** aprovado visualmente pelo dono no desktop e no celular.

---

## Fase A — Painel admin

Fica dentro do `/frontend`, na rota `/admin`. Só começa com a fase F concluída.

### [ ] A0 — Rotas e login do admin
React Router separando o site público (`/`) do painel (`/admin`). Tela de login com e-mail e senha usando `POST /auth/login`, verificação de sessão com `GET /auth/me` ao abrir o painel, botão de sair.
**Pronto quando:** credenciais erradas mostram erro, credenciais certas abrem uma página do painel ainda vazia, recarregar a página mantém o login, acessar `/admin` sem estar logado leva para a tela de login, sair encerra a sessão, e o site público continua funcionando igual.

### [ ] A1 — Lista de restaurantes
Tabela com nome, tipo e bairro, busca por nome, estados de carregando, erro e lista vazia.
**Pronto quando:** a tabela mostra todos os restaurantes da API e a busca filtra a lista.

### [ ] A2 — Criar restaurante
Formulário com todos os campos do modelo, validação antes de enviar e localização escolhida clicando em um mapa (preenche latitude e longitude).
**Pronto quando:** criar um restaurante pelo painel faz ele aparecer na lista e no mapa público, erros de validação da API aparecem no formulário, e sessão expirada leva de volta ao login.

### [ ] A3 — Editar restaurante
Reaproveita o formulário da A2, preenchido com os dados atuais.
**Pronto quando:** editar um restaurante atualiza a lista e o mapa público, e abrir a edição de um id inexistente mostra erro.

### [ ] A4 — Remover restaurante
Botão de remover na lista, com confirmação antes de apagar.
**Pronto quando:** cancelar não apaga nada, e confirmar remove o restaurante da lista e do mapa público.

---

## Depois da v1 (não planejado ainda)

Deploy e CI/CD, aplicativo mobile.

## Pendências

Coisas notadas durante uma etapa que ficam para depois.

- (B0) O npm avisa que o script de instalação do `esbuild` (dependência do `tsx` e do Vitest) não está aprovado em `allowScripts`. Dev e testes funcionam sem ele; decidir se aprova ou se deixa como está.
- (B1) O Knex escreve `Acquire connection error` direto no console quando o banco está fora do ar, fora do logger do Fastify. Decidir se vale redirecionar para o logger.
- (B4) Decidido pelo dono: Zod só na entrada, com `schema.parse` no controller, sem dependência nova e sem schema de saída. Resolvido na B10 (opção A): o `src/openapi.ts` monta o documento a partir dos schemas exportados pelos controllers, com `z.toJSONSchema`, e um teste garante que toda rota registrada está documentada.
- (B5) ~~Rotas sem teste automatizado.~~ Resolvido na B8: o dono decidiu testar rotas com `app.inject` e dependências em memória, e o `CLAUDE.md` foi atualizado.
- (B7) O `argon2` também tem script de instalação fora do `allowScripts` (mesmo aviso do `esbuild` na B0). Funciona sem ele porque o pacote traz binários prontos; entra na mesma decisão.
- (B8) `migrate`, `seed` e `create-admin` usam a mesma validação de ambiente do servidor e agora também exigem `JWT_SECRET` e, desde a B10, `CORS_ORIGIN`, embora não os usem. Decidir se os comandos devem validar só o que precisam.
- (B8) O logout só apaga o cookie: um token copiado continua válido até expirar (7 dias). Revogação de sessão não está no escopo da v1.
- (B8) O limite de tentativas do login fica na memória do processo; reiniciar o servidor zera a contagem, e com mais de uma instância cada uma conta separado. Basta para a v1, mas entra na conversa de deploy.
- (B9) Um campo desconhecido no corpo de `POST`/`PUT /restaurants` gera um item em `details` com `field` vazio, porque o Zod põe o nome do campo na mensagem e não no caminho. O error handler poderia usar o nome do campo como `field`; decidir se vale ajustar.
- (B10) A documentação em `/docs` fica aberta também em produção. Decidir na etapa de deploy se esconde ou protege.
- (B10) Como a documentação descreve o que o cliente envia, campos com transformação aparecem só pelo tipo de entrada: `website` e `instagram` aparecem como texto livre, sem o formato de URL nem o padrão de usuário, e os parâmetros de área do mapa aparecem como texto em vez de número. A validação real continua igual; decidir se vale completar a descrição à mão.
- (F0) O app passa a se chamar **Tem Veg Aí?** (domínio pretendido: `temveg.ai`). Só o frontend usa o nome novo; README, título do `SPEC.md`, `veganos-backend` no `package.json` e o nome do banco continuam "veganos". Decidir se e quando renomear.
- (F0) Com o domínio `temveg.ai`, a decisão 5 do `SPEC.md` (site e API no mesmo domínio por causa do cookie) leva a algo como `temveg.ai` e `api.temveg.ai`. Entra na etapa de deploy.
- (F0) No frontend, o `fsevents` (dependência opcional do Vite no macOS) tem script de instalação fora do `allowScripts`. Mesmo aviso do `esbuild` (B0) e do `argon2` (B7); entra na mesma decisão.
