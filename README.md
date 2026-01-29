# Airtable Integration Skill

프로젝트에 Airtable MCP 서버 및 SDK 래퍼를 자동으로 설정해주는 Claude 스킬입니다.

## 개요

이 스킬은 Airtable을 프로젝트에 연동할 때 필요한 모든 설정을 자동화합니다:

- **MCP 서버**: Claude가 Airtable을 직접 읽고 쓸 수 있도록 설정
- **SDK 래퍼**: 프로젝트 코드에서 Airtable API를 사용할 수 있도록 설정  
- **스키마 캐싱**: 반복적인 API 호출과 토큰 낭비 방지
- **스냅샷 관리**: 정적 데이터를 로컬에 저장하여 효율성 극대화

## 호출 방법

다음 중 하나로 스킬을 호출할 수 있습니다:

```
"에어테이블 연동해줘"
"airtable 세팅"
"에어테이블 설정"
"Airtable 연동"
```

## 워크플로우

스킬을 호출하면 다음 단계 중 필요한 것을 선택할 수 있습니다:

| 단계 | 설명 | 생성 파일 |
|------|------|----------|
| **Step 1** | MCP 서버 설정 | `.mcp.json` |
| **Step 2** | SDK 래퍼 설치 | `lib/airtable.ts`, `lib/airtable.types.ts` |
| **Step 3** | 환경변수 가이드 | `.env.local` 설정 안내 |
| **Step 4** | 스키마 캐싱 | `.airtable/{baseName}/schema.md` |
| **Step 5** | 스냅샷 관리 | `.airtable/{baseName}/snapshots/*.json` |

## 주요 기능

### 1. MCP 서버 (Claude 전용)

Claude Code/Desktop에서 Airtable을 직접 조작할 수 있게 합니다.

**사용 가능한 도구 (15개)**:
- 읽기: `list_bases`, `list_tables`, `describe_table`, `list_records`, `search_records`, `get_record`
- 쓰기: `create_record`, `update_records`, `delete_records`, `create_table`, `update_table`, `create_field`, `update_field`
- 댓글: `create_comment`, `list_comments`

### 2. SDK 래퍼 (프로젝트 코드용)

TypeScript/JavaScript 프로젝트에서 Airtable API를 안전하게 사용할 수 있게 합니다.

```typescript
import { base, TABLES, escapeFormulaValue } from '@/lib/airtable'

// 안전한 쿼리 (Formula Injection 방지)
const safeInput = escapeFormulaValue(userInput)
const records = await base(TABLES.USERS)
  .select({ filterByFormula: `{이메일} = "${safeInput}"` })
  .all()
```

### 3. 스키마 캐싱

Airtable 테이블 구조를 로컬에 저장하여:
- API 호출 최소화 (Rate limit 보호)
- 토큰 사용량 절감 (테이블당 500-1000 토큰 절약)
- 빠른 작업 시작 가능

### 4. 스냅샷 관리

변경되지 않는 정적 데이터를 JSON으로 저장:
- 과거 결제 데이터
- 종료된 프로젝트 데이터
- 레퍼런스용 마스터 데이터

## 필요한 환경변수

| 변수명 | 용도 | 형식 |
|--------|------|------|
| `AIRTABLE_API_KEY` | Personal Access Token | `pat_XXXXXX...` |
| `AIRTABLE_BASE_ID` | 연동할 베이스 ID | `appXXXXXX...` |

### PAT 발급 방법

1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. 스코프 설정:
   - 필수: `schema.bases:read`, `data.records:read`
   - 쓰기: `schema.bases:write`, `data.records:write`
   - 댓글: `data.recordComments:read`, `data.recordComments:write`
4. Access에서 연동할 베이스 선택
5. 토큰 생성 후 복사

## 디렉토리 구조

스킬이 생성하는 파일 구조:

```
프로젝트/
├── .mcp.json                    # MCP 서버 설정 (Step 1)
├── lib/
│   ├── airtable.ts              # API 클라이언트 (Step 2)
│   └── airtable.types.ts        # 타입 정의 (Step 2)
├── .env.local                   # 환경변수 (Step 3)
└── .airtable/
    └── {baseName}/              # 한글 베이스명 (예: 파트너스)
        ├── schema.md            # 스키마 캐시 (Step 4)
        └── snapshots/           # 데이터 스냅샷 (Step 5)
            └── *.json
```

## API 사용 시 주의사항

### Rate Limit
- **제한**: 5 requests/second per base
- **해결**: 배치 작업, 딜레이 추가

### Pagination
- **기본**: 100 records per request
- **해결**: `offset` 파라미터로 순회

### Batch Operations
- `update_records`: 최대 10건/호출
- `delete_records`: 최대 10건/호출

### Best Practices

```javascript
// 뷰 사용 금지 (숨겨진 필터 문제)
list_records(baseId, tableId, { view: 'Active' })

// 명시적 필터 사용 (권장)
list_records(baseId, tableId, {
  filterByFormula: `{Status} = "Active"`,
  maxRecords: 50
})
```

## 참조 문서

스킬에 포함된 상세 문서:

| 문서 | 용도 |
|------|------|
| `references/usage-guide.md` | SDK 래퍼 사용법 |
| `references/llm-rules.md` | API 효율화 규칙 |
| `references/schema-template.md` | 스키마 문서 형식 |
| `references/claude-context.md` | CLAUDE.md 템플릿 |
| `assets/schema-generator.md` | 스키마 자동 생성 가이드 |

## 스킬 구성

```
airtable-integration/
├── SKILL.md                     # 스킬 정의 (메인)
├── assets/
│   ├── mcp-config.json          # MCP 설정 템플릿
│   ├── airtable.ts              # SDK 래퍼 템플릿
│   ├── airtable.types.ts        # 타입 정의 템플릿
│   └── schema-generator.md      # 스키마 생성 가이드
└── references/
    ├── usage-guide.md           # 사용 가이드
    ├── llm-rules.md             # LLM 에이전트 규칙
    ├── schema-template.md       # 스키마 템플릿
    └── claude-context.md        # CLAUDE.md 템플릿
```

## 라이선스

이 스킬은 개인 사용 목적으로 제작되었습니다.
