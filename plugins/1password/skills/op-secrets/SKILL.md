---
name: op-secrets
description: Use when configuring credentials, API tokens, environment variables, or `.env` files — resolves secrets via the 1Password CLI (`op`) instead of hardcoding them in shells, dotfiles, or repo config. TRIGGER when the user mentions storing a token / API key / password / connection string, setting `_CMD` env vars, writing or editing a `.env`, asking "how do I keep this out of the repo", running anything that needs a secret available at runtime, or has the `op` CLI installed.
---

# op-secrets — 1Password CLI secrets

Prefer this skill any time a secret would otherwise be pasted into a shell, `.env` file, `~/.zshrc`, `~/.bashrc`, CI config, or a project config file. The pattern: keep the secret in 1Password, reference it by a `op://` URI, and let `op` resolve it at the moment of use.

## Prerequisites — verify before suggesting `op` commands

```bash
op --version            # CLI installed? (>= 2.x)
op whoami               # signed in? prints account + user
op account list         # multiple accounts? account shorthand to pass to --account
```

If `op` is missing, install instructions per OS:

| OS | Install |
|---|---|
| macOS | `brew install 1password-cli` |
| Windows | `winget install 1Password.1PasswordCLI` (or `scoop install 1password-cli`) |
| Linux (apt) | See [1Password CLI install docs](https://developer.1password.com/docs/cli/get-started/) — apt source + `apt install 1password-cli` |

After install, on macOS / Windows the recommended auth is the **desktop-app integration** (1Password app → Settings → Developer → "Integrate with 1Password CLI" + Touch ID / Windows Hello). That unlocks the CLI biometrically with no service-account token needed.

If the user does not have the desktop app or is on a headless box, fall back to `eval $(op signin)` or a **service account** (below).

## Secret reference URIs

The core abstraction. Everything else builds on this:

```
op://<vault>/<item>/<field>
op://<vault>/<item>/<section>/<field>
op://<vault>/<item>/<filename.ext>          # file attachment
op://<vault>/<item>/<field>?attr=otp        # OTP code
op://<vault>/<item>/<field>?ssh-format=openssh
```

Rules:

- Case-insensitive.
- Allowed name characters: `a-z A-Z 0-9 - _ . ` and space.
- If a vault / item / field name contains a space, **quote the whole URI**: `op read 'op://My Vault/AWS Prod/access-key'`.
- If a name contains `/` or other unsupported characters, use the item's UUID instead (`op item get <name> --format json` shows the `id`).
- Environment-aware references: `op://${APP_ENV}/credentials/password` — shell expands `$APP_ENV` first, then `op` resolves the reference.

## Pattern 1 — `op read` for one-shot retrieval

```bash
op read 'op://Personal/Bitbucket/token'
op read 'op://Personal/Bitbucket/token' --no-newline | pbcopy
op read 'op://Personal/SSH/id_ed25519' --out-file ~/.ssh/id_ed25519 --file-mode 0600
op read 'op://Personal/AWS Prod/MFA/one-time password?attr=otp'
```

Useful flags: `--no-newline` (strip trailing newline — important when piping), `--out-file PATH` (write to file), `--file-mode 0600` (set permissions when writing keys), `--account <shorthand>` (target a specific account).

## Pattern 2 — `_CMD` env vars (the indirection pattern)

Many tools — including the `git-platform` plugin in this marketplace — read `FOO` first, then fall back to running `FOO_CMD` as a shell command and using its stdout. Pair that with `op read`:

```bash
# ~/.zshrc or per-project env
export BITBUCKET_USERNAME='you@example.com'
export BITBUCKET_TOKEN_CMD='op read op://Personal/Bitbucket/token'
```

Why this is good:

- Secret never touches the shell history or rcfile in plaintext.
- Resolved on demand, only when the consuming tool actually needs it.
- Works without `op run` — fits tools that already understand `_CMD` indirection.
- Trivially replaceable: swap `op read ...` for `aws secretsmanager get-secret-value ...`, `pass show ...`, or `gcloud secrets versions access ...` without changing the consumer.

If the consuming tool does **not** support `_CMD` indirection, use Pattern 3 instead — do not paste the resolved value into the rcfile.

## Pattern 3 — `op run --env-file` for subprocess injection

When you have a `.env` full of secret references and a process that reads `process.env`:

```bash
# .env (checked into the repo — values are references, not secrets)
DATABASE_URL=op://Personal/Postgres-dev/connection-string
STRIPE_SECRET_KEY=op://Personal/Stripe/test-secret-key
SENTRY_AUTH_TOKEN=op://Personal/Sentry/auth-token
```

```bash
op run --env-file .env -- npm run dev
op run --env-file .env -- pytest
op run --env-file .env --no-masking -- ./script.sh    # disable stdout masking if it breaks output
```

Properties:

- Secrets exist only in the subprocess's environment for the duration of the command.
- Stdout/stderr containing the secret values are masked by default — pass `--no-masking` only when masking corrupts non-secret output.
- Precedence (lowest → highest): shell env → `--env-file` → `--environment` (Environments feature).
- Don't `$VAR`-expand a reference on the same command line as `op run` — the shell expands before `op` substitutes. Wrap in a subshell or move the lookup inside the script.

## Discovery — finding the right `op://` reference

When the user knows *what* they need but not the exact path:

```bash
op vault list                            # which vaults exist?
op item list --vault Personal            # items in a vault
op item list --categories login,api-credential
op item get Bitbucket                    # see fields available on an item
op item get Bitbucket --format json | jq '.fields[] | {label, id}'
op item get Bitbucket --reveal           # show field values inline (avoid in shared terminals)
```

When constructing a new reference: prefer field **labels** the user reads in the 1Password UI — they're stable and human-readable. Fall back to UUIDs only when names contain `/` or other unsupported characters.

## Service accounts — for CI, scripts, or headless boxes

Interactive sign-in is wrong for CI. Use a **service account**:

1. Create one in the 1Password web UI (Integrations → Service Accounts), scoping vault access narrowly.
2. Store the token as a CI secret named `OP_SERVICE_ACCOUNT_TOKEN`.
3. The CLI auto-detects the token and skips interactive auth:

```bash
export OP_SERVICE_ACCOUNT_TOKEN='ops_eyJzaWduSW5BZGRyZXNzI...'
op read 'op://CI/Deploy/token'                          # works without `op signin`
op run --env-file .env -- ./deploy.sh
```

Service accounts cannot use the desktop-app integration, OTPs are scoped per-vault, and they only see vaults you explicitly grant. **Never** put a service-account token in 1Password and resolve it with `op read` — that's a chicken-and-egg loop.

## Pitfalls — flag these when you see them

| Pitfall | What goes wrong | Fix |
|---|---|---|
| `op read $VAR_HOLDING_REFERENCE` on the same command line as `op run` | Shell expands `$VAR` before `op run` sees the reference; secret is exposed in `ps` | Resolve inside a subshell, or put the reference in `--env-file` |
| Pasting `op read ...` output into a file with `>` | Newline appended; tools that compare bytes (JWT, SSH keys) break | `op read --no-newline` or `--out-file` |
| Quoting a `.env` value: `KEY="op://..."` | `op run`'s `.env` parser strips quotes — usually harmless, but breaks if the value legitimately contains quotes | Leave references unquoted in `.env` |
| Hardcoding the vault as `Personal` for a teammate | Their vault might be named differently | Use a shared vault name (`Shared`, `Engineering`) or document the expected name in the repo |
| Committing a `.env` with real secrets after switching to references | Old secrets already in git history | `git log -p -- .env` to verify, rotate any secret that was ever in plaintext |
| Storing the same secret in 1Password *and* the rcfile | Drift; rotation only updates one place | Delete the rcfile copy after wiring up `_CMD` or `op run` |
| Using `op read` inside a loop / hot path | Every call hits the CLI; slow and noisy | Resolve once into a shell variable in a subshell, or use `op run` to inject everything once |

## Sandbox / permissions note

`op read` and `op run` need network access plus access to the 1Password helper socket. In a strict sandbox (e.g. Codex `read-only` mode, or anywhere outbound network is blocked), they will fail — fall back to having the user run the command themselves and paste the result, or pre-resolve before entering the sandbox.

## Integration with this marketplace

- **`git-platform`** — `BITBUCKET_USERNAME` / `BITBUCKET_TOKEN` natively support the `_CMD` suffix. Recommend `BITBUCKET_TOKEN_CMD='op read op://...'` rather than putting the raw token in the env.
- Any other plugin or tool that documents a `_CMD` suffix uses the same pattern — point users at Pattern 2 above.

## Reference

- [Secret reference syntax](https://developer.1password.com/docs/cli/secret-reference-syntax/)
- [`op read`](https://developer.1password.com/docs/cli/reference/commands/read/)
- [`op run`](https://developer.1password.com/docs/cli/reference/commands/run/)
- [Service accounts](https://developer.1password.com/docs/service-accounts/)
- [Get started / install](https://developer.1password.com/docs/cli/get-started/)
