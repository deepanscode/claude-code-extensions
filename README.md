# Claude Code Extensions

A plugin marketplace for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that adds OpenAI Codex-powered development tools and a unified Git platform MCP server.

## Available Plugins

### codex-tools `v1.0.0`

Full development lifecycle powered by OpenAI's [Codex CLI](https://github.com/openai/codex). Includes 5 skills (slash commands) and 4 background agents that work together to plan, build, test, debug, and review code.

**Skills** (interactive, inline):

| Command | Description |
|---------|-------------|
| `/codex-plan` | Plan features and architecture before writing code |
| `/codex-develop` | Build and implement features |
| `/codex-test` | Write and run tests |
| `/codex-debug` | Investigate and fix bugs (read-only or fix mode) |
| `/codex-review` | Review code changes for bugs, security, and best practices |

**Agents** (background, clean context):

| Agent | Description |
|-------|-------------|
| codex-planner | Produces implementation plans without polluting the conversation |
| codex-developer | Builds features in the background |
| codex-tester | Writes and runs tests in the background |
| codex-reviewer | Reviews code and returns a concise summary |

All skills and agents support two reasoning effort levels:
- **high** (default) — standard tasks
- **xhigh** — complex, security-critical, or architectural work (trigger with "codex extra high ...")

**Prerequisites**: [Codex CLI](https://github.com/openai/codex) installed and authenticated (`codex login`).

---

### git-platform `v0.1.0`

A TypeScript [MCP server](https://modelcontextprotocol.io/) that provides unified PR, pipeline, and repo operations across GitHub, GitLab, and Bitbucket. It auto-detects the platform from your git remote URL.

**11 MCP tools**:

| Tool | Description |
|------|-------------|
| `git_platform_detect` | Detect platform from git remote |
| `repo_info` | Get repository information |
| `pr_create` | Create a pull/merge request |
| `pr_list` | List pull/merge requests |
| `pr_view` | View PR details |
| `pr_merge` | Merge a PR |
| `pr_approve` | Approve a PR |
| `pipeline_list` | List CI/CD pipelines |
| `pipeline_trigger` | Trigger a pipeline run |
| `pipeline_status` | Check pipeline status |
| `deployment_approve` | Approve a deployment |

**Auth** (no token management needed for GitHub/GitLab):
- **GitHub**: Uses `gh` CLI (authenticate with `gh auth login`)
- **GitLab**: Uses `glab` CLI (authenticate with `glab auth login`)
- **Bitbucket**: Set `BITBUCKET_USERNAME` and `BITBUCKET_TOKEN` env vars

## Installation

### Quick start

```bash
# 1. Add the marketplace (one time)
/plugin marketplace add deepanscode/claude-code-extensions

# 2. Install the plugins you want
/plugin install codex-tools@deepanscode
/plugin install git-platform@deepanscode
```

### Updating

```bash
/plugin marketplace update
```

### Prerequisites

| Plugin | Requires |
|--------|----------|
| codex-tools | [Codex CLI](https://github.com/openai/codex) (`npm install -g @openai/codex`) |
| git-platform | `gh` CLI (GitHub), `glab` CLI (GitLab), or Bitbucket env vars |

## Repository Structure

```
.claude-plugin/
  marketplace.json               Marketplace catalog

plugins/
  codex-tools/                   Codex dev lifecycle plugin
    .claude-plugin/
      plugin.json
    skills/
      codex-plan/SKILL.md
      codex-develop/SKILL.md
      codex-test/SKILL.md
      codex-debug/SKILL.md
      codex-review/SKILL.md
    agents/
      codex-planner/AGENT.md
      codex-developer/AGENT.md
      codex-tester/AGENT.md
      codex-reviewer/AGENT.md

  git-platform/                  Unified Git MCP server
    .claude-plugin/
      plugin.json
    .mcp.json
    src/
      index.ts                   Entry point (11 MCP tools)
      platform.ts                Auto-detect GitHub/GitLab/Bitbucket
      types.ts                   Shared TypeScript types
      adapters/
        base.ts                  Abstract adapter
        github.ts                GitHub adapter (gh CLI)
        gitlab.ts                GitLab adapter (glab CLI)
        bitbucket.ts             Bitbucket adapter (REST API)
      utils/
        auth.ts                  Bitbucket auth helper
        exec.ts                  Child process wrapper
    package.json
    tsconfig.json
```

## How It Works

### Skills vs Agents

Skills run **inline** in your conversation — you see all the output and can iterate interactively. Agents run in the **background** as separate processes and return only a concise summary, keeping your conversation context clean.

Use skills when you want to discuss and iterate. Use agents when you want quick results without context bloat, or when running multiple tasks in parallel.

### Multi-Agent Collaboration

The Codex agents are designed to work together in a pipeline:

1. **Planner** analyzes the codebase and produces an implementation plan
2. **Developer** builds the feature following the plan
3. **Tester** writes and runs tests against the implementation
4. **Reviewer** reviews everything and flags issues

Claude Code orchestrates the pipeline, comparing plans, feeding results between agents, and resolving issues across iterations.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Add your skill in `plugins/codex-tools/skills/your-skill/SKILL.md` or agent in `plugins/codex-tools/agents/your-agent/AGENT.md`
4. Open a PR

### Adding a new skill

Create a directory under `plugins/codex-tools/skills/` with a `SKILL.md` file:

```
plugins/codex-tools/skills/my-skill/
  SKILL.md
```

The `SKILL.md` should include:
- Trigger phrases (when should this skill activate)
- Step-by-step execution instructions
- Example usage
- Error handling

### Adding a new agent

Create a directory under `plugins/codex-tools/agents/` with an `AGENT.md` file following the same pattern as existing agents. Include the Task tool prompt template and expected output format.

## License

MIT
