/**
 * Airtable 데이터베이스 클라이언트 (재사용 템플릿)
 *
 * @module lib/airtable
 * @description
 * Airtable API 클라이언트 초기화 및 보안 유틸리티.
 * 프로젝트별로 TABLES 상수만 수정하면 됩니다.
 *
 * @setup
 * 1. npm install airtable
 * 2. .env.local에 AIRTABLE_API_KEY, AIRTABLE_BASE_ID 설정
 * 3. TABLES 상수에 테이블 ID 추가
 * 4. airtable.types.ts에 타입 정의
 *
 * @example
 * import { base, TABLES, escapeFormulaValue } from '@/lib/airtable'
 *
 * const safeInput = escapeFormulaValue(userInput)
 * const records = await base(TABLES.MY_TABLE)
 *   .select({ filterByFormula: `{필드명} = "${safeInput}"` })
 *   .all()
 */

import Airtable from 'airtable'

// 타입은 별도 파일에서 import (Node.js Type Stripping 호환)
// import type { MyRecord } from './airtable.types'

// Airtable 클라이언트 초기화 (지연 로딩)
// 클라이언트 컴포넌트에서 타입만 import할 때 에러 방지
let _base: ReturnType<Airtable['base']> | null = null

function getBase(): ReturnType<Airtable['base']> {
  if (!_base) {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      throw new Error('Airtable 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.')
    }
    const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    _base = airtable.base(process.env.AIRTABLE_BASE_ID)
  }
  return _base
}

/** Airtable Base 인스턴스 (서버 전용) - 테이블 이름으로 호출 */
export function base(tableName: string) {
  return getBase()(tableName)
}

/**
 * Airtable 테이블 ID 상수
 * @description
 * Airtable에서 테이블 ID 확인 방법:
 * 1. Airtable 베이스 열기
 * 2. 테이블 선택
 * 3. URL에서 확인: https://airtable.com/appXXXXX/tblYYYYY/...
 *    - appXXXXX = Base ID (환경변수에 설정)
 *    - tblYYYYY = Table ID (여기에 추가)
 *
 * @example
 * // 테이블 추가 예시
 * export const TABLES = {
 *   USERS: 'tblXXXXXXXXXXXXXX',      // 사용자
 *   ORDERS: 'tblYYYYYYYYYYYYYY',     // 주문
 *   PRODUCTS: 'tblZZZZZZZZZZZZZZ',   // 상품
 * } as const
 */
export const TABLES = {
  // TODO: 프로젝트 테이블 ID 추가
  // EXAMPLE_TABLE: 'tblXXXXXXXXXXXXXX',
} as const

/**
 * Airtable 뷰 ID 상수 (선택사항)
 * @description
 * 뷰를 사용할 경우에만 정의. 기본적으로 뷰 없이 직접 조회 권장.
 * ⚠️ 뷰에는 숨겨진 필터가 있을 수 있으므로 주의!
 */
export const VIEWS = {
  // EXAMPLE_VIEW: 'viwXXXXXXXXXXXXXX',
} as const

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
    .replace(/\\/g, '\\\\')  // 백슬래시 이스케이프
    .replace(/"/g, '\\"')     // 큰따옴표 이스케이프
    .replace(/\n/g, '\\n')    // 줄바꿈 이스케이프
    .replace(/\r/g, '\\r')    // 캐리지 리턴 이스케이프
    .replace(/\t/g, '\\t')    // 탭 이스케이프
}

// ============================================
// 프로젝트별 헬퍼 함수 추가 영역
// ============================================

// TODO: 데이터 변환 함수 등 추가
// export function convertRecordToDto(record: MyRecord): MyDto { ... }
