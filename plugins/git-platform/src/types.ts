export type Platform = "github" | "gitlab" | "bitbucket";

export interface RepoInfo {
  platform: Platform;
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string;
  visibility: "public" | "private" | "internal";
  url: string;
}

export interface PlatformDetection {
  platform: Platform;
  owner: string;
  repo: string;
  remoteUrl: string;
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: "open" | "merged" | "closed";
  sourceBranch: string;
  targetBranch: string;
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  reviewers?: string[];
  labels?: string[];
  draft?: boolean;
}

export interface PullRequestCreateParams {
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch?: string;
  draft?: boolean;
  reviewers?: string[];
  labels?: string[];
}

export interface PullRequestListParams {
  state?: "open" | "merged" | "closed" | "all";
  author?: string;
  limit?: number;
}

export interface PullRequestViewParams {
  id: number;
  includeDiff?: boolean;
  includeChecks?: boolean;
}

export interface PullRequestMergeParams {
  id: number;
  strategy?: "merge" | "squash" | "rebase";
  deleteSourceBranch?: boolean;
}

export interface PullRequestApproveParams {
  id: number;
  comment?: string;
}

export interface Pipeline {
  id: number | string;
  status: "running" | "success" | "failed" | "pending" | "cancelled" | "waiting";
  ref: string;
  sha: string;
  url: string;
  createdAt: string;
  updatedAt?: string;
  duration?: number;
  source?: string;
}

export interface PipelineListParams {
  ref?: string;
  status?: string;
  limit?: number;
}

export interface PipelineTriggerParams {
  ref: string;
  variables?: Record<string, string>;
}

export interface PipelineStatusParams {
  id: number | string;
}

export interface DeploymentApproveParams {
  id: number | string;
  environment: string;
  comment?: string;
}

export interface PullRequestDetail extends PullRequest {
  diff?: string;
  checks?: PipelineCheck[];
  comments?: number;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
}

export interface PipelineCheck {
  name: string;
  status: string;
  conclusion?: string;
  url?: string;
}
