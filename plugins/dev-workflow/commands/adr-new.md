---
description: Create a new Architecture Decision Record
allowed-tools: Read, Write, Bash, Glob
---
Create a new ADR for: $ARGUMENTS

## Conventions

Most projects store ADRs in one of:
- `docs/adr/` (lowercase, most common)
- `Docs/adr/`
- `adr/` at repo root
- `doc/architecture/decisions/`

Detect which the project uses (check repo root + first-level dirs). If the project already has ADRs, copy their exact layout. If there are none yet, default to `docs/adr/` and note this in the summary so the user can move it if they prefer.

## Steps

1. **Locate the ADR folder.** Check in order: `docs/adr/`, `Docs/adr/`, `adr/`, `doc/architecture/decisions/`. If none exists, create `docs/adr/` and tell the user you did.
2. **Find the next ADR number.** List the folder and pick the next zero-padded 4-digit number (`0001`, `0002`, …).
3. **Find a template.** Look for `TEMPLATE.md` in the ADR folder. If none exists, use the MADR-style template below.
4. **Create the file** as `{NNNN}-{kebab-slug}.md`. Derive the slug from the arguments.
5. **Fill in:**
   - Title
   - Date (today's date, ISO format)
   - Status: `Proposed`
   - Context and Decision: draft from the arguments; flag anything you're unsure about with `<TODO: confirm>` rather than inventing.
6. **Update the ADR index** (`README.md` in the ADR folder) if one exists. Add a row with the ADR number, title, and `Proposed` status.
7. **Output a summary:** which file was created, what's in it, and what the user needs to fill in or confirm before moving it to `Accepted`.

Do not run `git commit`. Leave that to the user once they've finished the ADR.

## Fallback template (if none exists in the repo)

```markdown
# ADR-NNNN: <Title>

- **Status**: Proposed
- **Date**: YYYY-MM-DD
- **Deciders**: <who is deciding>

## Context

<The situation forcing the decision. What problem are we solving and what constraints apply?>

## Decision

<The decision we are making, stated positively.>

## Consequences

<What becomes easier, harder, or different because of this decision? Include downsides.>

## Alternatives considered

<Options that were weighed and why they were not chosen.>

## References

<Related ADRs, specs, external docs.>
```
