# AI-Commit Manual Testing Guide

## 🧪 테스트 방법

### 옵션 1: 자동 테스트 스크립트 (추천)

#### 1. 기본 설정 테스트

```bash
node test-config.js
```

**출력 예시**:
- 현재 설정된 플러그인
- 분석 활성화 여부
- 출력 디렉토리
- Git 설정
- 통합 서비스

#### 2. 환경 변수 테스트

```bash
# 환경 변수 설정 후 테스트
export NOTION_TOKEN=your_token_here
export NOTION_DATABASE_ID=your_db_id_here
node test-config.js
```

#### 3. JSON 출력 테스트

```bash
node test-config.js --json
```

---

### 옵션 2: 프로젝트별 설정 테스트

각 프로젝트에서 다른 설정을 사용하는 방법을 테스트합니다.

#### 프로젝트 A 설정

```bash
cd /path/to/project-a

# .env 파일 생성
cat > .env << 'EOF'
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=project_a_database_id
EOF

# 테스트
node /path/to/ai-commit/test-config.js
```

#### 프로젝트 B 설정

```bash
cd /path/to/project-b

# .env 파일 생성 (다른 데이터베이스 ID!)
cat > .env << 'EOF'
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=project_b_database_id
EOF

# 테스트
node /path/to/ai-commit/test-config.js
```

**결과**: 각 프로젝트는 자신의 `.env` 파일에서 설정을 읽습니다!

---

## 📦 설정 파일 우선순위 확인

### 테스트 시나리오

1. **package.json만 사용**
   ```bash
   # package.json에 추가
   {
     "commitConfig": {
       "plugins": ["@ai-commit/plugin-notion"],
       "git": { "autoPush": true }
     }
   }

   node test-config.js
   # → Auto-push: Yes 확인
   ```

2. **.commitrc.json만 사용**
   ```bash
   cp .commitrc.json.example .commitrc.json
   # 편집: "autoPush": false

   node test-config.js
   # → Auto-push: No 확인
   ```

3. **package.json + .commitrc.json (우선순위 테스트)**
   ```bash
   # package.json: "autoPush": true
   # .commitrc.json: "autoPush": false

   node test-config.js
   # → Auto-push: Yes (package.json이 우선!)
   ```

4. **환경 변수로 오버라이드**
   ```bash
   export AI_COMMIT_AUTO_PUSH=true
   node test-config.js
   # → Auto-push: Yes (환경 변수가 우선!)
   ```

---

## 🔧 수동 빌드 및 실행 (다른 환경에서)

TypeScript를 컴파일할 수 있는 환경이라면:

### 1. 의존성 설치

```bash
cd /mnt/d/progress/mathesis/ai-commit

# 루트 의존성
npm install

# 각 패키지 의존성
cd packages/shared && npm install
cd ../cli && npm install
cd ../plugin-notion && npm install
```

### 2. 빌드

```bash
# Shared 먼저 빌드 (다른 패키지가 의존)
cd packages/shared
npx tsc

# CLI 빌드
cd ../cli
npx tsc

# Notion 플러그인 빌드
cd ../plugin-notion
npx tsc
```

### 3. 로컬 링크

```bash
# CLI를 전역으로 링크
cd packages/cli
npm link

# 이제 어디서든 사용 가능
ai-commit config
```

---

## 🧪 Config Command 테스트 체크리스트

### ✅ 기본 기능

- [ ] `node test-config.js` 실행됨
- [ ] 기본 설정 표시됨
- [ ] 플러그인 목록 표시됨
- [ ] 분석 설정 표시됨
- [ ] Git 설정 표시됨

### ✅ 설정 파일 감지

- [ ] `.commitrc.json` 인식됨
- [ ] `package.json > commitConfig` 인식됨
- [ ] 환경 변수 인식됨

### ✅ 민감 정보 보호

- [ ] `NOTION_TOKEN` → `***REDACTED***`
- [ ] `LINEAR_API_KEY` → `***REDACTED***`
- [ ] `JIRA_TOKEN` → `***REDACTED***`

### ✅ 출력 형식

- [ ] 사람이 읽기 쉬운 형식
- [ ] `--json` 옵션으로 JSON 출력
- [ ] 컬러 출력 (chalk)

---

## 💡 실제 사용 시나리오

### 시나리오 1: 새 프로젝트 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd my-new-project

# 2. AI-Commit 초기화 (빌드 후 사용 가능)
# ai-commit init

# 또는 수동 설정:

# 3. .env 파일 생성
cat > .env << 'EOF'
NOTION_TOKEN=your_token
NOTION_DATABASE_ID=your_db_id
EOF

# 4. .commitrc.json 생성
cat > .commitrc.json << 'EOF'
{
  "plugins": ["@ai-commit/plugin-notion"],
  "analysis": { "enabled": true },
  "git": { "autoPush": false }
}
EOF

# 5. 설정 확인
node /path/to/ai-commit/test-config.js
```

### 시나리오 2: 여러 프로젝트 관리

```bash
# 전역 토큰 설정 (한 번만)
echo 'export NOTION_TOKEN=your_token' >> ~/.bashrc
source ~/.bashrc

# 프로젝트 A
cd project-a
echo 'NOTION_DATABASE_ID=db_a_123' > .env

# 프로젝트 B
cd ../project-b
echo 'NOTION_DATABASE_ID=db_b_456' > .env

# 각 프로젝트에서 테스트
cd project-a && node /path/to/ai-commit/test-config.js
cd project-b && node /path/to/ai-commit/test-config.js
```

---

## 🐛 문제 해결

### 문제: "No configuration found"

**해결책**:
1. 현재 디렉토리 확인: `pwd`
2. `.env` 또는 `.commitrc.json` 존재 확인: `ls -la`
3. package.json에 commitConfig 추가

### 문제: "Token not found"

**해결책**:
1. 환경 변수 확인: `echo $NOTION_TOKEN`
2. .env 파일 확인: `cat .env`
3. 환경 변수 다시 로드: `source .env`

### 문제: "빌드가 안됨"

**해결책**:
1. 테스트 스크립트 사용: `node test-config.js`
2. 다른 환경에서 빌드 시도 (Mac/Windows)
3. Docker 사용 고려

---

## 📊 예상 출력

### 정상 출력 예시

```
═══════════════════════════════════════════
          AI-Commit Configuration
═══════════════════════════════════════════

🔌 Plugins
   ✓ @ai-commit/plugin-notion

🤖 Analysis
   Enabled: Yes
   Exclude Patterns: 3

📄 Output
   Directory: docs/commits
   Format: markdown

📦 Git
   Auto-push: No
   Require Tests: No

🔗 Integrations
   ✓ NOTION
      token: ***REDACTED***
      databaseId: your_db_id

═══════════════════════════════════════════
```

---

## 🚀 다음 단계

1. ✅ 테스트 스크립트로 설정 확인
2. ⏳ TypeScript 빌드 (다른 환경에서)
3. ⏳ 실제 CLI 명령어로 테스트
4. ⏳ 실제 커밋으로 전체 워크플로우 테스트

---

**작성일**: 2026-01-03
**작성자**: Claude Sonnet 4.5
