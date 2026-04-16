import { PlatformAdapter } from "./base.js";
import { execOrThrow } from "../utils/exec.js";
import type {
  RepoInfo,
  PullRequest,
  PullRequestCreateParams,
  PullRequestListParams,
  PullRequestViewParams,
  PullRequestDetail,
  PullRequestMergeParams,
  PullRequestApproveParams,
  PullRequestCommentParams,
  PullRequestDeclineParams,
  Pipeline,
  PipelineListParams,
  PipelineTriggerParams,
  PipelineStatusParams,
  DeploymentApproveParams,
  PipelineCheck,
} from "../types.js";

export class GitHubAdapter extends PlatformAdapter {
  private get repoSlug() {
    return `${this.owner}/${this.repo}`;
  }

  private async gh(args: string[]): Promise<string> {
    const result = await execOrThrow("gh", args);
    return result.stdout.trim();
  }

  private async ghJson<T>(args: string[]): Promise<T> {
    const output = await this.gh(args);
    return JSON.parse(output) as T;
  }

  async repoInfo(): Promise<RepoInfo> {
    const data = await this.ghJson<{
      name: string;
      owner: { login: string };
      defaultBranchRef: { name: string };
      description: string;
      visibility: string;
      url: string;
    }>([
      "repo", "view", this.repoSlug,
      "--json", "name,owner,defaultBranchRef,description,visibility,url",
    ]);

    return {
      platform: "github",
      owner: data.owner.login,
      repo: data.name,
      defaultBranch: data.defaultBranchRef.name,
      description: data.description ?? "",
      visibility: data.visibility.toLowerCase() as RepoInfo["visibility"],
      url: data.url,
    };
  }

  async prCreate(params: PullRequestCreateParams): Promise<PullRequest> {
    const args = [
      "pr", "create",
      "--repo", this.repoSlug,
      "--title", params.title,
      "--head", params.sourceBranch,
      "--json", "number,title,body,state,headRefName,baseRefName,author,url,createdAt,updatedAt,isDraft,labels,reviewRequests",
    ];

    if (params.description) args.push("--body", params.description);
    if (params.targetBranch) args.push("--base", params.targetBranch);
    if (params.draft) args.push("--draft");
    if (params.reviewers?.length) args.push("--reviewer", params.reviewers.join(","));
    if (params.labels?.length) args.push("--label", params.labels.join(","));

    const data = await this.ghJson<GhPr>(args);
    return mapGhPr(data);
  }

  async prList(params: PullRequestListParams): Promise<PullRequest[]> {
    const args = [
      "pr", "list",
      "--repo", this.repoSlug,
      "--json", "number,title,body,state,headRefName,baseRefName,author,url,createdAt,updatedAt,isDraft,labels",
      "--limit", String(params.limit ?? 30),
    ];

    if (params.state && params.state !== "all") {
      args.push("--state", params.state);
    } else if (params.state === "all") {
      args.push("--state", "all");
    }

    if (params.author) args.push("--author", params.author);

    const data = await this.ghJson<GhPr[]>(args);
    return data.map(mapGhPr);
  }

  async prView(params: PullRequestViewParams): Promise<PullRequestDetail> {
    const fields = "number,title,body,state,headRefName,baseRefName,author,url,createdAt,updatedAt,isDraft,labels,additions,deletions,changedFiles,comments,reviewRequests,statusCheckRollup";
    const data = await this.ghJson<GhPrDetail>([
      "pr", "view", String(params.id),
      "--repo", this.repoSlug,
      "--json", fields,
    ]);

    const pr: PullRequestDetail = {
      ...mapGhPr(data),
      additions: data.additions,
      deletions: data.deletions,
      changedFiles: data.changedFiles,
      comments: data.comments?.length ?? 0,
    };

    if (params.includeChecks && data.statusCheckRollup) {
      pr.checks = data.statusCheckRollup.map((c: GhCheck) => ({
        name: c.name ?? c.context ?? "unknown",
        status: c.status ?? c.state ?? "unknown",
        conclusion: c.conclusion,
        url: c.detailsUrl ?? c.targetUrl,
      }));
    }

    if (params.includeDiff) {
      const diff = await this.gh([
        "pr", "diff", String(params.id),
        "--repo", this.repoSlug,
      ]);
      pr.diff = diff;
    }

    return pr;
  }

  async prMerge(params: PullRequestMergeParams): Promise<{ merged: boolean; message: string }> {
    const args = [
      "pr", "merge", String(params.id),
      "--repo", this.repoSlug,
    ];

    const strategy = params.strategy ?? "merge";
    if (strategy === "squash") args.push("--squash");
    else if (strategy === "rebase") args.push("--rebase");
    else args.push("--merge");

    if (params.deleteSourceBranch) args.push("--delete-branch");

    const output = await this.gh(args);
    return { merged: true, message: output || "Pull request merged successfully" };
  }

  async prApprove(params: PullRequestApproveParams): Promise<{ approved: boolean; message: string }> {
    const args = [
      "pr", "review", String(params.id),
      "--repo", this.repoSlug,
      "--approve",
    ];

    if (params.comment) args.push("--body", params.comment);

    const output = await this.gh(args);
    return { approved: true, message: output || "Pull request approved" };
  }

  async prComment(params: PullRequestCommentParams): Promise<{ id: number; message: string }> {
    await this.gh([
      "pr", "comment", String(params.id),
      "--repo", this.repoSlug,
      "--body", params.body,
    ]);
    return { id: 0, message: "Comment added" };
  }

  async prDecline(params: PullRequestDeclineParams): Promise<{ declined: boolean; message: string }> {
    await this.gh([
      "pr", "close", String(params.id),
      "--repo", this.repoSlug,
    ]);
    return { declined: true, message: "Pull request closed" };
  }

  async pipelineList(params: PipelineListParams): Promise<Pipeline[]> {
    const args = [
      "run", "list",
      "--repo", this.repoSlug,
      "--json", "databaseId,status,conclusion,headBranch,headSha,url,createdAt,updatedAt,event",
      "--limit", String(params.limit ?? 20),
    ];

    if (params.ref) args.push("--branch", params.ref);
    if (params.status) args.push("--status", params.status);

    const data = await this.ghJson<GhRun[]>(args);
    return data.map(mapGhRun);
  }

  async pipelineTrigger(params: PipelineTriggerParams): Promise<Pipeline> {
    // gh workflow run requires a workflow file name — list workflows and trigger the first (or default)
    const workflows = await this.ghJson<{ name: string; id: number; path: string }[]>([
      "workflow", "list",
      "--repo", this.repoSlug,
      "--json", "name,id,path",
    ]);

    if (workflows.length === 0) {
      throw new Error("No workflows found in this repository");
    }

    const workflowFile = workflows[0].path.split("/").pop()!;
    await this.gh([
      "workflow", "run", workflowFile,
      "--repo", this.repoSlug,
      "--ref", params.ref,
    ]);

    // Fetch the most recent run for the ref
    const runs = await this.ghJson<GhRun[]>([
      "run", "list",
      "--repo", this.repoSlug,
      "--branch", params.ref,
      "--limit", "1",
      "--json", "databaseId,status,conclusion,headBranch,headSha,url,createdAt,updatedAt,event",
    ]);

    if (runs.length === 0) {
      return {
        id: 0,
        status: "pending",
        ref: params.ref,
        sha: "",
        url: `https://github.com/${this.repoSlug}/actions`,
        createdAt: new Date().toISOString(),
      };
    }

    return mapGhRun(runs[0]);
  }

  async pipelineStatus(params: PipelineStatusParams): Promise<Pipeline> {
    const data = await this.ghJson<GhRun>([
      "run", "view", String(params.id),
      "--repo", this.repoSlug,
      "--json", "databaseId,status,conclusion,headBranch,headSha,url,createdAt,updatedAt,event",
    ]);
    return mapGhRun(data);
  }

  async deploymentApprove(params: DeploymentApproveParams): Promise<{ approved: boolean; message: string }> {
    // GitHub deployment approvals use the REST API via gh api
    const output = await this.gh([
      "api",
      `repos/${this.repoSlug}/actions/runs/${params.id}/pending_deployments`,
      "--method", "POST",
      "--field", `environment_ids[]=${params.environment}`,
      "--field", "state=approved",
      "--field", `comment=${params.comment ?? "Approved via MCP"}`,
    ]);
    return { approved: true, message: output || "Deployment approved" };
  }
}

// --- Internal GH CLI JSON types ---

interface GhPr {
  number: number;
  title: string;
  body: string;
  state: string;
  headRefName: string;
  baseRefName: string;
  author: { login: string };
  url: string;
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
  labels?: { name: string }[];
  reviewRequests?: { login?: string; name?: string }[];
}

interface GhPrDetail extends GhPr {
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: { id: string }[];
  statusCheckRollup?: GhCheck[];
}

interface GhCheck {
  name?: string;
  context?: string;
  status?: string;
  state?: string;
  conclusion?: string;
  detailsUrl?: string;
  targetUrl?: string;
}

interface GhRun {
  databaseId: number;
  status: string;
  conclusion: string | null;
  headBranch: string;
  headSha: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  event: string;
}

function mapGhPr(pr: GhPr): PullRequest {
  const stateMap: Record<string, PullRequest["state"]> = {
    OPEN: "open",
    CLOSED: "closed",
    MERGED: "merged",
  };

  return {
    id: pr.number,
    title: pr.title,
    description: pr.body ?? "",
    state: stateMap[pr.state] ?? "open",
    sourceBranch: pr.headRefName,
    targetBranch: pr.baseRefName,
    author: pr.author?.login ?? "",
    url: pr.url,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    draft: pr.isDraft,
    labels: pr.labels?.map((l) => l.name),
    reviewers: pr.reviewRequests?.map((r) => r.login ?? r.name ?? "").filter(Boolean),
  };
}

function mapGhRun(run: GhRun): Pipeline {
  const statusMap: Record<string, Pipeline["status"]> = {
    completed: run.conclusion === "success" ? "success" : run.conclusion === "failure" ? "failed" : "cancelled",
    in_progress: "running",
    queued: "pending",
    requested: "pending",
    waiting: "waiting",
    pending: "pending",
  };

  return {
    id: run.databaseId,
    status: statusMap[run.status] ?? "pending",
    ref: run.headBranch,
    sha: run.headSha,
    url: run.url,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    source: run.event,
  };
}
