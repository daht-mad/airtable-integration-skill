#!/usr/bin/env bun
/**
 * Airtable Field Create Script
 *
 * @description
 * 테이블에 새 필드를 생성합니다.
 * 성공 후 자동으로 스키마를 동기화합니다 (--no-sync로 비활성화 가능).
 *
 * @usage
 * bun run skills/airtable-sdk/scripts/create-field.ts --table <name> --field '<json>'
 * bun run skills/airtable-sdk/scripts/create-field.ts --help
 *
 * @example
 * bun run skills/airtable-sdk/scripts/create-field.ts --table Users --field '{"name":"등급","type":"singleSelect","options":{"choices":[{"name":"일반"},{"name":"프리미엄"}]}}'
 */

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  createField,
  validateEnv,
  parseArgs,
  printHelp,
  printJson,
  exitWithError,
  getEnv,
  fetchMetadata,
  type FieldSchema,
} from './lib/airtable'
import { syncSchema } from './sync-schema'

// ============================================
// Types
// ============================================

interface FieldConfig {
  name: string
  type: string
  options?: Record<string, unknown>
  description?: string
}

interface CreateFieldResult {
  success: boolean
  fieldId: string
  fieldName: string
  schemaSynced: boolean
}

// ============================================
// Main
// ============================================

const HELP_OPTIONS = [
  { flag: '--table <name>', desc: '테이블 이름 (필수)' },
  { flag: '--field <json>', desc: '필드 설정 JSON (필수)' },
  { flag: '--no-sync', desc: '스키마 자동 동기화 비활성화' },
  { flag: '--help', desc: '도움말 출력' },
]

async function main() {
  const args = parseArgs(Bun.argv)

  if (args.help) {
    printHelp(
      'bun run skills/airtable-sdk/scripts/create-field.ts --table <name> --field \'<json>\'',
      HELP_OPTIONS
    )
    console.log('Field JSON structure:')
    console.log('  {')
    console.log('    "name": "필드명",')
    console.log('    "type": "singleLineText | multilineText | singleSelect | ...",')
    console.log('    "options": { ... },  // 타입별 옵션 (선택)')
    console.log('    "description": "설명"  // 선택')
    console.log('  }')
    console.log('')
    console.log('Common field types:')
    console.log('  - singleLineText: 단일 행 텍스트')
    console.log('  - multilineText: 여러 행 텍스트')
    console.log('  - singleSelect: 단일 선택 (options.choices 필요)')
    console.log('  - multipleSelects: 다중 선택 (options.choices 필요)')
    console.log('  - number: 숫자 (options.precision 가능)')
    console.log('  - checkbox: 체크박스')
    console.log('  - date: 날짜')
    console.log('  - dateTime: 날짜+시간')
    console.log('  - email: 이메일')
    console.log('  - url: URL')
    console.log('  - phoneNumber: 전화번호')
    console.log('')
    console.log('Example:')
    console.log('  # Single select 필드')
    console.log('  bun run create-field.ts --table Users --field \'{"name":"등급","type":"singleSelect","options":{"choices":[{"name":"일반"},{"name":"프리미엄"}]}}\'')
    console.log('')
    console.log('  # 텍스트 필드')
    console.log('  bun run create-field.ts --table Users --field \'{"name":"메모","type":"multilineText"}\'')
    console.log('')
    process.exit(0)
  }

  // 필수 인자 검증
  if (!args.table || typeof args.table !== 'string') {
    exitWithError('Missing required argument: --table <name>')
  }

  if (!args.field || typeof args.field !== 'string') {
    exitWithError('Missing required argument: --field \'<json>\'')
  }

  // 환경변수 검증
  validateEnv()

  // JSON 파싱
  let fieldConfig: FieldConfig
  try {
    fieldConfig = JSON.parse(args.field as string)
    if (!fieldConfig.name || typeof fieldConfig.name !== 'string') {
      exitWithError('Field must have a "name" string property')
    }
    if (!fieldConfig.type || typeof fieldConfig.type !== 'string') {
      exitWithError('Field must have a "type" string property')
    }
  } catch (e) {
    if ((e as Error).message.includes('must')) {
      throw e
    }
    exitWithError(`Invalid JSON in --field: ${(e as Error).message}`)
  }

  const skipSync = args['no-sync'] === true

  try {
    // 테이블 ID 조회 (이름으로 찾기)
    const tableId = await getTableId(args.table as string)

    console.error(`[INFO] Creating field "${fieldConfig.name}" in table "${args.table}"...`)

    // 필드 생성
    const created = await createField(tableId, fieldConfig)

    console.error(`[SUCCESS] Field created: ${created.id}`)

    // 스키마 동기화
    let schemaSynced = false
    if (!skipSync) {
      console.error('[INFO] Syncing schema...')
      try {
        await syncSchema()
        schemaSynced = true
        console.error('[SUCCESS] Schema synced')
      } catch (syncError) {
        console.error(`[WARN] Schema sync failed: ${(syncError as Error).message}`)
        console.error('  Run manually: bun run skills/airtable-sdk/scripts/sync-schema.ts')
      }
    }

    const result: CreateFieldResult = {
      success: true,
      fieldId: created.id,
      fieldName: created.name,
      schemaSynced,
    }

    printJson(result)
  } catch (error) {
    const err = error as Error & { statusCode?: number; message: string }
    console.error(`[ERROR] Failed to create field: ${err.message}`)
    if (err.statusCode) {
      console.error(`  Status: ${err.statusCode}`)
    }
    process.exit(1)
  }
}

// ============================================
// Helpers
// ============================================

/**
 * 테이블 이름으로 ID 조회
 */
async function getTableId(tableName: string): Promise<string> {
  // 먼저 로컬 스키마 파일 확인
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const schemaPath = resolve(__dirname, '../references/schema-full.json')

  try {
    const file = Bun.file(schemaPath)
    if (await file.exists()) {
      const schema = await file.json()
      const table = schema.tables.find(
        (t: { name: string; id: string }) => t.name === tableName || t.id === tableName
      )
      if (table) {
        return table.id
      }
    }
  } catch {
    // 파일이 없거나 파싱 실패 - API로 폴백
  }

  // API로 조회
  console.error('[INFO] Table not found in cached schema, fetching from API...')
  const response = await fetchMetadata<{ tables: Array<{ id: string; name: string }> }>('/tables')

  const table = response.tables.find((t) => t.name === tableName || t.id === tableName)
  if (!table) {
    exitWithError(`Table not found: "${tableName}"`)
  }

  return table.id
}

main()
