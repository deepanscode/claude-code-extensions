# Codex Plan Skill

Use this skill ONLY when the user explicitly asks Codex to plan or architect something. Trigger phrases include:
- "plan this with codex"
- "use codex to plan"
- "codex plan"
- "have codex architect this"
- "codex design"
- "get codex to plan"

**IMPORTANT**: Do NOT use Codex for planning unless the user explicitly requests it. Claude Code should handle planning by default.

## Overview

This skill runs OpenAI's Codex CLI in non-interactive, read-only mode to analyze a codebase and produce an implementation plan for a feature, refactor, or architectural change. Codex reads the code but makes no modifications.

## Model & Reasoning Effort

Both the model (`-m`) and reasoning effort (`-c model_reasoning_effort=...`) are caller-configurable. Defaults: **`gpt-5.5`** + **`medium`** effort. If the user explicitly names a different Codex model or effort level, pass it through instead.

### Effort Levels

| Level | When to Use | Trigger Phrases |
|-------|-------------|-----------------|
| **low** | Quick, scoped plans where the approach is mostly obvious | "codex low effort plan", "quick codex plan" |
| **medium** (default) | Most planning tasks - features, refactors, integrations | "plan with codex", "codex plan" |
| **high** | Complex multi-file or multi-service plans | "codex high effort plan" |
| **xhigh** | Complex architecture, migration strategies, multi-service overhauls | "codex extra high plan", "thorough codex plan", "deep codex architect" |

**How to set reasoning effort:**
- Add `-c model_reasoning_effort="<level>"` to the codex command
- Default to **medium** unless the user requests a different level or the task is clearly low/high/xhigh complexity

## Prerequisites

- Codex CLI must be installed (`codex` command available)
- Codex must be authenticated (`codex login` completed)

## Execution Steps

### Step 1: Gather Context

Collect information about the project and what needs to be planned:

```bash
# Get the current project structure
ls -la

# Get the current branch name
git branch --show-current

# Understand the tech stack
ls package.json requirements.txt go.mod Cargo.toml pyproject.toml 2>/dev/null

# Get recent commit messages for context
git log --oneline -10

# Get a tree of the source code
find src -type f 2>/dev/null | head -50
```

Also ask the user (if not already provided):
- What feature/change needs to be planned?
- Any constraints or preferences?
- Are there areas of the codebase to focus on?

### Step 2: Construct the Planning Prompt

Build a comprehensive prompt for Codex. The prompt should include:

```
You are a senior software architect. Analyze this codebase and produce a detailed implementation plan.

## Feature/Change Description
[user's description of what to plan]

## Project Context
- Project root: [working directory]
- Tech stack: [detected from project files]
- Branch: [current branch name]
- Key directories: [relevant source directories]

## Constraints
[any specific constraints from the user]

## Your Task
1. **Read and understand** the existing codebase structure, patterns, and conventions
2. **Identify** all files that would need to be created or modified
3. **Design** the implementation approach, considering trade-offs
4. **Sequence** the work into logical steps

## Output Format
1. **Summary**: What this plan achieves (1-2 sentences)
2. **Approach**: High-level architecture/design decisions with rationale
3. **Files to Create**: New files needed with their purpose
4. **Files to Modify**: Existing files that need changes and what changes
5. **Implementation Steps**: Ordered list of steps to implement
6. **Edge Cases**: Important edge cases to handle
7. **Testing Strategy**: What tests to write and how to verify
8. **Risks & Trade-offs**: Potential issues and alternatives considered
```

### Step 3: Run Codex Planning

Execute Codex in non-interactive, read-only mode:

```bash
# Run Codex in read-only mode for planning
codex exec \
  -m gpt-5.5 \
  -s read-only \
  -c model_reasoning_effort="medium" \
  -C "$(pwd)" \
  --output-last-message /tmp/codex-plan-output.md \
  "[constructed prompt from Step 2]"
```

**Command flags explained:**
- `-m gpt-5.5`: Use GPT-5.5 (override with whatever model the user names)
- `-s read-only`: Read-only mode - Codex reads the codebase but cannot modify anything
- `-c model_reasoning_effort="medium"`: Default reasoning effort (use `low`/`high`/`xhigh` when the user asks for a different level)
- `-C "$(pwd)"`: Set working directory to current project
- `--output-last-message`: Capture Codex's plan to a file

### Step 4: Present the Plan

After Codex completes:

1. Read the output from `/tmp/codex-plan-output.md`
2. Present the plan to the user in a structured format
3. Ask if they want to:
   - Refine or adjust the plan
   - Compare with an alternative approach
   - Proceed with implementation (using codex-develop or Claude Code)
   - Have another agent review the plan

## Error Handling

- If Codex is not installed: Inform user to install it (`npm install -g @openai/codex` or via their package manager)
- If not authenticated: Prompt user to run `codex login`
- If Codex times out or fails: Show the error and suggest retrying with a more focused scope
- If the plan is too vague: Ask the user for more specific requirements

## Example Usage

### Standard Planning (medium effort, default)
**User says:** "Use codex to plan adding authentication to this app"

**Claude Code will:**
1. Examine the project structure and tech stack
2. Ask for specific requirements if needed
3. Construct planning prompt with the feature context
4. Run `codex exec -m gpt-5.5 -s read-only -c model_reasoning_effort="medium" ...`
5. Present the implementation plan
6. Offer to refine or proceed with implementation

### Quick Planning (low effort)
**User says:** "codex low effort plan for renaming this module"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="low"` for fast, scoped plans
2. Low effort is appropriate for: small refactors, rename plans, simple feature stubs

### Complex Architecture (xhigh effort)
**User says:** "codex extra high plan the migration from REST to GraphQL"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="xhigh"` for deeper analysis
2. Extra high effort is better for: multi-service changes, migration strategies, architectural overhauls

## Notes

- Planning runs in read-only mode so Codex cannot modify any files
- For large codebases, focus the planning prompt on specific directories/modules
- Plans work best when the user provides clear acceptance criteria
- Consider running the plan through a codex-review pass before implementation
- Plans can be compared with Claude Code's own plan for a more robust final approach
