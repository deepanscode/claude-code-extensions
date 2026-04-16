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

export abstract class PlatformAdapter {
  constructor(
    protected owner: string,
    protected repo: string,
  ) {}

  abstract repoInfo(): Promise<RepoInfo>;

  abstract prCreate(params: PullRequestCreateParams): Promise<PullRequest>;
  abstract prList(params: PullRequestListParams): Promise<PullRequest[]>;
  abstract prView(params: PullRequestViewParams): Promise<PullRequestDetail>;
  abstract prMerge(params: PullRequestMergeParams): Promise<{ merged: boolean; message: string }>;
  abstract prApprove(params: PullRequestApproveParams): Promise<{ approved: boolean; message: string }>;
  abstract prComment(params: PullRequestCommentParams): Promise<{ id: number; message: string }>;
  abstract prDecline(params: PullRequestDeclineParams): Promise<{ declined: boolean; message: string }>;

  abstract pipelineList(params: PipelineListParams): Promise<Pipeline[]>;
  abstract pipelineTrigger(params: PipelineTriggerParams): Promise<Pipeline>;
  abstract pipelineStatus(params: PipelineStatusParams): Promise<Pipeline>;

  abstract deploymentApprove(params: DeploymentApproveParams): Promise<{ approved: boolean; message: string }>;
}
