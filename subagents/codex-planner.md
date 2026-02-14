# Codex Planner Sub-agent

A background sub-agent that analyzes a codebase and produces an implementation plan using OpenAI's Codex CLI, returning a structured plan without polluting the main conversation context.

## When to Use

Trigger this sub-agent when the user says:
- "use codex sub-agent to plan"
- "codex agent plan"
- "background codex plan"
- "have the codex agent architect this"
- "spin up codex to plan"

## How to Spawn This Sub-agent

Use the Task tool with subagent_type="Bash" to spawn this agent:

```
Task tool parameters:
- subagent_type: "Bash"
- description: "Codex implementation plan"
- prompt: [The full prompt below, customized with context]
```

## Sub-agent Prompt Template

When spawning the sub-agent, use this prompt (fill in the bracketed sections):

```
You are a planning sub-agent. Your job is to run a Codex planning session and return a structured implementation plan.

## Context
- Working directory: [PROJECT_PATH]
- Feature/Change: [USER_DESCRIPTION]
- Reasoning effort: [high|xhigh]

## Your Task

1. Change to the project directory:
   cd [PROJECT_PATH]

2. Get the project structure:
   find src -type f 2>/dev/null | head -50

3. Get recent git context:
   git log --oneline -10

4. Run Codex planning:
   codex exec \
     -m gpt-5.3-codex \
     -s read-only \
     -c model_reasoning_effort="[EFFORT_LEVEL]" \
     -C "$(pwd)" \
     --output-last-message /tmp/codex-plan-output.md \
     "You are a senior software architect. Analyze this codebase and produce a detailed implementation plan for: [FEATURE_DESCRIPTION]

     Provide:
     1. Summary (1-2 sentences)
     2. Approach with rationale
     3. Files to create (with purpose)
     4. Files to modify (with specific changes)
     5. Implementation steps (ordered)
     6. Edge cases to handle
     7. Testing strategy
     8. Risks and trade-offs"

5. Read and return the plan:
   cat /tmp/codex-plan-output.md

## Output Format

Return ONLY a structured plan in this format:

---
## Codex Implementation Plan

**Summary**: [1-2 sentence overview]

**Approach**:
- [Key architectural decisions with rationale]

**Files to Create**:
- [path] - [purpose]

**Files to Modify**:
- [path] - [what changes]

**Implementation Steps**:
1. [Step with detail]
2. [Step with detail]
...

**Edge Cases**:
- [Edge case and how to handle it]

**Testing Strategy**:
- [What to test and how]

**Risks**:
- [Risk and mitigation]
---

Do not include intermediate command output. Keep the plan focused and actionable.
```

## Spawning Examples

### Standard Planning (high effort)
```javascript
Task({
  subagent_type: "Bash",
  description: "Codex implementation plan",
  prompt: `You are a planning sub-agent...
    Working directory: /Users/deepan/Code/Projects/MyApp
    Feature: Add client-side URL redirect resolver
    Reasoning effort: high
    ...`
})
```

### Complex Architecture (xhigh effort)
```javascript
Task({
  subagent_type: "Bash",
  description: "Codex architecture plan (thorough)",
  prompt: `You are a planning sub-agent...
    Working directory: /Users/deepan/Code/Projects/MyApp
    Feature: Migrate from REST to GraphQL
    Reasoning effort: xhigh
    ...`
})
```

## Benefits Over Inline Skill

| Aspect | Inline Skill | Sub-agent |
|--------|-------------|-----------|
| Context usage | High - full plan in conversation | Low - only structured summary returned |
| Interactivity | Can discuss/iterate immediately | Returns final plan only |
| Background execution | No | Yes (can use run_in_background) |
| Best for | Iterative planning, discussions | Quick plans, plan comparisons, clean context |

## Notes

- The sub-agent runs Codex in read-only mode (no file modifications)
- For background execution, use `run_in_background: true` in Task parameters
- Plans from this agent can be compared with Claude Code's own plans for a refined approach
- The main agent should present the sub-agent's plan and offer to refine or implement
