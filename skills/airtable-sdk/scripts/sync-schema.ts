#!/usr/bin/env bun
/**
 * Airtable Schema Sync Script
 *
 * @description
 * Metadata API로 베이스 스키마를 조회하여 JSON 파일로 캐싱합니다.
 * - schema-summary.json: 테이블/필드명만 (~500 토큰)
 * - schema-full.json: 전체 상세 정보
 *
 * @usage
 * bun run skills/airtable-sdk/scripts/sync-schema.ts
 * bun run skills/airtable-sdk/scripts/sync-schema.ts --help
 */

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  getBaseSchema,
  validateEnv,
  parseArgs,
  printHelp,
  printJson,
  type MetadataResponse,
} from './lib/airtable'

// ============================================
// Types
// ============================================

interface SchemaSummary {
  tables: Array<{
    id: string
    name: string
    fields: string[] // 필드명만
  }>
  lastSynced: string
}

interface SchemaFull {
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
  lastSynced: string
}

// ============================================
// Main
// ============================================

const HELP_OPTIONS = [
  { flag: '--help', desc: '도움말 출력' },
]

async function main() {
  const args = parseArgs(Bun.argv)

  if (args.help) {
    printHelp('bun run skills/airtable-sdk/scripts/sync-schema.ts', HELP_OPTIONS)
    process.exit(0)
  }

  // 환경변수 검증
  validateEnv()

  console.log('[INFO] Fetching base schema from Airtable Metadata API...')

  try {
    // Metadata API 호출
    const schema = await getBaseSchema()
    
    // 결과 변환
    const now = new Date().toISOString()
    const summary = transformToSummary(schema, now)
    const full = transformToFull(schema, now)

    // 파일 저장
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const referencesDir = resolve(__dirname, '../references')

    const summaryPath = resolve(referencesDir, 'schema-summary.json')
    const fullPath = resolve(referencesDir, 'schema-full.json')

    await Bun.write(summaryPath, JSON.stringify(summary, null, 2))
    await Bun.write(fullPath, JSON.stringify(full, null, 2))

    console.log('[SUCCESS] 스키마 동기화 완료')
    console.log(`  - schema-summary.json: ${summary.tables.length} tables`)
    console.log(`  - schema-full.json: ${full.tables.reduce((acc, t) => acc + t.fields.length, 0)} fields total`)
    console.log(`  - lastSynced: ${now}`)

    // 요약 출력
    console.log('')
    console.log('Tables:')
    for (const table of summary.tables) {
      console.log(`  - ${table.name} (${table.fields.length} fields)`)
    }

  } catch (error) {
    console.error('[ERROR] Failed to sync schema:', (error as Error).message)
    process.exit(1)
  }
}

// ============================================
// Transform Functions
// ============================================

function transformToSummary(schema: MetadataResponse, timestamp: string): SchemaSummary {
  return {
    tables: schema.tables.map((table) => ({
      id: table.id,
      name: table.name,
      fields: table.fields.map((f) => f.name),
    })),
    lastSynced: timestamp,
  }
}

function transformToFull(schema: MetadataResponse, timestamp: string): SchemaFull {
  return {
    tables: schema.tables.map((table) => ({
      id: table.id,
      name: table.name,
      primaryFieldId: table.primaryFieldId,
      fields: table.fields.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        ...(f.options && { options: f.options }),
        ...(f.description && { description: f.description }),
      })),
    })),
    lastSynced: timestamp,
  }
}

// ============================================
// Export for use by other scripts (create-field.ts)
// ============================================

export async function syncSchema(): Promise<{ summary: SchemaSummary; full: SchemaFull }> {
  validateEnv()
  const schema = await getBaseSchema()
  const now = new Date().toISOString()
  
  const summary = transformToSummary(schema, now)
  const full = transformToFull(schema, now)

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const referencesDir = resolve(__dirname, '../references')

  await Bun.write(resolve(referencesDir, 'schema-summary.json'), JSON.stringify(summary, null, 2))
  await Bun.write(resolve(referencesDir, 'schema-full.json'), JSON.stringify(full, null, 2))

  return { summary, full }
}

// Run if executed directly (not when imported)
// Bun에서는 import.meta.main으로 직접 실행 여부 확인
if (import.meta.main) {
  main()
}
