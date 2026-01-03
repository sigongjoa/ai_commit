# @ai-commit/plugin-notion

> Notion integration plugin for AI-Commit

## Overview

This plugin syncs commit analysis reports to a Notion database, allowing you to track all commits and their technical analysis in Notion.

## Installation

```bash
npm install --save-dev @ai-commit/plugin-notion
```

## Configuration

### 1. Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name (e.g., "AI-Commit")
4. Copy the "Internal Integration Token"

### 2. Create a Database

Create a new database in Notion with the following properties:

- **Commit** (Title) - Commit message
- **SHA** (Text) - Git commit SHA
- **Date** (Date) - Commit timestamp
- **Branch** (Text, optional) - Git branch name
- **Author** (Text, optional) - Commit author

### 3. Share Database with Integration

1. Open your database in Notion
2. Click "..." → "Add connections"
3. Select your integration

### 4. Configure AI-Commit

Add to your `package.json`:

```json
{
  "commitConfig": {
    "plugins": ["@ai-commit/plugin-notion"],
    "integrations": {
      "@ai-commit/plugin-notion": {
        "databaseId": "your-database-id-here"
      }
    }
  }
}
```

Or create `.commitrc.json`:

```json
{
  "plugins": ["@ai-commit/plugin-notion"],
  "integrations": {
    "@ai-commit/plugin-notion": {
      "databaseId": "your-database-id-here"
    }
  }
}
```

### 5. Set Environment Variables

Create a `.env` file:

```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxx
```

## Usage

Once configured, the plugin will automatically sync commits to Notion:

```bash
ai-commit "feat: add new feature"
```

This will:
1. Create the commit
2. Generate analysis report
3. Create a new page in your Notion database
4. Include the full analysis as page content

## Features

- ✅ Automatic commit syncing to Notion database
- ✅ Markdown to Notion blocks conversion
- ✅ Support for headings, code blocks, lists
- ✅ Commit metadata (SHA, date, branch, author)
- ✅ Full analysis report as page content

## Finding Your Database ID

1. Open your database in Notion
2. Click "..." → "Copy link"
3. The URL will look like: `https://notion.so/workspace/xxxxx?v=yyyyy`
4. The `xxxxx` part is your database ID

## Troubleshooting

### "Notion token not provided"

Make sure you've set the `NOTION_TOKEN` environment variable or added it to your config.

### "Notion database ID not provided"

Make sure you've set the `NOTION_DATABASE_ID` environment variable or added it to your config.

### "Failed to connect to Notion"

- Check that your integration token is valid
- Make sure the database is shared with your integration
- Verify the database ID is correct

## Development

```bash
# Build
npm run build

# Tests
npm run test
```

## License

MIT
