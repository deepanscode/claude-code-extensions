---
name: gemini-plan
description: Use when the user asks Gemini to plan a change through Antigravity CLI.
---

# Gemini Plan

Run from the project directory. Ask for an implementation plan with affected files and verification steps. Return the plan for review. Give the delegate the task and its scope as a single prompt argument.

```sh
agy --model gemini-4-neon-high --effort high --mode plan -p "Task and relevant project context"
```

Use the requested model or effort when the user specifies one. Report CLI errors if the requested model is unavailable.
