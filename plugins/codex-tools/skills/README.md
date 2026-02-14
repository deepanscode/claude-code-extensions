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

## Reasoning Effort Levels

All skills support two effort levels:

| Level | When to Use |
|-------|-------------|
| **high** (default) | Standard tasks |
| **xhigh** | Complex, security-critical, or architectural work |

Trigger with phrases like "codex extra high review" or "thorough codex plan".
