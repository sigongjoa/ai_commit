# Notion Integration Setup Guide

## Global Configuration (One-time setup)

### 1. Set Notion Token (Shared across all projects)

Create `.env` file in the ai-commit monorepo root:
```bash
NOTION_TOKEN=ntn_Ow685890528adOWptUh3RMKS9c1EIgwPETKtdtKFhBi3YA
NOTION_DATABASE_ID=  # Leave empty or set a default
```

**Note**: The `.env` file is already in `.gitignore` so your token won't be committed.

---

## Per-Project Configuration

Each project that uses ai-commit needs its own Notion database.

### 2. Create Notion Database for Each Project

1. Go to Notion
2. Create a new database with these properties:
   - **Commit** (Title)
   - **SHA** (Text)
   - **Date** (Date)
   - **Branch** (Text) - optional
   - **Author** (Text) - optional

3. Copy the database ID from the URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
                              ^^^^^^^^^^^^
   ```

### 3. Configure Each Project

In each project's `.commitrc.json`, set the database ID:

```json
{
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
      "databaseId": "YOUR_PROJECT_DATABASE_ID_HERE"
    }
  }
}
```

---

## Usage in Claude Code

### When using /ai-commit skill:

```
User: "커밋해줘"
Claude: [Executes] npx ai-commit
        → Stages changes
        → Analyzes code
        → Generates commit message
        → Creates commit
        → Syncs to Notion database (configured in .commitrc.json)
```

### Custom commit message:

```
User: "feat: add new feature 로 커밋해줘"
Claude: [Executes] npx ai-commit "feat: add new feature"
```

### Commit and push:

```
User: "커밋하고 푸시해줘"
Claude: [Executes] npx ai-commit --push
```

---

## Example Project Structure

```
project-a/
  .commitrc.json  → databaseId: "db_project_a_123"

project-b/
  .commitrc.json  → databaseId: "db_project_b_456"

ai-commit/  (monorepo)
  .env  → NOTION_TOKEN=secret_YOUR_TOKEN_HERE
  .commitrc.json  → databaseId: "db_ai_commit_789"
```

---

## Current Status

✅ Global token configured in `.env`
⚠️  Project database ID needs to be set in `.commitrc.json`

To complete setup for this project (ai-commit):
1. Create a Notion database for "ai-commit" project
2. Update `.commitrc.json` with the database ID
3. Test with: `npx ai-commit "test: verify notion integration"`
