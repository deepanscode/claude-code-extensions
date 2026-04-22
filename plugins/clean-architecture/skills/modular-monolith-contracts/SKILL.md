---
name: modular-monolith-contracts
description: Enforce that cross-module calls in a modular monolith go through each module's public contracts only — never its Domain, Application, or Infrastructure. TRIGGER when a file in one module imports a type from another module, when adding a dependency / package reference between modules, when writing a handler or route that touches multiple bounded contexts, or when adding a new type to a module's public-contracts surface.
---

# Cross-module calls go through public contracts only

A module talks to another module **only** through the callee's public surface (commonly called `Contracts`, `public`, `shared`, or `api`). Never import the callee's Domain, Application, or Infrastructure.

Cross-module coordination shape varies by stack — in-process bus (MediatR in .NET, MediatorJS / tsyringe in TS, a simple service-locator in Python, etc.) or plain interface calls against a public abstraction. What matters is the **seam**: the only types that cross the module boundary are the callee's public contract types.

## Rules

1. **Never add a package / project dependency from one module to another module's Domain, Application, or Infrastructure.** Allowed target: the callee module's Contracts / public surface only.
2. **Never `import` / `using` / `require` an internal type from another module** in a file outside that module. If you see `Module.Domain.*`, `Module.Application.*`, `Module.Infrastructure.*`, `module/src/internal/*`, `module/private/*` being imported from *outside* that module, that's a violation.
3. **Cross-module coordination** = dispatch a public contract (request / command / query / event) through the in-process bus or via a public interface the callee exposes. The handler lives inside the callee's Application layer and is private to it.
4. **Inside a single module**, richer patterns are fine (domain events, direct handler calls, shared repositories). Those must not leak out of the module — if another module needs to react, convert the domain event to a public notification / integration event in the Contracts surface.

## What belongs in a module's Contracts / public surface

- Request / command / query types
- Notification / integration event types
- Response / DTO types referenced by the above (records / immutable data classes)
- Enums shared across module boundaries
- Public interfaces the module exposes for others to depend on (rare; prefer messages)

## What does **not** belong in Contracts

- Handlers or handler implementations
- Validators
- Mapping profiles (AutoMapper, MapStruct, etc.)
- ORM entities, `DbContext`, repository interfaces for internal use
- Any method with business logic

## Examples across stacks

| Stack | Contracts looks like | Dispatching looks like |
|---|---|---|
| .NET + MediatR | `MyModule.Contracts` project with `IRequest<T>` / `INotification` types | `IMediator.Send(new SomeContractRequest(...))` |
| TypeScript (Nx, Turborepo) | `packages/my-module/contracts` or `libs/my-module/public-api` | A call to an exported interface or a mediator / event bus |
| Python modular monolith | `my_module/contracts/` submodule | An injected interface or an in-process message bus |
| Go modular monolith | `internal/mymodule/contracts/` | A call to an interface the consumer owns, implemented by the callee |

## When you see a violation

1. If the calling code needs something from the other module, add a contract type (request / query / notification) to the **callee** module and a handler in its Application layer. Dispatch it from the caller via the bus or interface.
2. Remove the bad package / project reference.
3. If the needed data is trivial and not domain-owned (e.g., a config value, a tenant id), consider whether it belongs in a shared kernel / platform / common package rather than being a cross-module call at all.

## Why this exists

The contracts boundary is the single inter-module seam, which makes every cross-module call explicit, greppable, and cleanly mappable to an out-of-process transport if a module is ever extracted into its own service. Direct interface calls against internals or shared databases dissolve that seam and reintroduce the coupling a modular monolith is designed to avoid.
