# Codex Developer Sub-agent

A background sub-agent that implements features using OpenAI's Codex CLI and returns a concise summary without polluting the main conversation context.

## When to Use

Trigger this sub-agent when the user says:
- "use codex sub-agent to develop"
- "codex agent build"
- "background codex develop"
- "have the codex agent build this"
- "spin up codex to develop"

## How to Spawn This Sub-agent

Use the Task tool with subagent_type="Bash" to spawn this agent:

```
Task tool parameters:
- subagent_type: "Bash"
- description: "Codex development"
- prompt: [The full prompt below, customized with context]
```

## Sub-agent Prompt Template

When spawning the sub-agent, use this prompt (fill in the bracketed sections):

```
You are a development sub-agent. Your job is to run Codex to build a feature and return a concise summary.

## Context
- Working directory: [PROJECT_PATH]
- Feature: [FEATURE_DESCRIPTION]
- Tech stack: [TECH_STACK]
- Model: [MODEL]            # default: gpt-5.5
- Reasoning effort: [low|medium|high|xhigh]   # default: medium

## Your Task

1. Change to the project directory:
   cd [PROJECT_PATH]

2. Run Codex development:
   codex exec \
     -m [MODEL] \
     -s workspace-write \
     -c model_reasoning_effort="[EFFORT_LEVEL]" \
     -C "$(pwd)" \
     --output-last-message /tmp/codex-dev-output.md \
     "[DEVELOPMENT_PROMPT]"

3. Show what was created:
   git diff --stat

4. Read and return the output:
   cat /tmp/codex-dev-output.md

## Output Format

Return ONLY a concise summary in this format:

---
## Codex Developer Summary

**Feature Built**: [what was implemented]

**Files Created/Modified**:
- [List of files]

**Key Decisions**:
- [Any architectural or design decisions]

**Next Steps**:
- [What should happen next - tests, config, etc.]
---

Do not include intermediate steps. Keep it brief.
```

## Benefits Over Inline Skill

| Aspect | Inline Skill | Sub-agent |
|--------|-------------|-----------|
| Context usage | High - all output in conversation | Low - only summary returned |
| Interactivity | Can iterate immediately | Returns final summary only |
| Background execution | No | Yes (can use run_in_background) |
| Best for | Iterative development, discussions | Quick builds, clean context |

## Caller Overrides

- **Model**: when the user names a different Codex model (e.g. "use gpt-5-codex"), pass that to `-m` instead of the default `gpt-5.5`.
- **Effort**: pick `low`/`medium`/`high`/`xhigh` from the user's phrasing. Default to `medium` when unspecified.

## Notes

- The sub-agent runs Codex with workspace-write access (files WILL be modified)
- For background execution, use `run_in_background: true` in Task parameters
- The main agent should present the sub-agent's summary to the user
- Always run `git diff` after to verify changes
