# Spec — Mapa de restaurantes veganos de Florianópolis

## O que é

Um site com um mapa de Florianópolis que mostra restaurantes veganos. O visitante abre o mapa, vê os marcadores, filtra e clica em um restaurante para ver os detalhes.

Um aplicativo mobile virá depois e vai consumir a mesma API. Por isso a API é um produto independente do frontend web.

## Usuários

- **Visitante** (sem login): vê o mapa, filtra, abre detalhes.
- **Admin**: entra com e-mail e senha e cadastra, edita e remove restaurantes pelo painel admin. Pode haver mais de um admin; todos têm as mesmas permissões.

## Escopo da v1

- Listar restaurantes no mapa.
- Ver detalhes de um restaurante (nome, descrição, endereço, bairro, tipo, contato, horário).
- Filtrar por tipo, por bairro e por nome.
- Buscar apenas os restaurantes dentro da área visível do mapa.
- Login de admin com e-mail e senha (entrar, sair, consultar a sessão atual).
- Contas de admin criadas por um comando no terminal do servidor; não existe cadastro público.
- Endpoints de escrita (criar, editar, remover) na API, exigindo admin logado.
- Painel admin em `/admin`, dentro do mesmo frontend:
  - tela de login com e-mail e senha;
  - lista de restaurantes com busca por nome;
  - formulário de criar e editar, com a localização escolhida clicando no mapa;
  - remoção com confirmação.

## Fora da v1

Não implementar, nem deixar "preparado":

- Cadastro público e contas de visitante (só admins têm conta).
- Recuperação de senha por e-mail, troca de senha pelo painel, login social, autenticação em dois fatores.
- Tela para gerenciar admins, níveis de permissão, histórico de alterações.
- Avaliações, comentários, favoritos.
- Upload de fotos.
- Outras cidades.
- Aplicativo mobile.
- Importação automática de dados (Google Places, OpenStreetMap etc.).
- Deploy e CI/CD (será uma etapa própria, decidida depois).

## Stack

| Camada | Escolha |
|---|---|
| Linguagem | TypeScript em tudo, modo `strict` |
| Backend | Node (LTS atual) + Fastify |
| Banco | PostgreSQL, rodando localmente via Docker Compose |
| Acesso ao banco | Knex (query builder, migrations e seeds) |
| Validação | Zod |
| Hash de senha | argon2 |
| Sessão | JWT em cookie `httpOnly` (`@fastify/jwt` + `@fastify/cookie`) |
| Limite de tentativas | `@fastify/rate-limit`, só na rota de login |
| Testes | Vitest |
| Frontend | React + Vite |
| Rotas do frontend | React Router (site público em `/`, painel em `/admin`) |
| Mapa | Leaflet (react-leaflet) com tiles do OpenStreetMap |
| Gerenciador de pacotes | npm |

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
| description | text | opcional |
| type | text | `fully_vegan` ou `vegan_options` |
| address | text | obrigatório |
| neighborhood | text | obrigatório |
| latitude | numeric | obrigatório |
| longitude | numeric | obrigatório |
| phone | text | opcional |
| website | text | opcional |
| instagram | text | opcional |
| opening_hours | text | texto livre na v1 |
| created_at / updated_at | timestamptz | |

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
4. **Mapa**: Leaflet + OpenStreetMap, por ser gratuito e não exigir chave de API.
5. **Sessão do admin**: o login devolve um JWT em cookie `httpOnly`, que o JavaScript da página não consegue ler. A sessão expira em 7 dias. Isso exige que, em produção, site e API fiquem no mesmo domínio (ex.: `site.com` e `api.site.com`).
6. **Criação de admins**: por comando no terminal (`npm run create-admin`), sem tela de cadastro.
7. **Idioma**: código e nomes em inglês; textos da interface em português.
