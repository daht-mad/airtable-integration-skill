---
name: airtable-integration
description: 에어테이블 베이스 연동 자동화. 프로젝트에 에어테이블 MCP 서버와 SDK 래퍼를 세팅한다. "에어테이블 연동해줘", "airtable 세팅", "에어테이블 설정" 등으로 호출.
---

# 에어테이블 연동

프로젝트에 Airtable MCP 서버 및 SDK 래퍼를 설정하는 스킬. 기본 설치(Step 1-4)는 모두 필수이며, 스냅샷(Step 5)만 선택 사항이다.

## 워크플로우 개요

사용자에게 설치 진행 여부를 확인한다:

```
에어테이블 연동을 설정합니다. 다음 항목이 모두 설치됩니다:

**기본 설치 (필수):**
1. MCP 서버 — Claude가 에어테이블을 직접 읽고 쓸 수 있도록 설정
2. SDK 래퍼 — 프로젝트 코드에서 에어테이블 API를 사용할 수 있도록 설정
3. 환경변수 가이드 — .env.local에 필요한 키 안내 (API_KEY + BASE_ID)
4. 스키마 캐싱 — 테이블 구조를 로컬에 저장하여 토큰 절약

**선택 항목:**
5. 스냅샷 — 정적 데이터를 JSON으로 저장 (필요할 때 추가)

진행할까요?
```

> **중요**: Step 1-4는 모두 필수이다. SDK 래퍼(Step 2)가 없으면 프로젝트 코드에서 Airtable API를 사용할 수 없고, 스키마 캐싱(Step 4)이 없으면 매번 API를 호출해서 토큰을 낭비한다.

### 기본 설치 흐름

"기본 설치" 선택 시 다음 순서로 진행:

1. **Step 1-3 완료** (MCP + SDK + 환경변수)
2. **Step 4 자동 진행**: 환경변수에서 Base ID 확인 → MCP로 테이블 조회 → 스키마 파일 생성
3. 완료 안내

---

## Step 1: MCP 서버 설정

프로젝트 루트에 `.mcp.json`을 생성하여 `airtable-mcp-server`를 등록한다.

### 1-1. 기존 파일 확인

프로젝트 루트에 `.mcp.json`이 이미 존재하는지 확인한다.

- **파일이 없는 경우**: `assets/mcp-config.json` 템플릿을 기반으로 새로 생성한다.
- **파일이 있는 경우**: 기존 내용을 읽고 `airtable` 서버가 이미 등록되어 있는지 확인한다.
  - 이미 등록됨 → 사용자에게 알리고 이 단계를 건너뛴다.
  - 등록 안 됨 → 기존 `mcpServers`에 `airtable` 항목을 추가한다.

> **⚠️ 덮어쓰기 경고**: `.mcp.json`이 이미 존재할 경우, 기존 설정을 덮어쓰지 않도록 주의해야 한다. 반드시 기존 내용을 보존하면서 병합한다.

### 1-2. 설정 내용

```json
{
  "mcpServers": {
    "airtable": {
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": {
        "AIRTABLE_API_KEY": "pat_YOUR_KEY_HERE"
      }
    }
  }
}
```

### 1-3. 사용자 확인

생성/수정 전 반드시 사용자에게 확인을 받는다:

```
MCP 서버를 설정합니다. 확인해주세요:

- **파일**: 프로젝트루트/.mcp.json
- **서버**: airtable (airtable-mcp-server)
- **API 키**: 환경변수에서 읽음 (pat_YOUR_KEY_HERE → 실제 키로 교체 필요)

진행할까요?
```

승인 후 파일을 생성/수정한다.

### 1-4. .gitignore 확인

`.mcp.json`에 API 키가 포함되므로 `.gitignore`에 추가 여부를 사용자에게 확인한다:

```
.mcp.json에 API 키가 포함됩니다. .gitignore에 추가할까요? (권장: 추가)
```

### 1-5. MCP 도구 목록

설정 완료 후 사용 가능한 도구 (15개):

**읽기 도구 (6개)**

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `list_bases` | 접근 가능한 베이스 목록 | (없음) |
| `list_tables` | 베이스 내 테이블 목록 | baseId, detailLevel |
| `describe_table` | 테이블 상세 정보 | baseId, tableId, detailLevel |
| `list_records` | 레코드 목록 조회 | baseId, tableId, maxRecords, filterByFormula, sort, view |
| `search_records` | 텍스트 검색 | baseId, tableId, searchTerm, fieldIds, maxRecords |
| `get_record` | 단일 레코드 조회 | baseId, tableId, recordId |

**쓰기 도구 (7개)**

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `create_record` | 레코드 생성 | baseId, tableId, fields |
| `update_records` | 레코드 수정 (**최대 10건/호출**) | baseId, tableId, records[{id, fields}] |
| `delete_records` | 레코드 삭제 | baseId, tableId, recordIds[] |
| `create_table` | 테이블 생성 | baseId, name, fields[], description |
| `update_table` | 테이블 이름/설명 수정 | baseId, tableId, name, description |
| `create_field` | 필드 추가 | baseId, tableId, nested.field{} |
| `update_field` | 필드 이름/설명 수정 | baseId, tableId, fieldId, name, description |

**댓글 도구 (2개)**

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `create_comment` | 레코드에 댓글 작성 | baseId, tableId, recordId, text |
| `list_comments` | 레코드 댓글 목록 | baseId, tableId, recordId, pageSize, offset |

> **주의**: `update_records`는 1회 호출당 최대 10건만 수정 가능하다. 10건 초과 시 여러 번 호출해야 한다.
> **주의**: `list_records`는 기본 최대 100건을 반환한다.
> **주의**: `list_tables`, `describe_table`의 `detailLevel` 파라미터(`tableIdentifiersOnly`, `identifiersOnly`, `full`)로 컨텍스트 사용량을 조절할 수 있다.

---

## Step 2: SDK 래퍼 설치

프로젝트 코드에서 Airtable API를 직접 사용할 수 있도록 SDK 래퍼 파일을 설치한다.

### 2-1. 패키지 설치

```bash
npm install airtable
```

### 2-2. 기존 파일 확인

다음 파일이 이미 존재하는지 확인한다:
- `lib/airtable.ts` (또는 프로젝트 구조에 맞는 경로)
- `lib/airtable.types.ts`

> **⚠️ 덮어쓰기 경고**: 파일이 이미 존재하면 사용자에게 알린다.
> ```
> ⚠️ 다음 파일이 이미 존재합니다:
> - lib/airtable.ts
>
> 덮어쓸까요, 건너뛸까요?
> ```

### 2-3. 파일 복사

`assets/` 디렉토리의 템플릿 파일을 프로젝트에 복사한다:

| 원본 (assets/) | 대상 (프로젝트) | 설명 |
|----------------|-----------------|------|
| `airtable.ts` | `lib/airtable.ts` | API 클라이언트, TABLES 상수, escapeFormulaValue |
| `airtable.types.ts` | `lib/airtable.types.ts` | 타입 정의 템플릿 |

대상 경로는 프로젝트 구조에 따라 조정한다 (`src/lib/`, `utils/` 등).

### 2-4. 사용자 확인

파일 생성 전 확인:

```
SDK 래퍼를 설치합니다. 확인해주세요:

- **패키지**: airtable (npm)
- **파일 생성**:
  - lib/airtable.ts — API 클라이언트 및 유틸리티
  - lib/airtable.types.ts — 타입 정의 템플릿
- **필요 환경변수**: AIRTABLE_API_KEY, AIRTABLE_BASE_ID

진행할까요?
```

### 2-5. 설치 후 안내

```
SDK 래퍼 설치 완료. 다음 작업이 필요합니다:

1. lib/airtable.ts의 TABLES 상수에 테이블 ID 추가
2. lib/airtable.types.ts에 테이블별 레코드 타입 정의
3. .env.local에 AIRTABLE_API_KEY, AIRTABLE_BASE_ID 설정 (Step 3 참고)
```

---

## Step 3: 환경변수 가이드

### 3-1. 필요한 환경변수

| 변수명 | 용도 | 형식 | 필요 단계 |
|--------|------|------|-----------|
| `AIRTABLE_API_KEY` | Personal Access Token | `pat_YOUR_KEY_HERE` | MCP, SDK 모두 |
| `AIRTABLE_BASE_ID` | 연동할 베이스 ID | `appYOUR_BASE_ID_HERE` | SDK만 |

### 3-2. PAT 발급 안내

```
Airtable Personal Access Token 발급 방법:

1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. 스코프 설정:
   - 필수: schema.bases:read, data.records:read
   - 쓰기: schema.bases:write, data.records:write
   - 댓글: data.recordComments:read, data.recordComments:write
4. Access에서 연동할 베이스 선택
5. 토큰 생성 후 복사
```

### 3-3. .env.local 설정

```bash
# Airtable
AIRTABLE_API_KEY=pat_YOUR_KEY_HERE
AIRTABLE_BASE_ID=appYOUR_BASE_ID_HERE
```

> `.env.local`이 `.gitignore`에 포함되어 있는지 반드시 확인한다.

### 3-4. Base ID 확인 방법

```
Base ID 확인: Airtable 베이스를 브라우저에서 열면 URL이 다음과 같다:
https://airtable.com/appXXXXXXXXXXXXXX/...
                      ^^^^^^^^^^^^^^^^^^
                      이 부분이 Base ID
```

---

## Step 4: 스키마 캐싱 ⭐ 기본 설치 포함

> **이 단계는 기본 설치 시 자동으로 진행된다.** Step 1-3 완료 후 환경변수에서 Base ID를 읽어 스키마를 자동 생성한다.

Airtable 테이블 구조를 프로젝트에 캐시하여 반복적인 API 호출과 토큰 낭비를 방지한다.

### 4-1. 스키마 캐싱이 필요한 이유

**문제점**:
- 매번 `describe_table` API 호출 → Rate limit 소모, 응답 대기 시간
- 테이블 스키마는 자주 변경되지 않음
- 필드명, 타입 정보를 반복 확인 → 토큰 낭비 (1 테이블당 500-1000 토큰)

**해결책**:
- 스키마를 `.airtable/{baseName}/schema.md` 파일로 저장 (한글 베이스명 사용)
- Claude가 작업 전에 이 파일을 읽어서 구조 파악
- API 호출 없이 즉시 작업 가능

### 4-2. 폴더명 규칙

```
.airtable/{baseName}/schema.md

예시:
.airtable/파트너스/schema.md
.airtable/스터디관리/schema.md
```

- **{baseName}**: 한글 베이스명 (직관적, 알아보기 쉬움)
- 베이스명은 사용자에게 확인하거나 MCP `list_bases`로 조회

### 4-3. 스키마 생성 워크플로우

#### 기본 설치 시 (자동 진행)

Step 1-3 완료 후 다음 순서로 자동 진행:

1. `.env.local`에서 `AIRTABLE_BASE_ID` 읽기
2. **사용자에게 베이스명(폴더명) 확인**: "이 베이스의 이름을 뭐라고 할까요? (예: 파트너스)"
3. MCP 도구로 테이블 목록 조회 (`list_tables`)
4. 각 테이블 스키마 조회 (`describe_table`)
5. **스키마를 마크다운으로 변환** (`assets/schema-generator.md` 참조)
6. **⚠️ Write 도구로 `.airtable/{baseName}/schema.md`에 저장** (필수!)
7. 완료 안내

> **주의**: 스키마를 생성했으면 **반드시 파일에 저장**해야 한다. 화면에 출력만 하고 끝내면 안 된다!

```
스키마 생성 완료:
- 파일: .airtable/{baseName}/schema.md
- 테이블: N개
- 필드: M개

이제 Claude가 Airtable 작업 시 이 파일을 자동으로 참조합니다.
```

#### 수동 설치 시 (또는 새 프로젝트에서 스킬 없이)

**1단계: 베이스명 확인**

사용자에게 폴더명으로 사용할 베이스명 확인:
```
이 베이스의 이름을 뭐라고 할까요? (예: 파트너스, 스터디관리)
```

**2단계: API로 자동 생성**

```
스키마를 API로 자동 생성합니다.
```

1. `list_tables(baseId, detailLevel: 'tableIdentifiersOnly')` 호출
2. 각 테이블별로 `describe_table(baseId, tableId, detailLevel: 'full')` 호출
3. `references/schema-template.md` 형식으로 변환
4. `.airtable/{baseName}/schema.md` 생성 (Write 도구로 저장!)

변환 규칙은 `assets/schema-generator.md`를 참조

**3단계: USER-ADDED 영역 안내**

생성 후 사용자에게 안내:
```
스키마가 생성되었습니다: .airtable/{baseName}/schema.md

다음을 추가하면 더 유용합니다 (선택사항):
- 비즈니스 컨텍스트 (필드 용도, 제약조건)
- 주요 조회 패턴 (filterByFormula 예시)
- 주의사항 (특정 필드 관련 버그, 알려진 이슈)

이 내용은 <!-- USER-ADDED --> 영역에 추가하세요.
```

### 4-3. 스키마 자동 갱신 (CRITICAL) ⚡

**다음 MCP 도구 사용 후에는 반드시 스키마 파일을 갱신해야 한다:**

| 스키마 변경 도구 | 변경 내용 |
|-----------------|----------|
| `create_table` | 새 테이블 추가됨 |
| `update_table` | 테이블 메타데이터 변경 |
| `create_field` | 새 필드 추가됨 |
| `update_field` | 필드 정보 변경 |

**자동 갱신 절차** (도구 호출 직후 수행):
1. 변경된 테이블에 대해 `describe_table(baseId, tableId, detailLevel: 'full')` 호출
2. `.airtable/{baseName}/schema.md`에서 해당 테이블 섹션 업데이트
3. `<!-- USER-ADDED -->` 영역은 반드시 보존
4. 사용자에게 "스키마 갱신 완료: {테이블명}" 알림

> **CRITICAL**: 이 자동 갱신은 에이전틱 루프에서 자동으로 수행된다. 스키마 변경 도구 사용 후 다른 작업으로 넘어가기 전에 반드시 스키마 파일을 업데이트해야 한다.

### 4-4. 수동 스키마 갱신

사용자가 Airtable 웹에서 직접 필드를 변경한 경우, 명시적으로 요청:

```
"스키마 갱신해줘"
"Airtable 스키마 refresh"
```

**갱신 절차**:
1. 기존 `schema.md`에서 `<!-- USER-ADDED -->` 블록 추출 및 백업
2. `describe_table` API로 `<!-- AUTO-GENERATED -->` 블록 재생성
3. 백업한 `<!-- USER-ADDED -->` 블록 복원
4. 파일 저장

### 4-5. 스키마 사용 방법

**Claude 작업 시**:
```
작업 전 스키마 확인 체크리스트:
1. .airtable/{baseName}/schema.md 파일 존재 확인
2. 파일 읽기 (Read 도구 사용)
3. 필요한 테이블/필드 정보 확인
4. 작업 진행
```

**SDK 코드에서**:
- `schema.md`를 보고 `lib/airtable.ts`의 `TABLES` 상수 작성
- `schema.md`를 보고 `lib/airtable.types.ts`의 타입 정의 작성

### 4-6. 스키마 파일 구조

```
.airtable/
└── 파트너스/               # 한글 베이스명
    ├── schema.md           # 테이블 스키마 (메인)
    └── snapshots/          # 정적 데이터 스냅샷 (Step 5)
```

**schema.md 형식**: `references/schema-template.md` 참조

---

## Step 5: 스냅샷 관리

자주 변경되지 않는 정적 데이터를 JSON 파일로 저장하여 불필요한 API 호출을 방지한다.

### 5-1. 스냅샷이 필요한 경우

**적합한 데이터**:
- 과거 결제 데이터 (확정됨, 변경 없음)
- 종료된 기수의 스터디 데이터
- 레퍼런스용 마스터 데이터 (상품 카탈로그 등)
- 통계/분석용 과거 스냅샷

**부적합한 데이터**:
- 실시간 변경되는 데이터 (주문 상태, 사용자 액션 등)
- 동기화가 중요한 데이터
- 민감한 개인정보 (별도 보안 정책 필요)

### 5-2. 스냅샷 생성 워크플로우

**사용자 요청**:
```
"Users 테이블 스냅샷 떠줘"
"2024년 결제 데이터 스냅샷 생성해줘"
```

**생성 절차**:

**1단계: 데이터 조회**

```javascript
// Pagination 처리하여 전체 데이터 가져오기
let offset = undefined
let allRecords = []
do {
  const response = await list_records(baseId, tableId, {
    maxRecords: 100,
    offset,
    filterByFormula: `{Year} = 2024`  // 필요시 필터 적용
  })
  allRecords.push(...response.records)
  offset = response.offset
} while (offset)
```

**2단계: 파일 저장**

```bash
# 파일명 형식: {tableName}-{YYYYMMDD}.json
.airtable/파트너스/snapshots/Users-20260128.json
.airtable/파트너스/snapshots/Payments2024-20260128.json
```

**3단계: 파일 크기 경고**

```
스냅샷 생성 완료:
- 파일: .airtable/파트너스/snapshots/Users-20260128.json
- 크기: 856 KB (123 레코드)

⚠️ 파일 크기가 1MB를 초과하면:
- Claude 읽기 성능 저하
- 토큰 사용량 증가
→ filterByFormula로 범위를 좁히는 것을 권장합니다.
```

**4단계: .gitignore 확인**

민감한 데이터가 포함될 수 있으므로 확인:

```
스냅샷에 민감한 정보가 포함되어 있나요?
(이메일, 전화번호, 결제정보 등)

포함된 경우 .gitignore에 추가를 권장합니다:

# .gitignore
.airtable/*/snapshots/
```

### 5-3. 스냅샷 사용 방법

**Claude가 분석할 때**:

```bash
# Read 도구로 JSON 파일 읽기
Read .airtable/파트너스/snapshots/Users-20260128.json

# 데이터 분석, 통계, 검증 작업 수행
```

**SDK 코드에서 사용**:

```typescript
// JSON import
import usersSnapshot from './.airtable/파트너스/snapshots/Users-20260128.json'

// 타입 정의
import { UserRecord } from './lib/airtable.types'

const users: UserRecord[] = usersSnapshot.records.map(r => ({
  id: r.id,
  fields: r.fields
}))

// 분석, 필터링 등
const activeUsers = users.filter(u => u.fields.Status === '활성')
```

### 5-4. 스냅샷 vs 실시간 조회

| 기준 | 스냅샷 | 실시간 조회 (list_records) |
|------|--------|---------------------------|
| **데이터 신선도** | 생성 시점 고정 | 항상 최신 |
| **API 호출** | 0회 (파일 읽기만) | 매번 필요 |
| **Rate limit 영향** | 없음 | 있음 (5 req/sec) |
| **토큰 사용** | 파일 크기에 비례 | API 응답 크기에 비례 |
| **적합한 경우** | 정적/과거 데이터 | 동적/실시간 데이터 |

**권장사항**:
- 변경되지 않는 데이터 → 스냅샷 (1회 생성, 무한 재사용)
- 자주 변경되는 데이터 → 실시간 조회 (filterByFormula로 최소화)

### 5-5. 스냅샷 관리

**파일명 규칙**:
```
{tableName}-{YYYYMMDD}.json       # 기본
{tableName}-{설명}-{YYYYMMDD}.json # 설명 포함

예시:
Users-20260128.json
Payments-2024년결산-20260128.json
StudyGroups-3기-20260115.json
```

**디렉토리 구조**:
```
.airtable/
└── 파트너스/                # 한글 베이스명
    ├── schema.md
    └── snapshots/
        ├── Users-20260128.json
        ├── Payments-2024년결산-20260128.json
        └── .gitignore  # (필요시)
```

**갱신 정책**:
- ⚠️ 자동 갱신 없음 (수동 생성만)
- 필요시 새 파일명으로 재생성 (날짜 변경)
- 이전 스냅샷 유지 (버전 히스토리)

### 5-6. 주의사항

**민감 데이터**:
- 개인정보 포함 여부 반드시 확인
- `.gitignore`에 추가 권장
- 필요시 필드 마스킹 후 저장

**파일 크기**:
- 1MB 초과 시 Claude 성능 저하
- 큰 테이블은 필터링 필수 (`filterByFormula`)
- 예: 전체 Users 대신 → 특정 기간, 특정 상태만

**LLM 규칙 참조**:
- Pagination 처리 필수 (100건 제한)
- `filterByFormula` 권장
- Rate limit 고려 (5 req/sec)

상세 규칙: `references/llm-rules.md` 참조

---

## 기본값

| 항목 | 기본값 |
|------|--------|
| MCP 서버 패키지 | `airtable-mcp-server` |
| SDK 패키지 | `airtable` |
| MCP 설정 파일 | 프로젝트루트/.mcp.json |
| SDK 래퍼 경로 | `lib/airtable.ts` |
| 타입 정의 경로 | `lib/airtable.types.ts` |
| API 키 형식 | `pat_` 접두사 (Personal Access Token) |

---

## 업그레이드 패스: Zod + Field ID 패턴

기본 설치는 필드 이름 기반이다. 프로덕션 수준의 타입 안전성이 필요한 경우 Zod + Field ID 패턴으로 업그레이드할 수 있다.

이 패턴은 다음과 같은 경우에만 권장한다:
- 필드 이름이 자주 변경되는 환경
- 런타임 타입 검증이 필요한 경우
- API 응답을 엄격하게 파싱해야 하는 경우

업그레이드 시 추가 작업:
1. `npm install zod` 설치
2. Airtable 필드 ID(`fldXXXXXX`) 기반으로 조회하도록 SDK 래퍼 수정
3. Zod 스키마로 레코드 파싱 레이어 추가
4. `cellFormat: 'string'`, `returnFieldsByFieldId: true` 옵션 사용

> 이 패턴은 기본 설치에 포함하지 않는다. 사용자가 명시적으로 요청할 때만 적용한다.

---

## 참조 문서

이 스킬에 포함된 외부 템플릿 문서들을 다음 상황에서 참조하세요:

### `references/usage-guide.md`
**언제 읽을까**: SDK 래퍼 설치 후 실제 사용 방법을 알고 싶을 때

새 프로젝트에서 Airtable을 빠르게 연동하기 위한 실전 가이드입니다.
- 파일 복사 방법
- TABLES 상수 수정
- 타입 정의 방법
- escapeFormulaValue 사용법
- 주의사항 (뷰 사용 금지, Lookup 필드 처리 등)

### `references/claude-context.md`
**언제 읽을까**: 프로젝트 CLAUDE.md를 작성할 때

프로젝트의 CLAUDE.md에 추가할 Airtable 섹션 템플릿입니다.
- 환경 설정 예시
- 테이블 구조 문서화 방법
- Airtable 쿼리 규칙 (뷰 사용 금지, 입력 이스케이프, Lookup/Link 필드 처리)
- 관련 파일 참조

### `references/schema-template.md`
**언제 읽을까**: 스키마 문서를 작성하거나 필드 타입을 확인할 때

프로젝트에서 사용하는 Airtable 테이블과 필드 정보를 정리하는 템플릿입니다.
- 테이블 목록 작성 방법
- 필드 목록 및 상세 설명 작성
- AUTO-GENERATED / USER-ADDED 영역 분리
- 필드 타입별 TypeScript 타입 매핑
- 주의사항 (Lookup, Link 필드, 뷰 사용)

### `references/llm-rules.md`
**언제 읽을까**: Airtable 작업 시 API 제한과 베스트 프랙티스를 확인할 때

LLM 에이전트가 Airtable API를 효율적으로 사용하기 위한 규칙 문서입니다.
- API 제약사항 (rate limit 5/sec, pagination 100 limit, batch 10 limit)
- 쿼리 베스트 프랙티스 (filterByFormula 필수, escaping, detailLevel)
- 스키마 관리 (캐싱, 참조 시점, 갱신 타이밍)
- 안티패턴 (7가지 흔한 실수와 해결책)
- MCP 도구 레퍼런스 (15개 도구 요약)

### `assets/schema-generator.md`
**언제 읽을까**: API로 스키마 파일을 자동 생성할 때

Claude가 `describe_table` MCP 도구를 사용하여 schema.md를 자동 생성하는 절차 가이드입니다.
- 단계별 MCP 호출 절차 (list_tables, describe_table)
- API 응답 → Markdown 변환 규칙
- 타입 매핑 테이블 (20+ Airtable 타입)
- Options 변환 규칙 (single select, links, rollup)
- 스키마 갱신 (regeneration) 절차
- 에러 처리 및 주의사항
