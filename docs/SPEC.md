# Spec — Mapa de restaurantes veganos de Florianópolis

## O que é

Um site com um mapa de Florianópolis que mostra restaurantes veganos. O visitante abre o mapa, vê os marcadores, filtra e clica em um restaurante para ver os detalhes.

Um aplicativo mobile virá depois e vai consumir a mesma API. Por isso a API é um produto independente do frontend web.

## Usuários

- **Visitante** (sem login): vê o mapa, filtra, abre detalhes e sugere restaurantes.
- **Admin**: entra com e-mail e senha e cadastra, edita e remove restaurantes pelo painel admin. Pode haver mais de um admin; todos têm as mesmas permissões.

## Escopo da v1

- Listar restaurantes no mapa.
- Ver detalhes de um restaurante (nome, descrição, endereço, bairro, tipo, contato, horário), com a indicação de aberto ou fechado no momento, pelo horário de Florianópolis.
- Filtrar por tipo, por bairro e por nome.
- Buscar apenas os restaurantes dentro da área visível do mapa.
- Ver a própria localização no mapa, pedida pelo botão "Minha localização" e usada só no navegador.
- Login de admin com e-mail e senha (entrar, sair, consultar a sessão atual).
- Contas de admin criadas por um comando no terminal do servidor; não existe cadastro público.
- Endpoints de escrita (criar, editar, remover) na API, exigindo admin logado.
- Sugestão de restaurante pelo visitante, sem conta: um texto livre (nome ou link, até 300 caracteres), enviado pelo botão "Sugerir", ao lado do botão de filtros.
- Rascunho da sugestão gerado por IA: depois de receber a sugestão, a API pesquisa o restaurante com o Gemini e a busca do Google e preenche um rascunho do formulário. A coordenada não vem da IA; o admin localiza pelo endereço, como no cadastro.
- Painel admin em `/admin`, dentro do mesmo frontend:
  - tela de login com e-mail e senha;
  - lista de restaurantes com busca por nome;
  - formulário de criar e editar, em modal sobre a lista, com a localização marcada pelo endereço ou escolhida clicando no mapa;
  - remoção com confirmação;
  - seção "Sugestões", com o texto do visitante e o rascunho da IA, onde o admin revisa o rascunho no formulário de criação e aprova, recusa ou processa de novo uma sugestão que falhou.

## Fora da v1

Não implementar, nem deixar "preparado":

- Cadastro público e contas de visitante (só admins têm conta).
- Recuperação de senha por e-mail, troca de senha pelo painel, login social, autenticação em dois fatores.
- Tela para gerenciar admins, níveis de permissão, histórico de alterações.
- Avaliações, comentários, favoritos.
- Upload de fotos.
- Outras cidades.
- Aplicativo mobile.
- Importação automática de dados (Google Places, OpenStreetMap etc.). A IA só gera o rascunho de uma sugestão, que nunca entra no mapa sem a aprovação do admin; não há importação em massa.
- Domínio próprio (a v1 usa os endereços da Vercel; o deploy está na fase D do `ROADMAP.md`).

## Stack

| Camada | Escolha |
|---|---|
| Linguagem | TypeScript em tudo, modo `strict` |
| Backend | Node (LTS atual) + Fastify |
| Banco | PostgreSQL, rodando localmente via Docker Compose; em produção no Neon |
| Acesso ao banco | Knex (query builder, migrations e seeds) |
| Validação | Zod |
| Hash de senha | argon2 |
| Sessão | JWT em cookie `httpOnly` (`@fastify/jwt` + `@fastify/cookie`) |
| Limite de tentativas | `@fastify/rate-limit`, só no login e no envio de sugestões |
| Testes | Vitest |
| Frontend | React + Vite |
| Interface do frontend | shadcn/ui (componentes copiados para `src/components/ui`) sobre Tailwind CSS (`tailwindcss` + `@tailwindcss/vite`), com `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css` e `sonner` (avisos) |
| Rotas do frontend | React Router (site público em `/`, painel em `/admin`) |
| Mapa | Leaflet (react-leaflet); no site, o estilo vetorial CARTO Voyager (dados do OpenStreetMap, chave grátis em `VITE_CARTO_KEY`), desenhado pelo MapLibre GL (`maplibre-gl`, ligado ao Leaflet por `@maplibre/maplibre-gl-leaflet`), com cores próprias em `mapColors.ts`; no painel admin, tiles do OpenStreetMap |
| Geocodificação | Nominatim (OpenStreetMap), chamado pelo painel admin para marcar o endereço no mapa e preencher o endereço do ponto clicado |
| IA | Gemini API (`gemini-3.8-flash`), com a busca do Google, chamada pela API com `fetch` direto, sem SDK, para gerar o rascunho das sugestões (`GEMINI_API_KEY`). A busca não existe no plano gratuito: o projeto do Google precisa de faturamento ativo (5 mil buscas grátis por mês nos modelos Gemini 3; os tokens são cobrados desde o primeiro), e o teto de 20 processamentos por dia mantém o custo previsível. O texto do visitante vai para o Google, como o endereço vai para o Nominatim. O processamento roda depois da resposta ao visitante, com `waitUntil` (`@vercel/functions`) |
| Gerenciador de pacotes | npm |
| Hospedagem | Vercel, com site e API em dois projetos; o site repassa `/api/*` para a API |
| CI/CD | GitHub Actions (checks em todo pull request e push na `main`, exceto quando só muda documentação; deploy na `main`) |

## Estrutura do repositório

```
/backend     API (primeira fase)
/frontend    Site (só é criado na fase F)
/docs        SPEC.md e ROADMAP.md
CLAUDE.md
```

## Modelo de dados (proposta inicial)

Tabela `restaurants`:

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | chave primária |
| name | text | obrigatório |
| description | text | opcional, até 300 caracteres |
| type | text | `fully_vegan` ou `vegan_options` |
| address | text | obrigatório |
| neighborhood | text | obrigatório |
| latitude | numeric | obrigatório |
| longitude | numeric | obrigatório |
| phone | text | opcional; só dígitos, com DDD: 10 (fixo) ou 11 (celular) |
| website | text | opcional |
| instagram | text | opcional |
| opening_hours | jsonb | opcional; horário semanal estruturado (ver abaixo) |
| created_at / updated_at | timestamptz | |

O horário (`opening_hours`) tem os sete dias, de `monday` a `sunday`, cada um com uma lista de intervalos `{ "opens": "HH:MM", "closes": "HH:MM" }` em ordem e sem sobreposição. Lista vazia é dia fechado. Um fechamento igual ou anterior à abertura (ex.: `18:00`–`02:00`) termina no dia seguinte, e só o último intervalo do dia pode passar da meia-noite.

Tabela `suggestions`:

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | chave primária |
| text | text | obrigatório, até 300 caracteres; o que o visitante enviou |
| status | text | `pending`, `processing`, `ready`, `failed`, `approved` ou `rejected` |
| draft | jsonb | opcional; rascunho do restaurante gerado pela IA, nulo até processar |
| error | text | opcional; motivo da falha no processamento |
| restaurant_id | uuid | opcional; restaurante criado na aprovação |
| processing_started_at | timestamptz | opcional; quando a IA começou a processar pela última vez |
| created_at / updated_at | timestamptz | |

A tabela também é a fila: uma sugestão nova entra como `pending`, passa a `processing` enquanto a IA trabalha e termina em `ready` (com rascunho) ou `failed` (com o erro). O admin leva uma `ready` a `approved` e recusa (`rejected`) uma `pending`, `ready` ou `failed`; uma `failed` volta a `pending` quando ele pede para processar de novo, e uma `processing` sem atualização há mais de 10 minutos também, porque ficou presa quando a função caiu no meio. São até 20 processamentos por dia, contados por `processing_started_at` desde a meia-noite de Florianópolis; os que passam disso terminam em `failed`. No rascunho, só o nome é obrigatório: um campo que a IA não acha, ou que não passa nas regras do formulário, fica nulo.

Tabela `users` (só admins):

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | chave primária |
| email | text | obrigatório, único, salvo em minúsculas |
| password_hash | text | obrigatório; a senha nunca é salva em texto puro |
| created_at / updated_at | timestamptz | |

## Decisões tomadas por padrão (revisar)

Estas escolhas não vieram do dono do projeto; foram assumidas para destravar o plano. Trocar aqui antes de começar, se for o caso.

1. **Origem dos dados**: cadastro manual pelo admin, pelo painel (o seed serve só para desenvolvimento).
2. **Tipos de restaurante**: inclui lugares com opções veganas, não só os 100% veganos.
3. **Coordenadas**: colunas simples de latitude/longitude, sem PostGIS.
4. **Mapa**: Leaflet com dados do OpenStreetMap, por ser gratuito. O site usa o estilo Voyager da CARTO, com cores suaves e menos informação, para os pins se destacarem. Ele é vetorial, desenhado pelo MapLibre, para trocar as cores de cada elemento (parques, água...) sem copiar o estilo: o site carrega o estilo oficial, que a CARTO mantém atualizado, e aplica as cores por cima. O MapLibre deixa o JavaScript do site bem maior. O estilo exige uma chave grátis (até 5 milhões de requisições por mês para projetos não comerciais). O painel admin continua com os tiles do OpenStreetMap, mais detalhados, para acertar o ponto do restaurante.
5. **Sessão do admin**: o login devolve um JWT em cookie `httpOnly`, que o JavaScript da página não consegue ler. A sessão expira em 7 dias. Isso exige que, em produção, site e API fiquem no mesmo domínio (ex.: `site.com` e `api.site.com`). Sem domínio próprio, o site na Vercel repassa `/api/*` para a API, e o navegador vê um domínio só.
6. **Criação de admins**: por comando no terminal (`npm run create-admin`), sem tela de cadastro.
7. **Idioma**: código e nomes em inglês; textos da interface em português.
