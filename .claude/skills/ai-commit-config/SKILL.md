---
name: project-ai-commit-config
description: Show AI-Commit configuration from all sources
---

# /ai-commit-config - Show Configuration

> Display current AI-Commit configuration from all sources

## Triggers
- User asks about configuration: "설정 보여줘", "config", "/ai-commit-config"
- User wants to check settings: "어떻게 설정돼있어?", "show settings"
- User needs to verify integration: "Notion 연결됐어?", "is Notion configured?"

## Behavior

Shows comprehensive configuration loaded from all sources:

1. Load configuration from all sources (priority order):
   - `.commitrc.skill.json` (highest)
   - `.commitrc.json`
   - `package.json` → `commitConfig`
   - `~/.commitrc` (global)
   - Environment variables
2. Merge with priority
3. Display in readable format
4. Redact sensitive information (tokens, API keys)
5. Show source of each setting

**Important**: This is informational only, does not modify anything.

## Implementation

```typescript
import { configCommand } from '@ai-commit/cli/dist/commands/config.js';

// Show config with pretty formatting
await configCommand({
  json: false,      // Human-readable format
  validate: true    // Check if config is valid
});
```

## Output Format

```markdown
═══════════════════════════════════════════
          AI-Commit Configuration
═══════════════════════════════════════════

🔌 Plugins
   ✓ @ai-commit/plugin-notion
   ✓ @ai-commit/plugin-linear

🤖 Analysis
   Enabled: Yes
   Rules: 3 active
      • technical-debt
      • security
      • test-coverage
   Exclude Patterns: 4
      • node_modules/**
      • dist/**
      • build/**
      • *.min.js
   Custom Rules: None

📄 Output
   Directory: docs/commits
   Format: markdown

📦 Git
   Auto-push: No
   Require Tests: No

🔗 Integrations
   ✓ NOTION
      token: ***REDACTED***
      databaseId: 1a2b3c4d5e6f (from .env)

   ✓ LINEAR
      apiKey: ***REDACTED***
      teamId: DEV (from .env)

⚙️  Skill Settings
   Auto Stage: Yes
   Verbose Output: Yes
   Confirm Before Commit: No

═══════════════════════════════════════════

📍 Configuration Sources:
   • .commitrc.skill.json (project-specific)
   • .env (environment variables)
   • Default values

✅ Configuration is valid
```

## Configuration Details

### Plugins Section

Shows which plugins are loaded:
```
✓ Plugin Name (enabled)
✗ Plugin Name (not configured)
```

### Analysis Settings

```
Enabled: Yes/No
Rules: [list of active rules]
Custom Rules: [number of custom patterns]
Exclude Patterns: [file patterns to skip]
```

### Integrations

Shows integration status with sensitive data redacted:
```
✓ NOTION
   token: ***REDACTED*** (8 characters shown)
   databaseId: 1a2b3c4d (visible, not sensitive)
   Source: Environment variable NOTION_TOKEN
```

## JSON Output Mode

For scripting or debugging:

```
User: "설정을 JSON으로 보여줘"
User: "/ai-commit-config --json"

Output:
```json
{
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": {
    "enabled": true,
    "rules": ["technical-debt", "security", "test-coverage"],
    "excludePatterns": ["node_modules/**", "dist/**"],
    "customRules": []
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
      "token": "***REDACTED***",
      "databaseId": "1a2b3c4d5e6f"
    }
  }
}
```

## Validation

Check if configuration is valid:

```
User: "설정 검증해줘"
User: "/ai-commit-config --validate"

If valid:
✅ Configuration is valid

If invalid:
❌ Configuration has errors:
   • Missing required field: integrations.notion.databaseId
   • Invalid value for git.autoPush: must be boolean
```

## Configuration Sources Priority

Show which source each setting comes from:

```
git.autoPush = false
   Source: .commitrc.skill.json

integrations.notion.token = ***REDACTED***
   Source: Environment variable NOTION_TOKEN

analysis.enabled = true
   Source: Default value
```

## Troubleshooting

### Missing Configuration
```
⚠️  No Configuration Found

AI-Commit is using default values.

💡 Create a configuration file:
   1. Copy .commitrc.json.example to .commitrc.json
   2. Or run: /ai-commit-init to generate config
```

### Plugin Not Configured
```
⚠️  Notion Plugin Enabled but Not Configured

The plugin is listed but missing credentials.

💡 Fix:
   1. Set environment variables:
      NOTION_TOKEN=your_token
      NOTION_DATABASE_ID=your_db_id

   2. Or add to .commitrc.json:
      {
        "integrations": {
          "@ai-commit/plugin-notion": {
            "databaseId": "your_db_id"
          }
        }
      }
```

### Multiple Databases (Multi-Project)
```
💡 Multi-Project Setup Detected

You're using different Notion databases per project.

Current project:
   NOTION_DATABASE_ID=project_a_db (from .env)

Other projects can use:
   project-b/.env: NOTION_DATABASE_ID=project_b_db
   project-c/.env: NOTION_DATABASE_ID=project_c_db

Global token (shared):
   NOTION_TOKEN=secret_xxx (from ~/.bashrc)
```

## Update Configuration

If user wants to change settings:

```
User: "auto push를 켜줘"

Response:
To enable auto-push, you can either:

1. Update .commitrc.skill.json:
   ```json
   {
     "git": {
       "autoPush": true
     }
   }
   ```

2. Or set environment variable:
   ```bash
   export AI_COMMIT_AUTO_PUSH=true
   ```

Would you like me to update the config file?
```

## Compare Configurations

Show differences between projects:

```
User: "다른 프로젝트 설정이랑 비교해줘"

Current Project (project-a):
   Notion DB: project_a_db
   Auto-push: No

Project B:
   Notion DB: project_b_db
   Auto-push: Yes
```

## Best Practices

1. **Redact sensitive data** - Never show full tokens/API keys
2. **Show sources** - Help users understand where settings come from
3. **Validate** - Check configuration is valid and warn about issues
4. **Guide users** - Provide clear instructions to fix problems
5. **Support multi-project** - Explain how different projects can have different configs

## Examples

### Example 1: Basic Config Display
```
User: "설정 보여줘"
→ Show full configuration with formatting

User: "config"
→ Same as above
```

### Example 2: Check Specific Setting
```
User: "Notion 연결됐어?"
→ Show only Notion integration status

User: "auto push 켜져있어?"
→ Show git.autoPush value
```

### Example 3: Troubleshoot
```
User: "왜 Notion에 안올라가?"
→ Check Notion configuration
→ Validate credentials
→ Show troubleshooting steps
```

---

**Note**: This skill is read-only and safe. It never modifies configuration files or exposes sensitive data.
