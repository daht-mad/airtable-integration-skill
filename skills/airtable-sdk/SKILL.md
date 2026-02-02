---
name: airtable-sdk
description: SDK 스크립트 기반 Airtable 연동. MCP 없이 토큰 효율적으로 Airtable을 조작한다. "에어테이블 SDK", "airtable sdk", "에어테이블 스크립트" 등으로 호출.
---

# Airtable SDK Skill

MCP 없이 SDK 스크립트로 Airtable을 조작하는 스킬. 스키마를 JSON으로 캐싱하여 토큰 사용량을 ~55% 절감한다.

## 개요

### 왜 SDK 방식인가?

| 항목 | MCP 방식 | SDK 방식 |
|------|----------|----------|
| 세션 초기화 | ~7,500 토큰 (15개 도구 정의) | 0 토큰 |
| 스키마 조회 | API 호출 필요 | JSON 파일 읽기 |
| 스키마 변경 대응 | 수동 | 자동 (create-field 후 sync) |

### 핵심 특징

- **토큰 절약**: MCP 도구 정의 오버헤드 없음
- **스키마 캐싱**: `schema-summary.json` (~500 토큰)
- **자동 동기화**: 필드 생성 시 스키마 자동 갱신
- **Formula Injection 방지**: `escapeFormulaValue()` 내장

---

## 사전 요구사항

### 1. Bun 설치 확인

```bash
bun --version
# 1.0.0 이상 필요
```

없으면 설치:
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. 환경변수 설정

```bash
export AIRTABLE_API_KEY="pat_XXXXX..."
export AIRTABLE_BASE_ID="appXXXXX..."
```

#### PAT 발급 방법

1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. 스코프 설정:
   - **필수**: `schema.bases:read`, `data.records:read`
   - **쓰기**: `schema.bases:write`, `data.records:write`
4. Access에서 연동할 베이스 선택
5. 토큰 생성 후 복사

### 3. 스키마 동기화

첫 사용 전 스키마를 로컬에 캐싱:

```bash
bun run skills/airtable-sdk/scripts/sync-schema.ts
```

생성되는 파일:
- `references/schema-summary.json` - 테이블/필드명 요약 (~500 토큰)
- `references/schema-full.json` - 전체 상세 (타입, 옵션 포함)

---

## 스크립트 사용법

모든 스크립트 경로: `skills/airtable-sdk/scripts/`

### 스키마 동기화

```bash
bun run sync-schema.ts
bun run sync-schema.ts --help
```

### 레코드 생성 (create.ts)

```bash
# 단일 레코드 생성
bun run create.ts --table Users --fields '{"이름":"홍길동","이메일":"hong@example.com"}'
```

**출력**:
```json
{
  "success": true,
  "recordId": "recXXXXXXXXXXXXXX",
  "fields": { "이름": "홍길동", "이메일": "hong@example.com" }
}
```

### 레코드 조회 (read.ts)

```bash
# 전체 조회
bun run read.ts --table Users

# 필터 + 최대 건수
bun run read.ts --table Users --filter '{상태}="활성"' --max 50

# 특정 필드만 조회
bun run read.ts --table Users --fields '["이름","이메일"]'
```

**출력**:
```json
{
  "success": true,
  "count": 25,
  "records": [
    { "id": "recXXX", "fields": { "이름": "홍길동", "이메일": "hong@example.com" } }
  ]
}
```

### 레코드 수정 (update.ts)

```bash
# 단일/다중 레코드 수정 (10건 초과 시 자동 분할)
bun run update.ts --table Users --records '[{"id":"recXXX","fields":{"상태":"비활성"}}]'
```

**출력**:
```json
{
  "success": true,
  "updatedCount": 1,
  "recordIds": ["recXXX"]
}
```

### 레코드 삭제 (delete.ts)

```bash
# --confirm 플래그 필수 (안전장치)
bun run delete.ts --table Users --ids '["recXXX","recYYY"]' --confirm
```

**출력**:
```json
{
  "success": true,
  "deletedCount": 2,
  "recordIds": ["recXXX", "recYYY"]
}
```

### 필드 생성 (create-field.ts)

```bash
# 텍스트 필드
bun run create-field.ts --table Users --field '{"name":"메모","type":"multilineText"}'

# Single select 필드
bun run create-field.ts --table Users --field '{"name":"등급","type":"singleSelect","options":{"choices":[{"name":"일반"},{"name":"프리미엄"}]}}'

# 스키마 동기화 건너뛰기
bun run create-field.ts --table Users --field '...' --no-sync
```

**출력**:
```json
{
  "success": true,
  "fieldId": "fldXXXXXXXXXXXXXX",
  "fieldName": "등급",
  "schemaSynced": true
}
```

---

## 스키마 동기화 전략

### 언제 스키마를 동기화하는가?

| 상황 | 동작 |
|------|------|
| 작업 시작 시 | `schema-summary.json` 읽기 |
| `create-field.ts` 실행 후 | **자동** 동기화 |
| 필드 에러 발생 시 | `sync-schema.ts` 실행 후 재시도 |
| 사용자가 "스키마 싱크" 요청 시 | `sync-schema.ts` 실행 |

### 작업 전 체크리스트

1. `schema-summary.json` 읽어서 테이블/필드명 확인
2. 필요 시 `schema-full.json`에서 타입 상세 확인
3. 사용자 입력에 `escapeFormulaValue()` 적용

---

## 에러 처리

### 필드 관련 에러

```
UNKNOWN_FIELD_NAME: "fld123" is not a valid field name
```

**복구**:
1. `sync-schema.ts` 실행
2. `schema-summary.json`에서 올바른 필드명 확인
3. 수정된 필드명으로 재시도

### Rate Limit 에러

- 스크립트 내장 재시도 로직 (최대 5회, 지수 백오프)
- 지속적 실패 시 잠시 대기 후 재시도

### 인증 에러

- `AIRTABLE_API_KEY` 환경변수 확인
- PAT 만료 여부 확인
- PAT scope 확인 (schema.bases:read/write, data.records:read/write)

---

## 참조 문서

| 파일 | 용도 |
|------|------|
| `references/schema-summary.json` | 테이블/필드명 요약 |
| `references/schema-full.json` | 전체 스키마 상세 |
| `references/llm-rules.md` | LLM 에이전트 사용 규칙 |

---

## 디렉토리 구조

```
skills/airtable-sdk/
├── SKILL.md                     # 이 문서
├── references/
│   ├── schema-summary.json      # 스키마 요약 (~500 토큰)
│   ├── schema-full.json         # 스키마 전체
│   └── llm-rules.md             # LLM 규칙
└── scripts/
    ├── lib/
    │   └── airtable.ts          # SDK 래퍼 라이브러리
    ├── sync-schema.ts           # 스키마 동기화
    ├── create.ts                # 레코드 생성
    ├── read.ts                  # 레코드 조회
    ├── update.ts                # 레코드 수정
    ├── delete.ts                # 레코드 삭제
    └── create-field.ts          # 필드 생성 (+ 자동 sync)
```

---

## API 제약사항 요약

| 제약 | 값 | 스크립트 대응 |
|------|-----|---------------|
| Rate Limit | 5 req/sec per base | `fetchWithRetry()` 자동 재시도 |
| Pagination | 100 records max | `read.ts` 자동 처리 |
| Batch Update | 10 records max | `update.ts` 자동 분할 |
| Batch Delete | 10 records max | `delete.ts` 자동 분할 |

---

## Quick Reference

```bash
# 스키마 동기화
bun run skills/airtable-sdk/scripts/sync-schema.ts

# CRUD 작업
bun run skills/airtable-sdk/scripts/create.ts --table <테이블> --fields '<JSON>'
bun run skills/airtable-sdk/scripts/read.ts --table <테이블> [--filter '<수식>'] [--max <N>]
bun run skills/airtable-sdk/scripts/update.ts --table <테이블> --records '<JSON>'
bun run skills/airtable-sdk/scripts/delete.ts --table <테이블> --ids '<JSON>' --confirm

# 필드 생성
bun run skills/airtable-sdk/scripts/create-field.ts --table <테이블> --field '<JSON>'

# 도움말
bun run skills/airtable-sdk/scripts/<script>.ts --help
```
