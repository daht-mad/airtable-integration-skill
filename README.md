# Airtable Integration Skill

에어테이블 연동 자동화 스킬 for Claude Code.

Claude Code에서 에어테이블 베이스, 테이블, 레코드를 쉽게 관리할 수 있는 스킬입니다. MCP 서버 설정부터 SDK 래퍼 설치까지 자동으로 처리합니다.

## 설치

### 프로젝트 로컬 설치 (권장)

특정 프로젝트에서만 사용하려면:

```bash
# 프로젝트 루트에서
mkdir -p .claude/skills
git clone https://github.com/daht-mad/airtable-integration-skill.git .claude/skills/airtable-integration
```

### 전역 설치

모든 프로젝트에서 사용하려면:

```bash
git clone https://github.com/daht-mad/airtable-integration-skill.git ~/.claude/skills/airtable-integration
```

## 사용법

Claude Code에서 다음과 같이 호출:

```
에어테이블 연동해줘
```

또는:

```
airtable 세팅
```

```
에어테이블 설정
```

## 기능

### MCP 서버 설정
- `.mcp.json` 자동 생성/수정
- `airtable-mcp-server` 연동 설정

### SDK 래퍼 설치
- `lib/airtable.ts` - 타입 안전 API 클라이언트
- `lib/airtable.types.ts` - 완전한 타입 정의

### 환경변수 가이드
- `.env.local` 설정 안내
- Personal Access Token (PAT) 발급 방법
- 베이스 ID 및 테이블 ID 확인 방법

## MCP 도구 목록 (15개)

### 읽기 (6개)
- `list_bases` - 모든 베이스 조회
- `list_tables` - 베이스의 테이블 목록
- `describe_table` - 테이블 스키마 조회
- `list_records` - 테이블의 레코드 조회
- `search_records` - 레코드 검색
- `get_record` - 특정 레코드 조회

### 쓰기 (7개)
- `create_record` - 새 레코드 생성
- `update_records` - 레코드 업데이트 (최대 10개)
- `delete_records` - 레코드 삭제
- `create_table` - 새 테이블 생성
- `update_table` - 테이블 이름/설명 수정
- `create_field` - 새 필드 추가
- `update_field` - 필드 이름/설명 수정

### 댓글 (2개)
- `create_comment` - 레코드에 댓글 추가
- `list_comments` - 레코드의 댓글 조회

## 파일 구조

```
airtable-integration-skill/
├── README.md                    # 이 파일
├── SKILL.md                     # 스킬 정의 및 상세 가이드
├── assets/
│   ├── airtable.ts             # TypeScript API 클라이언트
│   ├── airtable.types.ts       # 타입 정의
│   └── mcp-config.json         # MCP 설정 템플릿
└── references/
    ├── usage-guide.md          # 사용 가이드
    ├── claude-context.md       # Claude 컨텍스트
    └── schema-template.md      # 스키마 템플릿
```

## 라이선스

MIT
