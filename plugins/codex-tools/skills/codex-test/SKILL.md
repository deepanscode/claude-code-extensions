# Codex Test Skill

Use this skill ONLY when the user explicitly asks Codex to write tests or test code. Trigger phrases include:
- "test this with codex"
- "use codex to write tests"
- "codex test"
- "have codex write tests"
- "codex write test cases"
- "use codex to add test coverage"

**IMPORTANT**: Do NOT use Codex for testing unless the user explicitly requests it. Claude Code should handle testing by default.

## Overview

This skill runs OpenAI's Codex CLI in non-interactive mode with workspace-write access to analyze existing code, write comprehensive tests, and optionally run them.

## Modes

| Mode | Sandbox | When to Use |
|------|---------|-------------|
| **Write Tests** (default) | `workspace-write` | User wants Codex to write test files |
| **Write & Run** | `workspace-write` | User wants Codex to write tests AND run them |

## Model & Reasoning Effort

Both the model (`-m`) and reasoning effort (`-c model_reasoning_effort=...`) are caller-configurable. Defaults: **`gpt-5.5`** + **`medium`** effort. If the user explicitly names a different Codex model or effort level, pass it through instead.

### Effort Levels

| Level | When to Use | Trigger Phrases |
|-------|-------------|-----------------|
| **low** | Small tweaks, adding a few targeted tests, simple coverage gaps | "codex low effort test", "quick codex test" |
| **medium** (default) | Most testing tasks - unit tests, integration tests | "test with codex", "codex test" |
| **high** | Broader test suites, less obvious edge cases | "codex high effort test" |
| **xhigh** | Complex test scenarios - concurrency, security, intricate state | "codex extra high test", "thorough codex test", "deep codex test" |

**How to set reasoning effort:**
- Add `-c model_reasoning_effort="<level>"` to the codex command
- Default to **medium** unless the user requests a different level

## Prerequisites

- Codex CLI must be installed (`codex` command available)
- Codex must be authenticated (`codex login` completed)

## Execution Steps

### Step 1: Gather Context

Collect information about the project and what needs testing:

```bash
# Get the current project structure
ls -la

# Understand the tech stack
ls package.json requirements.txt go.mod Cargo.toml pyproject.toml 2>/dev/null

# Check for existing test framework configuration
ls jest.config* vitest.config* pytest.ini .mocharc* karma.conf* 2>/dev/null

# Check for existing tests
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" | head -20

# Get recent changes to understand what was just built
git diff HEAD --stat
git log --oneline -5
```

Also ask the user (if not already provided):
- What code should Codex write tests for?
- Any specific test framework preference?
- What types of tests? (unit, integration, e2e)
- Any specific edge cases or scenarios to cover?

### Step 2: Construct the Test Prompt

Build a comprehensive prompt for Codex:

```
You are a senior test engineer. Your job is to write comprehensive tests for the codebase.

## What to Test
[user's description of what needs testing, or "all recent changes"]

## Project Context
- Project root: [working directory]
- Tech stack: [detected from project files]
- Test framework: [detected or user-specified]
- Source files: [relevant source files to test]

## Requirements
1. Write comprehensive tests covering:
   - Happy path / normal usage
   - Edge cases (empty input, null, boundary values)
   - Error handling (invalid input, failures)
   - Type correctness (if applicable)
2. Follow the existing test patterns in the project (if any)
3. Use the project's test framework
4. Each test should have a clear, descriptive name
5. Group related tests logically
6. Include setup/teardown where needed
7. Mock external dependencies appropriately

## Test Categories to Cover
- **Unit Tests**: Individual functions and methods
- **Integration Tests**: Component interactions (if applicable)
- **Edge Cases**: Boundary values, empty states, error conditions

## Output
After writing tests, provide:
1. **Test Files Created**: List of test files written
2. **Test Coverage Summary**: What scenarios are covered
3. **How to Run**: The command to execute the tests
4. **Known Gaps**: Any areas that need additional testing
```

### Step 3: Run Codex Test Writer

Execute Codex in workspace-write mode:

```bash
codex exec \
  -m gpt-5.5 \
  -s workspace-write \
  -c model_reasoning_effort="medium" \
  -C "$(pwd)" \
  --output-last-message /tmp/codex-test-output.md \
  "[constructed prompt from Step 2]"
```

`-m gpt-5.5` and `-c model_reasoning_effort="medium"` are the defaults — override with the model or effort level the user named.

### Step 4: Run the Tests (if Write & Run mode)

After Codex writes the tests:

```bash
# Detect and run the appropriate test command
# Node.js: npm test or npx vitest or npx jest
# Python: pytest or python -m unittest
# Go: go test ./...
```

### Step 5: Present the Results

After Codex completes:

1. Read the output from `/tmp/codex-test-output.md`
2. Show what test files were created (`git diff --stat`)
3. Show test results if tests were run
4. Present a summary to the user
5. Ask if they want to:
   - Run the tests (if not already run)
   - Add more test cases
   - Have Codex iterate on failing tests
   - Review the test quality

## Error Handling

- If Codex is not installed: Inform user to install it
- If not authenticated: Prompt user to run `codex login`
- If no source code to test: Inform user and ask what should be tested
- If tests fail: Present failures and offer to have Codex fix them
- If test framework not found: Suggest installing one appropriate for the tech stack

## Example Usage

### Standard Testing (medium effort, default)
**User says:** "Use codex to write tests for the URL shortener module"

**Claude Code will:**
1. Examine the source files and existing test setup
2. Construct test prompt with the module context
3. Run `codex exec -m gpt-5.5 -s workspace-write -c model_reasoning_effort="medium" ...`
4. Show test files created
5. Run the tests and present results

### Quick Testing (low effort)
**User says:** "codex low effort test - just cover the happy path here"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="low"` for fast, focused tests
2. Low effort is appropriate for: small coverage gaps, single-function tests

### Thorough Testing (xhigh effort)
**User says:** "use codex extra high to test the authentication flow"

**Claude Code will:**
1. Same steps as above, but use `-c model_reasoning_effort="xhigh"` for deeper analysis
2. Extra high effort is better for: security testing, complex state management, concurrency tests

## Notes

- Codex runs with workspace-write access so it CAN create test files
- Always show test results after running
- For large codebases, focus Codex on specific modules rather than everything
- If tests fail, consider running Codex debug skill to investigate
