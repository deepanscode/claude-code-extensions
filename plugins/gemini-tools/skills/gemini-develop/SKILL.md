---
name: gemini-develop
description: Use when the user asks Gemini to implement a change through Antigravity CLI.
---

# Gemini Develop

Run from the project directory. Specify the requested behavior, files in scope, and acceptance criteria. Review the resulting diff and run the relevant checks. Give the delegate the task and its scope as a single prompt argument.

```sh
agy --model gemini-4-neon-high --effort high --mode accept-edits -p "Task and relevant project context"
```

Use the requested model or effort when the user specifies one. Report CLI errors if the requested model is unavailable.
