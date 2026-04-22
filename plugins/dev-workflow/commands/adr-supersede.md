---
description: Supersede an existing ADR with a new one
allowed-tools: Read, Write, Edit, Bash, Glob
---
Supersede ADR $ARGUMENTS (pass the ADR number, e.g. `0003`).

## Steps

1. **Locate the ADR folder** (check `docs/adr/`, `Docs/adr/`, `adr/`, `doc/architecture/decisions/` in that order).
2. **Read the ADR being superseded** at `<adr-folder>/{NNNN}-*.md` and confirm its current Status is `Accepted`.
   - If it is `Proposed`, stop and suggest the user just edit it in place.
   - If it is already `Superseded` or `Deprecated`, stop and ask the user which one they actually mean.
3. **Find the next ADR number** by listing the folder.
4. **Create the new ADR** from the repo's `TEMPLATE.md` if one exists (otherwise use the fallback from `/adr-new`). Name it `{next-NNNN}-{slug}.md`. Leave the slug blank for the user to fill if the arguments don't make it obvious.
5. **In the new ADR:**
   - Set Status to `Proposed`
   - Add a **Supersedes** reference in the References section pointing to the old ADR (`ADR-{old-NNNN}`).
6. **In the old ADR:** change Status to `Superseded by ADR-{new-NNNN}`. Leave the rest of the file intact — ADRs are otherwise immutable.
7. **Update the index** (`README.md` in the ADR folder) if one exists:
   - Change the old ADR's Status to `Superseded`
   - Add a new row for the new ADR with Status `Proposed`
8. **Output a summary** of what changed. Remind the user that the new ADR is `Proposed` — they need to discuss and move it to `Accepted` themselves.

Do not run `git commit`. The user will stage and commit once they've filled in Context / Decision / Consequences / Alternatives.
