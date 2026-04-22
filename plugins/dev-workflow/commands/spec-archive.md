---
description: Archive a shipped (or cancelled) spec
allowed-tools: Read, Bash, Glob
---
Move the spec file $ARGUMENTS from the active specs folder to the archive, organized by quarter, using `git mv` so history is preserved.

## Steps

1. **Locate the active specs folder** (`docs/specs/active/`, `Docs/specs/active/`, `specs/active/`).
2. **Resolve the file.** If the user gave a bare slug, find the matching file in the active folder. If multiple match, list them and ask which.
3. **Determine the archive destination.** Convention is `<specs>/archive/{current-year}-Q{quarter}/`, e.g. `docs/specs/archive/2026-Q2/`. Create the quarter folder if it doesn't exist.
4. **Move with `git mv`** so history follows the file. Do not `cp` + `rm`.
5. **Output** the old path, the new path, and a reminder to commit the move with a conventional commit message like `docs: archive <spec-slug> spec`.

Do not commit the move yourself — leave that to the user.
