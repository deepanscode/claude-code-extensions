# Codex Review Skill

Use this skill when the user wants code changes reviewed by OpenAI's Codex CLI agent. Trigger phrases include:
- "review this with codex"
- "get codex to review"
- "codex review"
- "have codex check this"
- "run codex review"
- "review this implementation/feature/fix/change with codex"

## Overview

This skill runs OpenAI's Codex CLI in non-interactive, read-only mode to review code changes and provide feedback on bugs, security vulnerabilities, best practices, and correctness.

## Reasoning Effort Levels

Codex supports different reasoning effort levels. Choose based on complexity:

| Level | When to Use | Trigger Phrases |
|-------|-------------|-----------------|
| **high** (default) | Most reviews - features, bug fixes, standard changes | "review with codex", "codex review" |
| **xhigh** | Complex implementations, security-sensitive code, architectural changes | "codex extra high review", "use codex extra high", "thorough codex review", "deep codex review" |

**How to set reasoning effort:**
- Add `-c model_reasoning_effort="high"` or `-c model_reasoning_effort="xhigh"` to the codex command
- Default to **high** unless user explicitly requests extra high or the changes are complex/security-critical

## Prerequisites

- Codex CLI must be installed (`codex` command available)
- Codex must be authenticated (`codex login` completed)

## Execution Steps

### Step 1: Gather Context

First, collect information about the changes to be reviewed:

```bash
# Get the current branch name
git branch --show-current

# Get recent commit messages for context (last 5 commits on this branch)
git log --oneline -5

# Get all changes (staged + unstaged) as a diff
git diff HEAD

# If no uncommitted changes, get changes since branching from main/master
git diff main...HEAD 2>/dev/null || git diff master...HEAD 2>/dev/null
```

Also ask the user (if not already provided):
- What feature/fix/change were they implementing?
- Any specific areas they want reviewed?

### Step 2: Construct the Review Prompt

Build a comprehensive review prompt for Codex. The prompt should include:

```
You are reviewing code changes. Please analyze the following:

## Context
- Feature/Change: [user's description of what they built]
- Branch: [current branch name]
- Recent commits: [commit messages for context]

## Changes to Review
[git diff output]

## Review Criteria
Please review for:
1. **Correctness**: Does the implementation correctly fulfill the stated requirements?
2. **Bugs**: Are there any logical errors, edge cases not handled, or potential runtime issues?
3. **Security**: Are there any security vulnerabilities (injection, XSS, auth issues, etc.)?
4. **Best Practices**: Does the code follow language/framework best practices?
5. **Performance**: Are there any obvious performance concerns?
6. **Code Quality**: Is the code readable, maintainable, and well-structured?

## Output Format
Provide your review as:
1. **Summary**: Overall assessment (1-2 sentences)
2. **Issues Found**: List any problems, categorized by severity (Critical/Warning/Info)
3. **Suggestions**: Specific improvements with code examples where helpful
4. **Verdict**: APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION
```

### Step 3: Run Codex Review

Execute Codex in non-interactive, read-only mode:

```bash
# Create a temp file for the review prompt
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" << 'PROMPT_EOF'
[constructed prompt from Step 2]
PROMPT_EOF

# Run Codex in read-only, non-interactive mode
# Use REASONING_EFFORT="high" by default, or "xhigh" if user requested
codex exec \
  -m gpt-5.3-codex \
  -s read-only \
  -c model_reasoning_effort="high" \
  -C "$(pwd)" \
  --output-last-message /tmp/codex-review-output.md \
  "$(cat "$PROMPT_FILE")"

# Clean up
rm "$PROMPT_FILE"
```

**Command flags explained:**
- `-m gpt-5.3-codex`: Use the Codex 5.3 model
- `-s read-only`: Sandbox mode - Codex can read files but cannot modify anything (do NOT use `--full-auto` as it overrides this to `workspace-write`)
- `-c model_reasoning_effort="high"`: Reasoning effort level (use "xhigh" for complex reviews)
- `-C "$(pwd)"`: Set working directory to current project
- `--output-last-message`: Capture Codex's final response to a file

### Step 4: Present the Review

After Codex completes:

1. Read the output from `/tmp/codex-review-output.md`
2. Present it to the user in a clear format
3. Ask if they want to:
   - Apply any suggested changes
   - Discuss specific feedback
   - Run another review after making changes

## Error Handling

- If Codex is not installed: Inform user to install it (`npm install -g @openai/codex` or via their package manager)
- If not authenticated: Prompt user to run `codex login`
- If no changes to review: Inform user there are no uncommitted changes
- If Codex times out or fails: Show the error and suggest retrying

## Example Usage

### Standard Review (high effort)
**User says:** "I just finished implementing the user authentication feature, can you have codex review it?"

**Claude Code will:**
1. Run `git diff HEAD` to get all changes
2. Ask for any additional context if needed
3. Construct review prompt with the auth feature context
4. Run `codex exec -m gpt-5.3-codex -s read-only -c model_reasoning_effort="high" ...`
5. Present Codex's review feedback
6. Offer to help implement suggested changes

### Thorough Review (xhigh effort)
**User says:** "use codex extra high to review this security implementation"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="xhigh"` for deeper analysis
2. Extra high effort is better for: security-sensitive code, complex algorithms, architectural changes

## Notes

- The review runs in read-only mode so Codex cannot modify any files
- Large diffs may need to be summarized or split for effective review
- For very large changes, consider reviewing file-by-file
