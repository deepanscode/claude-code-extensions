export interface BitbucketAuth {
  username: string;
  token: string;
}

export function getBitbucketAuth(): BitbucketAuth {
  const username = process.env.BITBUCKET_USERNAME;
  const token = process.env.BITBUCKET_TOKEN;

  if (!username || !token) {
    throw new Error(
      "Bitbucket authentication requires BITBUCKET_USERNAME and BITBUCKET_TOKEN environment variables.\n" +
      "Set them in your shell environment or in ~/.claude/.env"
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
