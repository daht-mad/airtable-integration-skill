/**
 * Airtable 타입 정의 템플릿
 *
 * @module lib/airtable.types
 * @description
 * Airtable 테이블 스키마에 대응하는 TypeScript 타입 정의.
 * Node.js Type Stripping 호환을 위해 구현 코드와 분리.
 *
 * @naming-convention
 * - XxxRecord: Airtable 레코드 원본 (id + fields)
 * - Xxx: UI/API용 변환된 타입 (DTO)
 *
 * @field-types
 * - Single line text: string
 * - Long text: string
 * - Number: number
 * - Checkbox: boolean
 * - Single select: string
 * - Multiple select: string[]
 * - Date: string (YYYY-MM-DD)
 * - DateTime: string (ISO 8601)
 * - Link to another record: string[] (Record ID 배열)
 * - Lookup: 원본 필드 타입의 배열 (예: string | string[])
 * - Rollup: 집계 함수에 따라 다름 (number, string 등)
 * - Formula: 결과 타입에 따라 다름
 * - Attachment: { url: string, filename: string, ... }[]
 * - Created time: string (ISO 8601)
 * - Created by: { id: string, email: string, name: string }
 *
 * @gotchas
 * - Lookup 필드는 항상 배열일 수 있음 → string | string[] 처리 필요
 * - Link 필드는 Record ID 배열 → FIND() + ARRAYJOIN() 필터링 안됨
 * - 모든 필드는 optional로 정의 (비어있을 수 있음)
 */

// ============================================
// Airtable 레코드 타입 (원본)
// ============================================

/**
 * 예시 테이블 레코드
 * @table 테이블명 (tblXXXXXXXXXXXXXX)
 *
 * @example
 * export interface UserRecord {
 *   id: string
 *   fields: {
 *     이름?: string
 *     이메일?: string
 *     전화번호?: string
 *     가입일?: string  // ISO 8601
 *     상태?: '활성' | '비활성' | '대기'
 *     연결된_주문?: string[]  // Link 필드 (Record ID 배열)
 *     주문_수?: number  // Rollup (COUNT)
 *     Created?: string
 *   }
 * }
 */

// TODO: 프로젝트별 레코드 타입 정의
// export interface MyTableRecord {
//   id: string
//   fields: {
//     필드명?: 타입
//   }
// }

// ============================================
// UI/API용 DTO 타입
// ============================================

/**
 * 예시 UI용 타입
 *
 * @example
 * export interface User {
 *   id: string
 *   name: string
 *   email: string
 *   phone: string
 *   status: string
 *   createdAt: string
 * }
 */

// TODO: 프로젝트별 DTO 타입 정의
// export interface MyDto {
//   id: string
//   ...
// }

// ============================================
// API 응답 래퍼 타입 (범용)
// ============================================

/** API 응답 래퍼 (성공/실패 통합) */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/** 목록 API 응답 래퍼 */
export interface ListResponse<T> {
  success: boolean
  count: number
  data: T[]
  error?: string
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> extends ListResponse<T> {
  offset?: string  // Airtable offset (다음 페이지 토큰)
  hasMore: boolean
}
