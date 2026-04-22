---
description: Pre-PR review — architectural self-review plus parallel docs-sync and test-gap agents, consolidated by severity
allowed-tools: Read, Grep, Glob, Bash, Agent
---
Review the current branch against its base branch (`develop`, `main`, `master`, or whatever the project uses). Run the three checks below in parallel by dispatching the two agents and performing the architectural scan yourself, then consolidate findings.

## 0. Resolve the base branch

Detect in order: `origin/develop`, `origin/main`, `origin/master`. If none of those exist, ask the user which branch this PR targets. All subsequent `git diff` commands compare against this base.

If the branch has no diff against the base, report that and stop.

## 1. Architectural self-review (do this yourself)

Scan the diff for common violations. The specific rules depend on the project — check which of these skills are installed and let them guide the scan:

- **Layering violations** (if `clean-arch-boundaries` skill is installed)
  - Domain / core layer importing persistence, HTTP, or framework-specific packages
  - Dependencies pointing outward instead of inward
- **Cross-module / cross-context leaks** (if `modular-monolith-contracts` skill is installed)
  - A file importing another module's internal types rather than its public contracts
  - New cross-module package references that bypass the contracts boundary
- **Route-derived IDs validated in request-body validators** (if `route-derived-ids` skill is installed)
- **Missing soft-delete on new entities** (if `soft-delete-required` skill is installed)
- **Tenant scoping drift** — new tenant-scoped entities missing the tenant/organization column (if the project is multi-tenant)
- **Commit / branch hygiene** — check the branch name and recent commits against `branch-naming` and `commit-message-format` skills
- **Secret leaks** — scan the diff for what look like API keys, tokens, connection strings, `.env` contents

If the project's `CLAUDE.md` / `AGENTS.md` lists critical rules, treat those as additional items to scan for.

## 2. Documentation drift (delegate)

Dispatch the `docs-sync` agent in parallel with step 3. It returns a list of documentation files that should have been updated alongside the code change but weren't.

## 3. Test coverage (delegate)

Dispatch the `test-gap` agent in parallel with step 2. It returns production types that gained new behavior in this diff but didn't get a matching test.

## Consolidated output

Merge all three reports into a single review grouped by severity:

```
## Blockers (must fix before PR)
- <findings that violate hard rules or critical coverage gaps>

## Should fix
- <findings that are important but the team might defer>

## Consider
- <findings that may or may not apply — flagged for human judgment>
```

Each finding includes a `file:line` reference where applicable and a one-line suggested fix. When a rule's rationale lives in an ADR, reference it so the reviewer can check edge-case judgment.

## Ground rules

- **Don't fix issues.** This command reports; the human decides which fixes to make.
- **Don't duplicate.** If the same issue appears in the architectural scan and in `docs-sync` or `test-gap`, list it once under the highest severity.
- **Cap the consolidated report at ~600 words.** Link to file:line; don't quote large blocks.
