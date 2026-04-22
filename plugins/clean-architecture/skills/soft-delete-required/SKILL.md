---
name: soft-delete-required
description: Ensure every new entity has soft-delete support (except junction / join tables). TRIGGER when creating a new entity / model class, adding a new table to the schema, generating a migration that introduces a table, or editing the ORM configuration for a new type.
---

# Soft delete required

Every entity is soft-deleted by default. Hard delete is for GDPR-style data erasure and admin tooling — not something normal request handlers or repositories do.

## Rule

- A new entity inherits the project's soft-delete base (or includes the equivalent columns / fields — check peer entities for the pattern the project already uses). Typical columns:
  - `is_deleted` / `IsDeleted` — boolean, default `false`, not null
  - `deleted_at` / `DeletedAt` — nullable timestamp
  - optionally `deleted_by` — nullable user id
- **Delete operations** set `is_deleted = true` and `deleted_at = now()`. They do **not** issue SQL `DELETE`.
- **Repositories / queries** filter out `is_deleted = true` rows by default. Most ORMs support this via a global query filter; use it rather than copying `.where(is_deleted = false)` into every query.
- **Queries that intentionally need to see deleted rows** opt in explicitly and document why.

## ORM-specific patterns

| ORM | Query-filter mechanism |
|---|---|
| EF Core | `modelBuilder.Entity<T>().HasQueryFilter(x => !x.IsDeleted);` + `.IgnoreQueryFilters()` to opt out |
| Prisma | Middleware that rewrites `findMany` / `findFirst` with `where: { deletedAt: null }` |
| SQLAlchemy | Custom `Query` subclass, or `@events.listens_for(Query, "before_compile")` hook |
| Django | Custom `Manager` that filters; a second `all_objects` manager for opt-out |
| TypeORM | `@DeleteDateColumn()` for soft-delete, `.softRemove()` / `.restore()` APIs |
| ActiveRecord | `acts_as_paranoid` / `paranoia` gem, or `default_scope { where(deleted_at: nil) }` |
| GORM | `gorm.DeletedAt` field — built-in, automatic |
| Diesel | Not built-in; add a nullable `deleted_at`, filter in all queries, scoped by convention |

Whichever the project uses, **be consistent with peer entities** — don't invent a new mechanism for one new entity.

## The one exception: junction / join tables

Pure junction tables skip soft delete. Removing the row is the operation; soft-deleting it breaks the "does user X have role Y?" query in ways that are worse than just hard-deleting.

A row is a junction table iff:
- It has exactly two (occasionally three) FKs and no other meaningful state.
- Its primary key is the composite of those FKs.
- Removing it doesn't need an audit trail beyond "it's gone".

If you're unsure, it's not a junction. Default to soft delete.

## Checklist when adding a new entity

1. Inherits the project's soft-delete base or includes the equivalent columns.
2. The ORM configuration adds the soft-delete query filter (check a peer entity's configuration for the exact pattern).
3. The generated migration creates `is_deleted` and `deleted_at` columns with correct nullability and defaults — verify in the migration file, not just the model.
4. Any hard-delete requirement (GDPR erasure, test fixtures) goes through a dedicated admin path, not the standard delete handler.

## Why this exists

Accidental deletions are one of the more recurring production incidents. Soft delete gives you a recovery window and a consistent audit trail. The cost is one extra column per table and one extra predicate per query — cheap compared to un-deleting rows after the fact. When a project formalizes this, it usually has an ADR; check the ADR index when an edge case forces judgment.
