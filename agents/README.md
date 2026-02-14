# Agents

Background sub-agents for Claude Code. Agents run as separate processes and return only their results, keeping the main conversation context clean.

## Available Agents

| Agent | Trigger Phrases | Description |
|-------|-----------------|-------------|
| codex-planner | "codex agent plan", "background codex plan" | Background architecture planning via Codex |
| codex-developer | "codex agent develop", "background codex build" | Background development via Codex |
| codex-tester | "codex agent test", "background codex test" | Background test writing via Codex |
| codex-reviewer | "codex agent review", "background codex review" | Background code review via Codex |

## Skill vs Agent

| Aspect | Skill | Agent |
|--------|-------|-------|
| Execution | Inline in conversation | Separate process |
| Context | All output stays in chat | Only summary returned |
| Background | No | Yes (can use `run_in_background`) |
| Best for | Interactive, iterative work | Quick checks, parallel tasks, clean context |

## Structure

Each agent is a directory containing an `AGENT.md` file:

```
agents/
├── codex-planner/
│   └── AGENT.md
├── codex-developer/
│   └── AGENT.md
└── ...
```
