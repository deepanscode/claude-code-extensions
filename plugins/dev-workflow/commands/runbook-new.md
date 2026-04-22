---
description: Create a new operational runbook
allowed-tools: Read, Write, Bash, Glob
---
Create a new runbook for: $ARGUMENTS

## Conventions

Runbooks are on-call / incident-response docs. Most projects keep them in:
- `docs/runbooks/`
- `Docs/runbooks/`
- `ops/runbooks/`
- `runbooks/` at repo root

Default to `docs/runbooks/` if none exists.

## Steps

1. **Locate or create the runbooks folder.**
2. **Confirm this belongs in runbooks/** (operational / on-call) rather than `guides/` (dev workflow). If it's really a dev-setup guide, stop and suggest `/guide-new` instead.
3. **Name by symptom, not system.** On-call searches for alert strings. Prefer `kafka-consumer-lag-spiking.md` over `kafka-operations.md`, `500-error-rate-elevated.md` over `api-troubleshooting.md`.
4. **Check for a `TEMPLATE.md`** in the runbooks folder. If present, copy it. Otherwise use the fallback below.
5. **Fill in** from the user's arguments:
   - Title
   - Severity (ask if not obvious; default P2)
   - Owning team (ask if not provided)
   - Last verified: today's date
   - Symptom section: prefill with exact alert text or log lines the user gave
6. **Leave** Quick check, Mitigation, Root cause, and Escalation as placeholders for the user to complete from real incident knowledge.
7. **Flag any destructive step** you noted in arguments — remind the user that blast-radius warnings are required before any destructive command in a runbook.

Never invent mitigation commands. If the user didn't give them, leave placeholders with `<TODO>` markers. A wrong runbook is worse than a missing one.

## Fallback template (if none exists)

```markdown
# <Title>

- **Severity**: P<N>
- **Owning team**: <team>
- **Last verified**: YYYY-MM-DD

## Symptom

<Exact alert text, log lines, or user-visible behavior that triggers this runbook.>

## Quick check (≤2 minutes)

1. <First command / dashboard to look at>
2. <Second>

## Mitigation

<Steps to stop the bleeding. Put the safest, least-destructive option first. For any destructive step, state the blast radius explicitly.>

## Root-cause investigation

<Queries, log paths, and dashboards to find out why this happened, after the immediate issue is mitigated.>

## Escalation

- **After <N> minutes without mitigation** → page <team / person>
- **If <specific condition>** → page <team / person>

## References

- <Related runbooks, dashboards, ADRs>
```
