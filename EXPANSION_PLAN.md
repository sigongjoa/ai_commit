# AI-Commit 확장 계획: 3-레이어 아키텍처

**목표**: AI-Commit을 CLI, MCP Server, Claude Skill로 확장하여 모든 AI 코딩 도구에서 사용 가능하게 만들기

**작성일**: 2026-01-03
**버전**: 1.0.0

---

## 📋 설계 결정사항

### 1. 아키텍처 전략

**선택**: Integrated 구조
```
@ai-commit/
├── packages/
│   ├── cli/              ← 전체 비즈니스 로직 포함
│   ├── mcp-server/       ← CLI를 import하여 사용
│   └── claude-skill/     ← CLI를 import하여 사용
```

**이유**:
- CLI가 이미 완전한 기능을 가지고 있음
- 중복 코드 최소화
- 단일 진실 공급원 (Single Source of Truth)

### 2. 기능 동등성

**모든 인터페이스에서 동일한 기능 제공**:
- ✅ 변경사항 분석
- ✅ 커밋 메시지 생성
- ✅ Git 커밋/푸시
- ✅ Notion/Linear 동기화
- ✅ 설정 관리

### 3. 사용자 경험

#### CLI
```bash
ai-commit                  # 전체 워크플로우
ai-commit analyze          # 분석만
ai-commit config           # 설정 보기
```

#### MCP (Cursor, Windsurf, Cline 등)
```
User: "변경사항 분석하고 커밋해줘"
AI: [ai_commit_full 도구 호출]
    → 분석 결과 + 커밋 완료 보고
```

#### Claude Skill (Claude Code)
```
/ai-commit                 # 자동 실행
/ai-commit:analyze         # 분석만
/ai-commit:config          # 설정 보기
```

---

## 🗺️ 구현 로드맵

### Phase 1: CLI 완성 ✅ (현재)

**상태**: 코드 구현 완료, 빌드 필요

**완료된 것**:
- [x] Git 작업 (stage, commit, push)
- [x] 분석 엔진 (기술부채, 보안, 테스트 커버리지)
- [x] 리포트 생성
- [x] 플러그인 시스템
- [x] Notion 플러그인
- [x] 설정 로더
- [x] Config 명령어

**남은 작업**:
- [ ] TypeScript 빌드 (다른 환경에서)
- [ ] E2E 테스트
- [ ] npm 배포

---

### Phase 2: MCP 서버 구축 🎯 (다음 단계)

#### 2.1 패키지 구조

```
packages/mcp-server/
├── src/
│   ├── index.ts                 # MCP 서버 진입점
│   ├── server.ts                # StdioServerTransport 설정
│   ├── tools/
│   │   ├── analyze.ts           # ai_commit_analyze
│   │   ├── commit.ts            # ai_commit_commit
│   │   ├── push.ts              # ai_commit_push
│   │   ├── full.ts              # ai_commit_full
│   │   ├── sync-notion.ts       # ai_commit_sync_notion
│   │   ├── config-get.ts        # ai_commit_config_get
│   │   └── config-set.ts        # ai_commit_config_set
│   ├── resources/
│   │   ├── commit-history.ts    # commit:///history
│   │   └── analysis-reports.ts  # analysis:///reports
│   └── prompts/
│       ├── review-changes.ts    # 변경사항 리뷰
│       └── suggest-message.ts   # 커밋 메시지 제안
├── package.json
├── tsconfig.json
└── README.md
```

#### 2.2 MCP Tools 스펙

##### Tool 1: ai_commit_analyze
```typescript
{
  name: "ai_commit_analyze",
  description: "Analyze current Git changes for technical debt, security risks, and test coverage",
  inputSchema: {
    type: "object",
    properties: {
      excludePatterns: {
        type: "array",
        items: { type: "string" },
        description: "File patterns to exclude from analysis"
      }
    }
  }
}
```

##### Tool 2: ai_commit_commit
```typescript
{
  name: "ai_commit_commit",
  description: "Create a Git commit with AI-generated or custom message",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Custom commit message (optional, will generate if not provided)"
      },
      skipAnalysis: {
        type: "boolean",
        description: "Skip analysis step",
        default: false
      }
    }
  }
}
```

##### Tool 3: ai_commit_push
```typescript
{
  name: "ai_commit_push",
  description: "Push commits to remote repository",
  inputSchema: {
    type: "object",
    properties: {
      remote: {
        type: "string",
        description: "Remote name",
        default: "origin"
      },
      branch: {
        type: "string",
        description: "Branch name (optional, uses current branch)"
      }
    }
  }
}
```

##### Tool 4: ai_commit_full
```typescript
{
  name: "ai_commit_full",
  description: "Complete workflow: analyze, commit, sync plugins, and optionally push",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Custom commit message"
      },
      push: {
        type: "boolean",
        description: "Push after commit",
        default: false
      },
      syncPlugins: {
        type: "boolean",
        description: "Sync to Notion/Linear",
        default: true
      }
    }
  }
}
```

##### Tool 5: ai_commit_sync_notion
```typescript
{
  name: "ai_commit_sync_notion",
  description: "Sync commit analysis to Notion database",
  inputSchema: {
    type: "object",
    properties: {
      commitSha: {
        type: "string",
        description: "Commit SHA to sync"
      }
    },
    required: ["commitSha"]
  }
}
```

##### Tool 6: ai_commit_config_get
```typescript
{
  name: "ai_commit_config_get",
  description: "Get current AI-Commit configuration",
  inputSchema: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "Specific config key to retrieve (optional)"
      }
    }
  }
}
```

##### Tool 7: ai_commit_config_set
```typescript
{
  name: "ai_commit_config_set",
  description: "Update AI-Commit configuration",
  inputSchema: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "Config key to update"
      },
      value: {
        description: "New value"
      }
    },
    required: ["key", "value"]
  }
}
```

#### 2.3 MCP Resources 스펙

##### Resource 1: commit-history
```typescript
{
  uri: "commit:///history",
  name: "Commit History",
  description: "Recent commit history with analysis",
  mimeType: "application/json"
}
```

##### Resource 2: analysis-reports
```typescript
{
  uri: "analysis:///reports",
  name: "Analysis Reports",
  description: "Historical analysis reports",
  mimeType: "application/json"
}
```

#### 2.4 MCP Prompts 스펙

##### Prompt 1: review-changes
```typescript
{
  name: "review-changes",
  description: "Review current changes with detailed analysis",
  arguments: [
    {
      name: "focus",
      description: "Focus area: security, performance, or quality",
      required: false
    }
  ]
}
```

##### Prompt 2: suggest-commit-message
```typescript
{
  name: "suggest-commit-message",
  description: "Suggest commit message based on changes",
  arguments: [
    {
      name: "style",
      description: "Message style: conventional, descriptive, or concise",
      required: false
    }
  ]
}
```

#### 2.5 MCP 서버 구현

**index.ts**:
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Import CLI functionality
import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import { PluginManager } from '@ai-commit/cli/dist/core/plugin-manager.js';

// Import tool handlers
import { analyzeHandler } from './tools/analyze.js';
import { commitHandler } from './tools/commit.js';
import { fullHandler } from './tools/full.js';
// ... more imports

const server = new Server(
  {
    name: '@ai-commit/mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ai_commit_analyze',
      description: 'Analyze current Git changes...',
      inputSchema: { /* ... */ }
    },
    // ... more tools
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'ai_commit_analyze':
      return analyzeHandler(args);
    case 'ai_commit_commit':
      return commitHandler(args);
    case 'ai_commit_full':
      return fullHandler(args);
    // ... more handlers
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**tools/full.ts** (가장 중요한 도구):
```typescript
import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import { PluginManager } from '@ai-commit/cli/dist/core/plugin-manager.js';

export async function fullHandler(args: any) {
  const config = await new ConfigLoader().load();
  const git = new GitClient();

  // Stage all changes
  await git.stage();

  // Get diff and files
  const diff = await git.getDiff(true);
  const files = await git.getChangedFiles(true);

  // Analyze
  const analyzer = new Analyzer(config.analysis?.customRules);
  const analysis = await analyzer.analyze(diff, files);

  // Generate commit message
  const message = args.message || generateMessage(analysis);

  // Commit
  const sha = await git.commit(message);

  // Sync plugins
  if (args.syncPlugins !== false) {
    const pluginManager = new PluginManager(config.integrations);
    await pluginManager.sync({ commit: { sha, message }, analysis });
  }

  // Push
  if (args.push === true) {
    await git.push();
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          commit: { sha, message },
          analysis: {
            technicalDebt: analysis.technicalDebt.length,
            risks: analysis.risks.length
          }
        }, null, 2)
      }
    ]
  };
}
```

#### 2.6 설정 파일

**.commitrc.mcp.json**:
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
  },
  "mcp": {
    "enableAllTools": true,
    "autoSync": true
  }
}
```

#### 2.7 사용법

**Cursor에서**:
```json
// .cursor/config.json
{
  "mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["@ai-commit/mcp-server"]
    }
  }
}
```

**Windsurf에서**:
```json
// .windsurf/config.json
{
  "mcp": {
    "servers": {
      "ai-commit": {
        "command": "npx @ai-commit/mcp-server"
      }
    }
  }
}
```

**Cline에서**:
```json
// settings.json
{
  "cline.mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["@ai-commit/mcp-server"]
    }
  }
}
```

---

### Phase 3: Claude Skill 추가

#### 3.1 패키지 구조

```
packages/claude-skill/
├── skills/
│   ├── commit.md            # /ai-commit 또는 /ai-commit:commit
│   ├── analyze.md           # /ai-commit:analyze
│   ├── config.md            # /ai-commit:config
│   ├── init.md              # /ai-commit:init
│   └── sync.md              # /ai-commit:sync
├── package.json
└── README.md
```

#### 3.2 Skill 파일 스펙

**skills/commit.md** (메인 skill):
```markdown
# /ai-commit - AI-Powered Git Commit Automation

> Automatically analyze changes, generate commit messages, and sync to project management tools

## Triggers
- User wants to commit changes with AI analysis
- User types `/ai-commit` or `/ai-commit:commit`

## Behavior

This skill executes the complete AI-Commit workflow:

1. **Stage Changes**: Automatically stages all modified files
2. **Analyze**: Detects technical debt, security risks, and test coverage issues
3. **Generate Message**: Creates semantic commit message based on analysis
4. **Commit**: Creates Git commit with generated or custom message
5. **Sync**: Syncs to Notion/Linear if configured
6. **Report**: Shows analysis results to user

## Implementation

```typescript
import { commitCommand } from '@ai-commit/cli/dist/commands/commit.js';

// Execute full workflow
await commitCommand({
  message: undefined,  // Auto-generate
  analysis: true,
  push: false,
  verbose: true
});
```

## Output Format

The skill should provide a structured report:

```
✅ AI-Commit Complete

📊 Analysis Results:
   • Technical Debt: 2 items found
   • Security Risks: 0 issues
   • Test Coverage: Adequate

📝 Commit:
   SHA: abc123...
   Message: "feat: add user authentication with JWT"

🔗 Synced to:
   • Notion: https://notion.so/page/xyz
```

## Usage Examples

User: `/ai-commit`
→ Executes full workflow with auto-generated message

User: `/ai-commit "fix: resolve login bug"`
→ Uses custom message but still performs analysis

## Error Handling

- No changes staged: Inform user and ask if they want to stage all
- Analysis fails: Continue with commit but warn user
- Sync fails: Commit succeeds but report sync error

## Configuration

Reads from `.commitrc.skill.json` or falls back to `.commitrc.json`
```

**skills/analyze.md**:
```markdown
# /ai-commit:analyze - Analyze Changes Only

> Analyze current Git changes without committing

## Triggers
- User wants to review changes before committing
- User types `/ai-commit:analyze`

## Behavior

Performs analysis only, does not commit:

1. Get staged/unstaged changes
2. Run analysis engine
3. Generate detailed report
4. Show results to user

## Implementation

```typescript
import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';

const git = new GitClient();
const diff = await git.getDiff(true);
const files = await git.getChangedFiles(true);

const analyzer = new Analyzer();
const analysis = await analyzer.analyze(diff, files);

// Format and display results
```

## Output Format

```
📊 Analysis Results

🔴 Technical Debt (2 items):
   • src/auth.ts:45 - TODO: Implement rate limiting
   • src/api.ts:120 - FIXME: Handle edge case

🟡 Security Risks (1 item):
   • src/config.ts:10 - Hardcoded API endpoint detected

✅ Test Coverage: Good
   • Modified files have associated tests

🏗️ Architecture Impact: Low
   • No breaking changes detected
```
```

**skills/config.md**:
```markdown
# /ai-commit:config - Show Configuration

> Display current AI-Commit configuration

## Triggers
- User wants to see current settings
- User types `/ai-commit:config`

## Behavior

Shows configuration from all sources:
- `.commitrc.skill.json`
- `.commitrc.json`
- `package.json`
- Environment variables

## Implementation

```typescript
import { configCommand } from '@ai-commit/cli/dist/commands/config.js';

await configCommand({ json: false, validate: true });
```

## Output Format

Colorful, formatted configuration display (same as CLI)
```

#### 3.3 설정 파일

**.commitrc.skill.json**:
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
  },
  "skill": {
    "autoStage": true,
    "verboseOutput": true,
    "confirmBeforeCommit": false
  }
}
```

#### 3.4 설치 방법

```bash
# Claude Code 스킬 디렉토리에 복사
cp -r packages/claude-skill/skills/* ~/.claude/skills/ai-commit/

# 또는 심볼릭 링크
ln -s $(pwd)/packages/claude-skill/skills ~/.claude/skills/ai-commit
```

---

### Phase 4: 통합 테스트 및 문서화

#### 4.1 테스트 시나리오

**CLI 테스트**:
```bash
cd test-project
echo "test" > file.txt
ai-commit                    # Should analyze and commit
ai-commit analyze            # Should only analyze
ai-commit config             # Should show config
```

**MCP 테스트 (Cursor)**:
1. Cursor에서 파일 수정
2. Composer: "변경사항 분석해줘"
3. AI가 `ai_commit_analyze` 호출
4. 결과 확인
5. Composer: "커밋해줘"
6. AI가 `ai_commit_commit` 호출

**Skill 테스트 (Claude Code)**:
1. Claude Code에서 파일 수정
2. `/ai-commit:analyze` 입력
3. 분석 결과 확인
4. `/ai-commit` 입력
5. 자동 커밋 확인

#### 4.2 문서

**README.md 업데이트**:
- 3가지 사용 방법 안내
- 각 도구별 설치 가이드
- 설정 파일 우선순위 설명

**USAGE_GUIDE.md** (새로 작성):
- CLI 사용법
- MCP 서버 설정 (Cursor, Windsurf, Cline)
- Claude Skill 사용법
- 각 인터페이스별 설정 파일

**PLUGIN_DEVELOPMENT.md** (기존):
- 플러그인 개발 가이드
- 모든 인터페이스에서 플러그인 사용

---

## 📦 최종 패키지 구조

```
@ai-commit/
├── packages/
│   ├── shared/              # 타입 정의
│   ├── cli/                 # CLI + 전체 로직
│   ├── plugin-notion/       # Notion 플러그인
│   ├── plugin-linear/       # Linear 플러그인 (TODO)
│   ├── plugin-jira/         # Jira 플러그인 (TODO)
│   ├── mcp-server/          # 🆕 MCP 서버
│   └── claude-skill/        # 🆕 Claude Skill
├── examples/
│   ├── cursor-setup/
│   ├── windsurf-setup/
│   ├── cline-setup/
│   └── claude-code-setup/
├── docs/
│   ├── CLI.md
│   ├── MCP.md
│   ├── SKILL.md
│   └── COMPARISON.md        # CLI vs MCP vs Skill
├── ARCHITECTURE_DESIGN.md
├── IMPLEMENTATION_ROADMAP.md
├── EXPANSION_PLAN.md        # 이 문서
├── MANUAL_TESTING_GUIDE.md
└── README.md
```

---

## 🎯 성공 기준

### Phase 2 완료 기준 (MCP)
- [ ] MCP 서버 빌드 성공
- [ ] 7개 도구 모두 작동
- [ ] Cursor에서 테스트 성공
- [ ] Windsurf에서 테스트 성공
- [ ] npm에 배포

### Phase 3 완료 기준 (Skill)
- [ ] 4개 skill 파일 작성
- [ ] Claude Code에서 테스트 성공
- [ ] 자동화 시나리오 작동
- [ ] 문서화 완료

### 전체 완료 기준
- [ ] 3가지 인터페이스 모두 작동
- [ ] 동일한 기능 제공 확인
- [ ] 설정 파일 우선순위 정상 작동
- [ ] 플러그인 시스템 모든 인터페이스에서 작동
- [ ] 완전한 사용 가이드 작성

---

## 🚀 다음 작업

**즉시 시작**: Phase 2 - MCP 서버 구축

1. `packages/mcp-server` 생성
2. 기본 서버 설정 (index.ts, server.ts)
3. 7개 도구 구현
4. Cursor에서 테스트

**예상 소요 시간**:
- Phase 2 (MCP): 구현 완료 (빌드 환경 필요)
- Phase 3 (Skill): 30분-1시간 (skill 파일 작성)
- Phase 4 (테스트): 1-2시간

**준비 완료! 이제 Phase 2 MCP 서버 구축을 시작할까요?** 🚀
