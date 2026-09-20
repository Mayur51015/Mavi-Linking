# Model Context Protocol (MCP) Setup Guide for MAVI Linking

This guide outlines how to configure and utilize MCP servers within Antigravity IDE for the **MAVI Linking** development workflow.

---

## 1. Overview of Configured MCP Servers

The workspace configuration is located in [`.agents/mcp_config.json`](file:///c:/Users/mayur/Desktop/Mavi-Linking/.agents/mcp_config.json):

| Server | Role / Capabilities | Security Note |
|---|---|---|
| **`github`** | Repository analysis, pull requests, issue triage, branch inspection | Authenticated via local `GITHUB_TOKEN` environment variable. Never committed to Git. |
| **`filesystem`** | High-performance contextual file exploration within the project workspace | Scoped strictly to the MAVI Linking repository root. |
| **`mongodb`** | Inspect collections, schemas, indexes, and aggregation pipelines | Authenticated via local `MONGODB_URI` environment variable. |
| **`fetch`** | Fetch and parse external documentation and API specifications | Read-only public HTTP requests. |

---

## 2. Security Best Practices

> [!CAUTION]
> **Strict Credential Protection**:
> - Never hardcode database connection strings, passwords, or personal access tokens in `mcp_config.json`.
> - Always configure secrets in your local terminal environment or local `.env` files (which are ignored by `.gitignore`).
> - Keep MongoDB in read-only mode for development queries if possible.

---

## 3. Local Activation Steps

### A. Set Environment Variables
In your local environment (PowerShell on Windows):
```powershell
# Set GitHub Token for repo inspection
$env:GITHUB_TOKEN="your_personal_access_token_here"

# Set MongoDB URI for local development database inspection
$env:MONGODB_URI="mongodb://localhost:27017/mavi_linking"
```

### B. Verify in Antigravity IDE
1. Open Antigravity IDE.
2. Navigate to **Additional Options (...) > MCP Servers**.
3. Verify that the configured servers (`github`, `filesystem`, `mongodb`, `fetch`) are listed and active.
4. Tools exposed by these servers will automatically become available in your agent toolset.
