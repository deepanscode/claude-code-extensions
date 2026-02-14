# Claude Code Extensions

A plugin for Claude Code providing skills and agents for the full development lifecycle using OpenAI's Codex CLI.

## Plugin Structure

```
.claude-plugin/          Plugin manifests
skills/                  Slash command skills
├── codex-plan/          Plan features and architecture
├── codex-develop/       Build and implement features
├── codex-test/          Write and run tests
├── codex-debug/         Investigate and fix bugs
└── codex-review/        Review code changes
agents/                  Background sub-agents
├── codex-planner/       Background planning agent
├── codex-developer/     Background development agent
├── codex-tester/        Background testing agent
└── codex-reviewer/      Background review agent
mcp-servers/             MCP server implementations
hooks/                   Hook scripts for Claude Code events
```

## Installation

```
/plugin marketplace add deepanscode/claude-code-extensions
/plugin install codex-tools@deepanscode
```

## Conventions

### Git Tagging
- Staging releases: `staging-vX.Y.Z`
- Production releases: `prod-vX.Y.Z`
- Version bumps follow semver (MAJOR.MINOR.PATCH)

### Development Guidelines
- Do not commit unless explicitly requested
- Never push without explicit permission
