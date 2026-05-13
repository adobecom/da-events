# CLAUDE.md

<!-- pim-pod-agent-begin -->

## PIM — Pod Agent Protocol

This project is connected to PIM pod `pod-emc-s27-configsservice-follow-9f4cd4`.
PIM server: `https://d1ygncl0yqo6sv.cloudfront.net`

### Automatic Reporting

Context updates are automatically reported to PIM when you:
- **Make a git commit** — via post-commit hook (captures subject, body, changed files)
- **Create a pull request** — via Claude Code hook (captures PR URL and title)

You do not need to manually report routine progress — it flows automatically.

### PIM MCP Tools (Preferred)

If the PIM MCP server is configured in Claude Code, **always use these tools
instead of CLI commands** — they are faster and don't require a shell.

**Context & Session**

| Tool | When to use |
|------|-------------|
| `get_agent_session_context` | Pull pod state, living doc, conflicts, and token-budgeted org learnings in one call |
| `context_search` | Search external sources (Slack archives, Jira, Confluence, GitHub, git) via PIM's aggregated search — no separate Slack/Jira MCPs needed |
| `query_knowledge` | Search the org knowledge graph for historical precedents and resolved decisions |

**Reporting**

| Tool | When to use |
|------|-------------|
| `submit_context_update` | Report progress, blockers, decisions, spec changes, or questions |

**Conflicts**

| Tool | When to use |
|------|-------------|
| `get_conflict_details` | Inspect a specific open conflict and its suggested resolutions |
| `resolve_conflict` | Mark a conflict as resolved with a chosen approach |

**Observability**

| Tool | When to use |
|------|-------------|
| `render_pod_dashboard` | Get a full interactive React artifact showing pod health, conflicts, feed, and live doc |
| `list_pods` | See all active pods in the org |

### Fallback: CLI Commands

Use these only when the PIM MCP server is not configured.

#### Getting Current Pod Context

```bash
pim context --pod pod-emc-s27-configsservice-follow-9f4cd4 --scope frontend
```

Use `--brief` for a quick summary or `--diff` to see only what changed since
your last pull. If conflict pressure is >= 0.6, check open conflicts before
proceeding in contested areas.

#### Manual Reporting

Report blockers, decisions, spec changes, and questions manually:

```bash
pim report --pod pod-emc-s27-configsservice-follow-9f4cd4 --type decision --scope frontend \
  --summary "Chose Redis over Memcached for session cache" \
  --details "Redis supports pub/sub which we need for real-time invalidation..."
```

Types: `progress` | `blocker` | `spec_change` | `question` | `decision`

### Quality Guidelines

- Summaries should be specific and actionable (avoid "made progress" or "working on it")
- Include file paths, function names, or API endpoints when relevant
- Declare blockers and input requests — this triggers PIM's escalation system
- Artifacts (changed files) are automatically included with commit reports

### Conflict Awareness

- Check pod pressure with `pim context --pod pod-emc-s27-configsservice-follow-9f4cd4 --brief`
- If pressure is >= 0.8, ingestion is halted — resolve conflicts first
- When your work overlaps with another area, PIM will detect it automatically

<!-- pim-pod-agent-end -->
