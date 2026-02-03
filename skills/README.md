# Skills

Custom skills (slash commands) for Claude Code.

## How Skills Work

Skills are markdown files that provide instructions to Claude Code for handling specific tasks. They can be invoked either:

1. **As slash commands**: `/codex-review`
2. **Via natural language**: "review this with codex", "have codex check this code"

## Installation

Skills must be linked to Claude Code's commands directory (`~/.claude/commands/`):

```bash
# Create commands directory if it doesn't exist
mkdir -p ~/.claude/commands

# Symlink all skills
ln -s /path/to/claude-code-extensions/skills/*.md ~/.claude/commands/
```

Or link individual skills:

```bash
ln -s /path/to/claude-code-extensions/skills/codex-review.md ~/.claude/commands/codex-review.md
```

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| codex-review | `/codex-review` | Get code changes reviewed by OpenAI's Codex CLI |

## Creating New Skills

1. Create a markdown file in this directory (e.g., `my-skill.md`)
2. Include:
   - Trigger phrases (when should this skill activate)
   - Step-by-step instructions for Claude Code
   - Example commands and expected behavior
3. Symlink to `~/.claude/commands/`
4. Restart Claude Code or start a new session
