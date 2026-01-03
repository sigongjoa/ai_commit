# @ai-commit/shared

> Shared types and utilities for AI-Commit packages

## Overview

This package contains shared TypeScript types and utility functions used across all AI-Commit packages.

## Types

### Analysis Types

- `AnalysisResult`: Complete analysis result
- `TechnicalDebtItem`: Technical debt detection
- `RiskItem`: Risk assessment
- `TestCoverageInfo`: Test coverage information
- `ArchitectureImpact`: Architecture impact analysis

### Config Types

- `AiCommitConfig`: Main configuration
- `AnalysisConfig`: Analysis configuration
- `OutputConfig`: Output configuration
- `GitConfig`: Git configuration

### Plugin Types

- `AiCommitPlugin`: Plugin interface
- `CommitContext`: Commit context
- `CommitInfo`: Commit information
- `SyncResult`: Plugin sync result

### Git Types

- `GitStatus`: Git repository status
- `GitLog`: Git log entry
- `GitDiff`: Git diff information

## Utilities

### Markdown Utilities

- `escapeMarkdown(text)`: Escape markdown special characters
- `createCodeBlock(code, language)`: Create code block
- `createTable(headers, rows)`: Create markdown table
- `createList(items, ordered)`: Create list
- `createHeading(text, level)`: Create heading

## Usage

```typescript
import {
  AnalysisResult,
  AiCommitPlugin,
  CommitInfo,
  createCodeBlock,
  createTable
} from '@ai-commit/shared';
```

## Development

```bash
# Build
npm run build

# Tests
npm run test
```

## License

MIT
