# Skills

Custom skills (slash commands) for Claude Code, powered by OpenAI's Codex CLI.

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| codex-plan | `/codex-plan` | Plan features and architecture using Codex |
| codex-develop | `/codex-develop` | Build and implement features using Codex |
| codex-test | `/codex-test` | Write and run tests using Codex |
| codex-debug | `/codex-debug` | Investigate and fix bugs using Codex |
| codex-review | `/codex-review` | Review code changes using Codex |

## Structure

Each skill is a directory containing a `SKILL.md` file:

```
skills/
├── codex-plan/
│   └── SKILL.md
├── codex-develop/
│   └── SKILL.md
└── ...
```

## Prerequisites

- Codex CLI installed (`codex` command available)
- Codex authenticated (`codex login`)

## Model & Reasoning Effort

Both the model and reasoning effort are caller-configurable. When Claude Code invokes a skill, it can pass either based on the user's phrasing. Sensible defaults are used otherwise.

**Default model:** `gpt-5.5`
**Default reasoning effort:** `medium`

### Effort Levels

| Level | When to Use |
|-------|-------------|
| **low** | Trivial / small-scope changes, quick sanity checks |
| **medium** (default) | Standard tasks - features, bug fixes, normal reviews |
| **high** | Complex tasks, security-sensitive code, multi-file changes |
| **xhigh** | Architectural overhauls, security-critical reviews, very complex work |

Trigger with phrases like "codex low effort review", "codex high effort develop", or "codex extra high review".

### Overriding the Model

If the user explicitly names a different Codex model (e.g. "use gpt-5-codex to review"), pass that name to `-m` instead of the default. Otherwise use `gpt-5.5`.
