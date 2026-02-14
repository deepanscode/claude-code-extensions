# Claude Code Extensions

A plugin marketplace for Claude Code with Codex dev lifecycle tools and a unified Git platform MCP server.

## Plugin Structure

```
.claude-plugin/              Marketplace manifest
plugins/
├── codex-tools/             Codex CLI skills + agents
│   ├── skills/
│   │   ├── codex-plan/      Plan features and architecture
│   │   ├── codex-develop/   Build and implement features
│   │   ├── codex-test/      Write and run tests
│   │   ├── codex-debug/     Investigate and fix bugs
│   │   └── codex-review/    Review code changes
│   └── agents/
│       ├── codex-planner/   Background planning agent
│       ├── codex-developer/ Background development agent
│       ├── codex-tester/    Background testing agent
│       └── codex-reviewer/  Background review agent
└── git-platform/            Unified Git MCP server
    ├── src/                 TypeScript source
    ├── .mcp.json            MCP server config
    └── .claude-plugin/      Plugin manifest
```

## Installation

```
# Add the marketplace
/plugin marketplace add deepanscode/claude-code-extensions

# Install Codex skills + agents
/plugin install codex-tools@deepanscode

# Install Git Platform MCP server (GitHub/GitLab/Bitbucket)
/plugin install git-platform@deepanscode
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
