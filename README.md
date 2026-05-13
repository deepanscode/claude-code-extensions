# Claude Code Extensions

A plugin marketplace for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with Codex-powered dev tools, a unified Git platform MCP server, a framework-agnostic dev-workflow bundle, a Clean-Architecture skill pack, and a 1Password CLI secrets skill.

## Available Plugins

### codex-tools `v1.0.0`

Full development lifecycle powered by OpenAI's [Codex CLI](https://github.com/openai/codex). Includes 5 skills (slash commands) and 4 background agents that work together to plan, build, test, debug, and review code.

**Skills** (interactive, inline):

| Command | Description |
|---------|-------------|
| `/codex-plan` | Plan features and architecture before writing code |
| `/codex-develop` | Build and implement features |
| `/codex-test` | Write and run tests |
| `/codex-debug` | Investigate and fix bugs (read-only or fix mode) |
| `/codex-review` | Review code changes for bugs, security, and best practices |

**Agents** (background, clean context):

| Agent | Description |
|-------|-------------|
| codex-planner | Produces implementation plans without polluting the conversation |
| codex-developer | Builds features in the background |
| codex-tester | Writes and runs tests in the background |
| codex-reviewer | Reviews code and returns a concise summary |

All skills and agents support two reasoning effort levels:
- **high** (default) — standard tasks
- **xhigh** — complex, security-critical, or architectural work (trigger with "codex extra high ...")

**Prerequisites**: [Codex CLI](https://github.com/openai/codex) installed and authenticated (`codex login`).

---

### git-platform `v0.1.0`

A TypeScript [MCP server](https://modelcontextprotocol.io/) that provides unified PR, pipeline, and repo operations across GitHub, GitLab, and Bitbucket. It auto-detects the platform from your git remote URL.

**11 MCP tools**:

| Tool | Description |
|------|-------------|
| `git_platform_detect` | Detect platform from git remote |
| `repo_info` | Get repository information |
| `pr_create` | Create a pull/merge request |
| `pr_list` | List pull/merge requests |
| `pr_view` | View PR details |
| `pr_merge` | Merge a PR |
| `pr_approve` | Approve a PR |
| `pipeline_list` | List CI/CD pipelines |
| `pipeline_trigger` | Trigger a pipeline run |
| `pipeline_status` | Check pipeline status |
| `deployment_approve` | Approve a deployment |

**Auth** (no token management needed for GitHub/GitLab):
- **GitHub**: Uses `gh` CLI (authenticate with `gh auth login`)
- **GitLab**: Uses `glab` CLI (authenticate with `glab auth login`)
- **Bitbucket**: Set `BITBUCKET_USERNAME` and `BITBUCKET_TOKEN` env vars

---

### dev-workflow `v0.1.0`

Framework-agnostic development workflow bundle — branch naming, Conventional Commits, migration safety, the docs lifecycle (ADR / spec / guide / runbook), pre-PR review, and ticket-driven branch creation. Designed to be dropped into any project; per-project overrides (ticket-key regex, integration branch, docs folder) are picked up from the project's `CLAUDE.md` / `AGENTS.md`.

**Skills** (auto-triggered):

| Skill | Triggers on | Enforces |
|---|---|---|
| `branch-naming` | `git checkout -b`, branch creation / rename | `feature\|bugfix\|hotfix/<TICKET>`, `release/<version>`, branch-off / merge targets |
| `commit-message-format` | `git commit`, amend, drafting commit messages | Conventional Commits + ticket key; no AI attribution |
| `migration-safety` | Any DB migration tool (EF Core, Prisma, Alembic, Rails, Flyway, Liquibase, Knex, Sequelize, TypeORM, golang-migrate, …) | Generating OK; applying requires explicit in-conversation approval |

**Commands** (on-demand):

| Command | Description |
|---|---|
| `/adr-new <topic>` | Create a new Architecture Decision Record |
| `/adr-supersede <NNNN>` | Replace an existing ADR with a new one |
| `/spec-new <ticket-or-name>` | Create a new feature spec in `specs/active/` |
| `/spec-archive <filename>` | Archive a shipped spec to `specs/archive/YYYY-Qn/` |
| `/guide-new <topic>` | Create a new task-shaped developer guide |
| `/runbook-new <symptom>` | Create a new operational runbook |
| `/ticket-start <TICKET>` | Fetch the ticket and create the correctly-named branch |
| `/review-pr` | Pre-PR review: architectural scan + parallel docs-sync + test-gap, consolidated by severity |

**Agents** (background, delegated):

| Agent | Description |
|---|---|
| `docs-sync` | Scans the branch diff and lists doc files that should have been updated but weren't |
| `test-gap` | Scans the branch diff and lists new handlers / controllers / validators / domain methods without matching tests |

---

### clean-architecture `v0.1.0`

Architectural skills for layered backend projects. Multi-language examples (.NET, TypeScript, Python, Go, Java). Opt in to just the ones that match your project.

| Skill | Triggers on | Enforces |
|---|---|---|
| `clean-arch-boundaries` | Edits in `Domain`, `Application`, `Infrastructure`, `Contracts` (or equivalent) folders | Layering: deps point inward; domain has zero framework deps |
| `modular-monolith-contracts` | Cross-module references or new public-surface types | Only public contracts cross module lines |
| `route-derived-ids` | Controllers / route handlers with `{id}` in route + matching validator | Controller sets route IDs; body validators don't check them |
| `soft-delete-required` | New entities / new tables / new migrations | Soft-delete base + query filter; junction tables exempt |

---

### 1password `v0.1.0`

A focused skill that teaches Claude Code to resolve secrets through the [1Password CLI](https://developer.1password.com/docs/cli/) (`op`) instead of hardcoding them in shells, dotfiles, or repo config. Triggers when the user mentions tokens, API keys, env vars, or `.env` files.

| Skill | Covers |
|---|---|
| `op-secrets` | Secret reference syntax (`op://vault/item/field`), `op read` one-shots, `_CMD` env-var indirection (works with `git-platform`), `op run --env-file` subprocess injection, discovery commands, service accounts for CI, common pitfalls |

**Prerequisites**: 1Password CLI installed (`brew install 1password-cli` / `winget install 1Password.1PasswordCLI` / apt) and either the desktop-app integration enabled or a `OP_SERVICE_ACCOUNT_TOKEN` exported.

## Installation

### Quick start

```bash
# 1. Add the marketplace (one time)
/plugin marketplace add deepanscode/claude-code-extensions

# 2. Install the plugins you want
/plugin install codex-tools@deepanscode
/plugin install git-platform@deepanscode
/plugin install dev-workflow@deepanscode
/plugin install clean-architecture@deepanscode
/plugin install 1password@deepanscode
```

### Updating

```bash
/plugin marketplace update
```

### Prerequisites

| Plugin | Requires |
|--------|----------|
| codex-tools | [Codex CLI](https://github.com/openai/codex) (`npm install -g @openai/codex`) |
| git-platform | `gh` CLI (GitHub), `glab` CLI (GitLab), or Bitbucket env vars |
| dev-workflow | A git repo. `/ticket-start` works best with the Atlassian / Linear / GitHub MCP integration available |
| clean-architecture | Nothing — skills are pure markdown guidance |
| 1password | [1Password CLI](https://developer.1password.com/docs/cli/get-started/) (`op`) installed and either the desktop-app integration or `OP_SERVICE_ACCOUNT_TOKEN` configured |

## Repository Structure

```
.claude-plugin/
  marketplace.json               Marketplace catalog

plugins/
  codex-tools/                   Codex dev lifecycle plugin
    .claude-plugin/
      plugin.json
    skills/
      codex-plan/SKILL.md
      codex-develop/SKILL.md
      codex-test/SKILL.md
      codex-debug/SKILL.md
      codex-review/SKILL.md
    agents/
      codex-planner/AGENT.md
      codex-developer/AGENT.md
      codex-tester/AGENT.md
      codex-reviewer/AGENT.md

  git-platform/                  Unified Git MCP server
    .claude-plugin/
      plugin.json
    .mcp.json
    src/
      index.ts                   Entry point (11 MCP tools)
      platform.ts                Auto-detect GitHub/GitLab/Bitbucket
      types.ts                   Shared TypeScript types
      adapters/
        base.ts                  Abstract adapter
        github.ts                GitHub adapter (gh CLI)
        gitlab.ts                GitLab adapter (glab CLI)
        bitbucket.ts             Bitbucket adapter (REST API)
      utils/
        auth.ts                  Bitbucket auth helper
        exec.ts                  Child process wrapper
    package.json
    tsconfig.json

  dev-workflow/                  Framework-agnostic workflow bundle
    .claude-plugin/
      plugin.json
    skills/
      branch-naming/SKILL.md
      commit-message-format/SKILL.md
      migration-safety/SKILL.md
    commands/
      adr-new.md
      adr-supersede.md
      spec-new.md
      spec-archive.md
      guide-new.md
      runbook-new.md
      ticket-start.md
      review-pr.md
    agents/
      docs-sync.md
      test-gap.md

  clean-architecture/            Architectural skills for layered backends
    .claude-plugin/
      plugin.json
    skills/
      clean-arch-boundaries/SKILL.md
      modular-monolith-contracts/SKILL.md
      route-derived-ids/SKILL.md
      soft-delete-required/SKILL.md

  1password/                     1Password CLI secrets skill
    .claude-plugin/
      plugin.json
    skills/
      op-secrets/SKILL.md
```

## How It Works

### Skills vs Agents

Skills run **inline** in your conversation — you see all the output and can iterate interactively. Agents run in the **background** as separate processes and return only a concise summary, keeping your conversation context clean.

Use skills when you want to discuss and iterate. Use agents when you want quick results without context bloat, or when running multiple tasks in parallel.

### Multi-Agent Collaboration

The Codex agents are designed to work together in a pipeline:

1. **Planner** analyzes the codebase and produces an implementation plan
2. **Developer** builds the feature following the plan
3. **Tester** writes and runs tests against the implementation
4. **Reviewer** reviews everything and flags issues

Claude Code orchestrates the pipeline, comparing plans, feeding results between agents, and resolving issues across iterations.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Add your skill / command / agent under the relevant plugin folder (`plugins/<plugin>/skills/`, `plugins/<plugin>/commands/`, or `plugins/<plugin>/agents/`)
4. Open a PR

### Skills vs commands vs agents

| Artifact | Invocation | Frontmatter | Good for |
|---|---|---|---|
| **Skill** (`skills/<name>/SKILL.md`) | Auto — based on its `description` trigger | `name`, `description` | Coding conventions Claude should apply as it edits |
| **Slash command** (`commands/<name>.md`) | On demand — `/<name>` | `description`, `allowed-tools` | Workflow steps the human kicks off |
| **Agent** (`agents/<name>.md`) | Delegated — via the `Agent` tool | `name`, `description`, `tools` | Focused analysis that would bloat the main context |

### Adding a new skill

```
plugins/<plugin>/skills/my-skill/
  SKILL.md
```

`SKILL.md` needs `---\nname: …\ndescription: …\n---` frontmatter where the description explains *when* the skill should fire (trigger conditions, file patterns) — Claude uses that text to decide relevance.

### Adding a new command

```
plugins/<plugin>/commands/my-command.md
```

Frontmatter: `description` (shown in `/help`) and `allowed-tools` (comma-separated list that scopes what the command may use).

### Adding a new agent

```
plugins/<plugin>/agents/my-agent.md
```

Frontmatter: `name`, `description` (one paragraph on *when* to delegate — the main agent reads this), and `tools` (minimal toolset). The body is the full system prompt the agent runs with.

## License

MIT
