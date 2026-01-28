# LLM Agent Rules - Airtable API Efficiency

Rules for AI agents working with Airtable to minimize token waste and API errors.

## API Constraints

### Rate Limits
- **Limit**: 5 requests per second per base
- **Violation**: HTTP 429 errors
- **Strategy**: Batch operations when possible, add delays if hitting limits

### Pagination
- **Default limit**: 100 records per request
- **Maximum**: 100 records (cannot be increased)
- **Required**: Use `offset` parameter to fetch beyond 100

**Pagination Pattern**:
```javascript
let offset = undefined
let allRecords = []
do {
  const response = await list_records(baseId, tableId, { 
    maxRecords: 100, 
    offset,
    filterByFormula: `{Status} = "Active"` 
  })
  allRecords.push(...response.records)
  offset = response.offset
} while (offset)
```

### Batch Operations
- **`update_records`**: Maximum 10 records per call
- **`delete_records`**: Maximum 10 records per call  
- **`create_record`**: Single record only (loop for multiple)

**Batch Update Pattern**:
```javascript
// Split into chunks of 10
for (let i = 0; i < records.length; i += 10) {
  const batch = records.slice(i, i + 10)
  await update_records(baseId, tableId, batch)
}
```

---

## Query Best Practices

### 1. ALWAYS Use filterByFormula

**❌ NEVER rely on views**:
```javascript
// BAD: Views have hidden filters that can change
list_records(baseId, tableId, { view: 'Active Users' })
```

**✅ ALWAYS use explicit filtering**:
```javascript
// GOOD: Explicit, predictable, portable
list_records(baseId, tableId, {
  filterByFormula: `{Status} = "Active"`
})
```

**Why**: Views can have hidden filters that change without warning. Direct filtering is more reliable.

### 2. Escape User Input

**Always use `escapeFormulaValue()` for user inputs**:
```javascript
// From lib/airtable.ts
const safeInput = escapeFormulaValue(userInput)
filterByFormula: `{Email} = "${safeInput}"`
```

**Prevents**: Formula injection attacks (similar to SQL injection)

### 3. Specify maxRecords

**Set maxRecords when you know the expected count**:
```javascript
// GOOD: Reduces response size and processing time
list_records(baseId, tableId, { 
  maxRecords: 20,
  filterByFormula: `{Type} = "Premium"` 
})
```

**Don't over-fetch**: If you need 10 records, request 10-20 (not 100)

### 4. Use detailLevel Wisely

**MCP tools support detailLevel parameter**:
- `tableIdentifiersOnly`: Just IDs and names (minimal tokens)
- `identifiersOnly`: IDs, names, basic types
- `full`: Complete schema with field details (expensive)

```javascript
// GOOD: Start minimal, go deeper only if needed
list_tables(baseId, { detailLevel: 'tableIdentifiersOnly' })

// Then for specific table:
describe_table(baseId, tableId, { detailLevel: 'full' })
```

---

## Schema Management

### Before Any Airtable Work

**1. Check for schema file**:
```bash
ls .airtable/{appId}/schema.md
```

**2. If missing, request generation**:
Ask: "Can you generate the Airtable schema for this base?"

**Why schema caching matters**:
- Prevents repeated `describe_table` API calls
- Reduces token waste (schema can be 1000+ tokens per table)
- Provides business context that API doesn't have

**3. Always read schema before operations**:
```bash
Read .airtable/{appId}/schema.md
```

### Schema Contents
- Table IDs (`tblXXXXXXXXXXXXXX`)
- Field names and types
- Field IDs (`fldXXXXXXXXXXXXXX`)
- Single select options
- Link relationships  
- **USER-ADDED**: Business context, rules, gotchas

### When to Regenerate Schema
- Airtable fields added/removed/changed
- User explicitly requests "refresh schema"
- ⚠️ **Never auto-regenerate** (manual request only)

---

## Anti-Patterns

### ❌ Fetching Without Filters
```javascript
// BAD: Fetches ALL records (wastes API calls, tokens, time)
list_records(baseId, tableId)
```

**Fix**: Always filter to reduce scope:
```javascript
// GOOD: Only fetch what you need
list_records(baseId, tableId, {
  filterByFormula: `{Created} >= "2024-01-01"`,
  maxRecords: 50
})
```

### ❌ Ignoring Pagination
```javascript
// BAD: Only gets first 100 records, silently misses rest
const response = await list_records(baseId, tableId)
const records = response.records  // Missing data!
```

**Fix**: Always implement offset loop (see pagination pattern above)

### ❌ Batch Size Violations
```javascript
// BAD: Tries to update 50 records at once
update_records(baseId, tableId, fiftyRecords)  // ERROR: max 10
```

**Fix**: Chunk into groups of 10 (see batch update pattern above)

### ❌ Using detailLevel='full' Unnecessarily
```javascript
// BAD: Wastes tokens if you only need table names
list_tables(baseId, { detailLevel: 'full' })
```

**Fix**: Use minimal detail level, then drill down:
```javascript
// GOOD: Start minimal
const tables = await list_tables(baseId, { detailLevel: 'tableIdentifiersOnly' })
// Then get details only for tables you need
const tableSchema = await describe_table(baseId, targetTableId, { detailLevel: 'full' })
```

### ❌ Skipping Schema Check
```javascript
// BAD: Directly querying without checking schema
list_records(baseId, tableId, {
  filterByFormula: `{Stauts} = "Active"`  // Typo! Should be "Status"
})
```

**Fix**: Always read schema first to get correct field names

---

## MCP Tool Reference

### Read Tools (6)
- `list_bases` - List accessible bases (no params)
- `list_tables` - List tables in base (baseId, detailLevel)
- `describe_table` - Get table schema (baseId, tableId, detailLevel)
- `list_records` - Fetch records (baseId, tableId, maxRecords, filterByFormula, offset)
- `search_records` - Text search (baseId, tableId, searchTerm, maxRecords)
- `get_record` - Single record by ID (baseId, tableId, recordId)

### Write Tools (7)
- `create_record` - Single record (baseId, tableId, fields)
- `update_records` - Batch update **MAX 10** (baseId, tableId, records[])
- `delete_records` - Batch delete **MAX 10** (baseId, tableId, recordIds[])
- `create_table` - Create new table (baseId, name, fields[], description)
- `update_table` - Modify table metadata (baseId, tableId, name, description)
- `create_field` - Add field (baseId, tableId, field{})
- `update_field` - Modify field (baseId, tableId, fieldId, name, description)

### Comment Tools (2)
- `create_comment` - Add comment (baseId, tableId, recordId, text)
- `list_comments` - Fetch comments (baseId, tableId, recordId, pageSize, offset)

---

## Quick Checklist

Before any Airtable operation, verify:

- [ ] Schema file exists and is read? (`.airtable/{appId}/schema.md`)
- [ ] Using `filterByFormula` instead of views?
- [ ] User input escaped with `escapeFormulaValue()`?
- [ ] Pagination handled if expecting >100 records?
- [ ] Batch size ≤10 for updates/deletes?
- [ ] `detailLevel` appropriate for context budget?
- [ ] `maxRecords` set to expected count (not default 100)?

---

## Summary

**Token waste causes**:
1. No schema caching → repeated API calls
2. Fetching without filters → unnecessary data
3. Using `detailLevel='full'` everywhere → bloated responses
4. Not using `maxRecords` → over-fetching

**API error causes**:
1. Ignoring pagination → missing data
2. Batch size > 10 → errors
3. Rate limit (5 req/sec) → throttling
4. Relying on views → unpredictable results

**Follow these rules to minimize both.**
