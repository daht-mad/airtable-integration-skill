<!-- 
용도: 새 프로젝트에서 Airtable을 빠르게 연동하기 위한 실전 가이드
언제 읽을까: SDK 래퍼 설치 후 실제 사용 방법을 알고 싶을 때
-->

# Airtable 재사용 가이드

새 프로젝트에서 Airtable을 빠르게 연동하기 위한 실전 가이드입니다.

## 빠른 시작

### 1. 파일 복사

```bash
# 새 프로젝트로 복사
cp -r ~/Documents/DEV/airtable-template/lib/airtable*.ts ./lib/
cp -r ~/Documents/DEV/airtable-template/docs/airtable-schema.md ./docs/
```

### 2. 환경 설정

```bash
# .env.local 생성
AIRTABLE_API_KEY=patXXXXXXXX...
AIRTABLE_BASE_ID=appXXXXXXXX...
```

### 3. 패키지 설치

```bash
npm install airtable
```

### 4. TABLES 상수 수정

`lib/airtable.ts`에서 테이블 ID 추가:

```typescript
export const TABLES = {
  USERS: 'tblXXXXXXXXXXXXXX',
  ORDERS: 'tblYYYYYYYYYYYYYY',
} as const
```

### 5. 타입 정의

`lib/airtable.types.ts`에 레코드 타입 추가:

```typescript
export interface UserRecord {
  id: string
  fields: {
    이름?: string
    이메일?: string
    // ...
  }
}
```

### 6. CLAUDE.md 업데이트 (중요!)

`references/claude-context.md`를 참고해서 프로젝트의 CLAUDE.md에 Airtable 섹션 추가.

이렇게 하면 Claude가 자동으로 테이블 구조를 이해합니다.

## 핵심 기능

### escapeFormulaValue

사용자 입력을 안전하게 처리:

```typescript
import { escapeFormulaValue } from '@/lib/airtable'

const safeInput = escapeFormulaValue(userInput)
const records = await base(TABLES.USERS).select({
  filterByFormula: `{전화번호} = "${safeInput}"`,
}).all()
```

### 지연 로딩

클라이언트 컴포넌트에서 타입만 import해도 에러 없음:

```typescript
// 서버 컴포넌트
import { base, TABLES } from '@/lib/airtable'

// 클라이언트 컴포넌트 (타입만 import)
import type { UserRecord } from '@/lib/airtable.types'
```

## 주의사항

1. **뷰 사용 금지**: 뷰에는 숨겨진 필터가 있을 수 있음
2. **Lookup 필드**: 항상 배열일 수 있으므로 `T | T[]` 처리
3. **Link 필드 필터링**: ARRAYJOIN 안됨 → 클라이언트 필터링 사용
4. **환경변수**: .env.local은 절대 커밋하지 마세요

## API Key 생성

1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. Scopes: `data.records:read`, `data.records:write`
4. Access: 해당 Base 선택
