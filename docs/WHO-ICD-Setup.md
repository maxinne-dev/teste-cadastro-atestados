# WHO ICD API — Credentials & Configuration

This app integrates with the WHO ICD API for diagnosis search/autocomplete, with support for both CID-11 (ICD-11) and CID-10 codes.

## CID-10 and CID-11 Support

The service automatically detects the code format and uses the appropriate data source:

- **CID-10 codes** (e.g., F69, Z99.1, F84): Uses CREMESP CID-10 table as primary source, then validates with WHO ICD API
- **Other searches** (text, non-CID patterns): Uses WHO ICD-11 API directly

### CID-10 Flow
1. Detects CID-10 patterns using regex (letter + 2-3 digits, optional decimals)
2. Fetches from CREMESP table at `http://cremesp.org.br/resources/views/site_cid10_tabela.php`
3. For subcodes (F84.1), extracts parent code (F84) and fetches detailed subcodes
4. Validates results with WHO ICD API when possible
5. Falls back to CID-11 search if CID-10 fails
6. Caches results with appropriate release tags

## 1) Create credentials

- Sign up: https://icd.who.int/icdapi
- Read auth docs: https://icd.who.int/docs/icd-api/API-Authentication/
- After approval, you will receive a Client ID and Client Secret.

## 2) Configure environment

Add these variables to your `.env` (see `.env.example`):

```
WHO_ICD_CLIENT_ID=your_client_id_here
WHO_ICD_CLIENT_SECRET=your_client_secret_here
WHO_ICD_BASE_URL=https://id.who.int
WHO_ICD_RELEASE=2024-01     # Release/tag to target (optional)
WHO_ICD_LANGUAGE=en         # en, pt, es, etc. (optional)
```

Notes
- The backend obtains an OAuth2 access token from `https://icdaccessmanagement.who.int/connect/token` using the client credentials.
- The token is cached until near expiry and refreshed automatically.
- Requests set required headers: `Authorization: Bearer <token>`, `API-Version: v2`, and `Accept-Language` (if configured).

## 3) Rate limits

Set app-side rate limits in `.env` to avoid hammering the WHO API:

```
ICD_RATE_LIMIT_RPM=60  # requests per minute per IP
```

If WHO is down or rate-limited, the backend falls back to the local cache (`icdcodes` collection) and the frontend shows a fallback indicator.

## 4) Troubleshooting

- 401 from WHO: The backend retries once with a refreshed token; double-check credentials if errors persist.
- Empty results: Try a simpler query term or a different language; verify `WHO_ICD_RELEASE` exists.
- Network errors: The app logs upstream status and errors with a `requestId` for correlation.

