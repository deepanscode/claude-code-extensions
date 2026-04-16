import { execSync } from "node:child_process";

export interface BitbucketAuth {
  username: string;
  token: string;
}

/**
 * Resolve a credential from env var or a _CMD variant.
 *
 * Checks `name` first (direct value). If empty, checks `name + "_CMD"` —
 * a shell command whose stdout is the credential (e.g. `op read ...`,
 * `aws secretsmanager get-secret-value ...`, `pass show ...`).
 *
 * This keeps the plugin generic — no dependency on any specific secret
 * manager. Users configure whichever CLI they prefer via the _CMD env var.
 */
function resolveCredential(name: string): string | undefined {
  const direct = process.env[name];
  if (direct) return direct;

  const cmd = process.env[`${name}_CMD`];
  if (cmd) {
    try {
      return execSync(cmd, { encoding: "utf-8", timeout: 15_000 }).trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to resolve ${name} via ${name}_CMD:\n  Command: ${cmd}\n  Error: ${msg}`
      );
    }
  }

  return undefined;
}

export function getBitbucketAuth(): BitbucketAuth {
  const username = resolveCredential("BITBUCKET_USERNAME");
  const token = resolveCredential("BITBUCKET_TOKEN");

  if (!username || !token) {
    throw new Error(
      "Bitbucket authentication requires BITBUCKET_USERNAME and BITBUCKET_TOKEN.\n" +
      "Set them as environment variables (direct value) or as _CMD variants\n" +
      "(a shell command that outputs the credential, e.g. BITBUCKET_TOKEN_CMD=\"op read ...\").\n\n" +
      "BITBUCKET_USERNAME accepts your Bitbucket username or Atlassian email.\n" +
      "BITBUCKET_TOKEN is an API token from https://bitbucket.org/account/settings/api-tokens/\n" +
      "(App passwords are deprecated; use API tokens instead.)"
    );
  }

  return { username, token };
}

export function bitbucketHeaders(auth: BitbucketAuth): Record<string, string> {
  const encoded = Buffer.from(`${auth.username}:${auth.token}`).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}
