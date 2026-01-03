# /ai-commit:init - Initialize AI-Commit

> Set up AI-Commit in a new or existing project with configuration files and LLM instructions

## Triggers
- User wants to set up AI-Commit: "초기화해줘", "init", "/ai-commit:init"
- New project setup: "AI-Commit 설정해줘", "setup ai-commit"
- User asks: "How do I configure AI-Commit?"

## Behavior

Initializes AI-Commit for the current project:

1. Check if already initialized (has config files)
2. Create configuration files:
   - `.commitrc.json` (or `.commitrc.skill.json` for Claude Code)
   - `.env.example` (template for environment variables)
   - `.gitignore` entries (add .env to gitignore)
3. Generate LLM instruction files:
   - `.ai-commit/README.md` (instructions for LLM tools)
   - Update `CLAUDE.md` if exists (add AI-Commit section)
4. Set up directory structure:
   - Create `docs/commits/` for analysis reports
5. Show setup completion message with next steps

**Important**: Ask for confirmation if files already exist (--force to overwrite).

## Implementation

```typescript
import { initCommand } from '@ai-commit/cli/dist/commands/init.js';

// Initialize with options
await initCommand({
  force: false,        // Ask before overwriting
  skipClaude: false    // Update CLAUDE.md if exists
});
```

## Output Format

```markdown
🚀 Initializing AI-Commit...

═══════════════════════════════════════════

✅ Created Files:

📄 Configuration:
   ✓ .commitrc.json
   ✓ .env.example
   ✓ .gitignore (updated)

📚 Documentation:
   ✓ .ai-commit/README.md
   ✓ CLAUDE.md (updated)

📁 Directories:
   ✓ docs/commits/ (for analysis reports)

═══════════════════════════════════════════

🎯 Next Steps:

1. Configure Environment Variables
   ```bash
   cp .env.example .env
   # Edit .env and add your tokens:
   NOTION_TOKEN=secret_xxx
   NOTION_DATABASE_ID=your_db_id
   ```

2. Customize Configuration (optional)
   Edit .commitrc.json to adjust:
   • Enabled plugins
   • Analysis rules
   • Output format
   • Git settings

3. Test the Setup
   ```
   /ai-commit:config    # Verify configuration
   /ai-commit:analyze   # Test analysis
   /ai-commit          # Make your first AI commit!
   ```

═══════════════════════════════════════════

✨ AI-Commit is ready to use!

💡 Quick commands:
   • /ai-commit         - Commit with AI analysis
   • /ai-commit:analyze - Analyze changes only
   • /ai-commit:config  - Show configuration
```

## Generated Files

### .commitrc.json

```json
{
  "$schema": "https://ai-commit.dev/schema.json",
  "plugins": [
    "@ai-commit/plugin-notion"
  ],
  "analysis": {
    "enabled": true,
    "rules": [
      "technical-debt",
      "security",
      "test-coverage"
    ],
    "customRules": [],
    "excludePatterns": [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.min.js"
    ]
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
  }
}
```

### .env.example

```bash
# AI-Commit Configuration

# Notion Integration
NOTION_TOKEN=secret_xxx_your_token_here
NOTION_DATABASE_ID=your_database_id_here

# Linear Integration (optional)
LINEAR_API_KEY=lin_xxx_your_api_key_here
LINEAR_TEAM_ID=your_team_id_here

# Jira Integration (optional)
JIRA_TOKEN=your_jira_token_here
JIRA_DOMAIN=yourcompany.atlassian.net

# AI-Commit Settings
AI_COMMIT_AUTO_PUSH=false
AI_COMMIT_ANALYSIS_ENABLED=true
AI_COMMIT_OUTPUT_DIR=docs/commits
```

### .ai-commit/README.md

```markdown
# AI-Commit Instructions for LLM Tools

This project uses AI-Commit for intelligent Git commit automation.

## Available Commands

### Claude Code
- `/ai-commit` - Full commit workflow
- `/ai-commit:analyze` - Analyze changes only
- `/ai-commit:config` - Show configuration
- `/ai-commit:init` - Initialize/reconfigure

### Cursor, Windsurf, Cline (MCP)
Use the ai_commit_* tools:
- `ai_commit_full` - Complete workflow
- `ai_commit_analyze` - Analyze changes
- `ai_commit_commit` - Commit only
- `ai_commit_push` - Push to remote

## Workflow

1. User makes code changes
2. User requests "커밋해줘" or "commit"
3. AI automatically:
   - Analyzes changes
   - Generates commit message
   - Creates commit
   - Syncs to Notion/Linear
   - Shows results

## Configuration

Loaded from (priority order):
1. `.commitrc.json`
2. `package.json` → `commitConfig`
3. Environment variables (`.env`)

## Integration

This project is configured with:
- ✓ Notion sync: ${NOTION_DATABASE_ID}
- ✓ Analysis: Technical debt, security, test coverage
- ✓ Report output: docs/commits/

For more information: https://github.com/yourusername/ai-commit
```

### CLAUDE.md Update

Adds this section to existing `CLAUDE.md`:

```markdown
## AI-Commit Integration

This project uses AI-Commit for automated Git commits with analysis.

### Usage
- `/ai-commit` - Commit with AI analysis
- `/ai-commit:analyze` - Analyze changes without committing
- `/ai-commit:config` - View configuration

### Configuration
See `.commitrc.json` for settings.
Environment variables in `.env` (create from `.env.example`).

### Workflow
When user asks to commit changes, use `/ai-commit` to automatically:
1. Analyze code changes
2. Generate semantic commit message
3. Create Git commit
4. Sync to Notion/Linear (if configured)
```

## Interactive Setup

Ask user about preferences:

```
User: "/ai-commit:init"

Response:
🚀 Let's set up AI-Commit!

I'll ask you a few questions to customize the setup.

1️⃣  Which integrations do you want?
   • Notion (recommended)
   • Linear
   • Jira
   • None (just Git + analysis)

2️⃣  Auto-push after commit?
   • No (recommended - push manually)
   • Yes (automatically push)

3️⃣  Analysis depth?
   • Standard (technical debt, security, tests)
   • Minimal (quick checks only)
   • Deep (comprehensive analysis)

4️⃣  Report output format?
   • Markdown (recommended)
   • JSON
   • Both
```

Then generate customized config based on answers.

## Existing Project Detection

If config already exists:

```
⚠️  AI-Commit Already Initialized

Found existing configuration:
   • .commitrc.json
   • .env

Options:
   1. Keep current config (cancel)
   2. Update/merge config (safe)
   3. Overwrite completely (--force)

What would you like to do?
```

## Multi-Project Setup

Guide for users with multiple projects:

```
💡 Multi-Project Setup

You can use AI-Commit across multiple projects:

Global (shared):
   ~/.bashrc or ~/.zshrc:
   export NOTION_TOKEN=secret_xxx

Per-Project (different databases):
   project-a/.env:
   NOTION_DATABASE_ID=project_a_db

   project-b/.env:
   NOTION_DATABASE_ID=project_b_db

Each project uses:
   • Same token (global)
   • Different database (per-project)
```

## Validation

After initialization, validate setup:

```
✅ Validating Setup...

Checking:
   ✓ Configuration file is valid
   ✓ Output directory exists
   ✓ Git repository detected
   ⚠️  Environment variables not set (.env missing)

Warnings:
   • Create .env file from .env.example
   • Add your NOTION_TOKEN and NOTION_DATABASE_ID

Ready to use? Try:
   /ai-commit:analyze
```

## Update Existing Setup

If user wants to update:

```
User: "Notion 플러그인 추가해줘"

Response:
I'll add Notion plugin to your configuration.

Updating .commitrc.json:
   • Added @ai-commit/plugin-notion to plugins
   • Added integrations.notion section

Don't forget to set environment variables:
   NOTION_TOKEN=your_token
   NOTION_DATABASE_ID=your_db_id

Updated! Test with: /ai-commit:config
```

## Error Handling

### Not a Git Repository
```
❌ Not a Git Repository

This directory doesn't have Git initialized.

Initialize Git first:
   git init
   git remote add origin <url>

Then run /ai-commit:init again.
```

### Permission Issues
```
❌ Permission Denied

Cannot write to directory.

Fix:
   sudo chown -R $USER:$USER .
   # Or run from a directory you own
```

## Best Practices

1. **Guide users** - Explain each step clearly
2. **Validate input** - Check if Git exists, directory is writable
3. **Preserve existing** - Don't overwrite without confirmation
4. **Provide examples** - Show example .env values
5. **Test setup** - Validate configuration after creation

## Examples

### Example 1: First Time Setup
```
User: "/ai-commit:init"
→ Create all files
→ Show next steps
```

### Example 2: Add Plugin
```
User: "Linear 플러그인 추가해줘"
→ Update .commitrc.json
→ Show .env variables needed
```

### Example 3: Reconfigure
```
User: "/ai-commit:init --force"
→ Overwrite existing config
→ Regenerate all files
```

---

**Note**: This skill sets up files but doesn't install npm packages. The actual packages should be installed separately.
