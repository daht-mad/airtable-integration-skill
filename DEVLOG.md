# Airtable Integration Skill - 개발 로그

AI 코딩 도구와 함께 진행한 개발 작업 기록입니다.

---

## 배경: 왜 이 스킬을 만들게 되었나?

> **세션**: `ses_3fd8f6b81ffe1rITCaFUwqjjL4` (2026-01-28 02:30)
> **모드**: Prometheus (Plan)

### 문제 인식

gpters-partners 프로젝트에서 에어테이블 연동 작업을 하다가 든 생각:

```
[사용자]
이제 파트너스 명단을 관리하고 있는 에어테이블이 있어. 그걸 이 프로젝트에 연동해두고 싶은데, 
과거 다른 프로젝트에서 이미 에어테이블을 연동해둔 적이 많거든? 
매번 프로젝트 새로 시작할 때마다 에어테이블 연동하는 게 번거로운데 
이걸 스킬로 만들거나 재사용하는 그런 똑똑한 방법이 있을까?
```

### 기존에 가지고 있던 것들

Prometheus가 기존 프로젝트들을 탐색한 결과:

```
[Prometheus]
아주 좋은 조사 결과가 나왔어요! 현재 상황을 정리하고 최적의 방법을 함께 찾아볼게요.

### 이미 가지고 있는 것들

| 프로젝트 | 에어테이블 패턴 | 특징 |
|----------|---------------|------|
| `gpters-study-main` | **고급 SDK 래퍼** | Zod 스키마 + Field ID 매핑 (가장 견고) |
| `ai-study-dashboard` | **유틸리티 패턴** | 배치 업데이트 + rate-limiting |
| `ai-study-lms` | **풀 백엔드** | 에어테이블을 DB로 사용 |
| `airtable-template` | **보일러플레이트** | 새 프로젝트용 템플릿 |

### 현재 글로벌 MCP 설정
Linear, Notion 등은 MCP로 전역 설정되어 있지만, **에어테이블 MCP는 없는 상태**예요.
```

### 핵심 질문: MCP vs SDK?

```
[사용자 - 인터뷰 응답]
용도: "Claude가 직접 조회/수정" + "앱 코드에서 사용" 둘 다 필요
데이터 구조: 복합 구조 (여러 테이블 연결)
```

Prometheus의 설명:

```
[Prometheus]
## MCP vs 코드 래퍼: 둘은 경쟁 관계가 아니에요

이미 사용 중인 것으로 비유하면:

| | Linear MCP (이미 설치됨) | Linear SDK (코드에서 사용) |
|---|---|---|
| **누가 쓰나** | **Claude**가 대화 중에 씀 | **당신의 앱 코드**가 런타임에 씀 |
| **언제 실행** | Claude Code 켤 때만 | 앱 서버가 돌 때 |
| **무거운가** | ❌ 아주 가벼움 (작은 Node.js 프로세스) | 앱의 일부 |

지금 Linear MCP가 설치되어 있잖아요? Claude한테 "이번 주 이슈 보여줘" 하면 바로 보여주죠. 
그게 무겁다고 느끼셨나요? 에어테이블 MCP도 **정확히 같은 무게감**이에요.

### 핵심: 이 둘은 **용도가 다릅니다**

| 상황 | 최적의 도구 |
|------|-----------|
| "파트너스 현황 요약해줘" (대화) | **MCP** - Claude가 직접 에어테이블 읽음 |
| "이 파트너 상태 업데이트해줘" (대화) | **MCP** - Claude가 직접 수정 |
| 웹앱에서 파트너 목록 페이지 구현 | **SDK 래퍼** - 앱 코드에서 사용 |
| "새 프로젝트에 에어테이블 연동해줘" | **스킬** - 셋업 가이드 |
```

### 토큰 비용 논의

```
[Prometheus]
## MCP와 토큰 사용량

### 현재 이미 쓰고 있는 MCP 도구 수 (대략적 추정)

| MCP 서버 | 도구 수 | 매 턴 고정 비용 |
|----------|--------|--------------|
| Linear | ~25개 | 높음 |
| Linear-fast | ~8개 | 중간 |
| Notion-fast | ~8개 | 중간 |
| Playwright | ~15개 | 높음 |
| Chrome DevTools | ~25개 | 높음 |
| Context7 | ~2개 | 낮음 |
| **합계** | **~83개** | 이미 꽤 많음 |

### 솔직한 답변

**맞아요, 토큰 걱정은 타당합니다.** 이미 ~83개 도구가 매 턴마다 정의로 전달되고 있어요.

**하지만**, 이 비용은 상대적으로 봐야 해요:

| 비교 대상 | 토큰 비용 |
|----------|---------|
| 도구 정의 83개 | ~3,000~5,000 토큰 (추정) |
| 일반적인 코드 파일 1개 읽기 | ~1,000~3,000 토큰 |
| 긴 대화 한 턴 | ~2,000~5,000 토큰 |

즉, **전체 컨텍스트 대비 도구 정의 비용은 크지 않아요.**

### 진짜 고려할 포인트

더 중요한 건 **전역 vs 프로젝트별 설치** 선택이에요:

| 방식 | 장점 | 단점 |
|------|------|------|
| **전역 설치** | 모든 프로젝트에서 바로 사용 | 에어테이블 안 쓰는 프로젝트에서도 도구 정의가 로드됨 |
| **프로젝트별 설치** | 필요한 프로젝트에서만 로드 | 프로젝트마다 설정 필요 (하지만 **스킬**로 자동화 가능!) |

**저라면 이렇게 하겠어요:**
> 에어테이블 MCP는 **프로젝트별 설치** + **스킬로 자동화**
> → "에어테이블 연동해줘" 하면 스킬이 `.mcp.json` 생성 + SDK 래퍼 세팅을 한 번에 처리

이러면 토큰 낭비 없이, 필요할 때만 활성화되고, 매번 반복 작업도 없어요.
```

### 최종 결정

```
[Prometheus - Plan Generated]
## Plan Generated: `airtable-integration-skill`

### Key Decisions Made
- **MCP 서버**: `airtable-mcp-server` (domdomegg, npm v1.10.0) - 가장 성숙한 옵션
- **SDK 패턴**: Template 패턴 기본 (airtable-template에서 가져옴), Advanced는 업그레이드 경로로만 안내
- **설치 방식**: 프로젝트별 `.mcp.json` (토큰 절약)
- **스킬 에셋**: `assets/` 디렉토리에 내장 (외부 경로 의존 X, 자체 완결)

### Guardrails Applied (Metis review)
- MCP 서버를 실제 사용 전 검증 단계 포함 (Task 1)
- 기존 파일 존재 시 덮어쓰기 경고 로직 필수
- API 키/비밀값 절대 포함 금지
- 스킬에 절대 경로 하드코딩 금지
```

---

## 2026-01-28 (Day 1)

### 1. 스킬 생성 플랜 작성 및 실행

> 플랜 인터뷰는 "배경" 섹션에서 상세히 기록됨

**OpenCode (Prometheus) 작업 요약:**
- 현재 상황 분석 (기존 프로젝트들의 에어테이블 패턴 조사)
- MCP vs SDK 차이점 설명 및 "둘 다 필요" 결론
- 토큰 비용 분석 및 프로젝트별 설치 결정
- Metis 컨설팅으로 gap 분석
- `airtable-integration-skill.md` 플랜 생성

**추가 요청 처리:**

```
[사용자]
플랜 생성하고, 추가로 CLAUDE.md 지침에 학습 문서 저장 규칙 추가해줘.
파일명 형식: YYMMDD-제목.md (예: 250128-에어테이블연동가이드.md)
```

---

**실행:**

```
[Sisyphus 작업 세션 - ses_3fd789b63ffe8wXZMeJ318QhR3]
/start-work
```

**OpenCode (Atlas → Sisyphus) 작업:**
- Wave 1 (병렬):
  - Task 1: MCP 서버 검증 + 스킬 에셋 준비
  - Task 4: CLAUDE.md 문서 저장 규칙 업데이트
- Wave 2:
  - Task 2: 에어테이블 연동 스킬 생성 (`~/.claude/skills/airtable-integration/`)
  - Task 3: gpters-partners에 스킬 적용
  - Task 5: 전체 통합 검증

**생성된 스킬 구조:**
```
~/.claude/skills/airtable-integration/
├── SKILL.md
├── assets/
│   ├── airtable.ts
│   ├── airtable.types.ts
│   └── mcp-config.json
└── references/
    └── ...
```

---

### 2. Airtable 효율성 개선 플랜 실행

> **세션**: `ses_3fc03e1faffepNdaYv91VlXmlF` (2026-01-28 09:43)
> **모드**: Prometheus (Plan)

스킬을 사용해보니 비효율 문제를 발견:

```
[사용자]
내가 다른 프로젝트들에서 에어테이블을 연동해서 써보니까, 동일한 베이스에서 작업을 하는데도 
매번 작업 요청할 때마다 테이블 구조 읽고, 필드 타입 읽고, 각 테이블과 필드가 뭐하는건지 또 파악하고 .. 
이러면서 굉장히 비효율적인거 같더라고. 그래서 이 비효율을 최소화하는 방법을 만들고 싶어. 

그리고 에어테이블 api 리밋도 있고 offset적용 안하면 한번에 100개밖에 안가져오는 등 
매번 에이전트가 일할 때 헷갈려하고 파악하느라 토큰을 너무 많이 써. 
쿼리 날릴 때도 필터 제대로 안넣고 날려서 엄청 많은 db를 가져오느라 애를 쓴다거나..

그리고 자주 바뀌지 않아서 실시간성이 중요하지 않는 db는 어딘가에 저장해놓고 주기적으로 싱크를 시킨다거나.. 
이런 방법도 있을거같고, 복잡한 DB인 경우 자주 쓰는 디비 스키마만 별도로 두고 본다거나.. 
이런 방법도 있을 것 같고.. 내가 무슨 이야기를 하는지 알겠니?
```

Prometheus의 문제 분석:

```
[Prometheus]
네, 완전히 이해했어요! 핵심 문제는:

1. **반복적인 컨텍스트 로딩** - 매번 스키마/필드 파악에 토큰 낭비
2. **API 제한 사항 무지** - offset, rate limit, 100개 제한 등 매번 실수
3. **비효율적 쿼리** - 필터 없이 전체 fetch → 불필요한 API 호출
4. **캐싱 부재** - 정적 데이터도 매번 API 호출

### 핵심 문제 정리

현재 워크플로우 (비효율)
┌─────────────────────────────────────────────────────────────┐
│  매 작업 요청마다:                                            │
│  1. list_tables → 테이블 구조 파악 (API 호출)                  │
│  2. describe_table → 필드 타입 파악 (API 호출 × N)            │
│  3. "이 필드가 뭐지?" → 또 질문                               │
│  4. 필터 잘못 넣음 → 100개씩 전체 fetch → 토큰 폭발           │
│  5. offset 안 씀 → 데이터 누락                                │
└─────────────────────────────────────────────────────────────┘
```

인터뷰 진행:

```
[Prometheus - 질문]
1. 주로 어떤 베이스를 쓰시나요?
2. 가장 큰 페인포인트는 뭐예요?
3. "자주 안 바뀌는 정적 데이터"의 예시가 있나요?

[사용자 - 응답]
1. 그때그때 다름 하나의 베이스를 여러 프로젝트에서 쓰는 경우가 더 많긴 해
2. 전부
3. ex) 이미 과거에 쌓인 결제데이터, 이번기수에 확정된 스터디 데이터 등.
```

```
[Prometheus - 추가 질문]
1. 스키마 캐싱 방식: 수동 / 자동 / 자동+수동?
2. 스냅샷 형식: JSON / SQLite?
3. 사용 주체: Claude만 / 앱 코드에서도?

[사용자 - 응답]
1. 잘 모르겠어. 너가 추천해줘
2. json / 수동으로
3. 둘다
```

```
[Prometheus - 추천]
### 스키마 캐싱 추천 이유 (자동 + 수동)

Step 1: 자동 생성 (API로 fetch)
┌─────────────────────────────────────┐
│ ## Users 테이블 (tbl12345)         │
│ | 필드명 | 타입 | ID |              │
│ | 이름   | text | fld001 |          │
└─────────────────────────────────────┘
          ↓
Step 2: 수동 보강 (사용자가 설명 추가)
┌─────────────────────────────────────┐
│ ## Users 테이블 (tbl12345)         │
│ 용도: LMS 수강생 정보 관리          │  ← 추가
│ | 이름   | text | 실명 (카카오명 X) │  ← 추가
└─────────────────────────────────────┘

**장점:**
- 초기 설정 부담 ↓ (일일이 필드 안 적어도 됨)
- 정확도 ↑ (비즈니스 컨텍스트는 수동 추가)
- 스키마 변경 시 재생성 후 설명만 다시 붙이면 됨
```

저장 위치 논의:

```
[사용자]
현재 스킬을 개선 / 글로벌저장이 왜필요해? / 베이스는 appId를 주면될듯

[Prometheus]
### 글로벌 저장을 제안한 이유

당신이 말했던 상황:
> "하나의 베이스를 여러 프로젝트에서 쓰는 경우가 더 많다"

글로벌 저장 (베이스 단위)          vs          프로젝트 저장 (프로젝트 단위)
~/.airtable/bases/app12345/                   프로젝트 A/.airtable/schema.md
    schema.md ← 1번만 작성                    프로젝트 B/.airtable/schema.md ← 복사 or 재생성

### 하지만 프로젝트 단위도 괜찮을 수 있음

스키마 **자동 생성**이 되면:
- 프로젝트마다 "스키마 생성해줘" 한 번이면 끝
- 글로벌 관리 복잡도 ↓
- git으로 버전 관리 가능

[사용자]
매번 스키마 재생성해도돼. 단 같은 베이스를 사용하는 프로젝트에서의 스키마를 복제해오도록 하면될듯

[Prometheus]
완벽해요! 이제 구조가 명확해졌어요.

새 프로젝트에서 "에어테이블 연동해줘" 하면:
1. "app12345 스키마가 다른 프로젝트에 있나?" 확인
2. 있으면 → 복제
3. 없으면 → API로 자동 생성
```

```
[Prometheus - 최종 질문]
스키마 복제 시 검색 범위: 어디서 기존 스키마를 찾을까요?

[사용자]
~/Documents/DEV/ 하위 전체가 좋겠어. 무조건 그 안에 다 있어. 응응응
```

**Plan Generated:**

```
[Prometheus]
## Plan Generated: airtable-efficiency

### Key Decisions Made:
- **스키마 저장 위치**: 프로젝트/.airtable/{appId}/schema.md (글로벌 X)
- **스키마 갱신 트리거**: 명시적 요청 시만 (자동 동기화 X)
- **복제 시 처리**: 전체 복제 (비즈니스 컨텍스트 포함)
- **스냅샷 파일명**: {tableName}-{YYYYMMDD}.json

### 6개 Task 요약

| Task | 내용 | Wave |
|------|------|------|
| 1 | LLM 에이전트 규칙 문서 작성 | 1 (병렬) |
| 2 | 스키마 템플릿 개선 (자동/수동 분리) | 1 (병렬) |
| 3 | SKILL.md - 스키마 캐싱 (Step 4) | 2 (병렬) |
| 4 | SKILL.md - 스냅샷 관리 (Step 5) | 2 (병렬) |
| 5 | 스키마 자동 생성 가이드 | 2 (병렬) |
| 6 | 통합 검증 및 문서 정리 | 3 (최종) |

**Plan saved to**: `.sisyphus/plans/airtable-efficiency.md`
```

---

**실행:**

```
[Sisyphus 작업 세션 시작 - airtable-efficiency 플랜]
/start-work
```

**OpenCode (Atlas) 작업:**
- `.sisyphus/plans/airtable-efficiency.md` 플랜 파일 읽기 및 분석
- 총 6개 태스크, 3개 웨이브로 구성된 실행 계획 수립
- 노트패드 및 작업 추적 파일 초기화
  - `.sisyphus/notepads/airtable-efficiency/learnings.md`
  - `.sisyphus/notepads/airtable-efficiency/problems.md`
  - `.sisyphus/notepads/airtable-efficiency/issues.md`
  - `.sisyphus/notepads/airtable-efficiency/decisions.md`

---

### 3. Wave 1: LLM 규칙 및 스키마 템플릿 작성

```
Task 1: LLM 효율성 규칙 문서 생성
Task 2: 스키마 템플릿 개선 (AUTO/USER 섹션 분리)
```

**OpenCode (Atlas → Sisyphus) 작업:**
- 서브에이전트 위임 시도 → 실패 (google/gemini-3-flash-preview 모델 불안정)
- 오케스트레이터 오버라이드로 직접 작업 수행
- `references/llm-rules.md` 생성 (7.1KB, 259 lines)
  - API 제약사항 및 베스트 프랙티스
  - 7개 안티패턴과 해결책
  - MCP 도구 레퍼런스
- `references/schema-template.md` 개선
  - AUTO-GENERATED / USER-ADDED 마커 추가
  - Field ID 컬럼 추가
  - 재생성 워크플로우 설명

---

### 4. Wave 2: SKILL.md 확장 및 스키마 생성기 가이드

```
Task 3: SKILL.md에 Step 4 (스키마 캐싱) 추가
Task 4: SKILL.md에 Step 5 (스냅샷 관리) 추가
Task 5: 스키마 생성기 가이드 작성
```

**OpenCode (Atlas) 작업:**
- `SKILL.md` 확장 (+240 lines)
  - Step 4: Schema Caching (~116 lines)
  - Step 5: Snapshot Management (~124 lines)
- `assets/schema-generator.md` 생성 (9KB, 347 lines)
  - MCP 도구를 사용한 스키마 생성 절차
  - 20+ Airtable 타입 변환 규칙
  - 재생성 워크플로우

---

### 5. Wave 3: 최종 통합 및 문서화

```
Task 6: 크로스 레퍼런스 검증 및 최종 정리
```

**OpenCode (Atlas) 작업:**
- `references/claude-context.md` 업데이트
  - 스키마 캐싱 워크플로우 추가
  - llm-rules.md 참조 추가
- 내부 일관성 및 링크 검증
  - llm-rules.md: 3개 크로스 레퍼런스
  - schema-generator.md: 2개 레퍼런스
  - 마커 일관성: 17개 occurrences

---

### 6. 스킬 구조 개편 요청 (skill-creator 관련)

> **세션**: `ses_3fd789b63ffe8wXZMeJ318QhR3` (2026-01-28 03:21)

```
[사용자]
질문이 몇 개 있어.
1. 그러면 airtable-template 이라는 폴더는 더이상 필요 없는거야?
2. 그리고 이번에 만든 airtable-integration-skill을 skill-creator 스킬을 활용해서 구조적으로 전면 개편하고 싶어.
3. 그리고 이번에 만든 airtable-integration-skill을 별도 레포지토리로 public 배포해주고...
4. 해당 스킬은 전역설치 말고 현재 프로젝트에만 가져와서 쓰고 싶어
5. 마지막으로 해당 스킬을 gpters-toolkit에도 배포해줘
```

**Sisyphus 탐색 결과:**

| 항목 | 발견 사항 |
|------|----------|
| **skill-creator** | `~/.claude/skills/skill-creator/SKILL.md` 존재 |
| **skill-creator 구조** | `assets/`, `scripts/`, `references/` 디렉토리 구조 표준 정의 |
| **scripts 폴더** | `init_skill.py`, `package_skill.py` 스크립트 포함 |

**⚠️ 중요: 실제 구현에서는 skill-creator 스킬을 로드/사용하지 않음**

```
[실제 작업 방식]
- skill-creator 스킬 로드: ❌ 안 함
- `references/` 디렉토리 구조 참고: ✅ 탐색으로 확인
- `init_skill.py`, `package_skill.py` 스크립트 사용: ❌ 안 함
- 수동으로 `references/` 생성: ✅ 직접 만듦
```

사용자가 "skill-creator 스킬을 활용해서 구조적으로 전면 개편"을 요청했지만,
실제로는 skill-creator 스킬의 **디렉토리 구조만 참고**하여 수동으로 구현했습니다.

---

### 7. 스킬 구조 개편 실행

**Before:**
```
~/.claude/skills/airtable-integration/
├── SKILL.md
└── assets/ (3 files)
```

**After:**
```
~/.claude/skills/airtable-integration/
├── SKILL.md (291줄)
├── assets/ (3 files)
│   ├── airtable.ts
│   ├── airtable.types.ts
│   └── mcp-config.json
└── references/          ← NEW (skill-creator 구조 참고)
    ├── usage-guide.md   ← airtable-template/README.md 내용
    ├── claude-context.md ← airtable-template/CLAUDE.md.example 내용
    └── schema-template.md ← airtable-template/docs/airtable-schema.md 내용
```

**OpenCode (Sisyphus) 작업:**
- `references/` 디렉토리 생성
- `airtable-template` 폴더의 문서들을 스킬로 흡수:
  - README.md → `references/usage-guide.md`
  - CLAUDE.md.example → `references/claude-context.md`
  - docs/airtable-schema.md → `references/schema-template.md`
- 스킬이 자체 완결형(self-contained)이 됨 (외부 경로 의존 제거)

---

### 8. GitHub 공개 레포지토리 생성

```
[사용자]
이번에 만든 airtable-integration-skill을 별도 레포지토리로 public 배포해주고...
```

**OpenCode (Sisyphus) 작업:**
- GitHub 레포지토리 생성: `daht-mad/airtable-integration-skill` (PUBLIC)
- README.md에 설치 가이드 포함
- 스킬 전체 구조를 레포지토리에 푸시

**레포지토리 URL**: https://github.com/daht-mad/airtable-integration-skill

---

### 9. airtable-template 폴더 삭제

```
[사용자]
그러면 airtable-template 이라는 폴더는 더이상 필요 없는거야?

[Sisyphus]
네, 맞습니다. airtable-template의 모든 유용한 문서들이 
airtable-integration 스킬의 references/ 폴더로 흡수되었기 때문에
더 이상 별도의 템플릿 폴더는 필요하지 않습니다.
```

**삭제된 폴더:**
- `~/Documents/DEV/.../airtable-template/`

**흡수된 문서들:**

| 원본 (airtable-template) | 이동 위치 (스킬) |
|--------------------------|-----------------|
| `README.md` | `references/usage-guide.md` |
| `CLAUDE.md.example` | `references/claude-context.md` |
| `docs/airtable-schema.md` | `references/schema-template.md` |

---

### 10. Git 커밋 및 푸시

```
이거 깃커밋푸시해줘
```

**OpenCode (Sisyphus) 작업:**
- `.gitignore` 생성 (node_modules, .sisyphus/notepads 등 제외)
- 초기 커밋 생성
- GitHub 레포 연결 및 푸시: `daht-mad/airtable-integration-skill`

---

### 11. gpters-partners 프로젝트에 스킬 설치

```
gpters-partners 프로젝트에 이 스킬 설치해줘
→ 이 스킬을 일단 프로젝트 레벨에서 쓸 수 있도록 스킬 복사해줘
```

**OpenCode (Sisyphus) 작업:**
- `.claude/settings.local.json` 업데이트
  - `Skill(airtable-integration)` 권한 추가
  - `additionalDirectories` 설정
- 스킬 파일 복사: `.claude/skills/airtable-integration/`
  - SKILL.md
  - assets/ (airtable.ts, airtable.types.ts, mcp-config.json, schema-generator.md)
  - references/ (llm-rules.md, schema-template.md, claude-context.md, usage-guide.md)

---

## 2026-01-29 (Day 2)

> **세션**: `ses_3f8caf0ddffeOKs7tbWDLpMAc6`, `ses_3f7e4ecc7ffedQ6W2FP1uiEHMt`

### 1. README.md 생성

```
[사용자]
지금 이 스킬의 readme가 없는 것 같아. 어떤 스킬이고 어떻게 사용하는지 자세히 적어줘
```

**OpenCode (Sisyphus) 작업:**
- 프로젝트 구조 및 스킬 내용 파악
- `README.md` 생성
  - 개요: 스킬의 목적과 4가지 핵심 기능
  - 호출 방법: "에어테이블 연동해줘" 등 트리거 문구
  - 워크플로우: 5단계 설정 과정
  - 주요 기능: MCP 15개 도구, SDK 사용법
  - 환경변수: PAT 발급 방법 포함
  - API 주의사항: Rate limit, Pagination, Batch 제한

---

### 2. 스키마 캐싱 워크플로우 개선

```
[사용자]
gpters-partners 프로젝트에 스킬 설치했는데 스키마 캐싱과 스냅샷 관련해서 어떻게 해야하는지 모르겠어.
```

```
[Sisyphus - 현재 상태 분석]
## 현재 설정 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| MCP 서버 | ✅ 완료 | `.mcp.json` |
| SDK 래퍼 | ✅ 완료 | `lib/airtable.ts` |
| 환경변수 | ✅ 완료 | Base ID: `appFjttxZjgyZBHal` |
| 스키마 캐싱 | ❌ 없음 | `.airtable/` 디렉토리 없음 |
| 스냅샷 | ❌ 없음 | |

## 스키마 캐싱 vs 스냅샷 차이점

| | 스키마 캐싱 | 스냅샷 |
|---|------------|--------|
| **저장하는 것** | 테이블 구조 (필드 이름, 타입) | 실제 데이터 (레코드) |
| **용도** | Claude가 테이블 구조 빠르게 파악 | 변경 안 되는 과거 데이터 조회 |
| **예시** | "Users 테이블에 이메일, 이름 필드가 있음" | "2024년 결제 데이터 123건" |
```

---

### 3. SKILL.md 워크플로우 개선 - 스키마 캐싱 기본 포함

```
[사용자]
그러면 원래는 스킬 쓰면 자동으로 스키마까지 생성해주는 게 맞니?

[Sisyphus]
맞습니다. **수정 후** 스킬 워크플로우:

"에어테이블 연동해줘"
     ↓
"기본 설치를 진행할까요?" (기본 선택)
     ↓
Step 1: MCP 서버 설정
Step 2: SDK 래퍼 설치
Step 3: 환경변수 가이드
Step 4: 스키마 자동 생성 ← 여기까지 자동
     ↓
완료

### 이전 vs 이후

| | 수정 전 | 수정 후 |
|---|---------|---------|
| 기본 설치 범위 | Step 1-3 | Step 1-4 |
| 스키마 캐싱 | 별도 요청 필요 | **자동 포함** |

### gpters-partners에서 스키마가 없던 이유

스킬 설치 당시에는 **수정 전** 워크플로우였기 때문에 Step 1-3만 진행되고 Step 4는 건너뛰었습니다.
```

- 커밋: `feat: include schema caching in default installation workflow`

---

### 4. 스키마 저장 필수 강조

```
[사용자]
스키마 생성하고 왜 저장을 안해?
아니 내가 말하는 건 gpters-partners 가서 스키마 생성해달라고 했는데 만들어주고 저장을 안해

[Sisyphus]
아, 이해했습니다. gpters-partners에서 다른 세션을 열어서 스키마 생성을 요청했는데, 
Claude가 테이블 정보를 조회해서 **보여주기만 하고 파일에 저장하지 않았다**는 거죠.

이건 스킬 워크플로우 문제입니다. "생성 후 반드시 저장"이 명확하지 않았습니다.
```

**수정 내용:**
- `SKILL.md` 및 `assets/schema-generator.md`에 "⚠️ 반드시 저장" 강조 추가
- 커밋: `fix: emphasize mandatory file save step in schema generation`

---

### 5. 폴더명 형식 변경 (appId → 한글 베이스명)

```
[사용자]
혹시 .airtable 하위에 폴더명 지정할 때 베이스id 말고 한글명으로 가능할까?
→ "한글명만" 선택
```

**OpenCode (Sisyphus) 작업:**
- 전체 문서 수정
  - `SKILL.md`: 폴더명 형식 + 베이스명 확인 단계 추가
  - `README.md`: 디렉토리 구조 업데이트
  - `assets/schema-generator.md`: 폴더명 형식 변경
  - `references/llm-rules.md`, `claude-context.md` 업데이트
- gpters-partners 폴더 변경: `appFjttxZjgyZBHal` → `오픈채팅방-파트너DB`
- 커밋: `feat: use Korean base name for .airtable folder instead of appId`

---

### 6. 멀티 베이스 지원 분석

> **세션**: `ses_3f7e4ecc7ffedQ6W2FP1uiEHMt` (Prometheus)

```
[사용자]
혹시 여러 베이스의 테이블을 가지고 작업을 해야할 때 어떻게 해야해? 
.env 파일에는 1개의 baseId만 넣잖아? 그리고 스키마도 1개고..

[Prometheus]
## 현재 상황 분석

### 1. MCP 서버 → **이미 멀티 베이스 지원됨!** ✅

list_bases()           → 접근 가능한 모든 베이스 목록
list_tables(baseId)    → baseId를 파라미터로 전달

MCP 도구는 **모든 API 호출에 `baseId`를 파라미터로 받기 때문에** 
여러 베이스를 자유롭게 오갈 수 있어요. 
`.env`의 `AIRTABLE_BASE_ID`는 MCP 서버에서 사용하지 않습니다.

### 2. SDK 래퍼 (airtable.ts) → **단일 베이스에 고정됨** ❌

_base = airtable.base(process.env.AIRTABLE_BASE_ID)  // 싱글톤

| 구분 | 멀티 베이스 지원 | 필요한 조치 |
|------|-----------------|------------|
| **MCP 서버** | ✅ 이미 지원 | 없음 (baseId 파라미터로 전달) |
| **SDK 래퍼** | ❌ 단일 베이스 | `getBase(baseId)` 함수 추가 |
| **스키마 캐싱** | ✅ 이미 지원 | 없음 (폴더별 분리 구조) |
```

```
[사용자]
클로드로만 작업하긴 해. 그러면 .env에 있는 baseId는 필요없는거야?

[Prometheus]
맞아요! **MCP만 쓰면 `.env`의 `AIRTABLE_BASE_ID`는 필요 없어요**

| 구성 요소 | API Key 사용 | Base ID 사용 |
|-----------|-------------|-------------|
| **MCP 서버** | `.mcp.json`에서 | ❌ 안 씀 (파라미터로 전달) |
| **SDK 래퍼** | `.env`에서 | `.env`에서 |
```

---

### 7. SDK 필수화 및 스키마 자동 갱신 CRITICAL 지침 추가

```
[사용자]
일단 무조건 sdk도 되게 하자. 선택으로 두지마. 
그러면 baseid도 받는게 맞아. 
다만 사용자가 작업 중에 스키마를 바꾸게 되면 
스키마를 업데이트 자동으로 하도록 스킬이 발동되게 하려면 어떻게 해야해?

[Prometheus - 분석 결과]
## 핵심 발견

1. **Hook 시스템**은 있지만 `Write`, `Edit`, `Bash` 같은 **네이티브 도구에만 작동**
2. **MCP 도구** (Airtable API 등)에는 직접적인 Hook이 없음
3. 대신 **"지침 기반 자동화"**가 핵심 메커니즘

## 스키마 자동 업데이트 구현 방법

### 방법: SKILL.md에 CRITICAL 지침 추가 (권장 ✅)

**CRITICAL**: 다음 MCP 도구 사용 후에는 반드시 스키마 파일을 갱신해야 한다:
- `create_table` — 새 테이블 추가됨
- `update_table` — 테이블 메타데이터 변경
- `create_field` — 새 필드 추가됨  
- `update_field` — 필드 정보 변경

### 작동 원리

Claude가 create_field 호출
        ↓
에이전틱 루프가 CRITICAL 지침 인식
        ↓
자동으로 describe_table 호출
        ↓
schema.md 업데이트
        ↓
"스키마 갱신 완료" 알림
```

**OpenCode (Sisyphus) 작업:**
- `SKILL.md` 수정
  - SDK 필수화: Step 1-4 모두 필수, Step 5만 선택
  - 스키마 자동 갱신 CRITICAL 지침 추가 (4-3 섹션)
- `references/claude-context.md` 템플릿 업데이트
  - 스키마 자동 갱신 규칙 (CRITICAL) 섹션 추가

---

## 커밋 히스토리

| 날짜 | 커밋 | 설명 |
|------|------|------|
| 01/28 | `b1c812c` | feat(airtable): complete airtable-integration skill with efficiency features |
| 01/29 | `3164b40` | feat: include schema caching in default installation workflow |
| 01/29 | `09a807a` | fix: emphasize mandatory file save step in schema generation |
| 01/29 | `5a81597` | feat: use Korean base name for .airtable folder instead of appId |

---

## 기술 스택

- **MCP Server**: `airtable-mcp-server` (15개 도구)
- **SDK**: `airtable` (Node.js), Custom Wrapper (`airtable.ts`)
- **Runtime**: Node.js / Bun
- **Documentation**: Markdown

---

## 주요 기능

1. **MCP 서버 설정**
   - Airtable API 연동을 위한 MCP 서버 자동 설정
   - 15개 CRUD 도구 (list_bases, list_tables, list_records, create_record 등)

2. **SDK 래퍼**
   - 타입 안전한 Airtable 접근
   - 환경변수 기반 인증

3. **스키마 캐싱**
   - 토큰 절약을 위한 테이블 구조 로컬 캐싱
   - AUTO-GENERATED / USER-ADDED 섹션 분리
   - 스키마 변경 시 자동 갱신 (CRITICAL 지침)

4. **스냅샷 관리**
   - 변경되지 않는 과거 데이터 로컬 저장
   - API 호출 최소화

5. **LLM 효율성 규칙**
   - Rate limit (5 req/sec) 준수
   - Pagination 핸들링
   - Batch 제한 (10개) 안내
   - 7개 안티패턴 방지

---

## 부록: gpters-toolkit 배포 기록

> 이 섹션은 gpters-ai-toolkit (팀 내부 스킬 공유 플랫폼)에 스킬을 배포한 과정을 기록합니다.

### 1. 첫 번째 시도 및 MCP 인증 문제 (Day 1)

> **세션**: `ses_3fd789b63ffe8wXZMeJ318QhR3` (2026-01-28)

```
[사용자]
마지막으로 해당 스킬을 gpters-toolkit에도 배포해줘
```

**시도 1: gpters-ai-toolkit MCP 사용**
- `mcp__gpters-ai-toolkit__deploy_skill` 도구 호출
- 결과: **401 Unauthorized 에러**

```
[에러 메시지]
HTTP MCP 서버에 인증 헤더가 설정되지 않음
→ API 키 또는 Bearer 토큰 필요
```

**시도 2: Playwright로 폼 채우기**
- gpters-toolkit 웹사이트에 직접 접근 시도
- 결과: **로그인 필요** (인증 문제 동일)

**근본 원인:**
- gpters-ai-toolkit MCP 서버 설정에 인증 정보 누락
- HTTP MCP는 요청 시 인증 헤더를 자동으로 포함하지 않음

**제시된 해결책:**
1. OAuth 인증 플로우 구현
2. `.mcp.json`에 Bearer 토큰 직접 추가
3. 환경변수로 API 키 전달

---

### 2. 배포 성공 (gpters-partners에서 작업)

> 인증 문제 해결 후 별도 세션에서 진행

```
[사용자]
https://github.com/daht-mad/airtable-integration-skill 여기에 배포한 스킬을 gpters-toolkit에도 배포해줘
```

**Claude Code 작업:**
- GitHub API로 스킬 저장소 파일 내용 가져오기
  - `gh api repos/daht-mad/airtable-integration-skill/contents/SKILL.md`
  - `assets/` 폴더: airtable.ts, airtable.types.ts, mcp-config.json
  - `references/` 폴더: usage-guide.md, claude-context.md, schema-template.md
- `mcp__gpters-ai-toolkit__deploy_skill` 도구로 gpters-toolkit에 배포
  - name: "에어테이블 연동"
  - id: `airtable-integration`
  - tags: airtable, mcp, sdk, database, integration
  - teamTag: data

---

### 3. 기존 스킬 정리

```
[사용자]
Airtable 연동 이라는 걸 gpters-toolkit에서 제거해줘. 새로운 걸 올릴거야.
```

**Claude Code 작업:**
- `mcp__gpters-ai-toolkit__semantic_search`로 기존 스킬 검색
- 발견된 스킬 2개:
  - `airtable-connect` (Airtable 연동) - Next.js 프로젝트용
  - `airtable-integration` (에어테이블 연동) - MCP + SDK 래퍼
- `mcp__gpters-ai-toolkit__undeploy_skill`로 `airtable-integration` 삭제
- 새 버전으로 재배포 준비
