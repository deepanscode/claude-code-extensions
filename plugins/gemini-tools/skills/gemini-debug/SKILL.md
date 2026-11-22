---
name: gemini-debug
description: Use when the user asks Gemini to diagnose a bug through Antigravity CLI.
---

# Gemini Debug

Run from the project directory. Supply symptoms, relevant errors and expected behavior. Trace the cause. Use accept-edits only when the user requests a fix, then verify it. Give the delegate the task and its scope as a single prompt argument.

```sh
agy --model gemini-4-neon-high --effort high --mode plan -p "Task and relevant project context"
```

Use the requested model or effort when the user specifies one. Report CLI errors if the requested model is unavailable.
