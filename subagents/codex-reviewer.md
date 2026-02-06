# Codex Reviewer Sub-agent

A background sub-agent that reviews code changes using OpenAI's Codex CLI and returns a concise summary without polluting the main conversation context.

## When to Use

Trigger this sub-agent when the user says:
- "use codex sub-agent to review"
- "codex agent review"
- "background codex review"
- "have the codex agent review this"
- "spin up codex to review"

## How to Spawn This Sub-agent

Use the Task tool with subagent_type="Bash" to spawn this agent:

```
Task tool parameters:
- subagent_type: "Bash"
- description: "Codex code review"
- prompt: [The full prompt below, customized with context]
```

## Sub-agent Prompt Template

When spawning the sub-agent, use this prompt (fill in the bracketed sections):

```
You are a code review sub-agent. Your job is to run a Codex review and return a concise summary.

## Context
- Working directory: [PROJECT_PATH]
- Feature/Change: [USER_DESCRIPTION]
- Reasoning effort: [high|extra_high]

## Your Task

1. Change to the project directory:
   cd [PROJECT_PATH]

2. Get the git diff:
   git diff HEAD

3. If no uncommitted changes, get branch diff:
   git diff main...HEAD 2>/dev/null || git diff master...HEAD 2>/dev/null

4. Run Codex review:
   codex exec \
     -m codex-5.3 \
     -s read-only \
     --full-auto \
     -c model_reasoning_effort="[EFFORT_LEVEL]" \
     -C "$(pwd)" \
     --output-last-message /tmp/codex-review-output.md \
     "Review this code for bugs, security issues, and best practices:

     [GIT_DIFF_OUTPUT]

     Provide: Summary, Issues (Critical/Warning/Info), Verdict (APPROVE/REQUEST_CHANGES)"

5. Read and return the review:
   cat /tmp/codex-review-output.md

## Output Format

Return ONLY a concise summary in this format:

---
## Codex Review Summary

**Verdict**: [APPROVE/REQUEST_CHANGES]

**Issues Found**:
- [List any issues, or "None"]

**Key Suggestions**:
- [List key suggestions, or "None"]
---

Do not include the full Codex output or any intermediate steps. Keep it brief.
```

## Spawning Examples

### Standard Review (high effort)
```javascript
Task({
  subagent_type: "Bash",
  description: "Codex code review",
  prompt: `You are a code review sub-agent...
    Working directory: /Users/deepan/Code/Projects/MyApp
    Feature: Added user authentication
    Reasoning effort: high
    ...`
})
```

### Thorough Review (extra_high effort)
```javascript
Task({
  subagent_type: "Bash",
  description: "Codex code review (thorough)",
  prompt: `You are a code review sub-agent...
    Working directory: /Users/deepan/Code/Projects/MyApp
    Feature: Security-critical payment flow
    Reasoning effort: extra_high
    ...`
})
```

## Benefits Over Inline Skill

| Aspect | Inline Skill | Sub-agent |
|--------|-------------|-----------|
| Context usage | High - all output in conversation | Low - only summary returned |
| Interactivity | Can discuss/iterate immediately | Returns final summary only |
| Background execution | No | Yes (can use run_in_background) |
| Best for | Iterative reviews, discussions | Quick checks, clean context |

## Notes

- The sub-agent runs Codex in read-only mode (no file modifications)
- For background execution, use `run_in_background: true` in Task parameters
- The main agent should present the sub-agent's summary to the user
- User can then decide to dive deeper or apply changes
