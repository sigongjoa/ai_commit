# AI-Commit

> **AI-powered Git commit automation for everyone, everywhere**
>
> Use in your terminal, Cursor, Windsurf, Cline, Claude Code, and any AI coding tool!

[![npm version](https://img.shields.io/npm/v/@ai-commit/cli.svg)](https://www.npmjs.com/package/@ai-commit/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 One Tool, Three Interfaces

AI-Commit provides **three ways to use the same powerful features**:

```
1️⃣  Terminal (CLI)      → ai-commit
2️⃣  AI Coding Tools (MCP) → Cursor, Windsurf, Cline, etc.
3️⃣  Claude Code (Skill)  → /ai-commit
```

**All share the same core**: analyze changes, generate commits, sync to Notion/Linear, and more!

---

## ✨ Key Features

- 🤖 **AI-Powered Analysis**: Technical debt detection, security risks, test coverage
- 🔌 **Plugin Architecture**: Extensible integration with Notion, Linear, Jira, Asana
- 🎨 **3 Interfaces**: CLI + MCP + Claude Skill for maximum compatibility
- 📊 **Rich Reports**: Detailed markdown analysis reports
- ⚡ **Auto-Commit**: "딱깍" one-click automation in Cursor and other tools
- 🌐 **Universal**: Works with **any** Git repository, **any** language

## 🚀 Quick Start

Choose your interface:

### Option 1: Terminal (CLI) 💻

```bash
# Install globally
npm install -g @ai-commit/cli

# Use in any Git repository
cd your-project
ai-commit "feat: add new feature"
```

### Option 2: Cursor/Windsurf/Cline (MCP) 🤖

```jsonc
// Add to your tool's MCP config
{
  "mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["-y", "@ai-commit/mcp-server"]
    }
  }
}
```

Then in Cursor Composer:
```
You: "커밋해줘"
AI: [Automatically analyzes and commits with AI-Commit]
```

**[→ Detailed Cursor Setup Guide](CURSOR_SETUP_GUIDE.md)**

### Option 3: Claude Code (Skill) ⚡

```bash
# Install skills
cp -r packages/claude-skill/skills/* ~/.claude/skills/ai-commit/
```

Then in Claude Code:
```
/ai-commit                # Auto-commit
/ai-commit:analyze        # Analyze only
/ai-commit:config         # Show config
```

**[→ Skill Documentation](packages/claude-skill/README.md)**

---

## 🎨 What Happens When You Commit?

All three interfaces provide the same workflow:

1. ✅ **Stage Changes** - Automatically stages all modified files
2. 🤖 **Analyze Code** - Detects technical debt, security risks, test coverage
3. 📝 **Generate Message** - Creates semantic commit message (or use yours)
4. 💾 **Create Commit** - Makes Git commit with analysis
5. 🔄 **Sync Integrations** - Sends to Notion/Linear/Jira (if configured)
6. 📤 **Push** (optional) - Pushes to remote repository

**Output Example**:
```
✅ Commit Complete!

📊 Analysis:
   • Technical Debt: 2 items (TODO comments)
   • Security: 0 issues
   • Test Coverage: Good

📝 Commit: abc1234
   Message: feat: add user authentication

🔗 Notion: Synced to database
```

## Installation

### Basic Usage (No Integrations)

```bash
npm install -g @ai-commit/cli
```

### With Plugins

```bash
# Install CLI
npm install -g @ai-commit/cli

# Install plugins locally in your project
npm install --save-dev @ai-commit/plugin-notion
npm install --save-dev @ai-commit/plugin-linear
```

## Configuration

### package.json

```json
{
  "commitConfig": {
    "plugins": ["@ai-commit/plugin-notion", "@ai-commit/plugin-linear"],
    "analysis": {
      "enabled": true
    },
    "output": {
      "dir": "docs/commits"
    },
    "git": {
      "autoPush": true
    }
  }
}
```

### .commitrc.json

```json
{
  "$schema": "https://ai-commit.dev/schema.json",
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": {
    "enabled": true
  },
  "integrations": {
    "notion": {
      "databaseId": "${NOTION_DATABASE_ID}"
    }
  }
}
```

### Environment Variables (.env)

```bash
# Integration tokens
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=xxx
LINEAR_API_KEY=lin_api_xxx
JIRA_TOKEN=xxx
JIRA_DOMAIN=yourcompany.atlassian.net

# AI-Commit settings
AI_COMMIT_AUTO_PUSH=true
AI_COMMIT_ANALYSIS_ENABLED=true
```

## Usage

### Basic Commit

```bash
ai-commit "feat: add user authentication"
```

### Skip Analysis

```bash
ai-commit "docs: update README" --no-analysis
```

### Skip Push

```bash
ai-commit "fix: resolve bug" --no-push
```

### Dry Run

```bash
ai-commit "test" --dry-run
```

### Analyze Only (No Commit)

```bash
ai-commit --analyze-only
```

## 📦 Packages

This monorepo contains the following packages:

### Core Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@ai-commit/cli](packages/cli) | Terminal CLI tool | ✅ Complete |
| [@ai-commit/mcp-server](packages/mcp-server) | MCP server for AI tools | ✅ Complete |
| [@ai-commit/claude-skill](packages/claude-skill) | Claude Code skills | ✅ Complete |
| [@ai-commit/shared](packages/shared) | Shared types and utilities | ✅ Complete |

### Plugins

| Package | Description | Status |
|---------|-------------|--------|
| [@ai-commit/plugin-notion](packages/plugin-notion) | Notion integration | ✅ Complete |
| [@ai-commit/plugin-linear](packages/plugin-linear) | Linear integration | ⏳ Planned (v1.1) |
| [@ai-commit/plugin-jira](packages/plugin-jira) | Jira integration | ⏳ Planned (v1.1) |
| [@ai-commit/plugin-asana](packages/plugin-asana) | Asana integration | ⏳ Planned (v1.1) |

### Documentation

| Document | Description |
|----------|-------------|
| [CURSOR_SETUP_GUIDE.md](CURSOR_SETUP_GUIDE.md) | Cursor "딱깍" automation setup |
| [EXPANSION_PLAN.md](EXPANSION_PLAN.md) | 3-layer architecture plan |
| [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) | Manual testing instructions |
| [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md) | Technical spec |
| [ARCHITECTURE_DESIGN.md](ARCHITECTURE_DESIGN.md) | Architecture design |
| [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) | Implementation roadmap |

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup

```bash
# Clone repository
git clone git@github.com:sigongjoa/ai_commit.git
cd ai-commit

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test
```

### Local Development

```bash
# Link CLI for testing
cd packages/cli
npm link

# Test in another project
cd /path/to/test-project
npm link @ai-commit/cli
ai-commit "test"
```

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E only
npm run test:e2e
```

## Plugin Development

See [PLUGIN_DEVELOPMENT_GUIDE.md](docs/PLUGIN_DEVELOPMENT_GUIDE.md) for details on creating custom plugins.

### Example Plugin

```typescript
import { AiCommitPlugin, CommitInfo } from '@ai-commit/shared';

export default class MyPlugin implements AiCommitPlugin {
  name = '@ai-commit/plugin-my-plugin';
  version = '1.0.0';

  async init(config: any) {
    // Initialize plugin
  }

  async afterCommit(commit: CommitInfo): Promise<void> {
    // Handle commit event
    console.log('Commit created:', commit.sha);
  }
}
```

## Documentation

- [Technical Specification](TECHNICAL_SPECIFICATION.md)
- [Architecture Design](ARCHITECTURE_DESIGN.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [User Guide](docs/USER_GUIDE.md) (Coming soon)
- [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT_GUIDE.md) (Coming soon)

## 📊 Current Status

### ✅ Phase 1-4: Complete!

**Phase 1: Foundation** ✅
- ✅ Monorepo setup with Lerna + npm workspaces
- ✅ CLI package with Commander.js
- ✅ Git operations (GitClient class)
- ✅ Shared types package (TypeScript)

**Phase 2: Core Features** ✅
- ✅ Analysis engine (pattern-based detection)
- ✅ Report generator (Handlebars templates)
- ✅ Config loader (multi-source priority: package.json > .commitrc.json > env vars)
- ✅ Plugin manager (lifecycle hooks)
- ✅ Full commit workflow integration

**Phase 3: Plugin System** ✅
- ✅ Notion plugin (markdown→blocks conversion, API integration)
- ✅ Plugin architecture (beforeAnalysis, afterCommit, etc.)
- ✅ Sync to external integrations

**Phase 4: LLM Integration** ✅
- ✅ LLM instruction templates
- ✅ Init command (generates config files)
- ✅ CLAUDE.md auto-update

**Phase 5: MCP Server** ✅ (NEW!)
- ✅ 7 MCP tools (analyze, commit, push, full, sync-notion, config-get/set)
- ✅ 2 resources (commit history, analysis reports)
- ✅ 2 prompts (review-changes, suggest-message)
- ✅ Works with Cursor, Windsurf, Cline, Claude Desktop
- ✅ **Cursor Rules for "딱깍" auto-commit**

**Phase 6: Claude Skill** ✅ (NEW!)
- ✅ 4 skills (/ai-commit, :analyze, :config, :init)
- ✅ Auto-execute (no confirmation needed)
- ✅ Rich formatted output
- ✅ Multi-language triggers (Korean/English)

**Phase 7: Config Command** ✅
- ✅ Show configuration from all sources
- ✅ Validate settings
- ✅ JSON output mode
- ✅ Sensitive data redaction

---

## 🗺️ Roadmap

### v1.0.0 (✅ Complete - Ready to Build!)

**Completed**:
- ✅ CLI tool (full features)
- ✅ MCP server (Cursor, Windsurf, Cline support)
- ✅ Claude Code skills
- ✅ Notion plugin
- ✅ Configuration system
- ✅ "딱깍" auto-commit in Cursor

**Remaining for Release**:
- ⏳ TypeScript build (needs non-WSL environment)
- ⏳ npm publish
- ⏳ Live documentation site

### v1.1.0 (Future)

- Additional plugins (Linear, Jira, Asana)
- VS Code Extension
- Windsurf/Cline setup guides
- Plugin marketplace

### v2.0.0 (Future)

- Native LLM integration (OpenAI/Claude API)
- Natural language custom rules
- Team analytics dashboard
- Webhook system
- Multi-repo support

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © Claude Sonnet 4.5

## Support

- GitHub Issues: https://github.com/sigongjoa/ai_commit/issues
- Documentation: https://ai-commit.dev/docs (Coming soon)

---

**Generated with** [Claude Code](https://claude.com/claude-code)
