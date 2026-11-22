---
name: gemini-test
description: Use when the user asks Gemini to write or run tests through Antigravity CLI.
---

# Gemini Test

Run from the project directory. Identify the behavior under test and the test command. If the request is only to run existing tests, ask for execution without edits. Verify the results. Give the delegate the task and its scope as a single prompt argument.

```sh
agy --model gemini-4-neon-high --effort high --mode accept-edits -p "Task and relevant project context"
```

Use the requested model or effort when the user specifies one. Report CLI errors if the requested model is unavailable.
