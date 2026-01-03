# @ai-commit/cli

> AI-powered Git commit automation CLI tool

## Installation

```bash
npm install -g @ai-commit/cli
```

## Usage

### Basic Commit

```bash
ai-commit "feat: add new feature"
```

### Options

- `--no-analysis`: Skip AI analysis
- `--no-push`: Skip git push
- `--analyze-only`: Only analyze without committing
- `--dry-run`: Show what would happen without making changes
- `-v, --verbose`: Verbose output

### Examples

```bash
# Standard commit with analysis and push
ai-commit "fix: resolve login bug"

# Commit without pushing
ai-commit "docs: update README" --no-push

# Analyze only (no commit)
ai-commit --analyze-only

# Dry run (preview what would happen)
ai-commit "test" --dry-run
```

## Commands

### init

Initialize AI-Commit in your project

```bash
ai-commit init
```

### config

Show current configuration

```bash
ai-commit config
```

## Development

```bash
# Build
npm run build

# Development mode
npm run dev

# Tests
npm run test

# Watch mode
npm run test:watch
```

## License

MIT
