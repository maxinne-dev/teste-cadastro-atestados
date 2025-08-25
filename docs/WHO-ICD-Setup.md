# WHO ICD API — Credentials & Configuration

This app integrates with the WHO ICD API for diagnosis search/autocomplete.

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

