---
name: migration-safety
description: Gate database migration commands — generating a migration is fine, applying one is forbidden without explicit, in-conversation user approval. TRIGGER when about to run any migration tool command (EF Core, Prisma, Alembic, Rails, Flyway, Liquibase, Knex, Sequelize, golang-migrate, sqlx, Diesel, etc.), edit a generated migration file, or run any command that would change a database schema.
---

# Database migration safety

Database state is the hardest thing to recover in most systems — code rolls back, schema changes don't. This skill treats **generating** and **applying** migrations as two very different operations.

## Hard rules

1. **Never apply a migration** to any database (local, dev, staging, prod) without explicit, in-conversation user approval for that specific run. A past approval does not authorize a new run — ask again every time.
2. **Generating a migration is always safe.** The output is a source-controlled file that only executes via deliberate action.
3. **Never rewrite or `--force` an already-merged migration.** Write a follow-up migration that reverses or amends it.
4. `remove` / `down` on a migration is safe **only** if it hasn't been applied anywhere. If there's any chance it has run (CI, another dev's box, staging), write a new migration that reverses it instead.

## Which commands need approval

| Tool | Safe (generate) | DANGEROUS (apply) |
|---|---|---|
| **EF Core** | `dotnet ef migrations add <Name>`, `dotnet ef migrations script` | `dotnet ef database update`, `dotnet ef database drop` |
| **Prisma** | `prisma migrate dev --create-only`, `prisma migrate diff` | `prisma migrate dev`, `prisma migrate deploy`, `prisma db push` |
| **Alembic (Python)** | `alembic revision`, `alembic revision --autogenerate` | `alembic upgrade`, `alembic downgrade` |
| **Rails** | `rails g migration` | `rails db:migrate`, `rails db:rollback`, `rails db:schema:load` |
| **Django** | `manage.py makemigrations`, `manage.py sqlmigrate` | `manage.py migrate`, `manage.py flush` |
| **Flyway** | (editing SQL files in `migrations/`) | `flyway migrate`, `flyway clean` |
| **Liquibase** | (editing changelog) | `liquibase update`, `liquibase rollback` |
| **Knex / Sequelize / TypeORM** | `knex migrate:make`, `sequelize migration:generate`, `typeorm migration:create` | `knex migrate:latest`, `sequelize db:migrate`, `typeorm migration:run` |
| **golang-migrate / sqlx / Diesel** | `migrate create`, `sqlx migrate add`, `diesel migration generate` | `migrate up`, `sqlx migrate run`, `diesel migration run` |
| **Raw SQL** | Writing the `.sql` file | Running it against a database |

Rule of thumb: **if the command talks to a database, it needs approval.**

## Review the generated migration before committing

Migration tools emit surprises. Scan the generated file for:

- **Column drops you didn't intend.** A rename the schema-diffing tool doesn't recognize looks like `drop + add` — that silently loses data. If you see a drop, confirm it's really gone, or annotate the model with a rename hint so the next regeneration produces a `rename`.
- **Non-nullable column added without a default.** On a non-empty table this will fail. Options: default value, multi-step migration (add nullable → backfill → set non-null), or generated-as-expression.
- **Type narrowing.** `text` → `varchar(100)`, `bigint` → `int`, `numeric` → `int` can lose data silently. Require an explicit cast / check.
- **Index or unique-constraint changes on large tables.** These can lock writes or rewrite the table. Flag for the human running the deploy.
- **`DropTable` / `DropColumn`.** Double-check this is intended and that nothing still reads from it.
- **Multi-tenant / soft-delete scoping drift.** If the project uses `tenant_id` / `organization_id` or soft-delete columns, confirm new tables have them and the indexes match the table's peer tables.

## If you actually need the DB updated locally

1. Stop and show the user the generated migration.
2. Tell them exactly which command would apply it, against which environment (local / dev / staging / prod) and which connection string.
3. Wait for explicit approval.
4. Run it (or let them run it) — once. Do not re-run to "make sure it took".

**Don't infer approval from context.** The user saying "add a migration for X" is approval to *generate*, not to *apply*. If in doubt, ask.

## Why this exists

Generated migrations are reversible — they're just files. Applied migrations against a shared database are not. A careless `update` on what you thought was a local DB but was actually a pointed-at-staging connection string is a common, recoverable-only-with-effort mistake. The cost of one extra question is far lower than the cost of that mistake.
