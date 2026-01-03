# @ai-commit/mcp-server

> Model Context Protocol (MCP) server for AI-Commit
>
> Use AI-Commit in **Cursor**, **Windsurf**, **Cline**, and any MCP-compatible AI coding tool!

## ✨ Features

- 🤖 **7 Powerful Tools** - Complete Git commit automation
- 📊 **2 Resources** - Access commit history and analysis reports
- 💬 **2 Prompts** - Code review and commit message suggestions
- 🔌 **Universal** - Works with any MCP client (Cursor, Windsurf, Cline, etc.)
- 🚀 **Zero Config** - Works out of the box with `npx`

---

## 🚀 Quick Start

### Installation

```bash
npx @ai-commit/mcp-server
```

That's it! The MCP server will start and communicate via stdio.

---

## 🔧 Setup for Different Tools

### Cursor

Add to your Cursor settings (`.cursor/config.json` or global settings):

```json
{
  "mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["-y", "@ai-commit/mcp-server"]
    }
  }
}
```

Then in your project root, create `.cursorrules` file (see example in repo root).

**Usage**:
```
You: "커밋해줘" or "commit"
Cursor: [Automatically calls ai_commit_full and shows results]
```

### Windsurf

Add to `.windsurf/config.json`:

```json
{
  "mcp": {
    "servers": {
      "ai-commit": {
        "command": "npx",
        "args": ["-y", "@ai-commit/mcp-server"]
      }
    }
  }
}
```

### Cline (VSCode Extension)

Add to VSCode `settings.json`:

```json
{
  "cline.mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["-y", "@ai-commit/mcp-server"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["-y", "@ai-commit/mcp-server"]
    }
  }
}
```

---

## 🛠️ Available Tools

### 1. `ai_commit_full` ⭐ (Recommended)

Complete AI-Commit workflow: analyze → commit → sync → push

**Input**:
```typescript
{
  message?: string;      // Custom commit message (auto-generated if not provided)
  push?: boolean;        // Push to remote after commit (default: false)
  syncPlugins?: boolean; // Sync to Notion/Linear (default: true)
}
```

**Example**:
```typescript
// Auto-commit with generated message
ai_commit_full()

// Custom message + push
ai_commit_full({ message: "feat: add login", push: true })
```

### 2. `ai_commit_analyze`

Analyze current changes without committing.

**Input**:
```typescript
{
  excludePatterns?: string[]; // Files to exclude (e.g., ["node_modules/**"])
}
```

### 3. `ai_commit_commit`

Create a commit with optional message.

**Input**:
```typescript
{
  message?: string;       // Commit message
  skipAnalysis?: boolean; // Skip analysis (default: false)
}
```

### 4. `ai_commit_push`

Push commits to remote.

**Input**:
```typescript
{
  remote?: string; // Remote name (default: "origin")
  branch?: string; // Branch name (default: current branch)
}
```

### 5. `ai_commit_sync_notion`

Sync a specific commit to Notion.

**Input**:
```typescript
{
  commitSha: string; // Commit SHA to sync (required)
}
```

### 6. `ai_commit_config_get`

Get current configuration.

**Input**:
```typescript
{
  key?: string; // Specific config key (optional)
}
```

### 7. `ai_commit_config_set`

Update configuration.

**Input**:
```typescript
{
  key: string;   // Config key (e.g., "git.autoPush")
  value: any;    // New value
}
```

---

## 📦 Resources

### `commit://history`

Access recent commit history with analysis reports.

**Returns**:
```json
{
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "totalCommits": 10,
  "commits": [
    {
      "sha": "abc123",
      "message": "feat: add feature",
      "analysisReport": "docs/commits/abc123.md"
    }
  ]
}
```

### `analysis://reports`

List all analysis reports.

**Returns**:
```json
{
  "outputDirectory": "docs/commits",
  "totalReports": 5,
  "reports": [
    {
      "sha": "abc123",
      "title": "Commit Analysis Report",
      "file": "docs/commits/abc123.md",
      "created": "2026-01-03T..."
    }
  ]
}
```

---

## 💬 Prompts

### `review-changes`

Generate a comprehensive code review prompt.

**Arguments**:
- `focus?: "security" | "performance" | "quality" | "all"` (default: "all")

**Usage**:
```
Prompt: review-changes with focus="security"
→ Generates detailed security-focused review of current changes
```

### `suggest-commit-message`

Suggest commit messages based on changes.

**Arguments**:
- `style?: "conventional" | "descriptive" | "concise"` (default: "conventional")

**Usage**:
```
Prompt: suggest-commit-message with style="conventional"
→ Returns 3 conventional commit message suggestions with explanations
```

---

## ⚙️ Configuration

Create `.commitrc.mcp.json` in your project root:

```json
{
  "$schema": "https://ai-commit.dev/schema.json",
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": {
    "enabled": true,
    "rules": ["technical-debt", "security", "test-coverage"],
    "excludePatterns": ["node_modules/**", "dist/**"]
  },
  "output": {
    "dir": "docs/commits",
    "format": "markdown"
  },
  "git": {
    "autoPush": false,
    "requireTests": false
  },
  "integrations": {
    "@ai-commit/plugin-notion": {
      "databaseId": "${NOTION_DATABASE_ID}"
    }
  },
  "mcp": {
    "enableAllTools": true,
    "autoSync": true
  }
}
```

**Environment variables** (`.env`):
```bash
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=your_database_id
LINEAR_API_KEY=lin_xxx
JIRA_TOKEN=jira_xxx
```

---

## 📖 Usage Examples

### Cursor with Auto-Commit

1. Make some code changes
2. In Composer: "커밋해줘" or "commit"
3. Cursor automatically calls `ai_commit_full`
4. Results displayed with analysis and commit info

### Analyze Before Commit

```
You: "변경사항 분석해줘"
AI: [Calls ai_commit_analyze]
    📊 Analysis: 2 technical debt items, 0 security risks

You: "커밋해줘"
AI: [Calls ai_commit_full]
    ✅ Commit created: abc123
```

### Custom Message + Push

```
You: "fix: resolve login bug 로 커밋하고 푸시해줘"
AI: [Calls ai_commit_full({ message: "fix: resolve login bug", push: true })]
    ✅ Commit created and pushed!
```

### Review Changes

```
You: "Use the review-changes prompt with focus on security"
AI: [Uses prompt to generate security-focused review]
    🔍 Security Review:
    - No hardcoded credentials found
    - Input validation looks good
    - Recommendation: Add rate limiting
```

---

## 🎯 Best Practices

### 1. Use `.cursorrules` for Auto-Commit

Copy the `.cursorrules` file from the repo root to enable automatic tool usage in Cursor.

### 2. Start with `ai_commit_full`

It's the most complete workflow. Use specific tools only when needed.

### 3. Configure Per-Project

Use `.commitrc.mcp.json` for project-specific settings.

### 4. Set Up Environment Variables

For multi-project use, set global `NOTION_TOKEN` and per-project `NOTION_DATABASE_ID`.

### 5. Review Analysis Results

Always check the analysis results before pushing sensitive code.

---

## 🐛 Troubleshooting

### "No changes to commit"

**Solution**: Make some changes first, then try again.

### "Notion plugin not configured"

**Solution**:
1. Add `NOTION_TOKEN` and `NOTION_DATABASE_ID` to `.env`
2. Add `"@ai-commit/plugin-notion"` to `plugins` array in config

### MCP Server Not Found

**Solution**: Make sure you're using `npx -y @ai-commit/mcp-server` to automatically install.

### Tool Execution Fails

**Solution**: Check if you're in a Git repository and have write permissions.

---

## 🔗 Related Packages

- [@ai-commit/cli](../cli) - CLI tool for terminal use
- [@ai-commit/plugin-notion](../plugin-notion) - Notion integration
- [@ai-commit/claude-skill](../claude-skill) - Claude Code skill

---

## 📄 License

MIT

---

## 🤝 Contributing

Issues and PRs welcome!

---

**Built with ❤️ using the Model Context Protocol**
