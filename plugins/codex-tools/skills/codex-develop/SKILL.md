# Codex Develop Skill

Use this skill ONLY when the user explicitly asks Codex to develop or build something. Trigger phrases include:
- "develop this with codex"
- "use codex to build"
- "codex develop"
- "have codex implement this"
- "build this feature with codex"
- "codex build"

**IMPORTANT**: Do NOT use Codex for development unless the user explicitly requests it. Claude Code should handle development by default.

## Overview

This skill runs OpenAI's Codex CLI in non-interactive mode with workspace-write access to implement features, build components, or write code based on a feature description provided by the user.

## Model & Reasoning Effort

Both the model (`-m`) and reasoning effort (`-c model_reasoning_effort=...`) are caller-configurable. Defaults: **`gpt-5.5`** + **`medium`** effort. If the user explicitly names a different Codex model or effort level, pass it through instead.

### Effort Levels

| Level | When to Use | Trigger Phrases |
|-------|-------------|-----------------|
| **low** | Trivial / scoped edits, small utilities, boilerplate | "codex low effort develop", "quick codex build" |
| **medium** (default) | Most development tasks - features, components, utilities | "develop with codex", "codex build" |
| **high** | Complex features, multi-file implementations, careful work | "codex high effort develop" |
| **xhigh** | Architectural work, intricate business logic, security-sensitive code | "codex extra high develop", "thorough codex build", "deep codex develop" |

**How to set reasoning effort:**
- Add `-c model_reasoning_effort="<level>"` to the codex command
- Default to **medium** unless the user requests a different level or the task is clearly low/high/xhigh complexity

## Prerequisites

- Codex CLI must be installed (`codex` command available)
- Codex must be authenticated (`codex login` completed)

## Execution Steps

### Step 1: Gather Context

Collect information about the project and the feature to build:

```bash
# Get the current project structure
ls -la

# Get the current branch name
git branch --show-current

# Understand the tech stack (check for package.json, requirements.txt, go.mod, etc.)
ls package.json requirements.txt go.mod Cargo.toml pyproject.toml 2>/dev/null

# Get recent commit messages for context
git log --oneline -5
```

Also ask the user (if not already provided):
- What feature/component should Codex build?
- Any specific requirements, constraints, or patterns to follow?
- Which files or directories should Codex focus on?

### Step 2: Construct the Development Prompt

Build a comprehensive prompt for Codex. The prompt should include:

```
You are a developer working on this project. Please implement the following:

## Feature Description
[user's description of what to build]

## Project Context
- Project root: [working directory]
- Tech stack: [detected from project files]
- Branch: [current branch name]
- Key directories: [relevant source directories]

## Requirements
[any specific requirements from the user]

## Implementation Guidelines
1. Follow existing code patterns and conventions in the project
2. Write clean, readable, well-structured code
3. Handle edge cases and errors appropriately
4. Do not introduce security vulnerabilities
5. Keep changes focused - only modify what's needed for the feature

## Output
After implementing, provide:
1. **Summary**: What you built (1-2 sentences)
2. **Files Changed**: List of files created or modified
3. **Key Decisions**: Any architectural or design decisions made
4. **Next Steps**: What the user should do next (tests to run, config to set, etc.)
```

### Step 3: Run Codex Development

Execute Codex in non-interactive mode with workspace-write access:

```bash
# Run Codex with workspace-write access for development
# Default effort is "medium"; bump to "high"/"xhigh" for complex features or drop to "low" for scoped edits
codex exec \
  -m gpt-5.5 \
  -s workspace-write \
  -c model_reasoning_effort="medium" \
  -C "$(pwd)" \
  --output-last-message /tmp/codex-dev-output.md \
  "[constructed prompt from Step 2]"
```

**Command flags explained:**
- `-m gpt-5.5`: Use GPT-5.5 (override with whatever model the user names)
- `-s workspace-write`: Sandbox mode - Codex can read and write files in the workspace (do NOT use `--full-auto` as it conflicts with explicit sandbox settings)
- `-c model_reasoning_effort="medium"`: Default reasoning effort (use `low`/`high`/`xhigh` when the user asks for a different level)
- `-C "$(pwd)"`: Set working directory to current project
- `--output-last-message`: Capture Codex's final response to a file

### Step 4: Present the Results

After Codex completes:

1. Read the output from `/tmp/codex-dev-output.md`
2. Run `git diff` to show what Codex actually changed
3. Present a summary to the user
4. Ask if they want to:
   - Review the changes in detail
   - Have Codex iterate on the implementation
   - Run tests or linting
   - Commit the changes

## Error Handling

- If Codex is not installed: Inform user to install it (`npm install -g @openai/codex` or via their package manager)
- If not authenticated: Prompt user to run `codex login`
- If Codex times out or fails: Show the error and suggest retrying
- If Codex produces no changes: Inform user and ask for clarification on the feature

## Example Usage

### Standard Development (medium effort, default)
**User says:** "Use codex to build a CLI argument parser for this project"

**Claude Code will:**
1. Examine the project structure and tech stack
2. Ask for any specific requirements if needed
3. Construct development prompt with the feature context
4. Run `codex exec -m gpt-5.5 -s workspace-write -c model_reasoning_effort="medium" ...`
5. Show `git diff` of what Codex created
6. Present summary and offer next steps

### Quick Development (low effort)
**User says:** "codex low effort develop the utility function for this"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="low"` for fast, scoped output
2. Low effort is appropriate for: small utilities, glue code, boilerplate

### Complex Development (xhigh effort)
**User says:** "use codex extra high to build the authentication middleware"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="xhigh"` for deeper reasoning
2. Extra high effort is better for: multi-file features, complex business logic, architectural components

## Notes

- Codex runs with workspace-write access so it CAN modify files - always review changes after
- Always run `git diff` after Codex completes to show what changed
- For large features, consider breaking into smaller tasks for Codex
- Codex works best with clear, specific feature descriptions
- If the result is not satisfactory, iterate by providing more specific instructions
