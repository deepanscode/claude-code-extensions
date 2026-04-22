---
description: Fetch a ticket from your tracker and create the correctly-named branch to start work
allowed-tools: Bash, Read, Glob
---
Start work on ticket: $ARGUMENTS

## Supported trackers

This command works with any tracker the host Claude Code instance has access to via MCP. Common setups:
- **Jira / Confluence** via the Atlassian MCP (`getJiraIssue`, `transitionJiraIssue`)
- **Linear** via the Linear MCP
- **GitHub Issues** via the `gh` CLI
- **GitLab Issues** via the `glab` CLI

Detect which the project uses from the ticket key format:
- `[A-Z]+-\d+` (e.g., `PROJ-1234`, `WERD-1234`) → Jira or Linear
- `#\d+` → GitHub / GitLab issue
- Other patterns → ask the user

The project's `CLAUDE.md` / `AGENTS.md` should specify which tracker it uses; check there first.

## Steps

1. **Parse the ticket key / number** from arguments.
   - If it doesn't match any known pattern, ask for it and stop.

2. **Fetch the ticket** via the right tool:
   - Jira: `mcp__claude_ai_Atlassian__getJiraIssue` (or the project's configured Atlassian MCP)
   - Linear: the Linear MCP's issue-get tool
   - GitHub: `gh issue view <number>`
   - GitLab: `glab issue view <number>`
   - If fetching fails or no tracker tool is available, surface that and ask whether to proceed with the branch name using only the key.

3. **Map issue type to branch prefix:**

   | Issue type | Prefix | Branch off |
   |---|---|---|
   | Story / Task / Epic / feature request | `feature/` | `develop` (Git Flow) or `main` (trunk-based) |
   | Bug / defect | `bugfix/` | same as above |
   | Sub-task | use the parent's type → follow row above | same as parent |

   Hotfixes are context-dependent — if the ticket or the user indicates this is an urgent production fix, ask whether to use `hotfix/` off the production branch instead.

   Detect whether the repo uses Git Flow (long-lived `develop` branch) or trunk-based (just `main`) by checking `git branch -a`. Default to `develop` if it exists; otherwise `main`.

4. **Confirm with the user before creating the branch.** Show:
   - The ticket summary (one line)
   - Proposed branch name: `<prefix><TICKET-KEY>` (e.g., `feature/PROJ-1234`)
   - Base branch
   - Ask: "Proceed?" Only create the branch after explicit yes.

5. **Create the branch** from the correct base:
   ```bash
   git fetch origin
   git checkout <base-branch>
   git pull --ff-only
   git checkout -b <prefix><TICKET-KEY>
   ```
   If the working tree is dirty, stop and ask before proceeding.

6. **Offer follow-ups but do not run them unprompted:**
   - Transition the ticket to "In Progress" (only if the user approves)
   - Run `/spec-new <TICKET-KEY>` if this is a non-trivial feature

Do not auto-run anything with external side effects (ticket transitions, pushing to remote) without explicit user approval in this conversation.

## References

- The `branch-naming` skill in this plugin — the authoritative rules this command must follow
- The project's `CLAUDE.md` / `AGENTS.md` — ticket-key format and tracker
