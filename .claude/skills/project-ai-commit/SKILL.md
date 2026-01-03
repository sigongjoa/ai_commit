---
name: project-ai-commit
description: AI-powered Git commit automation with analysis
---

# /ai-commit - AI-Powered Git Commit Automation

> Automatically analyze changes, generate commit messages, and sync to project management tools

## Triggers
- User requests commit with phrases like "커밋해줘", "commit", "/ai-commit"
- User wants to commit changes with AI analysis
- User types `/ai-commit` or `/ai-commit:commit`

## Behavior

This skill executes the complete AI-Commit workflow automatically:

1. **Stage Changes**: Automatically stages all modified files
2. **Analyze**: Detects technical debt, security risks, and test coverage issues
3. **Generate Message**: Creates semantic commit message based on analysis
4. **Commit**: Creates Git commit with generated or custom message
5. **Sync**: Syncs to Notion/Linear if configured
6. **Report**: Shows comprehensive analysis results to user

**Important**: Execute immediately without asking for confirmation. This is an automation skill.

## Implementation

Use the AI-Commit CLI package to execute the full workflow:

```typescript
import { commitCommand } from '@ai-commit/cli/dist/commands/commit.js';

// Execute full workflow
await commitCommand({
  message: undefined,  // Auto-generate message
  analysis: true,      // Always run analysis
  push: false,         // Don't push unless explicitly requested
  verbose: true        // Show detailed output
});
```

## Input Patterns

### Pattern 1: Basic Commit
```
User: "커밋해줘"
User: "commit"
User: "/ai-commit"
→ Auto-generate message, analyze, commit
```

### Pattern 2: Custom Message
```
User: "feat: add login 으로 커밋해줘"
User: "commit with message 'fix: resolve bug'"
User: "/ai-commit fix: resolve timeout issue"
→ Use provided message, analyze, commit
```

### Pattern 3: Commit + Push
```
User: "커밋하고 푸시해줘"
User: "commit and push"
User: "/ai-commit --push"
→ Commit and push to remote
```

## Output Format

After execution, present results in this format:

```markdown
✅ AI-Commit Complete

═══════════════════════════════════════════

📊 Analysis Results:
   • Files Changed: 3
   • Technical Debt: 2 items found
     - src/auth.ts:45 - TODO: Implement rate limiting
     - src/api.ts:120 - FIXME: Handle edge case
   • Security Risks: 0 issues
   • Test Coverage: Adequate

📝 Commit:
   • SHA: abc1234567
   • Message: feat: add user authentication with JWT
   • Timestamp: 2026-01-03 14:23:45

🔗 Integrations:
   • Notion: Synced to https://notion.so/page/xyz123

[If pushed]
🚀 Pushed to: origin/main

═══════════════════════════════════════════

⏱️  Execution Time: 2.3s
```

## Error Handling

### No Changes

```
User: "커밋해줘"
→ Check git status
→ If no changes:
   ❌ No Changes to Commit

   There are no staged or modified files to commit.

   💡 Next steps:
      1. Make some changes to your code
      2. Save the files
      3. Try again with "커밋해줘"
```

### Git Not Initialized

```
❌ Not a Git Repository

This directory is not a git repository.

💡 Initialize git first:
   git init
   git remote add origin <url>
```

### Analysis Warnings

If analysis finds issues, still commit but warn:

```
⚠️  Analysis Warnings

Technical debt detected:
- 3 TODO comments
- 1 console.log statement

Commit created, but consider addressing these issues.
```

## Configuration

Reads configuration from (in priority order):
1. `.commitrc.skill.json`
2. `.commitrc.json`
3. `package.json` → `commitConfig`
4. Environment variables

Example `.commitrc.skill.json`:
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
  "skill": {
    "autoStage": true,
    "verboseOutput": true,
    "confirmBeforeCommit": false
  }
}
```

## Advanced Usage

### Analyze Before Commit

```typescript
// User can request analysis first
User: "먼저 분석해줘"
→ Run /ai-commit:analyze

User: "좋아, 커밋해줘"
→ Run /ai-commit (can skip re-analysis if recent)
```

### Batch Commits

```typescript
// Multiple changes across different contexts
User: "이 3개 파일을 'feat: add login' 으로 커밋하고,
     다른 2개는 'fix: resolve bug'로 따로 커밋해줘"

→ Execute two separate commits:
   1. ai-commit "feat: add login" for files 1-3
   2. ai-commit "fix: resolve bug" for files 4-5
```

## Integration with Other Skills

### With /sc:test
```
User: "테스트 돌리고 통과하면 커밋해줘"
→ Run /sc:test
→ If pass: Run /ai-commit
→ If fail: Show errors, don't commit
```

### With /sc:git
```
User: "브랜치 만들고 커밋해줘"
→ Run /sc:git branch feature/new-feature
→ Run /ai-commit
```

## Best Practices

1. **Always run analysis** - Don't skip unless explicitly requested
2. **Auto-generate messages** - Unless user provides specific message
3. **Show comprehensive results** - Include all analysis findings
4. **Don't ask for confirmation** - Execute immediately (this is automation)
5. **Handle errors gracefully** - Provide clear next steps

## Examples

### Example 1: Simple Commit
```
User: "커밋해줘"

[Execute commitCommand with defaults]

Output:
✅ Commit Complete
SHA: a1b2c3d
Message: feat: update user profile component
Files: 2 changed
```

### Example 2: Custom Message + Analysis
```
User: "fix: resolve login timeout 으로 커밋해줘"

[Execute with custom message]

Output:
✅ Commit Complete
SHA: x9y8z7w
Message: fix: resolve login timeout
Analysis: 0 issues found
```

### Example 3: Commit + Push
```
User: "커밋하고 푸시해줘"

[Execute with push: true]

Output:
✅ Commit & Push Complete
SHA: m5n6o7p
Pushed to: origin/main
```

---

**Note**: This skill should execute immediately without user confirmation. It's designed for rapid workflow automation in Claude Code.
