# AI-Commit Technical Specification

**Version**: 1.0.0
**Last Updated**: 2026-01-03
**Status**: Draft - Requirements Discovery Complete

---

## 📋 Executive Summary

**AI-Commit** is a SuperClaude-style, LLM-friendly Git commit automation tool with AI-powered analysis and multi-platform integration.

### Key Features

- 🤖 **AI-Powered Analysis**: Technical debt, risk assessment, test coverage
- 🔌 **Plugin Architecture**: Notion, Linear, Jira, Asana integrations
- 🌐 **LLM-Friendly**: Works with Cursor, Antigravity, Claude Code
- 📦 **npm Package**: `npm install -g @ai-commit/cli`
- ⚡ **Zero-Config**: Works out of the box with sensible defaults
- 🎯 **Language-Agnostic**: Analyzes Git diffs, not source code

### Usage

```bash
# One-time install
npm install -g @ai-commit/cli

# Use in any LLM coding tool
/ai-commit "feat: add user authentication"

# Or directly in terminal
ai-commit "fix: resolve login bug"
```

---

## 🏗️ Architecture Overview

### Package Structure

```
@ai-commit/
├── cli/                    # Main CLI package (@ai-commit/cli)
│   ├── src/
│   │   ├── core/
│   │   │   ├── analyzer.ts      # AI analysis engine
│   │   │   ├── git.ts           # Git operations
│   │   │   ├── config.ts        # Configuration loader
│   │   │   └── plugin-manager.ts # Plugin orchestration
│   │   ├── commands/
│   │   │   └── commit.ts        # Main commit command
│   │   ├── templates/
│   │   │   └── README.md        # LLM instruction template
│   │   └── index.ts
│   └── package.json
│
├── plugin-notion/          # @ai-commit/plugin-notion
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   └── types.ts
│   └── package.json
│
├── plugin-linear/          # @ai-commit/plugin-linear
├── plugin-jira/            # @ai-commit/plugin-jira
├── plugin-asana/           # @ai-commit/plugin-asana
│
└── shared/                 # @ai-commit/shared (types, utils)
    ├── src/
    │   ├── types/
    │   │   ├── analysis.ts
    │   │   ├── config.ts
    │   │   └── plugin.ts
    │   └── utils/
    └── package.json
```

---

## 📄 Configuration System

### Priority Order

1. **package.json** > `commitConfig` (Node.js projects)
2. **.commitrc.json** (Fallback for non-Node.js projects)
3. **~/.commitrc** (Global user config)
4. **Environment Variables** (CI/CD override)
5. **Built-in Defaults**

### Example: package.json

```json
{
  "name": "my-project",
  "commitConfig": {
    "plugins": [
      "@ai-commit/plugin-notion",
      "@ai-commit/plugin-linear"
    ],
    "analysis": {
      "enabled": true,
      "customRules": [
        {
          "pattern": "SECURITY:",
          "severity": "HIGH",
          "type": "Security Issue"
        }
      ]
    },
    "output": {
      "dir": "docs/commits",
      "format": "markdown"
    },
    "git": {
      "autoPush": true,
      "requireTests": false
    }
  }
}
```

### Example: .commitrc.json

```json
{
  "$schema": "https://ai-commit.dev/schema.json",
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": {
    "enabled": true,
    "rules": ["technical-debt", "risks", "test-coverage"]
  },
  "integrations": {
    "notion": {
      "databaseId": "${NOTION_DATABASE_ID}",
      "enabled": true
    }
  }
}
```

### Environment Variables (.env)

```bash
# Integration tokens (NEVER commit these!)
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=xxx
LINEAR_API_KEY=lin_api_xxx
JIRA_TOKEN=xxx
JIRA_DOMAIN=yourcompany.atlassian.net

# AI-Commit settings
AI_COMMIT_AUTO_PUSH=true
AI_COMMIT_ANALYSIS_ENABLED=true
```

---

## 🔌 Plugin API

### Plugin Interface

```typescript
// @ai-commit/shared/types/plugin.ts

export interface AiCommitPlugin {
  name: string;
  version: string;

  // Lifecycle hooks
  init?(config: PluginConfig): Promise<void>;
  beforeAnalysis?(context: CommitContext): Promise<void>;
  afterAnalysis?(analysis: AnalysisResult): Promise<void>;
  beforeCommit?(context: CommitContext): Promise<void>;
  afterCommit?(commit: CommitInfo): Promise<void>;

  // Integration methods
  sync?(data: CommitData): Promise<SyncResult>;
}

export interface CommitContext {
  files: string[];
  diff: string;
  branch: string;
  message: string;
}

export interface AnalysisResult {
  technicalDebt: TechnicalDebtItem[];
  risks: RiskItem[];
  testCoverage: TestCoverageInfo;
  architectureImpact: ArchitectureImpact;
}

export interface CommitInfo {
  sha: string;
  message: string;
  timestamp: Date;
  analysisFile: string;
}
```

### Example Plugin: Notion

```typescript
// @ai-commit/plugin-notion/src/index.ts

import { AiCommitPlugin, CommitData } from '@ai-commit/shared';
import { Client } from '@notionhq/client';

export default class NotionPlugin implements AiCommitPlugin {
  name = '@ai-commit/plugin-notion';
  version = '1.0.0';

  private client: Client;

  async init(config: any) {
    this.client = new Client({
      auth: process.env.NOTION_TOKEN || config.token
    });
  }

  async afterCommit(commit: CommitInfo): Promise<void> {
    // Read analysis MD file
    const analysisContent = await fs.readFile(commit.analysisFile, 'utf-8');

    // Create Notion page
    await this.client.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        'Commit': { title: [{ text: { content: commit.message } }] },
        'SHA': { rich_text: [{ text: { content: commit.sha } }] },
        'Date': { date: { start: commit.timestamp.toISOString() } }
      },
      children: this.markdownToNotionBlocks(analysisContent)
    });
  }

  private markdownToNotionBlocks(md: string): any[] {
    // Convert Markdown to Notion blocks
    // ...implementation...
  }
}
```

---

## 🤖 AI Analysis Engine

### Analysis Rules (Extensible)

```typescript
// @ai-commit/cli/src/core/analyzer.ts

export interface AnalysisRule {
  name: string;
  pattern: RegExp;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'technical-debt' | 'security' | 'performance' | 'testing';
  description: (match: string) => string;
}

export const DEFAULT_RULES: AnalysisRule[] = [
  {
    name: 'TODO Comment',
    pattern: /[+]\s*(?:#|\/\/|\/\*)\s*TODO[:\s]*(.*)/,
    severity: 'LOW',
    category: 'technical-debt',
    description: (match) => `TODO comment added: ${match}`
  },
  {
    name: 'FIXME Comment',
    pattern: /[+]\s*(?:#|\/\/|\/\*)\s*FIXME[:\s]*(.*)/,
    severity: 'MEDIUM',
    category: 'technical-debt',
    description: (match) => `FIXME comment added: ${match}`
  },
  {
    name: 'Console Log',
    pattern: /[+].*console\.log\((.*?)\)/,
    severity: 'LOW',
    category: 'technical-debt',
    description: (match) => `Debug log left in code: ${match}`
  },
  {
    name: 'Security Keyword',
    pattern: /[+].*(password|secret|api[_-]?key|token|credential)/i,
    severity: 'HIGH',
    category: 'security',
    description: () => 'Potential security-sensitive code change'
  }
];
```

### Custom Rules Configuration

```json
{
  "analysis": {
    "customRules": [
      {
        "name": "SECURITY Comment",
        "pattern": "SECURITY:",
        "severity": "HIGH",
        "category": "security",
        "description": "Security concern flagged by developer"
      },
      {
        "name": "Performance TODO",
        "pattern": "PERF:",
        "severity": "MEDIUM",
        "category": "performance"
      }
    ]
  }
}
```

---

## 🎨 LLM Integration (SuperClaude Style)

### Instruction Injection Pattern

When `ai-commit` is initialized in a project, it creates `.ai-commit/README.md`:

```markdown
# AI-Commit - LLM Usage Instructions

**IMPORTANT**: This file provides behavioral instructions for AI coding assistants.

## Quick Usage

When the user types `/ai-commit "message"`, execute:

\`\`\`bash
ai-commit "message"
\`\`\`

This will automatically:
1. Stage all changes (git add .)
2. Run AI analysis
3. Generate commit documentation
4. Create commit with analysis
5. Sync to configured integrations (Notion, Linear, Jira)
6. Push to remote (if autoPush enabled)

## Configuration

This project uses the following AI-Commit configuration:

- **Plugins**: {{ PLUGINS_LIST }}
- **Analysis**: {{ ANALYSIS_ENABLED }}
- **Auto-push**: {{ AUTO_PUSH }}

## Available Commands

\`\`\`bash
# Standard commit
ai-commit "feat: add feature"

# Skip analysis
ai-commit "docs: update README" --no-analysis

# Skip push
ai-commit "fix: bug" --no-push

# View analysis without committing
ai-commit --analyze-only
\`\`\`

## For Cursor/Antigravity Users

You can use the slash command syntax:

\`\`\`
/ai-commit "your message"
\`\`\`

The AI assistant will automatically execute the CLI command.

---

**Generated by**: @ai-commit/cli v{{ VERSION }}
**Last Updated**: {{ DATE }}
\`\`\`
```

### CLAUDE.md Integration Example

```markdown
# CLAUDE.md

## AI-Commit Integration

This project uses **AI-Commit** for automated commit analysis and integration syncing.

### Usage

\`\`\`bash
# Instead of:
git add . && git commit -m "message" && git push

# Use:
/ai-commit "message"
\`\`\`

### What It Does

1. ✅ Stages all changes
2. 🤖 Analyzes technical debt, risks, test coverage
3. 📄 Generates markdown report in \`docs/commits/\`
4. 💾 Creates commit with analysis attached
5. 🔄 Syncs to Notion (database: {{ NOTION_DB_ID }})
6. 📤 Pushes to GitHub

### Configuration

See \`.ai-commit/README.md\` for full configuration options.

**CRITICAL**: Always use \`/ai-commit\` for commits to maintain analysis history.
\`\`\`
```

---

## 🚀 Execution Flow

### High-Level Flow

```
User: /ai-commit "feat: add auth"
  │
  ├─> LLM (Cursor/Antigravity/Claude Code)
  │     └─> Executes: ai-commit "feat: add auth"
  │
  ├─> AI-Commit CLI
  │     ├─> Load config (package.json → .commitrc.json → ~/.commitrc)
  │     ├─> Load plugins
  │     │     ├─> @ai-commit/plugin-notion
  │     │     └─> @ai-commit/plugin-linear
  │     │
  │     ├─> Plugin.beforeAnalysis()
  │     │
  │     ├─> Git Operations
  │     │     ├─> git add .
  │     │     ├─> git diff --cached
  │     │     └─> Get changed files
  │     │
  │     ├─> AI Analysis Engine
  │     │     ├─> Technical debt detection
  │     │     ├─> Risk assessment
  │     │     ├─> Test coverage check
  │     │     └─> Architecture impact
  │     │
  │     ├─> Plugin.afterAnalysis(analysis)
  │     │
  │     ├─> Generate Markdown Report
  │     │     └─> Save to docs/commits/YYYYMMDD_HHMMSS.md
  │     │
  │     ├─> Plugin.beforeCommit()
  │     │
  │     ├─> Git Commit
  │     │     ├─> Add analysis file
  │     │     └─> git commit -m "..."
  │     │
  │     ├─> Plugin.afterCommit(commitInfo)
  │     │     ├─> Notion.sync()
  │     │     └─> Linear.createIssue() (if HIGH risks)
  │     │
  │     └─> Git Push (if autoPush enabled)
  │
  └─> Output Summary
        ├─> Commit SHA: abc1234
        ├─> Analysis: docs/commits/20260103_153045.md
        ├─> Notion: ✅ Synced
        └─> Linear: ✅ Issue created (LIN-123)
```

---

## 📦 Package Distribution

### NPM Packages

| Package | Description | Scope |
|---------|-------------|-------|
| `@ai-commit/cli` | Main CLI tool | Public |
| `@ai-commit/shared` | Shared types and utils | Public |
| `@ai-commit/plugin-notion` | Notion integration | Public |
| `@ai-commit/plugin-linear` | Linear integration | Public |
| `@ai-commit/plugin-jira` | Jira integration | Public |
| `@ai-commit/plugin-asana` | Asana integration | Public |

### Installation Scenarios

**Scenario 1: Basic Usage (No Integrations)**

```bash
npm install -g @ai-commit/cli
ai-commit "feat: my change"
# → Local analysis only, no syncing
```

**Scenario 2: With Notion**

```bash
npm install -g @ai-commit/cli
npm install --save-dev @ai-commit/plugin-notion

# package.json
{
  "commitConfig": {
    "plugins": ["@ai-commit/plugin-notion"]
  }
}

# .env
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=xxx
```

**Scenario 3: Multi-Integration**

```bash
npm install -g @ai-commit/cli
npm install --save-dev \
  @ai-commit/plugin-notion \
  @ai-commit/plugin-linear \
  @ai-commit/plugin-jira
```

---

## 🔄 Migration Path for MATHESIS LAB

### Phase 1: Extract Core Logic

1. Extract `analyze-commit.py` → TypeScript `@ai-commit/cli/src/core/analyzer.ts`
2. Extract `commit.sh` → TypeScript `@ai-commit/cli/src/commands/commit.ts`
3. Extract Notion sync → `@ai-commit/plugin-notion`

### Phase 2: Create Plugin

```typescript
// @ai-commit/plugin-notion/src/index.ts
// Port scripts/notion-sync.sh logic here
```

### Phase 3: Update MATHESIS LAB

```bash
# Install globally
npm install -g @ai-commit/cli

# Install plugin locally
npm install --save-dev @ai-commit/plugin-notion

# Update package.json
{
  "commitConfig": {
    "plugins": ["@ai-commit/plugin-notion"],
    "output": {
      "dir": "docs/commits"
    }
  }
}

# Update .env (no changes needed)
NOTION_TOKEN=...
NOTION_DATABASE_ID=...

# Update CLAUDE.md
Replace ./scripts/commit.sh with /ai-commit
```

### Phase 4: Deprecate Old Scripts

```bash
# Mark as deprecated
scripts/commit.sh → Add deprecation notice
scripts/analyze-commit.py → Add deprecation notice
scripts/notion-sync.sh → Remove (replaced by plugin)
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// @ai-commit/cli/tests/analyzer.test.ts
describe('Analyzer', () => {
  it('detects TODO comments', () => {
    const diff = '+// TODO: fix this';
    const result = analyze(diff);
    expect(result.technicalDebt).toContainEqual({
      type: 'TODO',
      severity: 'LOW'
    });
  });
});
```

### Integration Tests

```bash
# Test full commit flow
ai-commit "test: integration test" --dry-run
# → Should show what would happen without actually committing
```

### E2E Tests

```bash
# Test with real Git repo
cd test-repo
git init
echo "test" > file.txt
git add .
ai-commit "feat: test" --no-push
# → Verify commit created with analysis
```

---

## 📊 Success Metrics

### KPIs

1. **Installation**: 1000+ npm downloads in first 3 months
2. **Compatibility**: Works in Cursor, Antigravity, Claude Code
3. **Plugins**: 4+ official plugins (Notion, Linear, Jira, Asana)
4. **Performance**: < 5 seconds for typical commit flow
5. **Zero-Config**: 80%+ users use default config

### User Feedback

- [ ] Works seamlessly in Cursor
- [ ] Works seamlessly in Antigravity
- [ ] Works seamlessly in Claude Code
- [ ] Plugins install without issues
- [ ] Documentation clear for LLM tools

---

## 🛣️ Roadmap

### v1.0.0 (MVP)

- ✅ Core CLI with AI analysis
- ✅ Plugin system architecture
- ✅ Notion plugin
- ✅ package.json / .commitrc.json config
- ✅ LLM instruction generation

### v1.1.0

- Linear plugin
- Jira plugin
- Asana plugin
- VS Code Extension (Cursor support)

### v2.0.0

- LLM API integration (OpenAI/Claude for smarter analysis)
- Custom analysis rules with natural language
- Team analytics dashboard
- Webhook integrations

---

## 🔐 Security Considerations

### Token Storage

- **NEVER commit**: `.env` files with real tokens
- **Recommended**: System keychain for production
- **CI/CD**: Environment variables

### Sensitive Data Filtering

```typescript
// Exclude from analysis
const SENSITIVE_PATTERNS = [
  /\.env$/,
  /\.env\./,
  /credentials\.json/,
  /\.key$/,
  /\.pem$/,
  /secret/i
];
```

---

## 📚 References

- [SuperClaude Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Notion API](https://developers.notion.com/)
- [Linear API](https://developers.linear.app/)

---

**Document Owner**: Claude Sonnet 4.5
**Review Status**: Ready for Implementation Planning
**Next Step**: Architecture Design Document
