---
name: branch-naming
description: Enforce branch naming conventions and correct branch-off/merge targets. TRIGGER when running `git checkout -b`, `git switch -c`, `git branch <name>`, `git push -u origin <new-branch>`, or any command that creates or renames a branch. Also when proposing a branch name to the user.
---

# Branch naming

Branches should follow a predictable prefix table, include a tracker key (or a release version) where a project uses one, and branch off / merge into the right long-lived branches. Consistent naming powers ticket auto-linking in Jira / Linear / GitHub / etc.

## The four conventional patterns

| Purpose | Pattern | Branch from | Merge into |
|---|---|---|---|
| New feature | `feature/<TICKET-KEY>` | `develop` (Git Flow) or `main` (trunk-based) | same |
| Bug fix on the integration branch | `bugfix/<TICKET-KEY>` | `develop` or `main` | same |
| Critical production fix | `hotfix/<TICKET-KEY-or-slug>` | `main` (or production branch) | `main` **and** `develop` (if Git Flow) |
| Release prep | `release/<YYYY.MM.DD.N>` or `release/vX.Y.Z` | `develop` (or trunk) | `main` **and** `develop` |

- **Ticket key format** is project-specific. Check the project's `CLAUDE.md` / `AGENTS.md` for the exact regex. A common shape is `[A-Z]+-\d+` (e.g., `PROJ-1234`, `WERD-1234`, `ENG-567`). Casing matters for auto-linking — don't lowercase.
- **Release version** is either a date tag (`YYYY.MM.DD.N`, where `N` is the 1-based counter for that day) or a SemVer tag (`vX.Y.Z`). Follow whichever the project already uses — don't mix.

## Hard rules

1. **Never** commit directly to `main`, `master`, `develop`, or any other long-lived integration branch. Create a branch.
2. **Never** use ad-hoc variants (`feat/`, `bug/`, `fix/`, `feature-`, `BUGFIX/`). Use the exact prefixes above.
3. Hotfixes branch off the production branch, **not** the integration branch. Merge back to both.
4. When the project's CLAUDE.md / AGENTS.md specifies a different convention (e.g., different prefixes, no ticket key), follow that instead — those instructions take precedence.

## No ticket key provided? Ask.

If the user hasn't given a ticket key and the project expects one, do not invent one. Ask:
> "Which ticket is this for? I need the key (e.g. `PROJ-1234`) to name the branch correctly."

If they explicitly want a branch without a ticket key, flag that it breaks auto-linking and get explicit confirmation before creating it.

## What to do when you spot a violation

1. Stop the branch-creation command.
2. Surface the correct pattern for the intent (feature / bugfix / hotfix / release).
3. Propose a corrected name.
4. Only run the command after the user confirms the corrected name.

## Customizing for a project

Projects can override the defaults in their `CLAUDE.md` / `AGENTS.md`:

- The exact ticket-key regex (e.g., Linear's `ENG-\d+`, GitHub issues as `#\d+`)
- Whether the integration branch is `develop` (Git Flow) or `main` (trunk-based)
- Release-version style (date vs SemVer)
- Extra prefixes the team uses (e.g., `refactor/`, `chore/`, `docs/`) — allow them if the project documents them, but still require a ticket key
