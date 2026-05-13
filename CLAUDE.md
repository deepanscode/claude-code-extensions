# Claude Code Extensions

A plugin marketplace for Claude Code with Codex dev lifecycle tools, a unified Git platform MCP server, a framework-agnostic dev-workflow bundle, a Clean-Architecture skill pack, and a 1Password CLI secrets skill.

## Plugin Structure

```
.claude-plugin/              Marketplace manifest
plugins/
├── codex-tools/             Codex CLI skills + agents
│   ├── skills/              codex-plan, codex-develop, codex-test, codex-debug, codex-review
│   └── agents/              codex-planner, codex-developer, codex-tester, codex-reviewer
├── git-platform/            Unified Git MCP server (GitHub / GitLab / Bitbucket)
│   ├── src/                 TypeScript source
│   ├── .mcp.json            MCP server config
│   └── .claude-plugin/      Plugin manifest
├── dev-workflow/            Branch / commit / migration / docs lifecycle
│   ├── skills/              branch-naming, commit-message-format, migration-safety
│   ├── commands/            adr-new, spec-new, guide-new, runbook-new, ticket-start, review-pr, …
│   └── agents/              docs-sync, test-gap
├── clean-architecture/      Architectural skills for layered backends
│   └── skills/              clean-arch-boundaries, modular-monolith-contracts, route-derived-ids, soft-delete-required
└── 1password/               1Password CLI secrets skill
    └── skills/              op-secrets
```

## Installation

```
# Add the marketplace
/plugin marketplace add deepanscode/claude-code-extensions

# Install whichever plugins you want
/plugin install codex-tools@deepanscode
/plugin install git-platform@deepanscode
/plugin install dev-workflow@deepanscode
/plugin install clean-architecture@deepanscode
/plugin install 1password@deepanscode
```

## Conventions

### Git Tagging
- Staging releases: `staging-vX.Y.Z`
- Production releases: `prod-vX.Y.Z`
- Version bumps follow semver (MAJOR.MINOR.PATCH)

### Development Guidelines
- Do not commit unless explicitly requested
- Never push without explicit permission
- Always scan for credentials/secrets before pushing (repo is public)
