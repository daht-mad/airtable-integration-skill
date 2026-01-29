<!-- 
용도: 프로젝트 CLAUDE.md에 추가할 Airtable 섹션 템플릿
언제 읽을까: 프로젝트 CLAUDE.md를 작성할 때
-->

# CLAUDE.md - Airtable 섹션 템플릿

이 파일은 프로젝트의 CLAUDE.md에 포함할 Airtable 관련 섹션 예시입니다.
아래 내용을 복사해서 프로젝트 CLAUDE.md에 추가하세요.

---

## Airtable 연동

### 환경 설정

```bash
# .env.local (절대 커밋하지 마세요)
AIRTABLE_API_KEY=patXXXXXXXX...
AIRTABLE_BASE_ID=appXXXXXXXX...
```

### 테이블 구조

**사용자 테이블** (`tblXXXXXXXXXXXXXX`)
| 필드명 | 타입 | 설명 |
|-------|------|------|
| 이름 | text | 사용자 실명 |
| 이메일 | email | 이메일 주소 |
| 전화번호 | phone | 연락처 |
| 상태 | select | '활성', '비활성', '대기' |
| 가입일 | created | 자동 생성 |

**주문 테이블** (`tblYYYYYYYYYYYYYY`)
| 필드명 | 타입 | 설명 |
|-------|------|------|
| 주문번호 | text | 고유 주문 ID |
| 사용자 | link | 사용자 테이블 연결 |
| 상품명 | text | 주문 상품 |
| 금액 | number | 결제 금액 (KRW) |
| 상태 | select | '결제완료', '배송중', '완료' |

### Airtable 쿼리 규칙 (CRITICAL)

**1. 뷰 사용 금지:**
```typescript
// ❌ BAD: 뷰에 숨겨진 필터가 있을 수 있음
const records = await base(TABLES.USERS).select({
  view: 'Grid view',
}).all()

// ✅ GOOD: 직접 필터링
const records = await base(TABLES.USERS).select({
  filterByFormula: `{상태} = "활성"`,
}).all()
```

**2. 사용자 입력 이스케이프:**
```typescript
// ✅ GOOD: Formula Injection 방지
const safePhone = escapeFormulaValue(userInput)
filterByFormula: `{전화번호} = "${safePhone}"`
```

**3. Lookup 필드 처리:**
```typescript
// Lookup 필드는 항상 배열일 수 있음
const phone = Array.isArray(record.fields.전화번호)
  ? record.fields.전화번호[0]
  : record.fields.전화번호
```

**4. Link 필드 필터링:**
```typescript
// ❌ BAD: ARRAYJOIN 필터링 안됨
filterByFormula: `FIND("${recordId}", ARRAYJOIN({연결필드}, ","))`

// ✅ GOOD: 클라이언트 사이드 필터링
const filtered = records.filter(r =>
  r.fields.연결필드?.includes(targetId)
)
```

### 스키마 캐싱

작업 전 **반드시** 스키마 파일을 확인하세요:

```bash
# 스키마 파일 존재 여부 확인 (한글 베이스명 사용)
ls .airtable/{baseName}/schema.md
# 예: .airtable/파트너스/schema.md

# 있으면 읽기
Read .airtable/{baseName}/schema.md

# 없으면 생성 요청
"스키마 생성해줘"
```

**스키마 캐싱이 중요한 이유**:
- 반복적인 `describe_table` API 호출 방지 → 토큰 절약
- 테이블/필드 구조 즉시 파악 가능
- 비즈니스 컨텍스트 (USER-ADDED) 포함

### 관련 파일

- `lib/airtable.ts` - Airtable 클라이언트 및 TABLES 상수
- `lib/airtable.types.ts` - 타입 정의
- `.airtable/{baseName}/schema.md` - 테이블 스키마 캐시 (**작업 전 필독**)
- `.airtable/{baseName}/snapshots/` - 정적 데이터 스냅샷 (있는 경우)

### 참조 규칙 문서

- `references/llm-rules.md` - API 제약사항 및 베스트 프랙티스
  - Rate limit, pagination, batch 제한
  - filterByFormula 필수 패턴
  - Anti-patterns

---

## 사용법

1. 위 내용을 프로젝트 CLAUDE.md에 복사
2. 테이블 ID와 필드 정보를 실제 값으로 수정
3. 필요한 테이블 추가

이렇게 하면 Claude가 자동으로 Airtable 구조를 이해하고,
매번 필드를 설명할 필요가 없습니다.
