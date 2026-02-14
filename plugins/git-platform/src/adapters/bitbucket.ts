import { PlatformAdapter } from "./base.js";
import { getBitbucketAuth, bitbucketHeaders } from "../utils/auth.js";
import type {
  RepoInfo,
  PullRequest,
  PullRequestCreateParams,
  PullRequestListParams,
  PullRequestViewParams,
  PullRequestDetail,
  PullRequestMergeParams,
  PullRequestApproveParams,
  Pipeline,
  PipelineListParams,
  PipelineTriggerParams,
  PipelineStatusParams,
  DeploymentApproveParams,
} from "../types.js";

const BB_API = "https://api.bitbucket.org/2.0";

export class BitbucketAdapter extends PlatformAdapter {
  private get repoSlug() {
    return `${this.owner}/${this.repo}`;
  }

  private get headers() {
    return bitbucketHeaders(getBitbucketAuth());
  }

  private async api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const url = `${BB_API}/${path}`;
    const init: RequestInit = {
      method,
      headers: this.headers,
    };
    if (body) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bitbucket API ${method} ${path}: ${res.status} ${res.statusText}\n${text}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  async repoInfo(): Promise<RepoInfo> {
    const data = await this.api<BbRepo>(`repositories/${this.repoSlug}`);

    return {
      platform: "bitbucket",
      owner: data.owner.username ?? data.owner.display_name,
      repo: data.slug,
      defaultBranch: data.mainbranch?.name ?? "main",
      description: data.description ?? "",
      visibility: data.is_private ? "private" : "public",
      url: data.links.html.href,
    };
  }

  async prCreate(params: PullRequestCreateParams): Promise<PullRequest> {
    const body: Record<string, unknown> = {
      title: params.title,
      source: { branch: { name: params.sourceBranch } },
    };

    if (params.description) body.description = params.description;
    if (params.targetBranch) body.destination = { branch: { name: params.targetBranch } };
    if (params.reviewers?.length) {
      body.reviewers = params.reviewers.map((r) => ({ username: r }));
    }

    const data = await this.api<BbPr>(
      `repositories/${this.repoSlug}/pullrequests`,
      "POST",
      body,
    );
    return mapBbPr(data);
  }

  async prList(params: PullRequestListParams): Promise<PullRequest[]> {
    let stateFilter = "OPEN";
    if (params.state === "merged") stateFilter = "MERGED";
    else if (params.state === "closed") stateFilter = "DECLINED";
    else if (params.state === "all") stateFilter = "";

    let path = `repositories/${this.repoSlug}/pullrequests?pagelen=${params.limit ?? 30}`;
    if (stateFilter) path += `&state=${stateFilter}`;

    const data = await this.api<{ values: BbPr[] }>(path);
    let prs = data.values.map(mapBbPr);

    if (params.author) {
      prs = prs.filter((pr) => pr.author === params.author);
    }

    return prs;
  }

  async prView(params: PullRequestViewParams): Promise<PullRequestDetail> {
    const data = await this.api<BbPr>(
      `repositories/${this.repoSlug}/pullrequests/${params.id}`
    );

    const pr: PullRequestDetail = {
      ...mapBbPr(data),
      comments: data.comment_count,
    };

    if (params.includeDiff) {
      const diff = await this.api<string>(
        `repositories/${this.repoSlug}/pullrequests/${params.id}/diff`
      );
      pr.diff = diff;
    }

    if (params.includeChecks) {
      const statuses = await this.api<{ values: BbStatus[] }>(
        `repositories/${this.repoSlug}/pullrequests/${params.id}/statuses`
      );
      pr.checks = statuses.values.map((s) => ({
        name: s.name,
        status: s.state,
        conclusion: s.state === "SUCCESSFUL" ? "success" : s.state === "FAILED" ? "failure" : undefined,
        url: s.url,
      }));
    }

    return pr;
  }

  async prMerge(params: PullRequestMergeParams): Promise<{ merged: boolean; message: string }> {
    const body: Record<string, unknown> = {};

    if (params.strategy === "squash") {
      body.merge_strategy = "squash";
    } else if (params.strategy === "rebase") {
      body.merge_strategy = "fast_forward";
    } else {
      body.merge_strategy = "merge_commit";
    }

    body.close_source_branch = params.deleteSourceBranch ?? false;

    await this.api(
      `repositories/${this.repoSlug}/pullrequests/${params.id}/merge`,
      "POST",
      body,
    );
    return { merged: true, message: "Pull request merged successfully" };
  }

  async prApprove(params: PullRequestApproveParams): Promise<{ approved: boolean; message: string }> {
    await this.api(
      `repositories/${this.repoSlug}/pullrequests/${params.id}/approve`,
      "POST",
    );

    if (params.comment) {
      await this.api(
        `repositories/${this.repoSlug}/pullrequests/${params.id}/comments`,
        "POST",
        { content: { raw: params.comment } },
      );
    }

    return { approved: true, message: "Pull request approved" };
  }

  async pipelineList(params: PipelineListParams): Promise<Pipeline[]> {
    let path = `repositories/${this.repoSlug}/pipelines/?pagelen=${params.limit ?? 20}&sort=-created_on`;

    const data = await this.api<{ values: BbPipeline[] }>(path);
    let pipelines = data.values.map(mapBbPipeline);

    if (params.ref) {
      pipelines = pipelines.filter((p) => p.ref === params.ref);
    }
    if (params.status) {
      pipelines = pipelines.filter((p) => p.status === params.status);
    }

    return pipelines;
  }

  async pipelineTrigger(params: PipelineTriggerParams): Promise<Pipeline> {
    const body: Record<string, unknown> = {
      target: {
        type: "pipeline_ref_target",
        ref_type: "branch",
        ref_name: params.ref,
      },
    };

    if (params.variables) {
      body.variables = Object.entries(params.variables).map(([key, value]) => ({
        key,
        value,
      }));
    }

    const data = await this.api<BbPipeline>(
      `repositories/${this.repoSlug}/pipelines/`,
      "POST",
      body,
    );
    return mapBbPipeline(data);
  }

  async pipelineStatus(params: PipelineStatusParams): Promise<Pipeline> {
    const data = await this.api<BbPipeline>(
      `repositories/${this.repoSlug}/pipelines/${params.id}`
    );
    return mapBbPipeline(data);
  }

  async deploymentApprove(_params: DeploymentApproveParams): Promise<{ approved: boolean; message: string }> {
    // Bitbucket Cloud doesn't have a native deployment approval API in the same way.
    // Deployments are managed through pipeline step approvals.
    throw new Error(
      "Bitbucket Cloud does not support deployment approvals via API. " +
      "Use the Bitbucket web UI to approve deployments."
    );
  }
}

// --- Internal Bitbucket API types ---

interface BbRepo {
  slug: string;
  owner: { username: string; display_name: string };
  mainbranch?: { name: string };
  description: string;
  is_private: boolean;
  links: { html: { href: string } };
}

interface BbPr {
  id: number;
  title: string;
  description: string;
  state: string;
  source: { branch: { name: string } };
  destination: { branch: { name: string } };
  author: { display_name: string; username?: string; nickname?: string };
  links: { html: { href: string } };
  created_on: string;
  updated_on: string;
  reviewers?: { username?: string; nickname?: string; display_name: string }[];
  comment_count?: number;
}

interface BbPipeline {
  uuid: string;
  state: { name: string; result?: { name: string } };
  target: { ref_name: string; commit?: { hash: string } };
  links?: { html?: { href: string } };
  created_on: string;
  completed_on?: string;
  duration_in_seconds?: number;
  trigger?: { name: string };
}

interface BbStatus {
  name: string;
  state: string;
  url: string;
}

function mapBbPr(pr: BbPr): PullRequest {
  const stateMap: Record<string, PullRequest["state"]> = {
    OPEN: "open",
    MERGED: "merged",
    DECLINED: "closed",
    SUPERSEDED: "closed",
  };

  return {
    id: pr.id,
    title: pr.title,
    description: pr.description ?? "",
    state: stateMap[pr.state] ?? "open",
    sourceBranch: pr.source.branch.name,
    targetBranch: pr.destination.branch.name,
    author: pr.author?.username ?? pr.author?.nickname ?? pr.author?.display_name ?? "",
    url: pr.links.html.href,
    createdAt: pr.created_on,
    updatedAt: pr.updated_on,
    reviewers: pr.reviewers?.map((r) => r.username ?? r.nickname ?? r.display_name),
  };
}

function mapBbPipeline(p: BbPipeline): Pipeline {
  const stateMap: Record<string, Pipeline["status"]> = {
    COMPLETED: p.state.result?.name === "SUCCESSFUL" ? "success" : "failed",
    RUNNING: "running",
    PENDING: "pending",
    HALTED: "waiting",
    PAUSED: "waiting",
  };

  return {
    id: p.uuid,
    status: stateMap[p.state.name] ?? "pending",
    ref: p.target.ref_name,
    sha: p.target.commit?.hash ?? "",
    url: p.links?.html?.href ?? "",
    createdAt: p.created_on,
    updatedAt: p.completed_on,
    duration: p.duration_in_seconds,
    source: p.trigger?.name,
  };
}
