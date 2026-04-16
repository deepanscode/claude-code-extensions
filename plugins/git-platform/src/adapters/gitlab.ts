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
} from "../types.js";

export class GitLabAdapter extends PlatformAdapter {
  private get repoSlug() {
    return `${this.owner}/${this.repo}`;
  }

  private async glab(args: string[]): Promise<string> {
    const result = await execOrThrow("glab", args);
    return result.stdout.trim();
  }

  private async glabApi<T>(endpoint: string, method = "GET", body?: unknown): Promise<T> {
    const args = ["api", endpoint, "--method", method];
    if (body) {
      args.push("--raw-field", `=${JSON.stringify(body)}`);
    }
    const output = await this.glab(args);
    return JSON.parse(output) as T;
  }

  async repoInfo(): Promise<RepoInfo> {
    const data = await this.glabApi<GlProject>(`projects/${encodeURIComponent(this.repoSlug)}`);

    return {
      platform: "gitlab",
      owner: data.namespace.path,
      repo: data.path,
      defaultBranch: data.default_branch,
      description: data.description ?? "",
      visibility: data.visibility as RepoInfo["visibility"],
      url: data.web_url,
    };
  }

  async prCreate(params: PullRequestCreateParams): Promise<PullRequest> {
    const args = [
      "mr", "create",
      "--repo", this.repoSlug,
      "--title", params.title,
      "--source-branch", params.sourceBranch,
      "--output", "json",
      "--yes",
    ];

    if (params.description) args.push("--description", params.description);
    if (params.targetBranch) args.push("--target-branch", params.targetBranch);
    if (params.draft) args.push("--draft");
    if (params.reviewers?.length) {
      for (const r of params.reviewers) {
        args.push("--reviewer", r);
      }
    }
    if (params.labels?.length) {
      args.push("--label", params.labels.join(","));
    }

    const output = await this.glab(args);
    const data = JSON.parse(output) as GlMr;
    return mapGlMr(data);
  }

  async prList(params: PullRequestListParams): Promise<PullRequest[]> {
    let stateParam = "opened";
    if (params.state === "merged") stateParam = "merged";
    else if (params.state === "closed") stateParam = "closed";
    else if (params.state === "all") stateParam = "all";

    const endpoint = `projects/${encodeURIComponent(this.repoSlug)}/merge_requests?state=${stateParam}&per_page=${params.limit ?? 30}`;
    if (params.author) {
      const data = await this.glabApi<GlMr[]>(`${endpoint}&author_username=${params.author}`);
      return data.map(mapGlMr);
    }

    const data = await this.glabApi<GlMr[]>(endpoint);
    return data.map(mapGlMr);
  }

  async prView(params: PullRequestViewParams): Promise<PullRequestDetail> {
    const data = await this.glabApi<GlMr>(
      `projects/${encodeURIComponent(this.repoSlug)}/merge_requests/${params.id}`
    );

    const pr: PullRequestDetail = {
      ...mapGlMr(data),
      comments: data.user_notes_count,
    };

    if (params.includeChecks) {
      const pipelines = await this.glabApi<GlPipeline[]>(
        `projects/${encodeURIComponent(this.repoSlug)}/merge_requests/${params.id}/pipelines`
      );
      if (pipelines.length > 0) {
        const jobs = await this.glabApi<GlJob[]>(
          `projects/${encodeURIComponent(this.repoSlug)}/pipelines/${pipelines[0].id}/jobs`
        );
        pr.checks = jobs.map((j) => ({
          name: j.name,
          status: j.status,
          conclusion: j.status === "success" ? "success" : j.status === "failed" ? "failure" : undefined,
          url: j.web_url,
        }));
      }
    }

    if (params.includeDiff) {
      const changes = await this.glabApi<{ changes: { diff: string }[] }>(
        `projects/${encodeURIComponent(this.repoSlug)}/merge_requests/${params.id}/changes`
      );
      pr.diff = changes.changes.map((c) => c.diff).join("\n");
    }

    return pr;
  }

  async prMerge(params: PullRequestMergeParams): Promise<{ merged: boolean; message: string }> {
    const args: string[] = [
      "mr", "merge", String(params.id),
      "--repo", this.repoSlug,
      "--yes",
    ];

    if (params.strategy === "squash") args.push("--squash");
    if (params.strategy === "rebase") args.push("--rebase");
    if (params.deleteSourceBranch) args.push("--remove-source-branch");

    const output = await this.glab(args);
    return { merged: true, message: output || "Merge request merged successfully" };
  }

  async prApprove(params: PullRequestApproveParams): Promise<{ approved: boolean; message: string }> {
    const args = [
      "mr", "approve", String(params.id),
      "--repo", this.repoSlug,
    ];

    const output = await this.glab(args);

    if (params.comment) {
      await this.glab([
        "mr", "note", String(params.id),
        "--repo", this.repoSlug,
        "--message", params.comment,
      ]);
    }

    return { approved: true, message: output || "Merge request approved" };
  }

  async prComment(params: PullRequestCommentParams): Promise<{ id: number; message: string }> {
    await this.glab([
      "mr", "note", String(params.id),
      "--repo", this.repoSlug,
      "--message", params.body,
    ]);
    return { id: 0, message: "Comment added" };
  }

  async prDecline(params: PullRequestDeclineParams): Promise<{ declined: boolean; message: string }> {
    await this.glab([
      "mr", "close", String(params.id),
      "--repo", this.repoSlug,
    ]);
    return { declined: true, message: "Merge request closed" };
  }

  async pipelineList(params: PipelineListParams): Promise<Pipeline[]> {
    let endpoint = `projects/${encodeURIComponent(this.repoSlug)}/pipelines?per_page=${params.limit ?? 20}`;
    if (params.ref) endpoint += `&ref=${params.ref}`;
    if (params.status) endpoint += `&status=${params.status}`;

    const data = await this.glabApi<GlPipeline[]>(endpoint);
    return data.map(mapGlPipeline);
  }

  async pipelineTrigger(params: PipelineTriggerParams): Promise<Pipeline> {
    const body: Record<string, unknown> = { ref: params.ref };
    if (params.variables) {
      body.variables = Object.entries(params.variables).map(([key, value]) => ({
        key,
        value,
        variable_type: "env_var",
      }));
    }

    const data = await this.glabApi<GlPipeline>(
      `projects/${encodeURIComponent(this.repoSlug)}/pipeline`,
      "POST",
      body,
    );
    return mapGlPipeline(data);
  }

  async pipelineStatus(params: PipelineStatusParams): Promise<Pipeline> {
    const data = await this.glabApi<GlPipeline>(
      `projects/${encodeURIComponent(this.repoSlug)}/pipelines/${params.id}`
    );
    return mapGlPipeline(data);
  }

  async deploymentApprove(params: DeploymentApproveParams): Promise<{ approved: boolean; message: string }> {
    // GitLab deployment approvals via API
    await this.glabApi(
      `projects/${encodeURIComponent(this.repoSlug)}/deployments/${params.id}/approval`,
      "POST",
      {
        status: "approved",
        comment: params.comment ?? "Approved via MCP",
        represented_as: params.environment,
      },
    );
    return { approved: true, message: "Deployment approved" };
  }
}

// --- Internal GL API types ---

interface GlProject {
  path: string;
  namespace: { path: string };
  default_branch: string;
  description: string;
  visibility: string;
  web_url: string;
}

interface GlMr {
  iid: number;
  title: string;
  description: string;
  state: string;
  source_branch: string;
  target_branch: string;
  author: { username: string };
  web_url: string;
  created_at: string;
  updated_at: string;
  draft?: boolean;
  labels?: string[];
  reviewers?: { username: string }[];
  user_notes_count?: number;
}

interface GlPipeline {
  id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  duration?: number;
  source?: string;
}

interface GlJob {
  name: string;
  status: string;
  web_url: string;
}

function mapGlMr(mr: GlMr): PullRequest {
  const stateMap: Record<string, PullRequest["state"]> = {
    opened: "open",
    closed: "closed",
    merged: "merged",
  };

  return {
    id: mr.iid,
    title: mr.title,
    description: mr.description ?? "",
    state: stateMap[mr.state] ?? "open",
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    author: mr.author?.username ?? "",
    url: mr.web_url,
    createdAt: mr.created_at,
    updatedAt: mr.updated_at,
    draft: mr.draft,
    labels: mr.labels,
    reviewers: mr.reviewers?.map((r) => r.username),
  };
}

function mapGlPipeline(p: GlPipeline): Pipeline {
  const statusMap: Record<string, Pipeline["status"]> = {
    running: "running",
    success: "success",
    failed: "failed",
    pending: "pending",
    canceled: "cancelled",
    cancelled: "cancelled",
    created: "pending",
    waiting_for_resource: "waiting",
    manual: "waiting",
  };

  return {
    id: p.id,
    status: statusMap[p.status] ?? "pending",
    ref: p.ref,
    sha: p.sha,
    url: p.web_url,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    duration: p.duration,
    source: p.source,
  };
}
