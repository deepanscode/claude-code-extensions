---
name: clean-arch-boundaries
description: Enforce Clean Architecture layering when editing files in a Domain / Application / Infrastructure / Contracts (or equivalently named) project. Dependencies point inward; the domain / core layer has zero framework or infrastructure dependencies. TRIGGER when editing any file under a `*/Domain/**`, `*/Application/**`, `*/Infrastructure/**`, or `*/Contracts/**` folder (or equivalent naming like `core/`, `domain/`, `usecases/`, `adapters/`, `infra/`), or when adding a dependency / `using` / `import` between those layers.
---

# Clean Architecture boundaries

Dependencies point **inward**. An outer layer may reference inner layers, never the reverse.

```
Infrastructure  →  Application  →  Domain
       ↑                              ↑
       └──────────  Contracts  ───────┘
```

**Note**: Layer names vary by language / project. Match by role, not by exact folder name:

| Role | Common names |
|---|---|
| Domain | `Domain/`, `domain/`, `core/`, `entities/`, `model/` |
| Application | `Application/`, `application/`, `usecases/`, `services/`, `handlers/` |
| Infrastructure | `Infrastructure/`, `infrastructure/`, `infra/`, `adapters/`, `persistence/` |
| Contracts | `Contracts/`, `contracts/`, `public/`, `shared/`, `api/` (the module's public surface, not the HTTP layer) |

Check `CLAUDE.md` / `AGENTS.md` for project-specific names.

## Hard rules

- **Domain**: zero references to ORMs (EF Core, Prisma, SQLAlchemy, TypeORM, GORM, Diesel, ActiveRecord…), web frameworks (ASP.NET, Express, Django, FastAPI, Spring, Gin, Rails…), DI / mediator libraries (MediatR, InversifyJS, tsyringe…), logging frameworks, HTTP clients, background-job libraries, or any module's Application / Infrastructure. Only the language's standard library + shared primitives.
- **Application**: may reference Domain + Contracts + infrastructure *abstractions* (interfaces). May reference orchestration helpers (MediatR, validators like FluentValidation / Zod / Pydantic) — but **no** concrete persistence (DbContext, Prisma client, session, connection) and **no** HTTP-framework types.
- **Infrastructure**: may reference Application, Domain, Contracts, and external SDKs. This is where ORMs, job runners, third-party SDKs, and adapter classes live.
- **Contracts / public-surface**: DTOs, request / response / event types, enums shared across module boundaries. **No** domain logic (no methods with behavior), **no** persistence types, **no** validators, **no** mapping profiles.
- **Cross-module references**: one module may reference **only** another module's Contracts / public surface — never its Domain, Application, or Infrastructure. See `modular-monolith-contracts` skill.

## Common violations to block

- Domain file importing an ORM type or a web-framework type.
- Repository *implementation* living in Application (it belongs in Infrastructure; the interface stays in Application or Domain).
- Domain entity exposing `DbSet<T>`, `IQueryable<T>`, `Queryable`, Prisma models, or any query-builder type.
- Controller / route handler reaching into another module's Application layer directly (dispatch through the in-process bus / shared interface instead).
- Contracts project containing behavior (methods with logic), mapping profiles (AutoMapper, MapStruct, …), or validators.
- Framework annotations on domain entities (`@Entity`, `[Table]`, `@Column`, `[JsonProperty]`) — those belong on a separate persistence model / mapping, not on the domain type.

## When you find a violation

1. **Move the type to the correct layer.** Don't add a shim to make the wrong layer compile.
2. **If the fix requires restructuring** (e.g., extract an interface into Application, implement in Infrastructure), do it in the same change — don't leave a half-fix.
3. **Update the project reference / import / package dependency.** Stale references linger otherwise.

## Why this exists

Clean Architecture only "works" if layering is respected. A single leak (Domain importing an ORM, Application importing an HTTP framework) makes the module un-testable without infra, un-extractable later, and invites further leaks. The rule is mechanical on purpose: if a layer's imports follow the arrow, unit tests and refactors stay cheap.

Projects that formalize this typically have an ADR (e.g., ADR-0001 "Modular monolith over microservices" or "Clean Architecture for all modules"). Check the project's ADR index when an edge case forces judgment.
