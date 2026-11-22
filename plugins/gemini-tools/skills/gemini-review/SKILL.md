---
name: gemini-review
description: Use when the user asks Gemini to review code through Antigravity CLI.
---

# Gemini Review

Run from the project directory. Identify the diff or comparison range. Request findings with file and line references, and verify the findings against the code. Give the delegate the task and its scope as a single prompt argument.

```sh
agy --model gemini-4-neon-high --effort high --mode plan -p "Task and relevant project context"
```

Use the requested model or effort when the user specifies one. Report CLI errors if the requested model is unavailable.
