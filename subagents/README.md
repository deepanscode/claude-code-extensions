# Sub-agents

Custom sub-agent configurations for Claude Code. Sub-agents run as separate processes and return only their results, keeping the main conversation context clean.

## Skill vs Sub-agent

| Aspect | Skill | Sub-agent |
|--------|-------|-----------|
| Execution | Inline in conversation | Separate process |
| Context | All output stays in chat | Only summary returned |
| Use case | Interactive, iterative work | Background tasks, clean context |

## Available Sub-agents

| Sub-agent | Trigger Phrases | Description |
|-----------|-----------------|-------------|
| codex-reviewer | "codex agent review", "use codex sub-agent" | Background code review via Codex CLI |

## How Sub-agents Work

Sub-agents are spawned using Claude Code's Task tool. Each sub-agent file contains:

1. **Trigger phrases** - When to use this sub-agent
2. **Prompt template** - Instructions for the spawned agent
3. **Output format** - How results should be returned

## Usage Pattern

When user requests a sub-agent review:

```
User: "use codex sub-agent to review this auth feature"

Claude Code:
1. Reads sub-agent config (subagents/codex-reviewer.md)
2. Spawns Task with the configured prompt
3. Sub-agent runs independently (gathers diff, runs Codex)
4. Sub-agent returns concise summary
5. Main agent presents summary to user
```

## Creating New Sub-agents

1. Create a markdown file in this directory (e.g., `my-agent.md`)
2. Include:
   - Trigger phrases
   - Task tool parameters (subagent_type, etc.)
   - Full prompt template
   - Expected output format
3. Document in this README
