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

| 필드명 | 타입 | 설명 |
|-------|------|------|
| 이름 | Single line text | 사용자 실명 |
| 이메일 | Email | 이메일 주소 |
| 전화번호 | Phone number | 연락처 (010-XXXX-XXXX) |
| 상태 | Single select | 활성/비활성/대기 |
| 가입일 | Created time | 자동 생성 |
| 연결된_주문 | Link to 주문 | 다른 테이블 연결 |
| 주문_수 | Rollup (COUNT) | 연결된 주문 수 집계 |

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

---

## 스키마 작성 가이드

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
