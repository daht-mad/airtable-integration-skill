# Airtable 스키마 자동 생성 가이드

이 문서는 Claude가 Airtable MCP 도구를 사용하여 schema.md 파일을 자동으로 생성하는 절차를 정의합니다.

## 언제 사용하는가

- 새 프로젝트에서 Airtable 연동 시 스키마 파일이 필요할 때
- 기존 프로젝트에 없는 베이스를 추가할 때
- 사용자가 "스키마 생성해줘" 요청할 때

## 생성 절차

### Step 1: 테이블 목록 조회

```
MCP Tool: list_tables
Parameters:
  baseId: {사용자가 제공한 베이스 ID}
  detailLevel: 'tableIdentifiersOnly'
```

**응답 예시**:
```json
{
  "tables": [
    {
      "id": "tblUSERS123456789",
      "name": "Users"
    },
    {
      "id": "tblORDERS987654321",
      "name": "Orders"
    }
  ]
}
```

### Step 2: 각 테이블의 상세 스키마 조회

각 테이블에 대해 반복:

```
MCP Tool: describe_table
Parameters:
  baseId: {베이스 ID}
  tableId: {테이블 ID}
  detailLevel: 'full'
```

**응답 예시** (일부):
```json
{
  "table": {
    "id": "tblUSERS123456789",
    "name": "Users",
    "description": "사용자 정보",
    "fields": [
      {
        "id": "fldNAME123",
        "name": "이름",
        "type": "singleLineText",
        "description": "사용자 실명"
      },
      {
        "id": "fldSTATUS456",
        "name": "상태",
        "type": "singleSelect",
        "options": {
          "choices": [
            { "id": "selACTIVE", "name": "활성", "color": "greenBright" },
            { "id": "selINACTIVE", "name": "비활성", "color": "redBright" }
          ]
        }
      },
      {
        "id": "fldORDERS789",
        "name": "연결된_주문",
        "type": "multipleRecordLinks",
        "options": {
          "linkedTableId": "tblORDERS987654321"
        }
      }
    ]
  }
}
```

### Step 3: schema.md 형식으로 변환

`references/schema-template.md`를 기반으로 문서 생성.

#### 3-1. 헤더 및 테이블 목록

```markdown
# Airtable 스키마

이 문서는 프로젝트에서 사용하는 Airtable 테이블과 필드 정보를 정리합니다.
Claude가 자동으로 참조하므로 필드 변경 시 업데이트해주세요.

## 테이블 목록

| 테이블명 | Table ID | 용도 |
|---------|----------|------|
| Users | tblUSERS123456789 | 사용자 정보 |
| Orders | tblORDERS987654321 | 주문 내역 |
```

**변환 규칙**:
- 테이블명: `table.name`
- Table ID: `table.id`
- 용도: `table.description` (없으면 빈칸)

#### 3-2. 각 테이블별 필드 정보

```markdown
---

## Users
- Table ID: `tblUSERS123456789`
- 용도: 사용자 정보

### 필드 목록

<!-- AUTO-GENERATED: 아래는 describe_table API로 자동 생성됨. 직접 수정하지 마세요. 스키마 갱신 시 이 영역이 재생성됩니다. -->

| 필드명 | 타입 | Field ID | Options | 설명 |
|-------|------|----------|---------|------|
| 이름 | Single line text | fldNAME123 | - | 사용자 실명 |
| 상태 | Single select | fldSTATUS456 | 활성, 비활성 | 계정 상태 |
| 연결된_주문 | Link to Orders | fldORDERS789 | → tblORDERS987654321 | 주문 테이블 연결 |

<!-- END AUTO-GENERATED -->

<!-- USER-ADDED: 아래는 수동 추가 영역. 비즈니스 로직, 제약조건, 규칙, 주의사항을 자유롭게 추가하세요. 스키마 갱신 시에도 이 영역은 보존됩니다. -->

### 필드 상세 설명

(비즈니스 컨텍스트는 사용자가 수동으로 추가)

<!-- END USER-ADDED -->
```

**변환 규칙 (필드 테이블)**:

| 컬럼 | 소스 | 변환 |
|------|------|------|
| 필드명 | `field.name` | 그대로 |
| 타입 | `field.type` | 아래 타입 매핑 표 참조 |
| Field ID | `field.id` | 그대로 (fldXXXXX) |
| Options | `field.options` | 아래 Options 변환 규칙 참조 |
| 설명 | `field.description` | 없으면 "-" |

### Step 4: 타입 변환 규칙

| Airtable type (API) | 마크다운 표기 | 참고 |
|---------------------|--------------|------|
| `singleLineText` | Single line text | |
| `multilineText` | Long text | 마크다운 지원 |
| `richText` | Rich text | |
| `number` | Number | |
| `percent` | Percent | |
| `currency` | Currency | |
| `checkbox` | Checkbox | |
| `singleSelect` | Single select | options.choices 참조 |
| `multipleSelects` | Multiple select | options.choices 참조 |
| `date` | Date | YYYY-MM-DD |
| `dateTime` | DateTime | ISO 8601 |
| `multipleRecordLinks` | Link to {테이블명} | options.linkedTableId 참조 |
| `multipleLookupValues` | Lookup | 원본 타입의 배열 |
| `rollup` | Rollup ({함수}) | options.rollupFunction |
| `formula` | Formula | 결과 타입에 따름 |
| `multipleAttachments` | Attachment | |
| `createdTime` | Created time | ISO 8601 |
| `createdBy` | Created by | User 객체 |
| `lastModifiedTime` | Last modified time | ISO 8601 |
| `lastModifiedBy` | Last modified by | User 객체 |

### Step 5: Options 변환 규칙

**Single select / Multiple select**:
```javascript
// field.options.choices 배열을 쉼표로 join
options.choices.map(c => c.name).join(', ')
// 예: "활성, 비활성, 대기"
```

**Link (multipleRecordLinks)**:
```javascript
// 화살표로 연결된 테이블 표시
`→ ${field.options.linkedTableId}`
// 예: "→ tblORDERS987654321"

// 가능하면 테이블명도 표시
`→ ${linkedTableName} (${field.options.linkedTableId})`
// 예: "→ Orders (tblORDERS987654321)"
```

**Rollup**:
```javascript
// 집계 함수 표시
`Rollup (${field.options.rollupFunction})`
// 예: "Rollup (COUNT)", "Rollup (SUM)"
```

**기타 타입**:
```
"-"
```

### Step 6: 파일 저장

```bash
# 경로
.airtable/{baseId}/schema.md

# 예시
.airtable/appABC123/schema.md
```

**디렉토리 생성**:
```bash
mkdir -p .airtable/{baseId}
```

## 생성 후 안내 메시지

```
스키마 생성 완료:
- 파일: .airtable/{baseId}/schema.md
- 테이블: {N}개
- 필드: {M}개

다음을 추가하면 더 유용합니다 (선택사항):
- 비즈니스 컨텍스트 (각 테이블의 <!-- USER-ADDED --> 영역)
  - 필드 용도 설명
  - 제약조건, 규칙
  - 알려진 이슈, 주의사항
- 주요 조회 패턴 (filterByFormula 예시)

이 정보는 Claude가 작업 시 자동으로 참조합니다.
```

## 스키마 갱신 (regeneration)

사용자가 "스키마 갱신해줘" 요청 시:

1. **백업**: 기존 schema.md에서 모든 `<!-- USER-ADDED -->` ~ `<!-- END USER-ADDED -->` 블록 추출
2. **재생성**: 위 Step 1-6 절차 다시 실행 (AUTO-GENERATED 영역만)
3. **복원**: 백업한 USER-ADDED 블록을 해당 테이블 섹션에 다시 삽입
4. **저장**: 파일 덮어쓰기

**주의**:
- USER-ADDED 블록은 테이블별로 관리 (Users 테이블의 USER-ADDED는 Users 섹션에만 복원)
- 새로 추가된 테이블은 빈 USER-ADDED 템플릿 추가
- 삭제된 테이블의 USER-ADDED는 보존 불가 (삭제됨 경고)

## 예시: 전체 생성 결과

```markdown
# Airtable 스키마

이 문서는 프로젝트에서 사용하는 Airtable 테이블과 필드 정보를 정리합니다.

## 테이블 목록

| 테이블명 | Table ID | 용도 |
|---------|----------|------|
| Users | tblUSERS123 | 사용자 정보 |
| Orders | tblORDERS456 | 주문 내역 |

---

## Users
- Table ID: `tblUSERS123`
- 용도: 사용자 정보

### 필드 목록

<!-- AUTO-GENERATED -->

| 필드명 | 타입 | Field ID | Options | 설명 |
|-------|------|----------|---------|------|
| 이름 | Single line text | fldNAME123 | - | 사용자 이름 |
| 이메일 | Email | fldEMAIL456 | - | 이메일 주소 |
| 상태 | Single select | fldSTATUS789 | 활성, 비활성, 대기 | 계정 상태 |
| 가입일 | Created time | fldCREATED012 | - | - |

<!-- END AUTO-GENERATED -->

<!-- USER-ADDED -->

### 필드 상세 설명

(사용자가 추가)

<!-- END USER-ADDED -->

---

## Orders
- Table ID: `tblORDERS456`
- 용도: 주문 내역

### 필드 목록

<!-- AUTO-GENERATED -->

| 필드명 | 타입 | Field ID | Options | 설명 |
|-------|------|----------|---------|------|
| 주문번호 | Single line text | fldORDERNUM123 | - | 고유 주문 ID |
| 사용자 | Link to Users | fldUSER456 | → tblUSERS123 | 주문한 사용자 |
| 금액 | Currency | fldAMOUNT789 | - | 결제 금액 (KRW) |
| 상태 | Single select | fldORDSTATUS012 | 결제완료, 배송중, 완료 | 주문 상태 |

<!-- END AUTO-GENERATED -->

<!-- USER-ADDED -->

### 필드 상세 설명

(사용자가 추가)

<!-- END USER-ADDED -->
```

## 주의사항

### Rate Limit
- `list_tables`: 1회
- `describe_table`: 테이블 수만큼 (N회)
- 총 API 호출: N+1회
- Rate limit: 5 req/sec → N이 큰 경우 delay 필요

### 에러 처리
- 베이스 접근 권한 없음 → 사용자에게 안내
- 테이블 조회 실패 → 해당 테이블 skip, 나머지 계속
- 필드 타입 미지원 → "Unknown ({type})" 표시

### 테이블명/필드명에 특수문자
- 마크다운 테이블에서 `|` 문자 → escape: `\|`
- 백틱 포함 시 → 이스케이프 처리

## 참조

- 템플릿: `references/schema-template.md`
- LLM 규칙: `references/llm-rules.md` (Rate limit, pagination)
- Airtable field types: https://airtable.com/developers/web/api/field-model
