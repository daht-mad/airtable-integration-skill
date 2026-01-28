<!-- 
용도: 프로젝트에서 사용하는 Airtable 테이블과 필드 정보를 정리하는 템플릿
언제 읽을까: 스키마 문서를 작성하거나 필드 타입을 확인할 때
-->

# Airtable 스키마 문서 템플릿

이 문서는 프로젝트에서 사용하는 Airtable 테이블과 필드 정보를 정리합니다.
Claude가 자동으로 참조하므로 필드 변경 시 업데이트해주세요.

## 테이블 목록

| 테이블명 | Table ID | 용도 |
|---------|----------|------|
| 예시테이블 | tblXXXXXXXXXXXXXX | 예시 용도 설명 |

---

## 테이블명 (예시)
- Table ID: `tblXXXXXXXXXXXXXX`
- 용도: 테이블의 주요 목적 설명

### 필드 목록

<!-- AUTO-GENERATED: 아래는 describe_table API로 자동 생성됨. 직접 수정하지 마세요. 스키마 갱신 시 이 영역이 재생성됩니다. -->

| 필드명 | 타입 | Field ID | Options | 설명 |
|-------|------|----------|---------|------|
| 이름 | Single line text | fldXXXXXXXXXXXXXX | - | 사용자 실명 |
| 이메일 | Email | fldYYYYYYYYYYYYYY | - | 이메일 주소 |
| 전화번호 | Phone number | fldZZZZZZZZZZZZZZ | - | 연락처 (010-XXXX-XXXX) |
| 상태 | Single select | fldAAAAAAAAAAAAA | 활성, 비활성, 대기 | 계정 상태 |
| 가입일 | Created time | fldBBBBBBBBBBBBBB | - | 자동 생성 |
| 연결된_주문 | Link to 주문 | fldCCCCCCCCCCCCCC | → tblOrdersXXXXXXXX | 다른 테이블 연결 |
| 주문_수 | Rollup (COUNT) | fldDDDDDDDDDDDDDD | - | 연결된 주문 수 집계 |

<!-- END AUTO-GENERATED -->

<!-- USER-ADDED: 아래는 수동 추가 영역. 비즈니스 로직, 제약조건, 규칙, 주의사항을 자유롭게 추가하세요. 스키마 갱신 시에도 이 영역은 보존됩니다. -->

### 필드 상세 설명

**상태 필드 옵션:**
- `활성`: 현재 활동 중인 사용자
- `비활성`: 탈퇴/휴면 사용자
- `대기`: 가입 승인 대기

**주요 조회 패턴:**
```javascript
// 활성 사용자 조회
filterByFormula: `{상태} = "활성"`

// 특정 기간 가입자 조회
filterByFormula: `AND({가입일} >= "2024-01-01", {가입일} <= "2024-12-31")`
```

<!-- END USER-ADDED -->

---

## 스키마 작성 가이드

### 0. AUTO-GENERATED vs USER-ADDED 영역

이 템플릿은 자동 생성 영역과 수동 보강 영역을 구분합니다.

**AUTO-GENERATED 영역**:
- `describe_table` MCP 도구로 자동 생성
- 필드 테이블 (필드명, 타입, Field ID, Options, 기본 설명)
- 스키마 갱신 시 이 영역이 **완전히 재생성**됨

**USER-ADDED 영역**:
- 비즈니스 컨텍스트, 규칙, 주의사항
- 개발자가 수동으로 추가한 내용
- 스키마 갱신 시에도 **보존됨**

**스키마 갱신 방법**:
1. 기존 schema.md에서 USER-ADDED 영역 백업
2. describe_table로 AUTO-GENERATED 영역 재생성
3. USER-ADDED 영역 복원

**갱신 타이밍**:
- Airtable에서 필드가 추가/삭제/변경됨
- 사용자가 명시적으로 "스키마 갱신해줘" 요청
- ⚠️ 자동 갱신 안 함 (수동 요청만)

**Field ID 컬럼**:
- API 자동 생성 시 필요 (`fldXXXXXXXXXXXXXX`)
- describe_table 응답에 포함됨
- 필드 이름 변경 시에도 Field ID는 유지됨

### 1. 필드 타입별 표기법

| Airtable 타입 | TypeScript 타입 | 참고 |
|--------------|-----------------|------|
| Single line text | `string` | |
| Long text | `string` | 마크다운 지원 |
| Number | `number` | |
| Checkbox | `boolean` | |
| Single select | `string` 또는 Union | `'옵션1' \| '옵션2'` |
| Multiple select | `string[]` | |
| Date | `string` | YYYY-MM-DD |
| DateTime | `string` | ISO 8601 |
| Link | `string[]` | Record ID 배열 |
| Lookup | `T \| T[]` | 원본 타입의 배열 가능 |
| Rollup | `number \| string` | 집계 함수에 따름 |
| Formula | 결과 타입 | |
| Attachment | `object[]` | `{ url, filename, ... }` |
| Created time | `string` | ISO 8601 |

### 2. 주의사항

**Lookup 필드:**
- 항상 배열일 수 있으므로 `string | string[]` 처리 필요
- 예: `전화번호?: string | string[]`

**Link 필드 필터링:**
- `FIND()` + `ARRAYJOIN()` 조합이 작동하지 않을 수 있음
- 클라이언트 사이드 필터링 권장

**뷰 사용 주의:**
- 뷰에는 숨겨진 필터가 있을 수 있음
- 직접 테이블 조회 권장

---

## 환경 설정

```bash
# .env.local
AIRTABLE_API_KEY=patXXXXXXXX...
AIRTABLE_BASE_ID=appXXXXXXXX...
```

**API Key 생성:**
1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. Scopes: `data.records:read`, `data.records:write` 선택
4. Access: 해당 Base 선택
