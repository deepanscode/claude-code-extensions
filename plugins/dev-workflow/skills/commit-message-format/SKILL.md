---
name: commit-message-format
description: Enforce Conventional Commits, an imperative subject, an issue-tracker key on every commit, and a no-AI-attribution rule. TRIGGER when running `git commit`, drafting a commit message, amending a commit, or preparing the title of a PR that mirrors the commit.
---

# Commit message format

Every commit must match:

```
<type>(<scope>): <subject>
```

With the ticket key either as a prefix on the subject or inside square brackets at the end so the tracker can auto-link the commit to the ticket.

## Allowed `<type>` values

| Type | Use for |
|---|---|
| `feat` | New user-facing functionality |
| `fix` | Bug fix |
| `refactor` | Restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests only |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, no logic change |
| `chore` | Dependencies, configs, build scripts |
| `build` | Build system or external dependencies |
| `ci` | CI configuration / scripts |

No other types. If none fit, the change probably needs to split.

## `<scope>` (optional but encouraged)

Short area name: `auth`, `api`, `billing`, `ui`, `infra`, etc. One word, lowercase. Match the module or component touched.

## `<subject>` rules

- Imperative mood: `add`, `fix`, `update` — not `added`, `fixes`, `updating`.
- ≤ 50 characters.
- No trailing period.
- Start with a lowercase letter after the colon.

## Ticket key placement

Either is fine, but pick one per commit:

```
PROJ-1234 feat(api): add route optimization endpoint
feat(api): add route optimization endpoint [PROJ-1234]
```

If the branch already encodes the key (`feature/PROJ-1234`), the key is still required in the commit — most trackers group by commit message, not branch.

If the project's `CLAUDE.md` / `AGENTS.md` says commits don't need a ticket key (solo work, OSS repos, etc.), skip it — but keep everything else.

## Hard rules

1. **No AI / automation attribution.** Never mention Claude, Codex, Copilot, Cursor, Aider, ChatGPT, Gemini, Anthropic, OpenAI, or any AI tool in the commit subject, body, trailers, or code comments. No `Co-Authored-By: Claude`, no `🤖 Generated with …` footer, no "AI-assisted" note. Work is attributed to the human committing it. A project may have a stricter policy in CLAUDE.md; follow whichever is stricter.
2. **Atomic commits.** One logical change per commit. If the subject contains `and`, split.
3. **Avoid generic messages:** `fixed bug`, `updated code`, `changes`, `wip`.
4. **Body explains *why*, not *what*.** The diff already shows *what*. Wrap body at 72 chars.

## Good vs bad

| Bad | Good |
|---|---|
| `fixed bug` | `fix(auth): handle expired JWT on refresh [PROJ-1701]` |
| `updated code` | `refactor(api): extract rate-limit middleware [PROJ-1845]` |
| `WIP` | *(don't commit WIP; stash or use a feature branch)* |
| `feat: added group messaging and fixed contact search` | Split into two commits, each with its own ticket key |
| `feat(api): Added the new endpoint.` | `feat(api): add filter endpoint [PROJ-1234]` |

## What to do when you spot a violation

1. Stop the `git commit` command.
2. Show the drafted message and which rule it breaks.
3. Propose a corrected message.
4. Only commit after the user confirms.

## References

- [Conventional Commits spec](https://www.conventionalcommits.org/)
- The project's `CLAUDE.md` / `AGENTS.md` — authoritative for ticket-key format and any project-specific overrides.
