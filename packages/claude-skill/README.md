# @ai-commit/claude-skill

> Claude Code skills for AI-Commit
>
> Use AI-Commit directly in Claude Code with slash commands!

## ✨ Features

- 🎯 **4 Powerful Skills** - Complete workflow automation in Claude Code
- 🚀 **Auto-Execute** - Skills run immediately without confirmation
- 📊 **Rich Output** - Beautiful formatted analysis results
- 🔧 **Easy Setup** - Simple installation and configuration

---

## 📦 Installation

### Option 1: Manual Installation (Recommended)

Copy skill files to your Claude Code skills directory:

```bash
# Clone or download this repository
cd packages/claude-skill

# Copy to Claude Code skills directory
cp -r skills/* ~/.claude/skills/ai-commit/

# Or create symbolic link
ln -s $(pwd)/skills ~/.claude/skills/ai-commit
```

### Option 2: NPM Installation (Future)

```bash
npm install -g @ai-commit/claude-skill
```

---

## 🎯 Available Skills

### 1. `/ai-commit` (Main Skill)

**Triggers**: `/ai-commit`, `/ai-commit:commit`, "커밋해줘", "commit"

Complete AI-Commit workflow:
1. Stage all changes
2. Analyze code (technical debt, security, test coverage)
3. Generate commit message (or use provided)
4. Create Git commit
5. Sync to Notion/Linear (if configured)
6. Show comprehensive results

**Usage**:
```
/ai-commit
/ai-commit feat: add user authentication
/ai-commit --push
```

**Output**:
```
✅ AI-Commit Complete

📊 Analysis Results:
   • Technical Debt: 0 items
   • Security Risks: 0 issues
   • Test Coverage: Good

📝 Commit:
   SHA: abc1234
   Message: feat: add login functionality

🔗 Notion: Synced to database
```

### 2. `/ai-commit:analyze`

**Triggers**: `/ai-commit:analyze`, "분석해줘", "analyze"

Analyze changes without committing.

**Usage**:
```
/ai-commit:analyze
```

**Output**:
```
📊 Analysis Results

🔴 Technical Debt (2 items):
   • TODO: Implement rate limiting
   • Console.log statement detected

✅ Security: No issues
✅ Tests: Adequate coverage
```

### 3. `/ai-commit:config`

**Triggers**: `/ai-commit:config`, "설정 보여줘", "config"

Show current configuration.

**Usage**:
```
/ai-commit:config
/ai-commit:config --json
```

**Output**:
```
═══════════════════════════════════════════
          AI-Commit Configuration
═══════════════════════════════════════════

🔌 Plugins: @ai-commit/plugin-notion
🤖 Analysis: Enabled
📄 Output: docs/commits
🔗 Notion: Connected (***REDACTED***)
```

### 4. `/ai-commit:init`

**Triggers**: `/ai-commit:init`, "초기화해줘", "setup"

Initialize AI-Commit in current project.

**Usage**:
```
/ai-commit:init
/ai-commit:init --force
```

**Output**:
```
🚀 Initializing AI-Commit...

✅ Created:
   • .commitrc.json
   • .env.example
   • docs/commits/

🎯 Next Steps:
   1. Create .env from .env.example
   2. Add your NOTION_TOKEN
   3. Run /ai-commit:config to verify
```

---

## 🔧 Setup

### Step 1: Project Configuration

Create `.commitrc.json` in your project root (or use `/ai-commit:init`):

```json
{
  "$schema": "https://ai-commit.dev/schema.json",
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": {
    "enabled": true,
    "rules": ["technical-debt", "security", "test-coverage"]
  },
  "git": {
    "autoPush": false
  },
  "integrations": {
    "@ai-commit/plugin-notion": {
      "databaseId": "${NOTION_DATABASE_ID}"
    }
  }
}
```

### Step 2: Environment Variables

Create `.env` file:

```bash
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=your_database_id

# Optional
LINEAR_API_KEY=lin_xxx
JIRA_TOKEN=jira_xxx
```

### Step 3: Test

```
/ai-commit:config    # Verify setup
/ai-commit:analyze   # Test analysis
/ai-commit          # Make first commit!
```

---

## 📖 Usage Examples

### Basic Commit

```
You: /ai-commit
Claude: [Executes full workflow]
        ✅ Commit created: a1b2c3d
        Message: feat: update user profile
```

### Custom Message

```
You: /ai-commit fix: resolve login timeout
Claude: [Commits with provided message]
        ✅ Commit created: x9y8z7w
```

### Analyze First

```
You: /ai-commit:analyze
Claude: [Shows analysis]
        📊 2 technical debt items found

You: /ai-commit
Claude: [Creates commit]
        ✅ Committed with analysis
```

### Check Configuration

```
You: /ai-commit:config
Claude: [Shows config]
        ✓ Notion: Connected
        ✓ Analysis: Enabled
```

---

## 🎨 Skill Behavior

### Auto-Execute

Skills execute **immediately** without asking for confirmation:

```
✅ Good:
You: "커밋해줘"
Claude: [Executes ai-commit]

❌ Bad:
You: "커밋해줘"
Claude: "Should I commit? (y/n)"  ← Don't do this!
```

### Comprehensive Output

Always show detailed results:

```
✅ Commit Complete

📊 Analysis:
   [Detailed breakdown]

📝 Commit:
   [Commit details]

🔗 Integrations:
   [Sync status]
```

### Error Handling

Provide clear guidance on errors:

```
❌ No Changes to Commit

💡 Make some changes first:
   1. Edit files
   2. Save changes
   3. Try /ai-commit again
```

---

## 🔧 Configuration Priority

Settings loaded in this order (highest to lowest):

1. `.commitrc.skill.json` (project-specific for skills)
2. `.commitrc.json` (project config)
3. `package.json` → `commitConfig`
4. `~/.commitrc` (global)
5. Environment variables (`.env`)
6. Default values

---

## 🐛 Troubleshooting

### Skill Not Found

**Problem**: `/ai-commit` doesn't work

**Solution**:
1. Check skills are installed: `ls ~/.claude/skills/ai-commit/`
2. Should see: `commit.md`, `analyze.md`, `config.md`, `init.md`
3. Restart Claude Code

### No Configuration

**Problem**: "No configuration found"

**Solution**:
1. Run `/ai-commit:init` to generate config
2. Or manually create `.commitrc.json`

### Notion Sync Fails

**Problem**: "Notion plugin not configured"

**Solution**:
1. Check `.env` has `NOTION_TOKEN` and `NOTION_DATABASE_ID`
2. Verify plugin in `.commitrc.json`: `"plugins": ["@ai-commit/plugin-notion"]`
3. Run `/ai-commit:config` to verify

### Permission Denied

**Problem**: "Cannot write to repository"

**Solution**:
```bash
# Fix Git permissions
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 🌟 Advanced Features

### Multi-Project Setup

Use different Notion databases per project:

```bash
# Global token (shared)
~/.bashrc:
export NOTION_TOKEN=secret_xxx

# Project A
project-a/.env:
NOTION_DATABASE_ID=project_a_db

# Project B
project-b/.env:
NOTION_DATABASE_ID=project_b_db
```

### Custom Analysis Rules

Add custom patterns to `.commitrc.json`:

```json
{
  "analysis": {
    "customRules": [
      {
        "name": "Deprecated API",
        "pattern": "old_api_call",
        "severity": "HIGH",
        "category": "technical-debt"
      }
    ]
  }
}
```

### Integration with Other Skills

```
You: "테스트 돌리고 통과하면 커밋해줘"
Claude: [Runs tests via /sc:test]
        [If pass: runs /ai-commit]
        ✅ Tests passed, committed!
```

---

## 📚 Related Packages

- [@ai-commit/cli](../cli) - CLI tool for terminal use
- [@ai-commit/mcp-server](../mcp-server) - MCP server for Cursor/Windsurf
- [@ai-commit/plugin-notion](../plugin-notion) - Notion integration

---

## 🤝 Contributing

Issues and PRs welcome!

---

## 📄 License

MIT

---

**Built with ❤️ for Claude Code users**
