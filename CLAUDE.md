# Mapa de restaurantes veganos de Florianópolis

Leia `docs/SPEC.md` (o que é o produto e o que está fora do escopo) e `docs/ROADMAP.md` (as etapas) antes de qualquer trabalho.

## Regra principal: uma etapa por vez

O projeto é construído bloco a bloco, e o dono revisa cada bloco antes do próximo.

- Trabalhe **somente** na etapa do `ROADMAP.md` que foi pedida.
- Antes de escrever código, apresente o plano da etapa (arquivos que vai criar ou alterar e por quê) e espere aprovação.
- Não adiante nada de etapas futuras: nem arquivos vazios, nem pastas, nem dependências, nem código "já preparado".
- Não crie nada do `/frontend` enquanto a fase B não estiver concluída.
- Ao terminar, mostre como verificar o critério de "pronto" da etapa, marque a etapa como concluída no `ROADMAP.md` e **pare**. Não comece a próxima.
- Se a etapa exigir uma decisão que não está no `SPEC.md` (biblioteca nova, mudança no modelo de dados, mudança de escopo), pergunte em vez de decidir.
- Se perceber algo fora da etapa que merece atenção, anote na seção "Pendências" do `ROADMAP.md` em vez de corrigir.

## Dependências

Use apenas o que está na tabela de stack do `SPEC.md`. Qualquer pacote novo precisa de aprovação antes de instalar, com uma linha explicando por que é necessário.

## Arquitetura do backend

Camadas, com dependência sempre de fora para dentro:

```
routes  →  controllers  →  use cases  →  repositories (interfaces)
                                              ↑
                                  implementações com Knex
```

- **Routes**: registram o endpoint no Fastify. Sem lógica.
- **Controllers**: validam a entrada com Zod (`schema.parse`), traduzem HTTP para chamada de use case e a resposta de volta para HTTP. Sem regra de negócio, sem acesso a banco. Não há schema de saída.
- **Use cases**: uma classe por operação (ex.: `ListRestaurantsUseCase`), com um método `execute`. Contêm a regra de negócio. Não conhecem Fastify nem Knex.
- **Repositories**: o use case depende de uma interface (ex.: `RestaurantRepository`). A implementação com Knex fica separada e é a única parte que importa o Knex.

Como aplicar SOLID aqui:

- **Responsabilidade única**: um use case por operação; um arquivo, um motivo para mudar.
- **Inversão de dependência**: use cases recebem repositórios pelo construtor, tipados pela interface. A montagem (qual implementação entra onde) acontece em um único lugar de composição, sem container de injeção de dependência.
- **Segregação de interface**: interfaces de repositório pequenas, só com os métodos que os use cases existentes realmente usam. Não adicione métodos "para o futuro".
- **Aberto/fechado e Liskov**: qualquer implementação da interface (Knex ou em memória, para teste) deve poder ser trocada sem alterar o use case.

Não crie abstrações sem uso concreto: nada de classes base genéricas, repositório genérico ou camadas extras além das listadas.

## Convenções

- TypeScript `strict`; sem `any`.
- Código, nomes de arquivos, tabelas e colunas em inglês. Textos da interface em português.
- Banco em `snake_case`, código em `camelCase`; a conversão acontece no repositório.
- Mudança de schema só por migration do Knex. Nunca edite uma migration já aplicada; crie uma nova.
- Erros de negócio são classes próprias (ex.: `RestaurantNotFoundError`) convertidas em resposta HTTP em um único error handler.
- Senhas, hashes e tokens nunca aparecem em logs, respostas da API ou mensagens de erro. O tipo de usuário devolvido pela API não tem o campo de hash.
- Hash de senha e emissão de token ficam atrás de interfaces (`PasswordHasher`, por exemplo); use cases não importam argon2 nem a biblioteca de JWT.
- Configuração vem de variáveis de ambiente, validadas na inicialização. Mantenha `.env.example` atualizado e nunca versione `.env`.

## Testes

- Use cases: testes unitários com repositório em memória.
- Rotas não têm teste automatizado (decisão do dono); são verificadas com `curl` contra o banco de desenvolvimento.
- Não há Postgres de teste; os repositórios Knex não têm teste automatizado.
- Uma etapa só está pronta com testes passando, `lint` e `typecheck` limpos.

## Git

- Só faça commit quando o dono pedir.
- Um commit por etapa, no padrão Conventional Commits: `tipo(escopo): descrição`.
  - Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `style`, `perf`.
  - Escopo: a área alterada (ex.: `restaurants`, `auth`, `db`, `config`, `admin`).
  - Descrição em inglês, no imperativo, minúscula, sem ponto final, até 72 caracteres.
  - O código da etapa vai no corpo da mensagem, não no título.
  - Exemplo:
    ```
    feat(restaurants): add restaurant repository

    Step B3.
    ```
- Se a etapa misturar naturezas diferentes (ex.: configuração e funcionalidade), proponha a divisão em mais de um commit e espere aprovação.
- Nunca inclua `Co-Authored-By`, "Generated with Claude Code" ou qualquer menção a Claude, Anthropic ou IA em mensagens de commit, descrições de PR ou no código. O dono é o único autor.

## Comandos

Rodar dentro de `/backend`, com Node 24 (`nvm use` na raiz lê o `.nvmrc`). O banco sobe com `docker compose up -d` na raiz, e o `/backend/.env` é uma cópia do `.env.example`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em `http://localhost:3000` com recarga automática |
| `npm test` | Roda os testes com Vitest |
| `npm run lint` | ESLint e verificação de formatação do Prettier |
| `npm run typecheck` | Checagem de tipos com `tsc --noEmit` |
| `npm run format` | Formata o código com Prettier |
| `npm run migrate` | Aplica as migrations pendentes |
| `npm run migrate:rollback` | Desfaz o último lote de migrations |
| `npm run seed` | Apaga e recria os dados de exemplo (só desenvolvimento) |
