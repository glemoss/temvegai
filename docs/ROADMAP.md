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

### [x] B11 — Bairros
`ListNeighborhoodsUseCase` e `GET /neighborhoods`, que devolve cada bairro com a área que cobre os seus restaurantes, para o frontend montar o filtro de bairro e mover o mapa até ele. Etapa criada durante o planejamento da F4.
**Pronto quando:** `GET /neighborhoods` devolve os bairros do seed em ordem alfabética, cada um com a sua área; bairros escritos com maiúsculas diferentes aparecem uma vez só; a rota é pública e aparece em `/docs`. Com testes do use case e da rota.

### [x] B12 — Horário estruturado
O horário de funcionamento deixa de ser texto livre e passa a ser estruturado: migration nova que troca `opening_hours` pelo formato estruturado e converte os textos existentes, `Restaurant`, repositórios, schema de `POST`/`PUT`, OpenAPI e seed no formato novo. O painel de detalhes do site público passa a ler a estrutura em vez do texto, mantendo "Aberto agora" e "Fechado agora". Etapa criada durante o planejamento da A2, que depende dela. O formato (um ou vários intervalos por dia, coluna `jsonb` ou tabela própria) é decidido pelo dono no plano desta etapa.
**Pronto quando:** `migrate` converte os horários existentes e o rollback volta ao texto; a API aceita e devolve o horário estruturado e recusa horário inválido com 400; o painel público mostra o horário e o estado de aberto ou fechado como antes. Com testes.

### [x] B13 — Pendências do backend
Resolve as pendências do backend que não dependem do deploy:
- (B1) mensagens do Knex no logger do Fastify, em vez do console;
- (B8) `migrate`, `seed` e `create-admin` validam só as variáveis de ambiente que usam;
- (B9) campo desconhecido no corpo gera item em `details` com o nome do campo em `field`;
- (B10) documentação com o formato de `website` e `instagram` e os parâmetros de área do mapa como número;
- (B11 e A2) filtro `neighborhood` e `GET /neighborhoods` ignoram acentos, além de maiúsculas;
- (B12) `openingHours` volta com os dias de segunda a domingo;
- (F6) parâmetro `limit` em `GET /restaurants`;
- (A2) mensagens de validação da API em português.

Etapa criada a partir das pendências. No plano, o dono decide item a item quais entram (B1, B10, B11, `limit` e mensagens em português pedem decisão); os que ficarem de fora voltam para as pendências.
**Pronto quando:** cada item aprovado no plano funciona como descrito, aparece em `/docs` quando muda a API, e é verificado com `curl`. Com testes.
No plano: entraram os oito itens. O bairro passa a ser nomeado pela grafia usada pela maioria dos restaurantes (no empate, a com acento), e o `limit` vai de 1 a 100.

### [x] B14 — Bairro capitalizado
`POST` e `PUT /restaurants` salvam o bairro com a primeira letra de cada palavra maiúscula e o resto minúsculo, independente de como foi escrito, exceto as preposições e artigos `da`, `de`, `do`, `das`, `dos` e `e`, que ficam minúsculos quando não são a primeira palavra (ex.: `lagoa DA conceição` vira `Lagoa da Conceição`). A regra fica na API, para valer para qualquer cliente. Os bairros já salvos não são convertidos. Etapa criada junto com a A6, e vem antes dela.
**Pronto quando:** criar e editar um restaurante com o bairro em minúsculas, maiúsculas ou misturado salva e devolve o bairro no formato descrito, com as preposições minúsculas, e os bairros já salvos continuam como estão. Verificado com `curl`. Com testes.
No plano: espaços repetidos viram um só, e só o espaço separa palavras (hífen e apóstrofo não).

### [x] B15 — Ordenação igual em qualquer banco
Restaurantes e bairros passam a ser ordenados por uma chave sem acentos e em minúsculas, comparada byte a byte (`lower(unaccent(...)) COLLATE "C"`), com o texto original (também em `"C"`) como desempate. A escolha da grafia do bairro, no empate, também passa a usar `"C"`. O repositório em memória ordena pela mesma regra, em vez do `localeCompare`. Sem migration: a ordem deixa de depender da collation do sistema operacional do Postgres. Etapa criada a partir da pendência (B13).
**Pronto quando:** `GET /restaurants` e `GET /neighborhoods` ordenam nomes com acento no início ("Éden") e com maiúsculas e minúsculas misturadas ("BUGIO", "naTerra") como se não tivessem acento nem caixa, o que muda quais restaurantes entram com `limit`. Verificado com `curl`. Com testes.

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

### [x] F4 — Filtros e busca
Filtro por tipo e bairro, busca por nome, e recarga dos marcadores conforme a área visível do mapa.
**Pronto quando:** os filtros atualizam o mapa, e mover o mapa busca só os restaurantes da área visível.

### [x] F5 — Acabamento visual
Identidade visual, responsividade, estado vazio (nenhum resultado) e acessibilidade básica.
**Pronto quando:** aprovado visualmente pelo dono no desktop e no celular.

### [x] F6 — Busca com sugestões
Ao digitar no campo de busca, uma lista abaixo dele sugere restaurantes de toda a cidade pelo nome. Escolher uma sugestão move o mapa até o restaurante e abre o painel. A busca no mapa por nome passa a ser aplicada só no Enter. Etapa criada durante a revisão da F5.
**Pronto quando:** as sugestões aparecem ao digitar e podem ser escolhidas com mouse e teclado (setas, Enter, Esc); escolher uma move o mapa e abre o painel; o mapa só filtra por nome depois do Enter, e apagar o campo remove o filtro. Com testes.

### [x] F7 — Legenda com folhas
A legenda do mapa deixa de mostrar o pin e passa a mostrar só a folha de cada tipo (cheia para 100% vegano, contorno para opções veganas), com 24px. Os marcadores do mapa continuam com o pin. Etapa criada depois da A5.
**Pronto quando:** a legenda mostra as duas folhas sem o pin, os marcadores do mapa continuam iguais, e a legenda é aprovada visualmente pelo dono no desktop e no celular. Com testes.

### [x] F8 — Destaque do pin selecionado
O pin do restaurante aberto no painel fica 1,35× maior (crescendo a partir da ponta), com um verde mais vivo, sombra mais forte e na frente dos pins vizinhos. Vale para o restaurante escolhido nas sugestões da busca e para o pin clicado no mapa, e o destaque some quando o painel fecha. Sem animação contínua. Etapa criada a partir da pendência da F6.
**Pronto quando:** clicar num pin ou escolher uma sugestão destaca o pin do restaurante, trocar de restaurante move o destaque, fechar o painel remove o destaque, e o destaque é aprovado visualmente pelo dono no desktop e no celular. Com testes.

### [x] F9 — Pendências do frontend
Resolve as pendências do site e do painel admin que não dependem do deploy:
- (F6) no celular, escolher um restaurante desloca o mapa para o pin ficar visível acima do painel de detalhes;
- (F6) as sugestões da busca pedem só 8 restaurantes com o `limit` da API;
- (A0) abrir `/admin/login` já logado leva direto ao painel;
- (A2) botão "copiar para os outros dias" no horário do formulário.

Etapa criada a partir das pendências. Depende da B13 só no item do `limit`, que sai se a B13 não criar o parâmetro. No plano, o dono decide se o botão de copiar horário entra; o que ficar de fora volta para as pendências.
**Pronto quando:** cada item aprovado no plano funciona como descrito, e o deslocamento no celular é aprovado visualmente pelo dono. Com testes.
No plano: o item do `limit` ficou de fora porque a B13 ainda não foi feita, e o botão de copiar entrou com um botão por dia.

### [x] F10 — Sugestões com `limit`
As sugestões da busca pedem só 8 restaurantes à API, com o `limit` criado na B13, em vez de receber todos os que combinam com o nome e cortar no navegador. O mapa continua sem limite. Etapa criada a partir da pendência da F6.
**Pronto quando:** a requisição das sugestões leva `limit=8`, as sugestões continuam as mesmas, o mapa continua pedindo sem `limit`. Com testes.

---

## Fase A — Painel admin

Fica dentro do `/frontend`, na rota `/admin`. Só começa com a fase F concluída. A A3 e a A4 só começam com a fase U concluída.

### [x] A0 — Rotas e login do admin
React Router separando o site público (`/`) do painel (`/admin`). Tela de login com e-mail e senha usando `POST /auth/login`, verificação de sessão com `GET /auth/me` ao abrir o painel, botão de sair.
**Pronto quando:** credenciais erradas mostram erro, credenciais certas abrem uma página do painel ainda vazia, recarregar a página mantém o login, acessar `/admin` sem estar logado leva para a tela de login, sair encerra a sessão, e o site público continua funcionando igual.

### [x] A1 — Lista de restaurantes
Tabela com nome, tipo e bairro, busca por nome, estados de carregando, erro e lista vazia.
**Pronto quando:** a tabela mostra todos os restaurantes da API e a busca filtra a lista.

### [x] A2 — Criar restaurante
Formulário com todos os campos do modelo, validação antes de enviar e localização escolhida clicando em um mapa (preenche latitude e longitude).
**Pronto quando:** criar um restaurante pelo painel faz ele aparecer na lista e no mapa público, erros de validação da API aparecem no formulário, e sessão expirada leva de volta ao login.

### [x] A3 — Editar restaurante
Reaproveita o formulário da A2, preenchido com os dados atuais.
**Pronto quando:** editar um restaurante atualiza a lista e o mapa público, e abrir a edição de um id inexistente mostra erro.

### [x] A4 — Remover restaurante
Botão de remover na lista, com confirmação antes de apagar.
**Pronto quando:** cancelar não apaga nada, e confirmar remove o restaurante da lista e do mapa público.

### [x] A5 — Site sem protocolo no site público
O painel de detalhes do site público mostra o site sem o protocolo, sem `www.` e sem a barra final (ex.: `https://www.mandarina.com.br/` aparece como `mandarina.com.br`), com o link ainda apontando para o endereço completo. O formulário do admin e a API continuam exigindo o endereço com `http://` ou `https://`, porque o site pode não ter `https`. Etapa criada durante a revisão da A3.
**Pronto quando:** o site público mostra o site sem protocolo, `www.` e barra final, e o link abre o endereço salvo, com `http` ou `https`. Com testes.

### [x] A6 — Aviso de bairro novo
No formulário de criar e editar restaurante, o bairro vindo do endereço (OpenStreetMap) só preenche o campo quando bate com um bairro já cadastrado, sem contar maiúsculas e acentos; senão o campo fica vazio para o admin escolher. Salvar com um bairro que não está em `GET /neighborhoods` pede confirmação antes de enviar, mostrando os bairros parecidos já cadastrados (ex.: "Nenhum restaurante está em “Trindade Norte”. Bairros parecidos: Trindade. Salvar mesmo assim?"). Sem mudança no banco nem na API. Etapa criada a partir da pendência da A2. O critério de "parecido" é decidido pelo dono no plano desta etapa.
**Pronto quando:** um bairro do endereço que bate com um cadastrado preenche o campo com o nome cadastrado, e um que não bate deixa o campo vazio; salvar com bairro já cadastrado não pede confirmação; salvar com bairro novo pede confirmação, cancelar volta ao formulário sem enviar e confirmar salva; vale para criar e editar. Com testes.

---

## Fase U — Interface com shadcn/ui

O frontend passa a usar shadcn/ui sobre Tailwind CSS, mantendo a identidade visual aprovada na F5. Fase criada depois da A2; entra antes da A3, para que a edição e a remoção já nasçam com os componentes novos. O Leaflet continua com o CSS próprio.

### [x] U0 — Base do Tailwind e do shadcn/ui
Tailwind CSS no Vite, alias `@/` para `src`, `components.json` do shadcn e as cores, fontes e raios da F5 transformados em variáveis do tema do shadcn. Nenhum componente ainda.
**Pronto quando:** o site público e o painel continuam com a mesma aparência no desktop e no celular, uma classe do Tailwind funciona na página, e `test`, `lint` e `typecheck` passam.

### [x] U1 — Painel admin com shadcn/ui
Login, cabeçalho, lista, formulário em modal e avisos do painel passam a usar os componentes do shadcn/ui (Button, Input, Label, Table, Dialog, Select, Sonner etc.), e os ícones passam a vir do `lucide-react`. O CSS próprio que deixar de ser usado é removido.
**Pronto quando:** tudo o que a A0, a A1 e a A2 entregaram continua funcionando, com testes, e o painel é aprovado visualmente pelo dono no desktop e no celular.

### [x] U2 — Site público com shadcn/ui
Filtros, busca com sugestões, painel de detalhes e legenda passam a usar os componentes do shadcn/ui. O CSS próprio que deixar de ser usado é removido.
**Pronto quando:** tudo o que a F3 a F6 entregaram continua funcionando, inclusive a navegação das sugestões por teclado, com testes, e o site é aprovado visualmente pelo dono no desktop e no celular.

### [x] U3 — Logo e favicon em SVG
O título do site público e do login do admin, hoje montado com texto em Bebas Neue e a folha posicionada como acento, passa a ser a logo em SVG feita pelo dono, com "Tem Veg Aí?" como texto alternativo. O favicon passa a ser o pin com a folha, também feito pelo dono. Etapa criada depois da D1.
**Pronto quando:** o site público e o login mostram a logo no desktop e no celular, a aba do navegador mostra o favicon novo, o título continua sendo o `h1` com o nome "Tem Veg Aí?" para leitores de tela, e `test`, `lint`, `typecheck` e `build` passam.

---

## Fase D — Deploy

Publicação gratuita, para portfólio, sem domínio próprio. Site e API ficam na Vercel, em dois projetos do mesmo repositório (raiz `frontend` e raiz `backend`); o banco fica no Neon; o GitHub Actions roda os checks e publica. O site repassa `/api/*` para a API (rewrite da Vercel), então o navegador vê um único domínio e o cookie de sessão continua `httpOnly` e `sameSite: 'lax'`, sem mudar a decisão 5 do `SPEC.md`.

Para que a troca da API por um container (ex.: Cloud Run) continue barata depois, a API não usa nenhum serviço próprio da Vercel (KV, Edge Config, Postgres, `waitUntil`), tem build próprio com `tsc` e lê toda a configuração de produção de variáveis de ambiente. Os limites dos planos gratuitos são conferidos na etapa que usa cada plataforma.

### [x] D0 — Build de produção
Script `build` (compila com `tsc` para `dist`) e `start` (roda `dist/server.js` com `node`, sem `tsx`) no backend, e `build` (`vite build`) no frontend.
**Pronto quando:** no backend, `npm run build && npm start` sobe a API contra o banco local e `GET /health` responde 200; no frontend, `npm run build` gera o `dist`, e o site servido por ele (`vite preview`) abre o mapa e o painel contra a API local.

### [x] D1 — API atrás de proxy e seed protegido
Variável de ambiente para o `trustProxy` do Fastify, para que o limite de tentativas do login conte pelo IP de quem acessa e não pelo do proxy. O `seed`, que apaga os dados, recusa rodar com `NODE_ENV=production`. `.env.example` atualizado.
**Pronto quando:** um teste com `app.inject` mostra que, com o proxy confiável ligado, duas origens diferentes no `X-Forwarded-For` têm contagens separadas, e o `seed` termina com erro e sem apagar nada quando `NODE_ENV=production`. Com testes.
No plano: `TRUST_PROXY` é o número de proxies na frente da API (padrão 0, desligado). Como o Fastify 5.12 deixou de aceitar a contagem (ela não distingue um proxy de um cliente que chega direto na API), a contagem vira uma função passada ao `trustProxy`, segura enquanto toda requisição passa pelos proxies, como na Vercel. Com a API num container exposto diretamente, trocar por uma lista de endereços dos proxies.

### [x] D2 — CI
Workflow do GitHub Actions que roda `test`, `lint`, `typecheck` e `build` do backend e do frontend em todo push e pull request, com o Node do `.nvmrc`.
**Pronto quando:** um pull request mostra os checks verdes, e um teste quebrado de propósito deixa o check vermelho.

### [x] D3 — Banco no Neon
O dono cria o projeto no Neon (região de São Paulo, se o plano gratuito oferecer). O README ganha uma seção de produção com como rodar `migrate` e `create-admin` contra o Neon pela conexão direta, e com o aviso de que o `seed` não roda lá.
**Pronto quando:** as migrations rodaram no Neon, inclusive a do `unaccent`, existe uma conta de admin, e o `migrate:rollback` não foi preciso.

### [x] D4 — API na Vercel
Arquivo de entrada da função da Vercel, que exporta o app em vez de chamar `listen`; a montagem das dependências passa a ficar numa função usada por ele e pelo `server.ts`, para continuar havendo um só lugar de composição. Projeto da Vercel com raiz `backend`, Node 24, variáveis de ambiente (`DATABASE_URL` pela conexão com pooler do Neon, `JWT_SECRET`, `NODE_ENV`, `CORS_ORIGIN`, a do proxy) e deploy automático pelo Git desligado, para que nenhum deploy de prévia use o banco de produção.
**Pronto quando:** `curl https://<api>.vercel.app/health` responde 200 com o banco acessível, e o login por `curl` devolve o cookie com `Secure` e `HttpOnly` (o `argon2` carregou o binário pronto).

### [x] D5 — Site na Vercel
`vercel.json` no frontend com o repasse de `/api/*` para a API e o fallback da SPA para o `index.html`. Projeto da Vercel com raiz `frontend`, `VITE_API_URL=/api` e deploy automático pelo Git desligado. `CORS_ORIGIN` da API passa a ser o endereço do site. A quantidade de proxies confiáveis da D1 é conferida aqui, com o caminho completo.
**Pronto quando:** o mapa carrega no endereço público; recarregar `/admin` abre o painel; o login funciona no Chrome e no Firefox (que bloqueia cookies de terceiros); criar, editar e remover funcionam; e o limite de tentativas do login vê o IP de quem acessa.
Conferido: pelo site (navegador → borda do site → borda da API → função) e direto na API, o `remoteAddress` nos logs da função é o IP de quem acessa, então o `TRUST_PROXY` continua `1`. O rewrite de um projeto da Vercel para outro não acrescenta um proxy à contagem.

### [x] D6 — Deploy automático
Workflow que, depois dos checks verdes num push na `main`, roda as migrations pendentes no Neon pela conexão direta e publica a API e depois o site com a CLI da Vercel (`npx`, sem entrar no `package.json`). Tokens e endereços do banco ficam nos secrets do GitHub. Como as migrations rodam antes do código novo, cada migration precisa funcionar também com a versão anterior da API.
**Pronto quando:** um commit na `main` aparece publicado sem passo manual; um commit com teste quebrado não é publicado; e uma migration nova é aplicada no Neon antes de a API que depende dela entrar no ar.
Conferido: o merge do PR #7 publicou a API e o site pelo workflow `Deploy`, com as migrations (`Already up to date.`) antes dos dois deploys. Os secrets ficam no environment `production`, liberado só para a `main`, com um token da Vercel por projeto. O deploy só roda com o CI verde (`conclusion == 'success'`); um commit com teste quebrado ainda não foi mandado de propósito. Uma migration aplicada pelo workflow só vai acontecer com a primeira migration da fase M.

---

## Fase M — Melhorias

Melhorias no cadastro do painel admin e no site público, notadas pelo dono ao testar o site publicado na D5. Começa depois da fase D. As etapas pequenas vêm primeiro; o endereço em campos separados, que muda o modelo de dados, fica por último.

Com o deploy automático (D6), cada migration é aplicada enquanto a API anterior ainda está no ar, então precisa funcionar com ela. Por isso a troca do `address` pelos campos separados é feita em duas etapas: a M5 cria e preenche os campos novos e mantém o `address`; a M6, num deploy seguinte, remove o `address`.

### [x] M0 — Página "não encontrada"
Rota para qualquer caminho sem página, no site e dentro do `/admin` (ex.: `/xyz`, `/admin/xyz`), que mostra o cabeçalho do site, uma mensagem em português e um link para o mapa. Hoje esses caminhos recebem o `index.html` pelo fallback da SPA (D5) e a página fica em branco.
**Pronto quando:** `/xyz` e `/admin/xyz` mostram a página com o cabeçalho e o link leva ao mapa; `/`, `/admin` e `/admin/login` continuam iguais. Com testes.

### [x] M1 — Rota até o restaurante
Botão "Como chegar" no painel de detalhes, que abre o Google Maps numa nova aba com a rota até a latitude e longitude cadastradas (`https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`). No celular, o link abre o app do Google Maps quando ele está instalado. Sem dependência nova.
**Pronto quando:** o botão aparece no painel de qualquer restaurante e o link tem a coordenada dele. Com testes.

### [x] M2 — Restaurante no centro da área visível
Clicar num pin, ou escolher um restaurante nas sugestões da busca, centraliza o restaurante no espaço do mapa que sobra visível com o painel de detalhes aberto, no celular (acima do painel) e no desktop (à esquerda dele). O zoom não muda no clique, e a sugestão mantém o zoom que já usa. Substitui a regra da F9, em que o mapa só se move no celular e leva o pin para 10rem abaixo do cabeçalho.
**Pronto quando:** no celular e no desktop, o pin clicado e o restaurante escolhido na busca ficam no centro da área livre, sem ficar atrás do painel nem do cabeçalho. Com testes da conta do deslocamento.

### [x] M3 — Limite da descrição
`description` com no máximo 300 caracteres, na API (Zod, com mensagem em português) e no formulário do admin, que mostra um contador (`120/300`). Sem migration: a coluna continua `text`. Antes do deploy, conferir no Neon se algum restaurante passa de 300 (`select name, length(description) from restaurants where length(description) > 300`); um que passe só precisa ser encurtado na próxima edição, e o contador mostra quanto sobra.
**Pronto quando:** a API recusa uma descrição de 301 caracteres com 400 e aceita uma de 300; o formulário mostra o contador e não deixa salvar acima do limite. Com testes.

### [x] M4 — Telefone padronizado
O formulário do admin usa máscara para telefone fixo e celular (`(48) 3333-4444` e `(48) 99999-8888`). A API aceita só 10 ou 11 dígitos, ignorando a pontuação, e guarda só os dígitos. O site e o painel formatam o número na exibição. Uma migration converte os telefones existentes para dígitos; um que não fique com 10 ou 11 dígitos continua como está e aparece na saída da migration, para o admin corrigir. O rollback formata os dígitos de volta. O seed passa a guardar só dígitos. Sem dependência nova para a máscara.
**Pronto quando:** `migrate`, `migrate:rollback` e `migrate` de novo rodam no banco local; a API recusa `123` e aceita `(48) 99999-8888`, guardando `48999998888`; o site mostra o telefone formatado, e a API anterior continua funcionando com os telefones convertidos. Com testes.

### [ ] M5 — Endereço em campos separados
O endereço passa a ter logradouro (`street`, obrigatório), número (`number`, opcional, para "s/n"), complemento (`complement`, opcional) e CEP (`postal_code`). Migration que cria as colunas, separa os endereços existentes no que der (o que não der fica todo no logradouro, para o admin revisar) e **mantém** o `address`, que a API passa a montar a partir dos campos, para que a API anterior continue funcionando durante o deploy. As colunas novas ficam opcionais no banco nesta etapa: a API anterior grava só o `address`, e os endereços existentes não têm CEP. A API nova exige logradouro e CEP no criar e no editar.
No formulário, digitar o CEP preenche logradouro e bairro pelo ViaCEP, chamado do navegador do admin, sem chave e sem dependência nova; o bairro segue a regra da A6. A busca da coordenada no Nominatim usa os campos novos, e clicar no mapa preenche logradouro, número, bairro e também o CEP quando o Nominatim devolver (em parte do Brasil ele vem vazio ou genérico, e o admin confere). O painel de detalhes mostra o endereço montado com o CEP, e o link de rota da M10 passa a usar esse endereço montado. O `SPEC.md` é atualizado: modelo de dados e a linha de geocodificação da stack, com o ViaCEP, que recebe o CEP digitado, como o Nominatim recebe o endereço (A2).
**Pronto quando:** `migrate`, `migrate:rollback` e `migrate` de novo rodam no banco local com os restaurantes do seed separados; criar e editar exigem CEP; o CEP preenche logradouro e bairro; o clique no mapa preenche o CEP quando ele existe; e a API anterior continua lendo e gravando `address` depois da migration. Com testes.

### [ ] M6 — Remover a coluna `address`
Depois que a M5 estiver no ar, migration que remove o `address`, que deixa de ser montado pela API, e torna o `street` obrigatório no banco; um restaurante gravado pela API anterior durante o deploy da M5, só com o `address`, tem o logradouro preenchido a partir dele antes. O rollback recria a coluna a partir dos campos separados.
**Pronto quando:** `migrate`, `migrate:rollback` e `migrate` de novo rodam no banco local; nada no backend nem no frontend usa mais o `address`; e o deploy automático aplica a migration antes da API nova, o que também confirma o último item da D6.

---

### [x] M7 — Mapa minimalista
O mapa do site passa a usar os tiles Voyager da CARTO, com os nomes por baixo das ruas (`rastertiles/voyager_labels_under`), cores suaves e menos informação que os do OpenStreetMap, para os pins se destacarem. A CARTO exige uma chave grátis, em `VITE_CARTO_KEY`, validada na inicialização como a `VITE_API_URL`; sem ela os tiles vêm com marca d'água. O mapa do painel admin continua com o OpenStreetMap. Sem dependência nova. Feita antes da M1, a pedido do dono.
**Pronto quando:** o mapa do site mostra o Voyager sem marca d'água e com o crédito do OpenStreetMap e da CARTO, o do admin continua igual, e o site não abre sem a chave. Com testes.

### [x] M8 — Mapa vetorial com cores próprias
O mapa do site troca os tiles em imagem do Voyager pelo estilo vetorial Voyager oficial da CARTO (`gl/voyager-gl-style/style.json`, com a mesma `VITE_CARTO_KEY`), desenhado pelo `maplibre-gl` dentro do Leaflet, ligado por `@maplibre/maplibre-gl-leaflet` (as duas dependências aprovadas pelo dono). As cores das camadas do estilo são trocadas por cima, a partir de `mapColors.ts`, com uma paleta própria no clima do MapTiler Basic, que o dono pediu (fundo bege, ruas brancas, parques num verde claro da marca, água azul, nomes nas cores de texto da marca), que o dono ajusta com a ajuda do Maputnik; fontes e ícones continuam vindo da CARTO. O mapa do painel admin continua com o OpenStreetMap. Substitui a ideia de trocar para o MapTiler, descartada pelo dono: o plano grátis dele é bem menor (100 mil requisições por mês) e os tiles em imagem também não deixam trocar as cores.
**Pronto quando:** o site mostra o Voyager vetorial com as cores do `mapColors.ts` e os créditos do OpenStreetMap e da CARTO, o admin continua igual, o site não abre sem a chave, e o `build` gera o worker do MapLibre. Com testes.

### [x] M9 — Localização do visitante
Botão "Minha localização" no mapa do site, acima do zoom. Ao clicar, o navegador pede permissão e o mapa mostra um ponto azul na posição do visitante, com um círculo da precisão, e centraliza nele na área visível, com zoom 16 (ou o atual, se já for maior). O ponto acompanha o visitante enquanto a página está aberta, mas o mapa só se move no clique. A localização não sai do navegador, nem para a API. Permissão negada, posição indisponível ou navegador sem suporte mostram um aviso em português ao lado do botão. O painel admin fica igual. Sem dependência nova: usa a Geolocation API do navegador. Feita antes da M5, a pedido do dono.
**Pronto quando:** o botão aparece no mapa; clicar mostra o ponto e centraliza nele; permissão negada mostra o aviso; e o admin continua igual. Com testes.

### [x] M10 — Rota pelo nome do restaurante
O botão "Como chegar" passa a mandar ao Google Maps o texto `Nome, endereço, Florianópolis` no lugar da latitude e longitude (`https://www.google.com/maps/dir/?api=1&destination=<texto>`), para o destino aparecer com o nome do restaurante, e não como "Pin". Sem dependência nova e sem migration. Feita antes da M5, a pedido do dono.
**Pronto quando:** o link de qualquer restaurante tem o nome e o endereço dele, e o app do Google Maps mostra o nome do restaurante no destino. Com testes.

## Depois da v1 (não planejado ainda)

Domínio próprio, API em container (ex.: Cloud Run) se a Vercel deixar de bastar, aplicativo mobile.

## Pendências

Coisas notadas durante uma etapa que ficam para depois.

- (B0) ~~O npm avisa que o script de instalação do `esbuild` (dependência do `tsx` e do Vitest) não está aprovado em `allowScripts`. Dev e testes funcionam sem ele; decidir se aprova ou se deixa como está.~~ Decidido pelo dono: deixa como está, sem aprovar nenhum script (vale também para o `argon2` da B7 e o `fsevents` da F0). O binário do `esbuild` chega pelo pacote opcional `@esbuild/<plataforma>`, o `argon2` carrega os binários prontos de `prebuilds/` (inclusive musl, para Alpine) e o `fsevents`, só no macOS, é opcional. No deploy, rodar `npm ci` dentro do próprio container, sem `--omit=optional`, e confirmar que o login funciona; só aprovar um script se a plataforma de produção exigir. Com a fase D na Vercel, a confirmação do login entra no critério de pronto da D4.
- (B1) ~~O Knex escreve `Acquire connection error` direto no console quando o banco está fora do ar, fora do logger do Fastify. Decidir se vale redirecionar para o logger.~~ Resolvido na B13: no servidor, as mensagens do Knex vão para o logger do Fastify; os comandos continuam no console.
- (B4) Decidido pelo dono: Zod só na entrada, com `schema.parse` no controller, sem dependência nova e sem schema de saída. Resolvido na B10 (opção A): o `src/openapi.ts` monta o documento a partir dos schemas exportados pelos controllers, com `z.toJSONSchema`, e um teste garante que toda rota registrada está documentada.
- (B5) ~~Rotas sem teste automatizado.~~ Resolvido na B8: o dono decidiu testar rotas com `app.inject` e dependências em memória, e o `CLAUDE.md` foi atualizado.
- (B7) O `argon2` também tem script de instalação fora do `allowScripts` (mesmo aviso do `esbuild` na B0). Funciona sem ele porque o pacote traz binários prontos. Resolvido com a decisão da (B0): não aprovar.
- (B8) ~~`migrate`, `seed` e `create-admin` usam a mesma validação de ambiente do servidor e agora também exigem `JWT_SECRET` e, desde a B10, `CORS_ORIGIN`, embora não os usem. Decidir se os comandos devem validar só o que precisam.~~ Resolvido na B13: os comandos validam só o `DATABASE_URL`.
- (B8) O logout só apaga o cookie: um token copiado continua válido até expirar (7 dias). Revogação de sessão não está no escopo da v1.
- (B8) O limite de tentativas do login fica na memória do processo; reiniciar o servidor zera a contagem, e com mais de uma instância cada uma conta separado. Basta para a v1, mas entra na conversa de deploy. Decidido no planejamento da fase D: na Vercel, cada instância da função conta separado e a contagem some quando a instância é desligada. Com o tráfego de um portfólio costuma haver uma instância só; a garantia volta com um armazenamento compartilhado ou com a API num container de instância única.
- (B9) ~~Um campo desconhecido no corpo de `POST`/`PUT /restaurants` gera um item em `details` com `field` vazio, porque o Zod põe o nome do campo na mensagem e não no caminho. O error handler poderia usar o nome do campo como `field`; decidir se vale ajustar.~~ Resolvido na B13: cada campo desconhecido vira um item de `details`, com o nome em `field`.
- (B10) A documentação em `/docs` fica aberta também em produção. Decidir na etapa de deploy se esconde ou protege.
- (B10) ~~Como a documentação descreve o que o cliente envia, campos com transformação aparecem só pelo tipo de entrada: `website` e `instagram` aparecem como texto livre, sem o formato de URL nem o padrão de usuário, e os parâmetros de área do mapa aparecem como texto em vez de número. A validação real continua igual; decidir se vale completar a descrição à mão.~~ Resolvido na B13: os schemas ganharam `.meta()` com o formato de `website` e `instagram`, e os parâmetros numéricos aparecem como número.
- Horários de funcionamento seguem a convenção `Dias: horário`, com trechos separados por `;`, dias por extenso de segunda a domingo, "a" para intervalo, "e" (e vírgula) para dias soltos, `fechado` para dias sem abertura e meia-noite como `0h` (ex.: `Segunda a sexta: 11h–14h; Sábado e domingo: fechado`). O painel de detalhes lê esse texto para mostrar "Aberto agora" ou "Fechado agora"; um texto fora da convenção aparece sem o estado. O dono quer que o formulário do admin já gere o horário nesse formato, em vez de texto livre; decidir na etapa do formulário se basta montar o texto ou se o horário passa a ser estruturado no banco. Decidido no planejamento da A2: o horário passa a ser estruturado, na etapa B12, antes da A2. Resolvido na B12: o horário virou `jsonb` com vários intervalos por dia, a migration converteu os textos e a convenção de texto deixou de existir (só o rollback ainda gera texto nela).
- (F0) ~~O app passa a se chamar **Tem Veg Aí?** (domínio pretendido: `temveg.ai`). Só o frontend usa o nome novo; README, título do `SPEC.md`, `veganos-backend` no `package.json` e o nome do banco continuam "veganos". Decidir se e quando renomear.~~ Resolvido antes da B12: README, título da OpenAPI, pacote `temveg-backend`, usuário, senha e banco `temveg` no `docker-compose.yml` e no `.env.example`, e e-mails dos testes. A pasta local e o repositório no GitHub continuam `veganos`, e a troca fica com o dono.
- (F0) Com o domínio `temveg.ai`, a decisão 5 do `SPEC.md` (site e API no mesmo domínio por causa do cookie) leva a algo como `temveg.ai` e `api.temveg.ai`. Entra na etapa de deploy. Decidido no planejamento da fase D: sem domínio por enquanto; o site na Vercel repassa `/api/*` para a API, e o navegador vê um domínio só. Os endereços `*.vercel.app` estão na Public Suffix List, então sem o repasse o cookie não funcionaria. Com domínio próprio, volta a valer `temveg.ai` e `api.temveg.ai`.
- (B11) ~~`GET /neighborhoods` agrupa os bairros sem diferenciar maiúsculas, como o filtro `neighborhood`, mas não ignora acentos: "Conceicao" e "Conceição" aparecem como bairros separados. Quando a mesma grafia varia só nas maiúsculas, o nome exibido é o menor (`min`). Decidir se o filtro e o agrupamento devem passar a ignorar acentos, ou se o painel admin deve evitar grafias diferentes.~~ Resolvido na B13: o filtro e o agrupamento ignoram acentos, e o nome exibido é a grafia usada pela maioria dos restaurantes do bairro (no empate, a com acento).
- (B11) ~~Um bairro com um só restaurante tem área de um ponto (mínimo igual ao máximo). A F4 precisa limitar o zoom ao mover o mapa até ele.~~ Resolvido na F4: o mapa vai até o bairro com zoom máximo 16.
- (F0) No frontend, o `fsevents` (dependência opcional do Vite no macOS) tem script de instalação fora do `allowScripts`. Mesmo aviso do `esbuild` (B0) e do `argon2` (B7). Resolvido com a decisão da (B0): não aprovar.
- (F4) ~~O painel de detalhes fecha quando o restaurante aberto sai do resultado, inclusive quando a pessoa arrasta o mapa e ele sai da área visível. No celular isso pode surpreender. Decidir na F5 se o painel deve continuar aberto até ser fechado.~~ Resolvido na F5: o dono decidiu que o painel continua aberto até ser fechado pelo botão ou pelo Esc.
- (F5) A fonte Bebas Neue (título) vem do Google Fonts por `<link>`, sem pacote npm. Cada visita faz uma requisição a servidores do Google, que recebem o IP do visitante. Decidir no deploy se mantém, se hospeda a fonte junto com o site ou se avisa na política de privacidade (LGPD).
- (F5) ~~Os 5 restaurantes do seed são todos `fully_vegan`, então a folha de contorno (opções veganas) nunca aparece no mapa de desenvolvimento. Decidir se o seed deve ganhar restaurantes `vegan_options`.~~ Resolvido depois da F6: o seed ganhou 4 bares com opções veganas indicados pelo dono (Bugio Centro, Bugio Trindade, Janela Bar e Dona Jovem). Em produção, eles entram pelo painel admin.
- (F6) ~~A API não tem parâmetro de limite: as sugestões recebem todos os restaurantes que combinam com o nome e o frontend mostra só os 8 primeiros. Basta com poucos dados; decidir se `GET /restaurants` deve ganhar um `limit` quando a base crescer.~~ Resolvido na B13: `GET /restaurants` aceita `limit` de 1 a 100. Resolvido na F10: as sugestões da busca pedem `limit=8`.
- (F6) ~~No celular, escolher uma sugestão centraliza o restaurante na tela, mas o painel de detalhes ocupa a parte de baixo (até 60% da altura) e pode cobrir o marcador. Decidir se o mapa deve deslocar o restaurante para a parte visível acima do painel.~~ Resolvido na F9: no celular, a sugestão escolhida fica com a ponta do pin 10rem abaixo do cabeçalho, sem passar do topo do painel; um pin clicado que o painel cobriria sobe para a mesma altura.
- (F6) ~~Ao escolher um restaurante nas sugestões da busca, destacar o pin dele no mapa, para ficar claro qual é entre os marcadores próximos. Decidir como será o destaque (tamanho, cor, animação) e se ele também vale para o pin clicado direto no mapa.~~ Resolvido na F8: o dono escolheu o pin maior e em verde mais vivo, sem animação contínua, para o restaurante selecionado pela busca ou pelo clique.
- (A2) Decidido no planejamento: o formulário valida com Zod (dependência nova no `/frontend`, já na tabela de stack) e o campo de bairro sugere os bairros existentes com `<datalist>` vindo de `GET /neighborhoods`.
- (A2) ~~As mensagens de validação da API estão em inglês. O formulário repete as regras em português e só mostra uma mensagem da API quando ela recusa algo que passou pela validação do formulário. Decidir se a API deve passar a responder em português.~~ Resolvido na B13: o Zod usa o idioma `pt-BR` e as mensagens próprias foram traduzidas. As mensagens genéricas do Zod saem técnicas (ex.: "Pequeno demais: esperava que o número fosse >= -90"); como o servidor liga o idioma no processo todo, os erros de variável de ambiente do servidor também saem em português.
- (A2) ~~Hoje o horário é preenchido dia a dia. Um botão para "copiar para os outros dias" economizaria trabalho no cadastro. Decidir se vale fazer.~~ Resolvido na F9: cada dia tem um botão que copia o horário dele para os outros 6, sem confirmação.
- (A2) A localização pelo endereço, e o endereço pelo clique no mapa, usam o Nominatim direto do navegador do admin: o endereço digitado e os pontos clicados vão para os servidores do OpenStreetMap, e a política de uso dele limita a 1 busca por segundo e pede identificação da aplicação (hoje vai só o `Referer` do navegador). Basta para poucos admins; entra na conversa de deploy (política de privacidade, ou passar a busca pela API).
- (A2) ~~O bairro preenchido pelo endereço vem com o nome oficial do OpenStreetMap ("Trindade Sul", "Trindade Norte", "Lagoa da Conceição"), que pode não bater com o nome já usado ("Trindade"). Só um nome igual, sem contar maiúsculas e acentos, é trocado pelo nome já cadastrado; os outros ficam como vieram, e o admin corrige antes de salvar. Entra na mesma decisão da (B11) sobre grafias diferentes do mesmo bairro. Com a B13, a API junta as grafias que só diferem em maiúsculas e acentos; nomes diferentes ("Trindade Sul" e "Trindade") continuam separados. Decidido pelo dono: aviso de bairro novo no formulário, na etapa A6.~~ Resolvido na A6: o bairro do OpenStreetMap só preenche o campo quando bate com um cadastrado, e salvar com um bairro novo pede confirmação, mostrando os cadastrados que têm uma palavra em comum com ele (sem contar `da`, `de`, `do`, `das`, `dos` e `e`). Se a lista de bairros não carregar, o campo não é preenchido e o formulário salva sem confirmação.
- (A2) ~~Com o cabeçalho do painel no `RequireAdmin`, o `useAdminSession` deixou de ser usado pelas páginas (só o teste do `RequireAdmin` o usa). Decidir se remove ou se a A3 vai precisar dele.~~ Resolvido na A3: a edição não precisou dele, e dentro dos modais ele devolveria o contexto do `AdminHome` em vez do admin. O dono decidiu remover o hook.
- (B12) O "Aberto agora" é calculado no frontend. Quando vier o app mobile, decidir se o cálculo passa para a API ou se é duplicado no app.
- (B12) ~~O Postgres guarda as chaves de um `jsonb` na ordem dele, então os dias de `openingHours` voltam da API fora da ordem da semana (`friday`, `monday`, `sunday`...). Os clientes leem pelo nome do dia, então nada quebra; decidir se o repositório deve devolver os dias de segunda a domingo.~~ Resolvido na B13: o repositório Knex devolve os dias de segunda a domingo.
- (A0) ~~Abrir `/admin/login` já estando logado mostra o formulário de novo, em vez de levar direto ao painel. Decidir se a tela de login deve verificar a sessão antes.~~ Resolvido na F9: a tela verifica a sessão e leva ao painel; se a verificação falhar, mostra o formulário.
- (U0) ~~Os tokens da F5 em `index.css` (`--color-green-900`, `--color-green-700`, `--color-green-100`, `--color-border`) têm os mesmos nomes de variáveis do Tailwind. Como ficam fora das camadas do Tailwind, eles vencem: uma classe como `bg-green-700` sai com o verde da F5, e não com o verde padrão do Tailwind. Nos componentes novos, usar as cores do tema (`bg-primary`, `border-border`...). Quando a U1 e a U2 removerem o CSS antigo, decidir se esses tokens somem ou ganham nomes próprios.~~ Resolvido na U2: os tokens da identidade passaram a se chamar `--brand-*` e só alimentam o tema do shadcn, então `bg-green-700` volta a ser o verde do Tailwind.
- (U1) Sem o `src/lib/utils.ts`, o `npx shadcn add` instalou o pacote `cn` (sem relação com o shadcn) para a função `cn()` e o `next-themes` para o Sonner; os dois foram removidos, os componentes passaram a importar `@/lib/utils` e o Toaster ficou com tema claro fixo. Agora que o `utils.ts` existe, isso não deve se repetir, mas vale revisar o `package.json` depois de cada `shadcn add` na U2. Repetiu na U2: mesmo com o `utils.ts`, o `shadcn add` instalou o `cn` e importou dele; o pacote foi removido e os imports trocados para `@/lib/utils`. Repetiu na A4 com o `alert-dialog`; o pacote foi removido de novo. Continuar revisando depois de cada `shadcn add`.
- (U1) Os componentes gerados pelo shadcn foram ajustados para a identidade: botões arredondados (`rounded-full`) e textos de "Fechar" em português. Um `shadcn add` com `--overwrite` desfaria esses ajustes.
- (U2) As classes `dark:` dos componentes do shadcn eram aplicadas quando o sistema estava em modo escuro, e os campos do site e do painel ficavam acinzentados. O `index.css` passou a ligar o `dark:` a uma classe `.dark` (padrão do shadcn), que o site não usa. Tema escuro não está no escopo da v1.
- (U2) O `NativeSelect` do shadcn ganhou a propriedade `wrapperClassName`, para o select ocupar a largura do filtro. Um `shadcn add` com `--overwrite` desfaria o ajuste, como os da (U1).
- (U2) Com o select nativo, o Bairro desabilitado (enquanto carrega ou com erro) aparece com opacidade reduzida, em vez do fundo cinza da F5.
- (A3) Decidido pelo dono: se o restaurante for removido com a edição aberta, salvar mostra o aviso "Oops, esse restaurante não existe mais.", fecha o modal e recarrega a lista.
- (B13) ~~O banco ordena os textos pelos bytes, com maiúsculas antes de minúsculas: a imagem `postgres:18-alpine` usa musl, que ignora a collation `en_US.utf8`. Um bairro ou restaurante em minúsculas ("lagoa da conceicao") aparece depois de "Trindade", e o repositório em memória, que usa `localeCompare`, ordena diferente. Decidir se a ordenação deve ignorar maiúsculas (ex.: `order by lower(name)` ou uma collation ICU).~~ Resolvido na B15: a ordem usa `lower(unaccent(...)) COLLATE "C"`, igual em qualquer Postgres, e o repositório em memória segue a mesma regra.
- (D0) O `vite build` avisa que o JavaScript do site passa de 500 kB depois de minificado (686 kB, 209 kB com gzip), porque mapa, site e painel admin vão num arquivo só. O build funciona; decidir se vale separar o painel admin (e talvez o Leaflet) com `import()` dinâmico.
- (M8) Com o MapLibre, o JavaScript do site passou de 686 kB (209 kB com gzip) para 1.753 kB (499 kB com gzip), mais o worker do MapLibre (519 kB), que ele baixa à parte. Entra na decisão da (D0): carregar o mapa vetorial com `import()` dinâmico deixaria o site aparecer antes, com o fundo do mapa chegando logo depois.
- (M8) ~~O visual do MapTiler Basic tem licença CC-BY 4.0, que pede um crédito "razoavelmente acessível" a partir do mapa (pode ser numa página ligada ao crédito do mapa, não precisa estar nele). Hoje o crédito está só no comentário do `mapColors.ts`. Decidir se entra no crédito do mapa (ex.: "cores: MapTiler Basic") ou numa página sobre o site.~~ Resolvido depois da M8: o dono escolheu uma paleta própria, com os verdes e as cores de texto da marca, no lugar dos valores copiados do Basic, e o crédito deixou de ser necessário.
- (M8) O Voyager raster usava a variante com os nomes por baixo das ruas (`voyager_labels_under`); o estilo vetorial oficial desenha os nomes por cima. Se fizer falta, a ordem das camadas também pode ser trocada no código, como as cores.
- (M8) No Vite, o MapLibre não acha o próprio worker depois que as dependências são empacotadas, e o mapa fica em branco ("Worker failed to load"). O `CartoBasemap.tsx` passa o endereço do worker com `setWorkerUrl`; ao atualizar o `maplibre-gl`, conferir no navegador que o mapa continua aparecendo, porque os testes não desenham o mapa.
- (D2) Os testes do frontend dependem do `VITE_API_URL` no ambiente: o `src/config.ts` valida a configuração ao ser importado, e sem `.env` (como num clone novo) 7 arquivos de teste falham antes de rodar. O CI define a variável no workflow. Decidir se os testes devem deixar de depender dela (ex.: `test.env` no `vite.config.ts`).
- (D3) O bloqueio do `seed` olha só o `NODE_ENV`. Com o `DATABASE_URL` do Neon exportado no terminal e o `.env` local com `NODE_ENV=development`, um `npm run seed` apagaria os restaurantes de produção. O README manda dar `unset DATABASE_URL` logo depois dos comandos; decidir se o `seed` também deve recusar um banco que não esteja em `localhost`.
- (D4) O carregador de funções da Vercel no Node 24 sobe o processo sem o `require()` de pacotes ESM, que o Node 24 aceita sozinho ([vercel/vercel#17770](https://github.com/vercel/vercel/issues/17770)). O `@fastify/static`, usado pelo Swagger UI do `/docs`, faz `require()` do `content-disposition` 3, que é só ESM, e a função quebrava ao carregar. Resolvido com `NODE_OPTIONS=--experimental-require-module` nas variáveis da Vercel. Quando a Vercel corrigir, a variável pode sair; se o `/docs` deixar de ser servido em produção (pendência da B10), ela também deixa de ser necessária.
- (D4) O Knex usa o pool padrão (mínimo de 2 conexões) também na função da Vercel, que é congelada entre requisições. Com o pooler do Neon funcionou; se aparecerem erros de conexão encerrada depois de um tempo parada, configurar `pool: { min: 0 }` e um `idleTimeoutMillis` curto.
- (D5) Pelo site, `/api/docs` abre o HTML do Swagger UI, mas ele pede os arquivos em `/docs/static/...`, fora do `/api`, e o fallback da SPA devolve o `index.html` do site no lugar deles: a documentação só funciona direto na API (`https://temvegai-api.vercel.app/docs`). Entra na decisão da (B10) sobre esconder ou proteger o `/docs` em produção.
- (M7) ~~Os tiles em imagem só permitem filtros que mudam todas as cores juntas. Para escolher a cor de cada elemento (parques, água, ruas) com os verdes da marca, o caminho são os tiles vetoriais da CARTO, com a mesma chave, desenhados pelo `maplibre-gl` e ligados ao Leaflet por mais um pacote: duas dependências novas e um JavaScript maior. Decidir se vira uma etapa.~~ Resolvido na M8.
- (M7) O `contrast(1.15)` por CSS nos tiles saiu depois da M1, a pedido do dono: com os tons claros do Voyager, ele deixava o mapa com cara de desbotado, e não mais nítido. Alternativas para testar no lugar dele: `saturate()`, `brightness()` ou os dois juntos.
- (M7) A chave da CARTO vai no JavaScript público do site, e qualquer um pode copiá-la e gastar o limite gratuito dela. Conferir no painel da CARTO se dá para restringir a chave ao domínio do site.
- (M4) ~~Em produção, a migration roda no deploy automático (D6), e o aviso de um telefone que ficou fora dos 10 ou 11 dígitos só aparece no log desse job. Antes do deploy, dá para conferir no Neon (`select name, phone from restaurants where phone is not null and length(regexp_replace(phone, '\D', '', 'g')) not in (10, 11)`). No formulário, esse telefone abre com a máscara aplicada aos dígitos que tem e precisa ser corrigido antes de salvar.~~ Resolvido antes do deploy da M4: o dono conferiu no Neon, e nenhum telefone fica fora dos 10 ou 11 dígitos.
- (M10) O Google procura o destino pelo texto e não recebe mais a coordenada: um nome diferente do cadastro dele leva só ao endereço, e um nome ou endereço ambíguo pode levar a outro lugar. O dono testou com o Kairú (duas unidades) e funcionou. Se algum restaurante cair no lugar errado, a saída é guardar o Place ID do Google (coluna nova, preenchida no painel admin) e mandá-lo em `destination_place_id`.
