---
description: Create a new developer guide
allowed-tools: Read, Write, Bash, Glob
---
Create a new guide for: $ARGUMENTS

## Conventions

Most projects store guides in one of:
- `docs/guides/`
- `Docs/guides/`
- `docs/how-to/`
- `docs/` (flat, no subfolder)

Pick the one the project already uses; default to `docs/guides/` if none exists.

## Steps

1. **Locate or create the guides folder.** Check `docs/guides/`, `Docs/guides/`, `docs/how-to/` in that order; fall back to `docs/guides/`.
2. **Confirm the topic belongs here.** Guides answer "how do I do X?" — task-shaped. If the topic is really:
   - "Why do we work this way?" → suggest `/adr-new` instead
   - "What's the current state of X?" → belongs in an architecture doc, not a guide
   - "What do I do when the alert fires?" → suggest `/runbook-new` instead
   - If it's wrong-folder, tell the user and stop instead of creating the file.
3. **Pick a kebab-case slug** from the arguments (e.g., "Setting up auth locally" → `setting-up-auth-locally.md`). Keep it task-shaped.
4. **Check for a `TEMPLATE.md`** in the guides folder. If present, copy it. Otherwise use the fallback below.
5. **Fill in** the title and prerequisites from the arguments; leave the step-by-step, verification, and troubleshooting sections as placeholders.
6. **Flag anything** you couldn't derive from arguments or existing docs so the user knows where to focus.

Do not invent commands you haven't verified. If a step needs a specific command, mark it `<TODO: confirm exact command>` rather than guessing.

## Fallback template (if none exists)

```markdown
# <Title>

<One-paragraph summary of what the reader will be able to do after following this guide.>

## Prerequisites

- <Tool / access / knowledge needed before starting>

## Steps

1. <Step one, with exact command if applicable>
2. <Step two>
3. <Step three>

## Verification

<How to confirm the task worked.>

## Troubleshooting

- **<Symptom>**: <likely cause and fix>

## References

- <Related guides, ADRs, or external docs>
```
