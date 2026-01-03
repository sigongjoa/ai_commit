---
name: project-ai-commit-analyze
description: Analyze Git changes for technical debt and security risks
---

# /ai-commit-analyze - Analyze Changes Only

> Analyze current Git changes for technical debt, security risks, and test coverage without committing

## Triggers
- User requests analysis with "분석해줘", "analyze", "/ai-commit-analyze"
- User wants to review changes before committing
- User asks "what changed?" or "뭐가 바뀌었어?"

## Behavior

Performs comprehensive analysis without creating a commit:

1. Get current staged/unstaged changes from Git
2. Run pattern-based analysis engine
3. Detect technical debt (TODOs, FIXMEs, console.log, etc.)
4. Identify security risks (hardcoded secrets, unsafe patterns)
5. Assess test coverage
6. Evaluate architecture impact
7. Generate detailed report

**Important**: Only analyze, do not commit. Let user decide next steps.

## Implementation

```typescript
import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';

// Get changes
const git = new GitClient(process.cwd());
const diff = await git.getDiff(true);  // staged changes
const files = await git.getChangedFiles(true);

// Load config
const config = await new ConfigLoader(process.cwd()).load();

// Analyze
const analyzer = new Analyzer(config.analysis?.customRules || []);
const analysis = await analyzer.analyze(diff, files);

// Present results to user
```

## Output Format

```markdown
📊 AI-Commit Analysis Results

═══════════════════════════════════════════

📁 Files Analyzed: 5
   • src/auth.ts (modified)
   • src/api/login.ts (modified)
   • src/utils/validator.ts (new)
   • tests/auth.test.ts (modified)
   • package.json (modified)

💡 Summary: 3 technical debt items, 1 security concern

─────────────────────────────────────────────

🔴 Technical Debt (3 items):

1. [MEDIUM] TODO comment added
   Location: src/auth.ts:45
   Description: TODO: Implement rate limiting
   Recommendation: Create issue or implement now

2. [LOW] Console.log statement
   Location: src/api/login.ts:28
   Description: console.log('Login attempt:', user)
   Recommendation: Replace with proper logging

3. [LOW] FIXME comment
   Location: src/utils/validator.ts:15
   Description: FIXME: Handle edge case for empty strings
   Recommendation: Fix before merging

─────────────────────────────────────────────

🟡 Security & Quality (1 item):

1. [MEDIUM] Potential security concern
   Location: src/api/login.ts:10
   Description: Hardcoded API endpoint detected
   Recommendation: Move to environment variables

─────────────────────────────────────────────

✅ Test Coverage: Good
   • Modified files have associated tests
   • tests/auth.test.ts covers src/auth.ts changes

─────────────────────────────────────────────

🏗️  Architecture Impact: Low
   • No breaking changes detected
   • New utility function added (validator.ts)
   • Existing API contracts maintained

═══════════════════════════════════════════

💡 Recommendations:
   1. Address the security concern before committing
   2. Remove console.log statement
   3. Consider fixing TODO/FIXME items

✨ Ready to commit? Type "커밋해줘" or "/ai-commit"
```

## Analysis Categories

### Technical Debt Detection

Patterns detected:
- TODO comments: `// TODO:`, `# TODO:`, `/* TODO */`
- FIXME comments: `// FIXME:`, `# FIXME:`
- HACK comments: `// HACK:`, `# HACK:`
- Console statements: `console.log`, `console.warn`, `console.error`
- Debug statements: `debugger;`, `print()`, `var_dump()`
- Temporary code: `XXX`, `TEMP`, `HACK`

### Security Risk Detection

Patterns detected:
- Hardcoded credentials: `password =`, `api_key =`, `secret =`
- Tokens in code: `token =`, `auth =`
- API keys: `API_KEY`, `API_SECRET`
- Unsafe patterns: `eval()`, `exec()`, `innerHTML =`
- SQL injection risks: Raw SQL concatenation
- XSS risks: Unescaped user input

### Test Coverage Analysis

Checks:
- Do modified files have corresponding test files?
- Were tests modified along with source code?
- Are new functions/classes covered by tests?

### Architecture Impact

Evaluates:
- Breaking changes (signature changes, exports)
- New dependencies
- File structure changes
- Pattern changes (new design patterns introduced)

## Error Handling

### No Changes
```
📊 No Changes to Analyze

There are no staged or modified files.

💡 Make some changes first, then run /ai-commit-analyze
```

### Git Not Initialized
```
❌ Not a Git Repository

This directory doesn't have git initialized.

💡 Initialize git first:
   git init
```

## Follow-up Actions

After showing analysis, suggest next steps:

```markdown
🎯 What's Next?

1. Fix issues: Address the technical debt and security concerns
2. Commit anyway: Type "커밋해줘" to commit with current state
3. Review specific file: Type "Show me src/auth.ts" to review the file
4. Get suggestions: Type "How should I fix the TODO items?"
```

## Configuration

Reads from `.commitrc.json` or `.commitrc.skill.json`:

```json
{
  "analysis": {
    "enabled": true,
    "rules": [
      "technical-debt",
      "security",
      "test-coverage",
      "breaking-changes"
    ],
    "customRules": [],
    "excludePatterns": [
      "node_modules/**",
      "dist/**",
      "*.min.js"
    ]
  }
}
```

## Advanced Usage

### Focus on Specific Area

```
User: "보안만 체크해줘"
→ Run analysis with focus on security patterns

User: "성능 체크해줘"
→ Run analysis with focus on performance patterns
```

### Compare with Previous

```
User: "이전 커밋과 비교해줘"
→ Run analysis and compare with last commit's analysis
```

### Export Report

```
User: "분석 리포트 저장해줘"
→ Generate markdown report and save to docs/commits/
```

## Integration with Commit

```
User: "분석해줘"
[Show analysis results]

User: "문제 없으면 커밋해줘"
→ If no HIGH severity issues: proceed with /ai-commit
→ If HIGH severity issues: warn and ask for confirmation
```

## Best Practices

1. **Be thorough** - Show all findings, don't hide issues
2. **Prioritize by severity** - HIGH > MEDIUM > LOW
3. **Provide context** - Explain why each issue matters
4. **Suggest fixes** - Don't just identify problems
5. **Enable action** - Make next steps clear

---

**Note**: This skill is read-only and safe to run anytime. It never modifies code or creates commits.
