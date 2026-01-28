# Airtable 작업 효율화 - 스킬 개선

## TL;DR

> **Quick Summary**: 에어테이블 연동 작업의 비효율(매번 스키마 파악, API 실수, 토큰 낭비)을 해결하기 위해 기존 airtable-integration 스킬을 개선. 스키마 캐싱, 정적 데이터 스냅샷, LLM 에이전트 규칙을 추가한다.
> 
> **Deliverables**:
> - 스키마 자동 생성 + 복제 워크플로우 (SKILL.md에 추가)
> - 스냅샷 관리 워크플로우 (SKILL.md에 추가)
> - LLM 에이전트 규칙 문서 (references/llm-rules.md)
> - 스키마 템플릿 개선 (자동/수동 영역 분리)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 3 → Task 5

---

## Context

### Original Request
에어테이블 연동 작업 시 비효율 최소화:
- 매번 테이블 구조, 필드 타입 파악에 토큰 낭비
- API 제한 (offset, rate limit, 100개 제한) 매번 실수
- 필터 없이 전체 fetch → 불필요한 API 호출
- 자주 안 바뀌는 정적 데이터도 매번 API 호출

### Interview Summary
**Key Discussions**:
- 베이스 패턴: 하나의 베이스를 여러 프로젝트에서 사용하는 경우가 많음
- 스키마 저장: 프로젝트 단위 (.airtable/{appId}/)
- 스키마 생성: API 자동 생성 + 수동 보강
- 복제 검색 범위: ~/Documents/DEV/ 하위 전체
- 정적 데이터 예시: 과거 결제 데이터, 확정된 기수 스터디 데이터
- 스냅샷: JSON 형식, 수동 생성

**Research Findings**:
- 현재 스킬: MCP 서버 설정, SDK 래퍼 템플릿, 스키마 템플릿(수동), 사용 가이드
- 부족한 것: 자동 스키마 생성, 복제 로직, 스냅샷 시스템, LLM 가이드라인
- MCP 도구: `describe_table(detailLevel: 'full')`로 스키마 조회 가능

### Metis Review
**Identified Gaps** (addressed):
- 스키마 갱신 트리거 → 명시적 요청 시만 (안전한 기본값)
- 복제 시 비즈니스 컨텍스트 → 전체 복제 (원본 보존)
- 스냅샷 파일명 → {tableName}-{YYYYMMDD}.json
- 자동/수동 영역 분리 → 마커 사용 (`<!-- AUTO-GENERATED -->`, `<!-- USER-ADDED -->`)

---

## Work Objectives

### Core Objective
기존 airtable-integration 스킬을 개선하여, 에어테이블 작업 시 스키마 캐싱, 스냅샷, LLM 규칙을 통해 효율성을 극대화한다.

### Concrete Deliverables
- `SKILL.md`: Step 4 (스키마 캐싱), Step 5 (스냅샷 관리) 섹션 추가
- `references/llm-rules.md`: LLM 에이전트용 에어테이블 작업 규칙
- `references/schema-template.md`: 자동/수동 영역 분리 형식으로 개선
- `assets/schema-generator.md`: 스키마 자동 생성 가이드 (Claude가 따라할 절차)

### Definition of Done
- [ ] 새 프로젝트에서 "에어테이블 연동해줘" 시 스키마 복제/생성 워크플로우 동작
- [ ] "스냅샷 떠줘" 시 JSON 파일 생성 워크플로우 동작
- [ ] LLM 규칙이 스킬에 포함되어 Claude가 참조 가능

### Must Have
- 스키마 자동 생성 (describe_table 활용)
- 기존 스키마 복제 (~/Documents/DEV/ 검색)
- 자동/수동 영역 분리 (갱신 시 수동 영역 보존)
- 스냅샷 생성 워크플로우
- LLM 에이전트 규칙 (offset 필수, rate limit, 필터 권장)

### Must NOT Have (Guardrails)
- ❌ 글로벌 저장소 (~/.airtable/) 사용 금지
- ❌ 자동 스키마 동기화/감지 구현 금지
- ❌ TypeScript 타입 자동 생성 (이번 범위 아님)
- ❌ 뷰별 스키마 저장 금지 (테이블 스키마만)
- ❌ 스냅샷 자동 생성 금지 (수동만)
- ❌ 스키마 변경 히스토리 추적 금지

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (스킬 문서이므로 코드 테스트 불필요)
- **User wants tests**: Manual-only
- **Framework**: none

### Manual QA

각 TODO 완료 후 수동 검증:

**스킬 동작 검증:**
1. 새 테스트 프로젝트 생성
2. "에어테이블 연동해줘" 요청
3. 스키마 캐싱 워크플로우가 안내되는지 확인
4. 복제 검색이 동작하는지 확인

**문서 품질 검증:**
- 각 워크플로우가 명확한가?
- Claude가 따라할 수 있는 수준인가?
- 누락된 단계가 없는가?

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: LLM 규칙 문서 작성
└── Task 2: 스키마 템플릿 개선

Wave 2 (After Wave 1):
├── Task 3: SKILL.md - 스키마 캐싱 섹션 추가
├── Task 4: SKILL.md - 스냅샷 관리 섹션 추가
└── Task 5: 스키마 생성 가이드 작성

Wave 3 (After Wave 2):
└── Task 6: 통합 검증 및 문서 정리
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 6 | 4, 5 |
| 4 | None (but after 3 for consistency) | 6 | 3, 5 |
| 5 | 2 | 6 | 3, 4 |
| 6 | 3, 4, 5 | None | None (final) |

---

## TODOs

### Task 1: LLM 에이전트 규칙 문서 작성

**What to do**:
- `references/llm-rules.md` 생성
- 에어테이블 API 제한사항 정리:
  - Rate limit: 5 requests/second
  - Pagination: 기본 100건, offset 필수
  - update_records: 최대 10건/호출
  - list_records: maxRecords 지정 권장
- 쿼리 베스트 프랙티스:
  - filterByFormula 항상 사용
  - 뷰 사용 금지 (숨겨진 필터 위험)
  - offset으로 전체 데이터 순회 패턴
- 스키마 참조 가이드:
  - 작업 전 .airtable/{appId}/schema.md 확인
  - 스키마 없으면 생성 요청

**Must NOT do**:
- SDK 사용법 포함 금지 (MCP 규칙만)
- 코드 예제 과다 금지 (패턴만 간결하게)

**Recommended Agent Profile**:
- **Category**: `writing`
  - Reason: 문서 작성 작업
- **Skills**: [`skill-creator`]
  - `skill-creator`: 스킬 문서 작성 패턴 참조

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Task 2)
- **Blocks**: Task 3
- **Blocked By**: None

**References**:
- `SKILL.md:83-118` - 현재 MCP 도구 목록 및 주의사항
- `references/claude-context.md:43-82` - 기존 쿼리 규칙 (확장할 내용)
- Airtable API docs: https://airtable.com/developers/web/api/rate-limits

**Acceptance Criteria**:
- [x] `references/llm-rules.md` 파일 생성됨
- [x] Rate limit, pagination, batch 제한 명시됨
- [x] filterByFormula 필수 패턴 포함
- [x] offset 순회 패턴 포함
- [x] 스키마 참조 가이드 포함

**Commit**: YES
- Message: `docs(airtable): add LLM agent rules for efficient API usage`
- Files: `references/llm-rules.md`

---

### Task 2: 스키마 템플릿 개선 (자동/수동 영역 분리)

**What to do**:
- `references/schema-template.md` 수정
- 자동 생성 영역과 수동 보강 영역 분리:
  ```markdown
  ## 테이블: {테이블명} ({tableId})
  
  <!-- AUTO-GENERATED: 아래는 API에서 자동 생성됨. 직접 수정하지 마세요. -->
  | 필드명 | 타입 | Field ID | Options |
  |--------|------|----------|---------|
  | ... | ... | ... | ... |
  <!-- END AUTO-GENERATED -->
  
  <!-- USER-ADDED: 아래는 수동 추가 영역. 자유롭게 수정하세요. -->
  ### 비즈니스 컨텍스트
  - 필드 설명, 규칙 등
  <!-- END USER-ADDED -->
  ```
- 갱신 시 수동 영역 보존 안내 추가

**Must NOT do**:
- 기존 템플릿 형식 완전히 변경 금지 (확장만)

**Recommended Agent Profile**:
- **Category**: `writing`
  - Reason: 문서 템플릿 개선
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Task 1)
- **Blocks**: Task 3, Task 5
- **Blocked By**: None

**References**:
- `references/schema-template.md` - 현재 템플릿 (전체 파일)
- Metis 분석: 자동/수동 영역 분리 마커 권장

**Acceptance Criteria**:
- [x] `<!-- AUTO-GENERATED -->`, `<!-- END AUTO-GENERATED -->` 마커 추가
- [x] `<!-- USER-ADDED -->`, `<!-- END USER-ADDED -->` 마커 추가
- [x] 갱신 시 수동 영역 보존 안내 포함
- [x] Field ID 컬럼 추가 (자동 생성용)

**Commit**: YES
- Message: `docs(airtable): improve schema template with auto/manual sections`
- Files: `references/schema-template.md`

---

### Task 3: SKILL.md - 스키마 캐싱 섹션 추가 (Step 4)

**What to do**:
- `SKILL.md`에 "Step 4: 스키마 캐싱" 섹션 추가
- 워크플로우:
  1. 프로젝트에 `.airtable/{appId}/` 폴더 확인
  2. 없으면 → 복제 검색 (~/Documents/DEV/ 하위)
  3. 복제 가능하면 → 사용자 확인 후 복제
  4. 복제 불가하면 → API로 자동 생성
  5. schema.md 생성 (자동/수동 영역 분리)
- 복제 검색 로직:
  ```bash
  find ~/Documents/DEV -path "*/.airtable/{appId}/schema.md" -type f 2>/dev/null
  ```
- 스키마 갱신 워크플로우 (명시적 요청 시):
  1. 기존 schema.md의 USER-ADDED 영역 백업
  2. API로 AUTO-GENERATED 영역 재생성
  3. USER-ADDED 영역 복원

**Must NOT do**:
- 자동 갱신/동기화 로직 금지
- 글로벌 저장 언급 금지

**Recommended Agent Profile**:
- **Category**: `writing`
  - Reason: 스킬 문서 작성
- **Skills**: [`skill-creator`]
  - `skill-creator`: 스킬 워크플로우 작성 패턴

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Task 4, 5)
- **Blocks**: Task 6
- **Blocked By**: Task 1, Task 2

**References**:
- `SKILL.md:26-118` - 기존 Step 1-3 형식 참고
- `references/schema-template.md` - 개선된 템플릿 (Task 2 결과)
- `references/llm-rules.md` - LLM 규칙 참조 (Task 1 결과)
- MCP 도구: `describe_table(baseId, tableId, detailLevel: 'full')`

**Acceptance Criteria**:
- [x] SKILL.md에 "Step 4: 스키마 캐싱" 섹션 추가됨
- [x] 복제 검색 워크플로우 포함 (find 명령어)
- [x] 자동 생성 워크플로우 포함 (describe_table 활용)
- [x] 갱신 워크플로우 포함 (USER-ADDED 보존)
- [x] 사용자 확인 단계 포함

**Commit**: YES
- Message: `feat(airtable): add schema caching workflow (Step 4)`
- Files: `SKILL.md`

---

### Task 4: SKILL.md - 스냅샷 관리 섹션 추가 (Step 5)

**What to do**:
- `SKILL.md`에 "Step 5: 스냅샷 관리" 섹션 추가
- 스냅샷 생성 워크플로우:
  1. 사용자가 "이 테이블 스냅샷 떠줘" 요청
  2. list_records로 데이터 조회 (pagination 처리)
  3. `.airtable/{appId}/snapshots/{tableName}-{YYYYMMDD}.json` 저장
  4. 파일 크기 경고 (1MB 초과 시)
- 스냅샷 사용 안내:
  - Claude: 스냅샷 파일 읽어서 분석
  - SDK: JSON import해서 사용
- 주의사항:
  - 민감 데이터 확인 안내
  - .gitignore 추가 권장

**Must NOT do**:
- 자동 스냅샷 생성 금지
- 스냅샷 동기화/비교 기능 금지

**Recommended Agent Profile**:
- **Category**: `writing`
  - Reason: 스킬 문서 작성
- **Skills**: [`skill-creator`]

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Task 3, 5)
- **Blocks**: Task 6
- **Blocked By**: None (but after Task 3 for consistency)

**References**:
- `SKILL.md:26-118` - 기존 Step 형식 참고
- MCP 도구: `list_records(baseId, tableId, maxRecords, filterByFormula, offset)`
- `references/llm-rules.md` - offset 순회 패턴 참조

**Acceptance Criteria**:
- [x] SKILL.md에 "Step 5: 스냅샷 관리" 섹션 추가됨
- [x] 스냅샷 생성 워크플로우 포함
- [x] 파일 경로 규칙 명시 ({tableName}-{YYYYMMDD}.json)
- [x] 파일 크기 경고 로직 포함
- [x] .gitignore 안내 포함

**Commit**: YES
- Message: `feat(airtable): add snapshot management workflow (Step 5)`
- Files: `SKILL.md`

---

### Task 5: 스키마 자동 생성 가이드 작성

**What to do**:
- `assets/schema-generator.md` 생성
- Claude가 따라할 스키마 자동 생성 절차:
  1. `list_tables(baseId, detailLevel: 'full')` 호출
  2. 각 테이블별 `describe_table(baseId, tableId, detailLevel: 'full')` 호출
  3. 결과를 schema-template.md 형식으로 변환
  4. AUTO-GENERATED 영역에 작성
  5. USER-ADDED 영역 빈 템플릿 추가
- 변환 규칙:
  - Airtable 타입 → 마크다운 표기
  - Single select → options 목록 포함
  - Link → 연결된 테이블 명시

**Must NOT do**:
- 실행 가능한 코드 작성 금지 (가이드 문서만)
- TypeScript 타입 생성 금지

**Recommended Agent Profile**:
- **Category**: `writing`
  - Reason: 가이드 문서 작성
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Task 3, 4)
- **Blocks**: Task 6
- **Blocked By**: Task 2

**References**:
- `references/schema-template.md` - 개선된 템플릿 (Task 2 결과)
- `SKILL.md:83-118` - MCP 도구 파라미터 상세
- Airtable field types: https://airtable.com/developers/web/api/field-model

**Acceptance Criteria**:
- [x] `assets/schema-generator.md` 파일 생성됨
- [x] 단계별 MCP 호출 절차 포함
- [x] 타입 변환 규칙 테이블 포함
- [x] 예시 출력 포함

**Commit**: YES
- Message: `docs(airtable): add schema auto-generation guide`
- Files: `assets/schema-generator.md`

---

### Task 6: 통합 검증 및 문서 정리

**What to do**:
- 전체 워크플로우 검증:
  1. SKILL.md 읽고 전체 흐름 확인
  2. 각 Step 간 연결 확인
  3. 참조 문서 링크 확인
- 문서 정리:
  - SKILL.md의 "참조 문서" 섹션 업데이트
  - 새로 추가된 파일들 반영
- references/claude-context.md 업데이트:
  - llm-rules.md 참조 추가
  - 스키마 캐싱 안내 추가

**Must NOT do**:
- 새로운 기능 추가 금지 (정리만)

**Recommended Agent Profile**:
- **Category**: `writing`
  - Reason: 문서 정리 및 검증
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 3 (sequential, final)
- **Blocks**: None (final task)
- **Blocked By**: Task 3, Task 4, Task 5

**References**:
- `SKILL.md` - 전체 파일
- `references/` - 모든 참조 문서
- `assets/` - 모든 에셋 파일

**Acceptance Criteria**:
- [x] SKILL.md "참조 문서" 섹션에 새 파일들 추가됨
- [x] references/claude-context.md에 llm-rules.md 참조 추가됨
- [x] 모든 내부 링크 유효성 확인됨
- [x] 전체 워크플로우 흐름 일관성 확인됨

**Commit**: YES
- Message: `docs(airtable): finalize skill documentation`
- Files: `SKILL.md`, `references/claude-context.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `docs(airtable): add LLM agent rules` | references/llm-rules.md | 파일 존재 확인 |
| 2 | `docs(airtable): improve schema template` | references/schema-template.md | 마커 존재 확인 |
| 3 | `feat(airtable): add schema caching (Step 4)` | SKILL.md | Step 4 섹션 확인 |
| 4 | `feat(airtable): add snapshot management (Step 5)` | SKILL.md | Step 5 섹션 확인 |
| 5 | `docs(airtable): add schema generator guide` | assets/schema-generator.md | 파일 존재 확인 |
| 6 | `docs(airtable): finalize documentation` | SKILL.md, references/claude-context.md | 링크 확인 |

---

## Success Criteria

### Final Checklist
- [x] 새 프로젝트에서 스킬 호출 시 스키마 캐싱 워크플로우 동작
- [x] 스냅샷 생성 요청 시 JSON 파일 생성 워크플로우 동작
- [x] LLM 규칙이 명확하게 문서화됨
- [x] 기존 스킬 기능 (Step 1-3) 영향 없음
- [x] 모든 Must NOT Have 항목 미포함 확인
