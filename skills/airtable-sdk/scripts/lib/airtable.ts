/**
 * Airtable SDK Wrapper Library
 *
 * @module skills/airtable-sdk/scripts/lib/airtable
 * @description
 * SDK 기반 Airtable 클라이언트.
 * - 지연 로딩 패턴으로 초기화
 * - Formula Injection 방지 (escapeFormulaValue)
 * - Rate Limit 대응 (fetchWithRetry)
 * - Metadata API 헬퍼 (fetchMetadata)
 *
 * @example
 * import { getBase, escapeFormulaValue, validateEnv } from './lib/airtable'
 *
 * validateEnv()
 * const base = getBase()
 * const safeInput = escapeFormulaValue(userInput)
 */

import Airtable from 'airtable'

// ============================================
// Types
// ============================================

export interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
  createdTime?: string
}

export interface TableSchema {
  id: string
  name: string
  fields: FieldSchema[]
}

export interface FieldSchema {
  id: string
  name: string
  type: string
  options?: Record<string, unknown>
  description?: string
}

export interface BaseSchema {
  tables: TableSchema[]
}

export interface MetadataResponse {
  tables: Array<{
    id: string
    name: string
    primaryFieldId: string
    fields: Array<{
      id: string
      name: string
      type: string
      options?: Record<string, unknown>
      description?: string
    }>
  }>
}

// ============================================
// Environment Validation
// ============================================

/**
 * 필수 환경변수 검증
 * @throws Error 환경변수가 누락된 경우
 */
export function validateEnv(): void {
  const required = ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`[ERROR] Missing required environment variables: ${missing.join(', ')}`)
    console.error('')
    console.error('Please set the following in your environment:')
    console.error('  export AIRTABLE_API_KEY="pat_XXXXX..."')
    console.error('  export AIRTABLE_BASE_ID="appXXXXX..."')
    process.exit(1)
  }
}

/**
 * 환경변수 가져오기 (검증 포함)
 */
export function getEnv(): { apiKey: string; baseId: string } {
  validateEnv()
  return {
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
  }
}

// ============================================
// Airtable Client (Lazy Loading)
// ============================================

let _base: ReturnType<Airtable['base']> | null = null

/**
 * Airtable Base 인스턴스 (지연 로딩)
 * @returns Airtable Base 인스턴스
 */
export function getBase(): ReturnType<Airtable['base']> {
  if (!_base) {
    const { apiKey, baseId } = getEnv()
    const airtable = new Airtable({ apiKey })
    _base = airtable.base(baseId)
  }
  return _base
}

/**
 * 테이블 접근 헬퍼
 * @param tableName 테이블 이름 또는 ID
 */
export function table(tableName: string) {
  return getBase()(tableName)
}

// ============================================
// Security Utilities
// ============================================

/**
 * Airtable Formula Injection 방지를 위한 이스케이프 함수
 *
 * @description
 * 사용자 입력값을 filterByFormula에 사용하기 전에 반드시 이 함수로 이스케이프해야 함.
 * SQL Injection과 유사하게 Formula Injection 공격을 방지.
 *
 * @param value - 이스케이프할 문자열
 * @returns 이스케이프된 안전한 문자열
 *
 * @example
 * const safePhone = escapeFormulaValue(userInput)
 * filterByFormula: `{전화번호} = "${safePhone}"`
 */
export function escapeFormulaValue(value: string): string {
  if (!value) return ''
  return value
    .replace(/\\/g, '\\\\') // 백슬래시 이스케이프
    .replace(/"/g, '\\"') // 큰따옴표 이스케이프
    .replace(/\n/g, '\\n') // 줄바꿈 이스케이프
    .replace(/\r/g, '\\r') // 캐리지 리턴 이스케이프
    .replace(/\t/g, '\\t') // 탭 이스케이프
}

// ============================================
// Rate Limit Handling
// ============================================

const DEFAULT_RETRY_DELAY = 1000 // 1초
const MAX_RETRIES = 5
const JITTER_MAX = 500 // 최대 500ms 랜덤 지터

/**
 * 지수 백오프 + 지터로 딜레이 계산
 */
function calculateBackoff(attempt: number): number {
  const exponentialDelay = DEFAULT_RETRY_DELAY * Math.pow(2, attempt)
  const jitter = Math.random() * JITTER_MAX
  return exponentialDelay + jitter
}

/**
 * Rate Limit (429) 대응 재시도 래퍼
 *
 * @param fn 실행할 함수
 * @param retries 최대 재시도 횟수 (기본 5)
 * @returns 함수 실행 결과
 */
export async function fetchWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // 429 Rate Limit 에러인 경우에만 재시도
      const isRateLimited =
        (error as { statusCode?: number }).statusCode === 429 ||
        (error as { message?: string }).message?.includes('RATE_LIMIT')

      if (!isRateLimited || attempt === retries) {
        throw error
      }

      const delay = calculateBackoff(attempt)
      console.error(
        `[WARN] Rate limited. Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${retries})`
      )
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Promise 기반 sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================
// Metadata API Helpers
// ============================================

const METADATA_API_BASE = 'https://api.airtable.com/v0/meta/bases'

/**
 * Metadata API 호출 헬퍼
 *
 * @param endpoint API 엔드포인트 (baseId 이후 경로)
 * @param options fetch 옵션
 * @returns API 응답
 */
export async function fetchMetadata<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey, baseId } = getEnv()
  const url = `${METADATA_API_BASE}/${baseId}${endpoint}`

  const response = await fetchWithRetry(() =>
    fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Metadata API error (${response.status}): ${errorBody}`)
  }

  return response.json() as Promise<T>
}

/**
 * 베이스 스키마 조회
 * @returns 모든 테이블과 필드 정보
 */
export async function getBaseSchema(): Promise<MetadataResponse> {
  return fetchMetadata<MetadataResponse>('/tables')
}

/**
 * 필드 생성
 *
 * @param tableId 테이블 ID
 * @param fieldConfig 필드 설정
 * @returns 생성된 필드 정보
 */
export async function createField(
  tableId: string,
  fieldConfig: {
    name: string
    type: string
    options?: Record<string, unknown>
    description?: string
  }
): Promise<FieldSchema> {
  return fetchMetadata<FieldSchema>(`/tables/${tableId}/fields`, {
    method: 'POST',
    body: JSON.stringify(fieldConfig),
  })
}

// ============================================
// Batch Utilities
// ============================================

/**
 * 배열을 청크로 분할
 * @param array 분할할 배열
 * @param size 청크 크기 (기본 10)
 */
export function chunk<T>(array: T[], size = 10): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ============================================
// CLI Helpers
// ============================================

/**
 * CLI 인자 파싱 헬퍼
 *
 * @param args process.argv (bun에서는 Bun.argv)
 * @returns 파싱된 옵션 객체
 *
 * @example
 * const opts = parseArgs(Bun.argv)
 * // --table Users --filter '{상태}="활성"'
 * // => { table: 'Users', filter: '{상태}="활성"' }
 */
export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {}
  const scriptArgs = args.slice(2) // bun run script.ts 이후의 인자들

  for (let i = 0; i < scriptArgs.length; i++) {
    const arg = scriptArgs[i]

    if (arg.startsWith('--')) {
      const key = arg.slice(2)

      // 다음 인자가 값인지 또는 다른 플래그인지 확인
      const nextArg = scriptArgs[i + 1]
      if (nextArg && !nextArg.startsWith('--')) {
        result[key] = nextArg
        i++ // 값을 소비했으므로 인덱스 증가
      } else {
        // 값이 없으면 boolean true
        result[key] = true
      }
    }
  }

  return result
}

/**
 * 도움말 출력 헬퍼
 */
export function printHelp(usage: string, options: Array<{ flag: string; desc: string }>): void {
  console.log('')
  console.log('Usage:')
  console.log(`  ${usage}`)
  console.log('')
  console.log('Options:')
  for (const opt of options) {
    console.log(`  ${opt.flag.padEnd(25)} ${opt.desc}`)
  }
  console.log('')
}

/**
 * JSON 결과 출력 (pretty print)
 */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

/**
 * 에러 출력 후 종료
 */
export function exitWithError(message: string, code = 1): never {
  console.error(`[ERROR] ${message}`)
  process.exit(code)
}
