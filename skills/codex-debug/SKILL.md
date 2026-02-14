# Codex Debug Skill

Use this skill ONLY when the user explicitly asks Codex to debug or fix a bug. Trigger phrases include:
- "debug this with codex"
- "use codex to debug"
- "codex debug"
- "have codex fix this bug"
- "codex triage"
- "use codex to investigate this issue"
- "codex fix this"

**IMPORTANT**: Do NOT use Codex for debugging unless the user explicitly requests it. Claude Code should handle debugging by default.

## Overview

This skill runs OpenAI's Codex CLI in non-interactive mode to investigate bugs, triage issues, and optionally apply fixes. It can run in read-only mode (investigation only) or workspace-write mode (investigate and fix).

## Modes

| Mode | Sandbox | When to Use |
|------|---------|-------------|
| **Investigate** (default) | `read-only` | User wants Codex to find the root cause without modifying files |
| **Fix** | `workspace-write` | User wants Codex to investigate AND apply a fix |

**How to choose mode:**
- Default to **investigate** (read-only) unless the user explicitly says "fix", "patch", or "apply the fix"
- If the user says "debug" or "triage" → investigate mode
- If the user says "fix this bug with codex" or "have codex fix it" → fix mode

## Reasoning Effort Levels

| Level | When to Use | Trigger Phrases |
|-------|-------------|-----------------|
| **high** (default) | Most bugs - runtime errors, logic issues, standard debugging | "debug with codex", "codex debug" |
| **xhigh** | Complex bugs - race conditions, memory issues, intermittent failures, security vulnerabilities | "codex extra high debug", "thorough codex debug", "deep codex investigate" |

## Prerequisites

- Codex CLI must be installed (`codex` command available)
- Codex must be authenticated (`codex login` completed)

## Execution Steps

### Step 1: Gather Bug Context

Collect as much context as possible about the bug:

```bash
# Get the current branch and project structure
git branch --show-current
ls -la

# Check for recent changes that might have introduced the bug
git log --oneline -10

# If there's an error, check for relevant log files
# (adjust based on project type)
```

Also ask the user (if not already provided):
- What is the bug or unexpected behavior?
- How to reproduce it?
- Any error messages or stack traces?
- When did it start happening? (recent change?)
- Which files or areas are likely involved?

### Step 2: Construct the Debug Prompt

Build a comprehensive prompt for Codex. The prompt should include:

```
You are a senior debugger investigating a bug in this project. Please analyze and diagnose the issue.

## Bug Description
[user's description of the bug]

## Error/Symptoms
[error messages, stack traces, or unexpected behavior]

## Reproduction Steps
[how to reproduce, if provided]

## Project Context
- Project root: [working directory]
- Tech stack: [detected from project files]
- Branch: [current branch name]
- Recent changes: [recent commits that might be relevant]

## Relevant Files
[any files the user mentioned, or likely candidates]

## Your Task
1. **Investigate**: Read the relevant source code and trace the execution flow
2. **Root Cause**: Identify the root cause of the bug
3. **Explanation**: Explain why the bug occurs in clear terms
4. [IF FIX MODE] **Fix**: Apply the minimal, targeted fix
5. **Verification**: Suggest how to verify the fix works

## Output Format
1. **Root Cause**: What's causing the bug (1-2 sentences)
2. **Detailed Analysis**: Step-by-step explanation of the bug
3. **Affected Files**: List of files involved
4. [IF FIX MODE] **Changes Made**: What was fixed and why
5. **Verification Steps**: How to confirm the fix
6. **Prevention**: How to prevent similar bugs in the future
```

### Step 3: Run Codex Debug

Execute Codex in the appropriate mode:

```bash
# INVESTIGATE MODE (default) - read-only, Codex cannot modify files
codex exec \
  -m gpt-5.3-codex \
  -s read-only \
  -c model_reasoning_effort="high" \
  -C "$(pwd)" \
  --output-last-message /tmp/codex-debug-output.md \
  "[constructed prompt from Step 2]"

# FIX MODE - workspace-write, Codex can apply the fix
codex exec \
  -m gpt-5.3-codex \
  -s workspace-write \
  -c model_reasoning_effort="high" \
  -C "$(pwd)" \
  --output-last-message /tmp/codex-debug-output.md \
  "[constructed prompt from Step 2]"
```

**Command flags explained:**
- `-m gpt-5.3-codex`: Use the Codex 5.3 model
- `-s read-only`: Investigation mode - Codex reads code but cannot modify (default)
- `-s workspace-write`: Fix mode - Codex can read and write files to apply the fix
- `-c model_reasoning_effort="high"`: Reasoning effort level (use "xhigh" for complex bugs)
- `-C "$(pwd)"`: Set working directory to current project
- `--output-last-message`: Capture Codex's final response to a file

**Do NOT use `--full-auto`** as it overrides `-s read-only` to `workspace-write`.

### Step 4: Present the Results

After Codex completes:

1. Read the output from `/tmp/codex-debug-output.md`
2. Present the root cause analysis to the user
3. If fix mode was used, run `git diff` to show what Codex changed
4. Ask if they want to:
   - Have Codex apply the fix (if in investigate mode)
   - Review the fix in detail (if in fix mode)
   - Run tests to verify
   - Investigate further

## Error Handling

- If Codex is not installed: Inform user to install it (`npm install -g @openai/codex` or via their package manager)
- If not authenticated: Prompt user to run `codex login`
- If Codex cannot identify the root cause: Present what it found and suggest providing more context
- If Codex times out or fails: Show the error and suggest retrying with more specific file paths

## Example Usage

### Bug Investigation (read-only, high effort)
**User says:** "Use codex to debug why the API returns 500 on the /users endpoint"

**Claude Code will:**
1. Gather project context and recent changes
2. Ask for error logs or stack traces if not provided
3. Construct debug prompt focusing on the API endpoint
4. Run `codex exec -m gpt-5.3-codex -s read-only -c model_reasoning_effort="high" ...`
5. Present root cause analysis
6. Offer to have Codex apply the fix

### Bug Fix (workspace-write, high effort)
**User says:** "Have codex fix the null pointer exception in the auth middleware"

**Claude Code will:**
1. Same investigation steps as above
2. Run in workspace-write mode since user said "fix"
3. Run `codex exec -m gpt-5.3-codex -s workspace-write -c model_reasoning_effort="high" ...`
4. Show `git diff` of the fix
5. Suggest verification steps

### Complex Bug (xhigh effort)
**User says:** "Use codex extra high to debug this race condition in the queue processor"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="xhigh"`
2. Extra high effort is better for: race conditions, memory issues, concurrency bugs, security vulnerabilities

## Notes

- Default to investigate mode (read-only) unless the user says "fix" or "patch"
- Always present the root cause analysis before showing any fixes
- For complex bugs, consider running investigate mode first, then fix mode after confirming the diagnosis
- Codex works best when given specific error messages, stack traces, and affected file paths
- If the bug spans multiple services/repos, focus Codex on one area at a time
