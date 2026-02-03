# Claude Code Extensions

This repository contains custom extensions for Claude Code including skills, sub-agents, MCP servers, and hooks.

## Directory Structure

- `skills/` - Custom skills (slash commands) for Claude Code
- `subagents/` - Custom sub-agent configurations
- `mcp-servers/` - MCP server implementations for external API integrations (Atlassian, GitHub, etc.)
- `hooks/` - Hook scripts that run on Claude Code events

## Conventions

### Git Tagging
- Staging releases: `staging-vX.Y.Z`
- Production releases: `prod-vX.Y.Z`
- Version bumps follow semver:
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes

### Development Guidelines
- Do not commit unless explicitly requested
- Never push without explicit permission
- No Claude Code references in commit messages or code comments
