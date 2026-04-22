---
description: Create a new feature spec in the active specs folder
allowed-tools: Read, Write, Bash, Glob
---
Create a new spec for: $ARGUMENTS

## Conventions

Specs typically live in:
- `docs/specs/active/` (with `docs/specs/archive/` for shipped ones)
- `Docs/specs/active/`
- `specs/active/`
- `docs/rfcs/` (some teams call them RFCs)

Default to `docs/specs/active/` if none exists.

## Filename

- If arguments include a ticket key (e.g., `PROJ-1234`), use `{ticket-key}-{slug}.md`.
- Otherwise just `{slug}.md`.

Slug is kebab-case, derived from a short title of the feature.

## Steps

1. **Locate or create the active specs folder.**
2. **Check for a `TEMPLATE.md`** in the specs folder. If present, copy it. Otherwise use the fallback below.
3. **If a ticket key is provided**, try to fetch the ticket via the project's tracker integration (Atlassian / Linear / GitHub). If fetching is available and succeeds, prefill the problem statement from the ticket description. If not available, leave placeholders and mention the ticket key in the spec header.
4. **Fill in** what you can derive from arguments:
   - Title and ticket reference
   - Problem statement (ask if unclear)
   - Affected modules / services (ask if unclear)
5. **Leave placeholders** for proposed design, API contract sketch, and open questions — these need the author's input.
6. **Do not invent** APIs, data shapes, or design decisions. If the user didn't give you the details, leave `<TODO>` markers so they know where to fill in.

## Fallback template (if none exists)

```markdown
# <Title>

- **Ticket**: <PROJ-1234 or link>
- **Author**: <name>
- **Status**: Draft
- **Last updated**: YYYY-MM-DD

## Problem

<What problem is this solving? Who is affected and how much does it matter?>

## Proposed design

<High-level approach. Include API contract sketch if the change exposes an external interface.>

### API / schema sketch

```
<Endpoint, request / response shape, or schema diff>
```

### Affected modules / services

- <Module / service and what changes>

## Alternatives considered

<Options weighed and why they were not chosen.>

## Open questions

- [ ] <Question to resolve before implementation>

## Rollout / migration

<If this needs a data migration, feature flag, or phased rollout, describe it here.>

## References

<Related specs, ADRs, tickets.>
```
