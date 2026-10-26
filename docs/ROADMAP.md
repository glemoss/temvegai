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

### [ ] A4 — Remover restaurante
Botão de remover na lista, com confirmação antes de apagar.
**Pronto quando:** cancelar não apaga nada, e confirmar remove o restaurante da lista e do mapa público.

### [ ] A5 — Site sem protocolo no site público
O painel de detalhes do site público mostra o site sem o protocolo, sem `www.` e sem a barra final (ex.: `https://www.mandarina.com.br/` aparece como `mandarina.com.br`), com o link ainda apontando para o endereço completo. O formulário do admin e a API continuam exigindo o endereço com `http://` ou `https://`, porque o site pode não ter `https`. Etapa criada durante a revisão da A3.
**Pronto quando:** o site público mostra o site sem protocolo, `www.` e barra final, e o link abre o endereço salvo, com `http` ou `https`. Com testes.

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
- Horários de funcionamento seguem a convenção `Dias: horário`, com trechos separados por `;`, dias por extenso de segunda a domingo, "a" para intervalo, "e" (e vírgula) para dias soltos, `fechado` para dias sem abertura e meia-noite como `0h` (ex.: `Segunda a sexta: 11h–14h; Sábado e domingo: fechado`). O painel de detalhes lê esse texto para mostrar "Aberto agora" ou "Fechado agora"; um texto fora da convenção aparece sem o estado. O dono quer que o formulário do admin já gere o horário nesse formato, em vez de texto livre; decidir na etapa do formulário se basta montar o texto ou se o horário passa a ser estruturado no banco. Decidido no planejamento da A2: o horário passa a ser estruturado, na etapa B12, antes da A2. Resolvido na B12: o horário virou `jsonb` com vários intervalos por dia, a migration converteu os textos e a convenção de texto deixou de existir (só o rollback ainda gera texto nela).
- (F0) ~~O app passa a se chamar **Tem Veg Aí?** (domínio pretendido: `temveg.ai`). Só o frontend usa o nome novo; README, título do `SPEC.md`, `veganos-backend` no `package.json` e o nome do banco continuam "veganos". Decidir se e quando renomear.~~ Resolvido antes da B12: README, título da OpenAPI, pacote `temveg-backend`, usuário, senha e banco `temveg` no `docker-compose.yml` e no `.env.example`, e e-mails dos testes. A pasta local e o repositório no GitHub continuam `veganos`, e a troca fica com o dono.
- (F0) Com o domínio `temveg.ai`, a decisão 5 do `SPEC.md` (site e API no mesmo domínio por causa do cookie) leva a algo como `temveg.ai` e `api.temveg.ai`. Entra na etapa de deploy.
- (B11) `GET /neighborhoods` agrupa os bairros sem diferenciar maiúsculas, como o filtro `neighborhood`, mas não ignora acentos: "Conceicao" e "Conceição" aparecem como bairros separados. Quando a mesma grafia varia só nas maiúsculas, o nome exibido é o menor (`min`). Decidir se o filtro e o agrupamento devem passar a ignorar acentos, ou se o painel admin deve evitar grafias diferentes.
- (B11) Um bairro com um só restaurante tem área de um ponto (mínimo igual ao máximo). A F4 precisa limitar o zoom ao mover o mapa até ele.
- (F0) No frontend, o `fsevents` (dependência opcional do Vite no macOS) tem script de instalação fora do `allowScripts`. Mesmo aviso do `esbuild` (B0) e do `argon2` (B7); entra na mesma decisão.
- (F4) ~~O painel de detalhes fecha quando o restaurante aberto sai do resultado, inclusive quando a pessoa arrasta o mapa e ele sai da área visível. No celular isso pode surpreender. Decidir na F5 se o painel deve continuar aberto até ser fechado.~~ Resolvido na F5: o dono decidiu que o painel continua aberto até ser fechado pelo botão ou pelo Esc.
- (F5) A fonte Bebas Neue (título) vem do Google Fonts por `<link>`, sem pacote npm. Cada visita faz uma requisição a servidores do Google, que recebem o IP do visitante. Decidir no deploy se mantém, se hospeda a fonte junto com o site ou se avisa na política de privacidade (LGPD).
- (F5) ~~Os 5 restaurantes do seed são todos `fully_vegan`, então a folha de contorno (opções veganas) nunca aparece no mapa de desenvolvimento. Decidir se o seed deve ganhar restaurantes `vegan_options`.~~ Resolvido depois da F6: o seed ganhou 4 bares com opções veganas indicados pelo dono (Bugio Centro, Bugio Trindade, Janela Bar e Dona Jovem). Em produção, eles entram pelo painel admin.
- (F6) A API não tem parâmetro de limite: as sugestões recebem todos os restaurantes que combinam com o nome e o frontend mostra só os 8 primeiros. Basta com poucos dados; decidir se `GET /restaurants` deve ganhar um `limit` quando a base crescer.
- (F6) No celular, escolher uma sugestão centraliza o restaurante na tela, mas o painel de detalhes ocupa a parte de baixo (até 60% da altura) e pode cobrir o marcador. Decidir se o mapa deve deslocar o restaurante para a parte visível acima do painel.
- (F6) Ao escolher um restaurante nas sugestões da busca, destacar o pin dele no mapa, para ficar claro qual é entre os marcadores próximos. Decidir como será o destaque (tamanho, cor, animação) e se ele também vale para o pin clicado direto no mapa.
- (A2) Decidido no planejamento: o formulário valida com Zod (dependência nova no `/frontend`, já na tabela de stack) e o campo de bairro sugere os bairros existentes com `<datalist>` vindo de `GET /neighborhoods`.
- (A2) As mensagens de validação da API estão em inglês. O formulário repete as regras em português e só mostra uma mensagem da API quando ela recusa algo que passou pela validação do formulário. Decidir se a API deve passar a responder em português.
- (A2) Hoje o horário é preenchido dia a dia. Um botão para "copiar para os outros dias" economizaria trabalho no cadastro. Decidir se vale fazer.
- (A2) A localização pelo endereço, e o endereço pelo clique no mapa, usam o Nominatim direto do navegador do admin: o endereço digitado e os pontos clicados vão para os servidores do OpenStreetMap, e a política de uso dele limita a 1 busca por segundo e pede identificação da aplicação (hoje vai só o `Referer` do navegador). Basta para poucos admins; entra na conversa de deploy (política de privacidade, ou passar a busca pela API).
- (A2) O bairro preenchido pelo endereço vem com o nome oficial do OpenStreetMap ("Trindade Sul", "Trindade Norte", "Lagoa da Conceição"), que pode não bater com o nome já usado ("Trindade"). Só um nome igual, sem contar maiúsculas e acentos, é trocado pelo nome já cadastrado; os outros ficam como vieram, e o admin corrige antes de salvar. Entra na mesma decisão da (B11) sobre grafias diferentes do mesmo bairro.
- (A2) ~~Com o cabeçalho do painel no `RequireAdmin`, o `useAdminSession` deixou de ser usado pelas páginas (só o teste do `RequireAdmin` o usa). Decidir se remove ou se a A3 vai precisar dele.~~ Resolvido na A3: a edição não precisou dele, e dentro dos modais ele devolveria o contexto do `AdminHome` em vez do admin. O dono decidiu remover o hook.
- (B12) O "Aberto agora" é calculado no frontend. Quando vier o app mobile, decidir se o cálculo passa para a API ou se é duplicado no app.
- (B12) O Postgres guarda as chaves de um `jsonb` na ordem dele, então os dias de `openingHours` voltam da API fora da ordem da semana (`friday`, `monday`, `sunday`...). Os clientes leem pelo nome do dia, então nada quebra; decidir se o repositório deve devolver os dias de segunda a domingo.
- (A0) Abrir `/admin/login` já estando logado mostra o formulário de novo, em vez de levar direto ao painel. Decidir se a tela de login deve verificar a sessão antes.
- (U0) ~~Os tokens da F5 em `index.css` (`--color-green-900`, `--color-green-700`, `--color-green-100`, `--color-border`) têm os mesmos nomes de variáveis do Tailwind. Como ficam fora das camadas do Tailwind, eles vencem: uma classe como `bg-green-700` sai com o verde da F5, e não com o verde padrão do Tailwind. Nos componentes novos, usar as cores do tema (`bg-primary`, `border-border`...). Quando a U1 e a U2 removerem o CSS antigo, decidir se esses tokens somem ou ganham nomes próprios.~~ Resolvido na U2: os tokens da identidade passaram a se chamar `--brand-*` e só alimentam o tema do shadcn, então `bg-green-700` volta a ser o verde do Tailwind.
- (U1) Sem o `src/lib/utils.ts`, o `npx shadcn add` instalou o pacote `cn` (sem relação com o shadcn) para a função `cn()` e o `next-themes` para o Sonner; os dois foram removidos, os componentes passaram a importar `@/lib/utils` e o Toaster ficou com tema claro fixo. Agora que o `utils.ts` existe, isso não deve se repetir, mas vale revisar o `package.json` depois de cada `shadcn add` na U2. Repetiu na U2: mesmo com o `utils.ts`, o `shadcn add` instalou o `cn` e importou dele; o pacote foi removido e os imports trocados para `@/lib/utils`. Continuar revisando depois de cada `shadcn add`.
- (U1) Os componentes gerados pelo shadcn foram ajustados para a identidade: botões arredondados (`rounded-full`) e textos de "Fechar" em português. Um `shadcn add` com `--overwrite` desfaria esses ajustes.
- (U2) As classes `dark:` dos componentes do shadcn eram aplicadas quando o sistema estava em modo escuro, e os campos do site e do painel ficavam acinzentados. O `index.css` passou a ligar o `dark:` a uma classe `.dark` (padrão do shadcn), que o site não usa. Tema escuro não está no escopo da v1.
- (U2) O `NativeSelect` do shadcn ganhou a propriedade `wrapperClassName`, para o select ocupar a largura do filtro. Um `shadcn add` com `--overwrite` desfaria o ajuste, como os da (U1).
- (U2) Com o select nativo, o Bairro desabilitado (enquanto carrega ou com erro) aparece com opacidade reduzida, em vez do fundo cinza da F5.
- (A3) Decidido pelo dono: se o restaurante for removido com a edição aberta, salvar mostra o aviso "Oops, esse restaurante não existe mais.", fecha o modal e recarrega a lista.
