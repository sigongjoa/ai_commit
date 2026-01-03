# AI-Commit Cursor 설정 가이드 🚀

> Cursor에서 "딸깍" 하나로 자동 커밋!

## 🎯 목표

Cursor Composer에서 "커밋해줘"라고 말하면 AI가 자동으로:
1. 변경사항 분석
2. 커밋 메시지 생성
3. Git 커밋 생성
4. Notion/Linear 동기화
5. 결과 리포트

**모든 것이 자동으로!** 🎉

---

## 📋 사전 준비

### 1. Cursor 설치

[https://cursor.sh](https://cursor.sh)에서 다운로드

### 2. Node.js 설치

```bash
node --version  # v18 이상 필요
```

### 3. Git 저장소

```bash
git init  # 아직 Git 저장소가 아니라면
```

---

## 🔧 설정 단계

### 단계 1: MCP 서버 설정

Cursor 설정 열기:
- Mac: `Cmd + ,`
- Windows/Linux: `Ctrl + ,`

**Features** → **Beta** → **Model Context Protocol** 활성화

설정 파일 편집:
1. `Cmd/Ctrl + Shift + P` → "Preferences: Open User Settings (JSON)"
2. 또는 `~/.cursor/config.json` 직접 편집

다음 내용 추가:

```json
{
  "mcpServers": {
    "ai-commit": {
      "command": "npx",
      "args": ["-y", "@ai-commit/mcp-server"]
    }
  }
}
```

### 단계 2: .cursorrules 파일 생성

**프로젝트 루트에** `.cursorrules` 파일 생성:

```bash
# AI-Commit Cursor Rules
# Cursor에서 AI가 자동으로 AI-Commit을 사용하도록 설정

## 자동 커밋 규칙

다음 요청을 받으면 자동으로 ai_commit_full 도구 실행:
- "커밋해줘" / "commit"
- "변경사항 커밋" / "commit changes"
- "푸시해줘" / "commit and push"

다음 요청을 받으면 ai_commit_analyze 도구 실행:
- "분석해줘" / "analyze"
- "뭐가 바뀌었어?" / "what changed?"

## 기본 동작

1. **사용자에게 물어보지 말고 즉시 실행**
2. **결과는 구조화된 형식으로 표시**
3. **에러 발생 시 해결 방법 제시**

## 도구 사용 우선순위

1. ai_commit_full - 완전한 워크플로우 (최우선)
2. ai_commit_analyze - 분석만 필요할 때
3. ai_commit_commit - 커밋만
4. ai_commit_push - 푸시만

## 응답 형식

도구 실행 후:
✅ 커밋 완료!
📝 SHA: abc123
📊 분석: 기술부채 0개, 보안 이슈 0개
🔗 Notion: [링크]
```

**또는** 저장소의 `.cursorrules` 파일을 복사:

```bash
cp /path/to/ai-commit/.cursorrules .
```

### 단계 3: 환경 변수 설정 (선택사항 - Notion 사용시)

프로젝트 루트에 `.env` 파일 생성:

```bash
# Notion Integration
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=your_database_id_here

# Linear Integration (optional)
LINEAR_API_KEY=lin_xxx
LINEAR_TEAM_ID=team_xxx
```

### 단계 4: 설정 파일 생성 (선택사항)

프로젝트 루트에 `.commitrc.mcp.json` 생성:

```json
{
  "$schema": "https://ai-commit.dev/schema.json",
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": {
    "enabled": true,
    "rules": ["technical-debt", "security", "test-coverage"],
    "excludePatterns": ["node_modules/**", "dist/**", "build/**"]
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

---

## ✅ 테스트

### 1. Cursor 재시작

설정 후 Cursor를 완전히 종료하고 다시 시작합니다.

### 2. MCP 연결 확인

Cursor 하단 상태바에 MCP 아이콘이 표시되는지 확인합니다.

### 3. 간단한 변경사항 만들기

```bash
echo "# Test" > test.md
```

### 4. Composer 열기

`Cmd/Ctrl + I` 또는 우측 사이드바의 Composer 아이콘 클릭

### 5. 자동 커밋 테스트

Composer에 다음과 같이 입력:

```
커밋해줘
```

**기대하는 결과**:

```
✅ AI-Commit Workflow Completed
═══════════════════════════════════════════

📁 Files Changed:
   Total: 1
   • test.md

📊 Analysis Results:
   • Technical Debt: 0 items
   • Security Risks: 0 items
   • Test Coverage: N/A

📝 Commit Created:
   SHA: a1b2c3d4
   Message: docs: add test file
   Time: 2026-01-03T...

⚙️  Execution Steps:
   ✓ config: loaded
   ✓ stage: completed
   ✓ analysis: completed
   ✓ commit: created
   ✓ plugins: synced (if configured)
   - push: skipped

⏱️  Execution Time: 1234ms
═══════════════════════════════════════════
```

---

## 🎨 사용 시나리오

### 시나리오 1: 기본 커밋

```
You: 커밋해줘
Cursor: [자동으로 분석 → 커밋 → 리포트]
```

### 시나리오 2: 분석만

```
You: 변경사항 분석해줘
Cursor: [ai_commit_analyze 실행]
        📊 기술부채 2개 발견
        🔴 TODO 주석 제거 필요
        🟡 console.log 제거 권장

You: 그럼 커밋해줘
Cursor: [ai_commit_full 실행]
        ✅ 커밋 완료!
```

### 시나리오 3: 커스텀 메시지 + 푸시

```
You: "feat: add user authentication" 으로 커밋하고 푸시해줘
Cursor: [ai_commit_full({ message: "feat: add user authentication", push: true })]
        ✅ 커밋 완료!
        🚀 origin/main에 푸시됨
```

### 시나리오 4: Notion 동기화

```
You: 커밋하고 Notion에 기록해줘
Cursor: [ai_commit_full({ syncPlugins: true })]
        ✅ 커밋 완료!
        🔗 Notion 페이지 생성: https://notion.so/...
```

### 시나리오 5: 설정 확인

```
You: 현재 설정 보여줘
Cursor: [ai_commit_config_get()]
        📋 현재 설정:
        • Plugins: @ai-commit/plugin-notion
        • Auto-push: No
        • Analysis: Enabled
```

---

## 🎯 고급 기능

### 1. 자동 감지 패턴

Cursor는 다음 키워드를 자동으로 감지합니다:

**커밋 트리거**:
- "커밋", "commit"
- "저장", "save"
- "완료", "done"
- "푸시", "push"

**분석 트리거**:
- "분석", "analyze"
- "리뷰", "review"
- "체크", "check"
- "확인", "verify"

### 2. 컨텍스트 유지

```
You: 파일 3개 수정했어
Cursor: 확인했습니다. 커밋하시겠어요?

You: 먼저 분석해줘
Cursor: [분석 실행 및 결과 표시]

You: 좋아, 커밋해줘
Cursor: [바로 커밋 실행]
```

### 3. 에러 자동 처리

```
You: 커밋해줘
Cursor: ❌ 변경사항이 없습니다.
        💡 먼저 파일을 수정해주세요.

You: [파일 수정]

You: 이제 커밋해줘
Cursor: ✅ 커밋 완료!
```

---

## 🐛 문제 해결

### 문제 1: MCP 서버가 시작되지 않음

**증상**: Composer에서 도구를 찾을 수 없음

**해결**:
1. Cursor 완전히 종료 후 재시작
2. 터미널에서 직접 테스트:
   ```bash
   npx -y @ai-commit/mcp-server
   ```
3. Node.js 버전 확인 (v18 이상 필요)

### 문제 2: "No changes to commit"

**증상**: 커밋하려는데 변경사항 없다고 나옴

**해결**:
```bash
git status  # 상태 확인
git add .   # 파일 스테이징
```

### 문제 3: Notion 동기화 실패

**증상**: "Notion plugin not configured"

**해결**:
1. `.env` 파일 확인:
   ```bash
   NOTION_TOKEN=secret_xxx
   NOTION_DATABASE_ID=xxx
   ```
2. `.commitrc.mcp.json`에 플러그인 추가:
   ```json
   {
     "plugins": ["@ai-commit/plugin-notion"]
   }
   ```

### 문제 4: 도구가 자동으로 실행되지 않음

**증상**: "커밋해줘"라고 해도 도구를 사용하지 않음

**해결**:
1. `.cursorrules` 파일이 **프로젝트 루트**에 있는지 확인
2. 파일 내용 확인 (위의 예시와 동일해야 함)
3. Cursor 재시작

### 문제 5: Permission Denied

**증상**: Git 권한 에러

**해결**:
```bash
chmod +x .git/hooks/*  # Git hooks 권한 설정
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 💡 팁 & 트릭

### 1. 글로벌 Notion 토큰 설정

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export NOTION_TOKEN=secret_xxx

# 프로젝트별로 DATABASE_ID만 설정
echo "NOTION_DATABASE_ID=project_a_db" > .env
```

### 2. 커밋 전 자동 분석

`.cursorrules`에 다음 추가:

```
커밋 요청 시 항상 먼저 분석 결과를 보여주고,
사용자가 확인 후 커밋하도록 한다.
```

### 3. 자동 푸시 활성화

`.commitrc.mcp.json`:

```json
{
  "git": {
    "autoPush": true
  }
}
```

### 4. 특정 파일 자동 제외

```json
{
  "analysis": {
    "excludePatterns": [
      "node_modules/**",
      "*.lock",
      "dist/**",
      ".env*"
    ]
  }
}
```

### 5. 커밋 메시지 스타일 통일

Composer에서:

```
앞으로 모든 커밋은 Conventional Commits 형식으로 해줘:
- feat: 새 기능
- fix: 버그 수정
- docs: 문서 수정
- refactor: 리팩토링
```

---

## 📚 추가 리소스

- [MCP 서버 README](./packages/mcp-server/README.md)
- [CLI 사용 가이드](./README.md)
- [플러그인 개발 가이드](./PLUGIN_DEVELOPMENT.md)
- [확장 계획](./EXPANSION_PLAN.md)

---

## 🎓 다음 단계

1. ✅ Cursor 설정 완료
2. ⏭️ [Windsurf 설정](./WINDSURF_SETUP_GUIDE.md) (TODO)
3. ⏭️ [Cline 설정](./CLINE_SETUP_GUIDE.md) (TODO)
4. ⏭️ [Claude Code Skill 설정](./packages/claude-skill/README.md) (TODO)

---

**설정 완료! 이제 Cursor에서 "커밋해줘"만 하면 끝! 🚀**
