# CID-10 Integration with CREMESP

This document explains the CID-10 lookup functionality integrated with the CREMESP (Conselho Regional de Medicina do Estado de São Paulo) table.

## Overview

The ICD service now supports both CID-10 and CID-11 lookups:
- **CID-10**: Uses CREMESP table data with optional WHO ICD API validation
- **CID-11**: Uses WHO ICD API directly (existing functionality unchanged)

## How it Works

### 1. Automatic Pattern Detection

The system automatically detects if a search term looks like a CID-10 code:

```typescript
// CID-10 patterns (routed to CREMESP):
'F84'    // Exact 3-character codes
'F84.1'  // Codes with dots
'Z99.9'  // Multi-level codes
'A00'    // Full range A00-Z999

// Non-CID-10 patterns (routed to WHO CID-11):
'fever'           // Text searches
'pneumonia'       // Medical terms
'acute respiratory' // Multi-word searches
```

### 2. CREMESP Integration

For CID-10 codes, the system:

1. **Fetches main table** from `http://cremesp.org.br/resources/views/site_cid10_tabela.php`
2. **Determines lookup strategy**:
   - **Exact 3-char codes** (F84, Z99): Search directly in main table
   - **Codes with dots/4+ chars** (F84.1, Z991): Find parent code, fetch sub-items
   - **Non-conforming queries**: Search descriptions in main table

3. **Caches results** for 24 hours to minimize requests

### 3. WHO ICD API Validation

Found CID-10 codes are validated against WHO ICD API:
- Attempts validation using CID-10 endpoint
- Falls back to CREMESP data if WHO validation fails
- Returns consistent format with existing CID-11 responses

## API Usage

The existing `/api/icd/search` endpoint works unchanged:

```bash
# CID-10 searches (automatically detected)
curl 'http://localhost:3000/api/icd/search?q=F84'
curl 'http://localhost:3000/api/icd/search?q=F84.1'

# CID-11 searches (existing behavior)
curl 'http://localhost:3000/api/icd/search?q=fever'
curl 'http://localhost:3000/api/icd/search?q=pneumonia'
```

All searches return the same format:
```json
{
  "results": [
    {
      "code": "F84",
      "title": "Transtornos globais do desenvolvimento"
    }
  ]
}
```

## Configuration

No additional configuration is required. The system uses the existing WHO ICD API credentials for validation attempts.

## Error Handling

- **CREMESP unavailable**: Returns empty results
- **WHO validation fails**: Uses CREMESP data directly
- **Network errors**: Gracefully logged and handled

## Performance

- **Caching**: CREMESP main table cached for 24 hours
- **Rate limiting**: Existing rate limiting applies to all searches
- **Timeouts**: 10s for CREMESP, 8s for WHO API calls

## Testing

Run CID-10 specific tests:
```bash
npm run test -- --testPathPattern=cremesp
npm run test -- --testPathPattern=icd
```

The implementation includes comprehensive tests covering:
- Pattern detection logic
- CREMESP table parsing
- WHO API validation
- Error handling scenarios
- Cache behavior