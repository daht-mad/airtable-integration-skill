---
name: airtable-integration
description: 에어테이블 베이스 연동 자동화. 프로젝트에 에어테이블 MCP 서버와 SDK 래퍼를 세팅한다. "에어테이블 연동해줘", "airtable 세팅", "에어테이블 설정" 등으로 호출.
---

# 에어테이블 연동

프로젝트에 Airtable MCP 서버 및 SDK 래퍼를 설정하는 스킬. 3단계 중 필요한 단계만 선택 가능.

## 워크플로우 개요

사용자에게 어떤 단계를 진행할지 먼저 확인한다:

```
에어테이블 연동을 설정합니다. 어떤 항목을 세팅할까요?

1. **MCP 서버** — Claude가 에어테이블을 직접 읽고 쓸 수 있도록 설정
2. **SDK 래퍼** — 프로젝트 코드에서 에어테이블 API를 사용할 수 있도록 설정
3. **환경변수 가이드** — .env.local에 필요한 키 안내

전부 할까요, 아니면 특정 단계만 선택할까요?
```

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
- 필드 타입별 TypeScript 타입 매핑
- 주의사항 (Lookup, Link 필드, 뷰 사용)
