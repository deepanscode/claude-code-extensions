import { exec } from "./utils/exec.js";
import type { Platform, PlatformDetection } from "./types.js";

const PLATFORM_PATTERNS: { platform: Platform; patterns: RegExp[] }[] = [
  {
    platform: "github",
    patterns: [
      /github\.com[:/]([^/]+)\/([^/.]+)/,
    ],
  },
  {
    platform: "gitlab",
    patterns: [
      /gitlab\.com[:/]([^/]+)\/([^/.]+)/,
    ],
  },
  {
    platform: "bitbucket",
    patterns: [
      /bitbucket\.org[:/]([^/]+)\/([^/.]+)/,
    ],
  },
];

function parseRemoteUrl(remoteUrl: string): PlatformDetection | null {
  for (const { platform, patterns } of PLATFORM_PATTERNS) {
    for (const pattern of patterns) {
      const match = remoteUrl.match(pattern);
      if (match) {
        return {
          platform,
          owner: match[1],
          repo: match[2].replace(/\.git$/, ""),
          remoteUrl,
        };
      }
    }
  }
  return null;
}

export async function detectPlatform(cwd?: string): Promise<PlatformDetection> {
  const { stdout } = await exec("git", ["remote", "get-url", "origin"], cwd);
  const remoteUrl = stdout.trim();

  if (!remoteUrl) {
    throw new Error("No git remote 'origin' found. Make sure you're in a git repository with a remote.");
  }

  const detection = parseRemoteUrl(remoteUrl);
  if (!detection) {
    throw new Error(
      `Could not detect platform from remote URL: ${remoteUrl}\n` +
      "Supported platforms: GitHub, GitLab, Bitbucket"
    );
  }

  return detection;
}
