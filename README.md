# AI-Commit

> **AI-powered Git commit automation tool with LLM integration and plugin architecture**

[![npm version](https://img.shields.io/npm/v/@ai-commit/cli.svg)](https://www.npmjs.com/package/@ai-commit/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

AI-Commit is a SuperClaude-style commit automation tool that brings AI-powered analysis and multi-platform integration to your Git workflow. It works seamlessly with Cursor, Antigravity, Claude Code, and terminal environments.

### Key Features

- 🤖 **AI-Powered Analysis**: Technical debt detection, risk assessment, test coverage analysis
- 🔌 **Plugin Architecture**: Extensible integration with Notion, Linear, Jira, Asana
- 🌐 **LLM-Friendly**: Natural integration with AI coding assistants
- 📦 **npm Package**: Global installation with `npm install -g @ai-commit/cli`
- ⚡ **Zero-Config**: Sensible defaults, works out of the box
- 🎯 **Language-Agnostic**: Analyzes Git diffs, not source code

## Quick Start

```bash
# Install globally
npm install -g @ai-commit/cli

# Use in any project
cd your-project
ai-commit "feat: add new feature"
```

### With LLM Tools (Cursor, Claude Code, etc.)

```bash
# In your LLM coding assistant
/ai-commit "your commit message"
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

## Packages

This monorepo contains the following packages:

| Package | Description | Version |
|---------|-------------|---------|
| [@ai-commit/cli](packages/cli) | Main CLI tool | - |
| [@ai-commit/shared](packages/shared) | Shared types and utilities | - |
| [@ai-commit/plugin-notion](packages/plugin-notion) | Notion integration | - |
| [@ai-commit/plugin-linear](packages/plugin-linear) | Linear integration | - |
| [@ai-commit/plugin-jira](packages/plugin-jira) | Jira integration | - |
| [@ai-commit/plugin-asana](packages/plugin-asana) | Asana integration | - |

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

## Roadmap

### v1.0.0 (MVP)

- ✅ Core CLI with AI analysis
- ✅ Plugin system architecture
- ✅ Notion plugin
- ✅ Configuration system
- ✅ LLM instruction generation

### v1.1.0

- Linear plugin
- Jira plugin
- Asana plugin
- VS Code Extension

### v2.0.0

- LLM API integration (OpenAI/Claude)
- Custom analysis rules with natural language
- Team analytics dashboard
- Webhook integrations

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © Claude Sonnet 4.5

## Support

- GitHub Issues: https://github.com/sigongjoa/ai_commit/issues
- Documentation: https://ai-commit.dev/docs (Coming soon)

---

**Generated with** [Claude Code](https://claude.com/claude-code)
