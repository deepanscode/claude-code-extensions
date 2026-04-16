#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { detectPlatform } from "./platform.js";
import { GitHubAdapter } from "./adapters/github.js";
import { GitLabAdapter } from "./adapters/gitlab.js";
import { BitbucketAdapter } from "./adapters/bitbucket.js";
import type { PlatformAdapter } from "./adapters/base.js";
import type { Platform } from "./types.js";

function createAdapter(platform: Platform, owner: string, repo: string): PlatformAdapter {
  switch (platform) {
    case "github":
      return new GitHubAdapter(owner, repo);
    case "gitlab":
      return new GitLabAdapter(owner, repo);
    case "bitbucket":
      return new BitbucketAdapter(owner, repo);
  }
}

async function getAdapter(): Promise<PlatformAdapter> {
  const detection = await detectPlatform();
  return createAdapter(detection.platform, detection.owner, detection.repo);
}

const server = new McpServer({
  name: "git-platform",
  version: "0.1.0",
});

// --- git_platform_detect ---
server.tool(
  "git_platform_detect",
  "Detect the git platform (GitHub/GitLab/Bitbucket) and repository info from the current git remote",
  {},
  async () => {
    const detection = await detectPlatform();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(detection, null, 2),
        },
      ],
    };
  },
);

// --- repo_info ---
server.tool(
  "repo_info",
  "Get repository metadata (default branch, visibility, description, etc.)",
  {},
  async () => {
    const adapter = await getAdapter();
    const info = await adapter.repoInfo();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(info, null, 2) }],
    };
  },
);

// --- pr_create ---
server.tool(
  "pr_create",
  "Create a pull request / merge request",
  {
    title: z.string().describe("PR title"),
    description: z.string().optional().describe("PR description/body"),
    source_branch: z.string().describe("Source branch name"),
    target_branch: z.string().optional().describe("Target branch (defaults to repo default branch)"),
    draft: z.boolean().optional().describe("Create as draft PR"),
    reviewers: z.array(z.string()).optional().describe("List of reviewer usernames"),
    labels: z.array(z.string()).optional().describe("List of labels to add"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const pr = await adapter.prCreate({
      title: params.title,
      description: params.description,
      sourceBranch: params.source_branch,
      targetBranch: params.target_branch,
      draft: params.draft,
      reviewers: params.reviewers,
      labels: params.labels,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pr, null, 2) }],
    };
  },
);

// --- pr_list ---
server.tool(
  "pr_list",
  "List pull requests / merge requests",
  {
    state: z.enum(["open", "merged", "closed", "all"]).optional().describe("Filter by state (default: open)"),
    author: z.string().optional().describe("Filter by author username"),
    limit: z.number().optional().describe("Max number of PRs to return (default: 30)"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const prs = await adapter.prList({
      state: params.state,
      author: params.author,
      limit: params.limit,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(prs, null, 2) }],
    };
  },
);

// --- pr_view ---
server.tool(
  "pr_view",
  "View pull request / merge request details including diff and CI checks",
  {
    id: z.number().describe("PR/MR number or ID"),
    include_diff: z.boolean().optional().describe("Include the full diff"),
    include_checks: z.boolean().optional().describe("Include CI/CD check statuses"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const pr = await adapter.prView({
      id: params.id,
      includeDiff: params.include_diff,
      includeChecks: params.include_checks,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pr, null, 2) }],
    };
  },
);

// --- pr_merge ---
server.tool(
  "pr_merge",
  "Merge a pull request / merge request",
  {
    id: z.number().describe("PR/MR number or ID"),
    strategy: z.enum(["merge", "squash", "rebase"]).optional().describe("Merge strategy (default: merge)"),
    delete_source_branch: z.boolean().optional().describe("Delete source branch after merge"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const result = await adapter.prMerge({
      id: params.id,
      strategy: params.strategy,
      deleteSourceBranch: params.delete_source_branch,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// --- pr_approve ---
server.tool(
  "pr_approve",
  "Approve a pull request / merge request",
  {
    id: z.number().describe("PR/MR number or ID"),
    comment: z.string().optional().describe("Optional approval comment"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const result = await adapter.prApprove({
      id: params.id,
      comment: params.comment,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// --- pr_comment ---
server.tool(
  "pr_comment",
  "Add a comment to a pull request / merge request",
  {
    id: z.number().describe("PR/MR number or ID"),
    body: z.string().describe("Comment body (markdown supported)"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const result = await adapter.prComment({
      id: params.id,
      body: params.body,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// --- pr_decline ---
server.tool(
  "pr_decline",
  "Close / decline a pull request without merging",
  {
    id: z.number().describe("PR/MR number or ID"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const result = await adapter.prDecline({ id: params.id });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// --- pipeline_list ---
server.tool(
  "pipeline_list",
  "List CI/CD pipelines / workflow runs",
  {
    ref: z.string().optional().describe("Filter by branch/tag ref"),
    status: z.string().optional().describe("Filter by status"),
    limit: z.number().optional().describe("Max number of pipelines to return (default: 20)"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const pipelines = await adapter.pipelineList({
      ref: params.ref,
      status: params.status,
      limit: params.limit,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pipelines, null, 2) }],
    };
  },
);

// --- pipeline_trigger ---
server.tool(
  "pipeline_trigger",
  "Trigger a CI/CD pipeline / workflow run",
  {
    ref: z.string().describe("Branch or tag to run the pipeline on"),
    variables: z.record(z.string()).optional().describe("Pipeline variables as key-value pairs"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const pipeline = await adapter.pipelineTrigger({
      ref: params.ref,
      variables: params.variables,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pipeline, null, 2) }],
    };
  },
);

// --- pipeline_status ---
server.tool(
  "pipeline_status",
  "Get the status of a specific CI/CD pipeline / workflow run",
  {
    id: z.union([z.number(), z.string()]).describe("Pipeline/run ID"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const pipeline = await adapter.pipelineStatus({ id: params.id });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pipeline, null, 2) }],
    };
  },
);

// --- deployment_approve ---
server.tool(
  "deployment_approve",
  "Approve a pending deployment",
  {
    id: z.union([z.number(), z.string()]).describe("Deployment or pipeline run ID"),
    environment: z.string().describe("Environment name to approve"),
    comment: z.string().optional().describe("Approval comment"),
  },
  async (params) => {
    const adapter = await getAdapter();
    const result = await adapter.deploymentApprove({
      id: params.id,
      environment: params.environment,
      comment: params.comment,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
