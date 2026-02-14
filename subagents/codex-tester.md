# Codex Tester Sub-agent

A background sub-agent that writes and runs tests using OpenAI's Codex CLI and returns a concise summary without polluting the main conversation context.

## When to Use

Trigger this sub-agent when the user says:
- "use codex sub-agent to test"
- "codex agent test"
- "background codex test"
- "have the codex agent write tests"
- "spin up codex to test"

## How to Spawn This Sub-agent

Use the Task tool with subagent_type="Bash" to spawn this agent:

```
Task tool parameters:
- subagent_type: "Bash"
- description: "Codex testing"
- prompt: [The full prompt below, customized with context]
```

## Sub-agent Prompt Template

When spawning the sub-agent, use this prompt (fill in the bracketed sections):

```
You are a testing sub-agent. Your job is to run Codex to write tests and return a concise summary.

## Context
- Working directory: [PROJECT_PATH]
- What to test: [DESCRIPTION_OF_CODE_TO_TEST]
- Tech stack: [TECH_STACK]
- Test framework: [TEST_FRAMEWORK]
- Reasoning effort: [high|xhigh]

## Your Task

1. Change to the project directory:
   cd [PROJECT_PATH]

2. Run Codex to write tests:
   codex exec \
     -m gpt-5.3-codex \
     -s workspace-write \
     -c model_reasoning_effort="[EFFORT_LEVEL]" \
     -C "$(pwd)" \
     --output-last-message /tmp/codex-test-output.md \
     "[TEST_PROMPT]"

3. Show what test files were created:
   git diff --stat

4. Run the tests:
   [TEST_COMMAND - e.g., npm test, npx vitest, pytest]

5. Read and return the output:
   cat /tmp/codex-test-output.md

## Output Format

Return ONLY a concise summary in this format:

---
## Codex Tester Summary

**Tests Written For**: [what was tested]

**Test Files Created**:
- [List of test files]

**Test Results**:
- Total: [N] tests
- Passed: [N]
- Failed: [N]
- Skipped: [N]

**Coverage Areas**:
- [List what's covered: happy path, edge cases, error handling, etc.]

**Issues Found**:
- [Any bugs or issues discovered during testing, or "None"]

**Gaps**:
- [Areas that need more test coverage, or "None"]
---

Do not include intermediate steps. Keep it brief.
```

## Collaboration with Other Sub-agents

The tester sub-agent works best in a pipeline:

1. **Developer sub-agent** builds the feature
2. **Tester sub-agent** writes and runs tests (this agent)
3. **Reviewer sub-agent** reviews both code and tests

When receiving output from the developer sub-agent, include the list of files created/modified in the test prompt so Codex knows what to test.

## Benefits Over Inline Skill

| Aspect | Inline Skill | Sub-agent |
|--------|-------------|-----------|
| Context usage | High - all output in conversation | Low - only summary returned |
| Interactivity | Can iterate immediately | Returns final summary only |
| Background execution | No | Yes (can use run_in_background) |
| Best for | Iterative testing, debugging | Quick test runs, clean context |

## Notes

- The sub-agent runs Codex with workspace-write access (test files WILL be created)
- For background execution, use `run_in_background: true` in Task parameters
- The main agent should present the sub-agent's summary to the user
- If tests fail, consider running the debug sub-agent or skill
