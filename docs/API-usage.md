# API Usage Examples

All endpoints are prefixed with `/api` (see `backend/src/main.ts`).

## Auth

- Login
  ```bash
  curl -sS -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@example.com","password":"dev-hash"}'
  # => { "accessToken": "<JWT>" }
  ```

- Logout
  ```bash
  curl -sS -X POST http://localhost:3000/api/auth/logout \
    -H 'Authorization: Bearer <JWT>'
  ```

## Health

```bash
curl -sS http://localhost:3000/api/health
```

Response example
```json
{
  "status": "ok",
  "mongo": { "status": "up" },
  "redis": { "status": "up" },
  "icd": { "status": "up" }
}
```

## ICD Search (public)

```bash
# Search in all supported versions (both ICD-10 and ICD-11)
curl -sS 'http://localhost:3000/api/icd/search?q=fever'
# => { "results": [ { "code":"..", "title":"..", "version":"10" }, ... ] }

# Search in specific ICD version
curl -sS 'http://localhost:3000/api/icd/search?q=fever&version=10'
# => { "results": [ { "code":"..", "title":"..", "version":"10" }, ... ] }
```

Notes
- Rate limited by the backend via `ICD_RATE_LIMIT_RPM`.
- Falls back to local cache when WHO API is unavailable.
- By default searches both ICD-10 and ICD-11; use `version=10` or `version=11` to search specific versions.
- Results include a `version` field indicating which ICD version each code belongs to.

## Collaborators (protected)

```bash
TOKEN="<JWT>"

# Create
curl -sS -X POST http://localhost:3000/api/collaborators \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "fullName":"Maria da Silva",
    "cpf":"52998224725",
    "birthDate":"1990-05-10",
    "position":"Analista",
    "department":"RH"
  }'

# Get by CPF
curl -sS http://localhost:3000/api/collaborators/52998224725 \
  -H "Authorization: Bearer $TOKEN"

# Search by name (pagination)
curl -sS 'http://localhost:3000/api/collaborators?q=maria&limit=10&offset=0' \
  -H "Authorization: Bearer $TOKEN"

# Update status
curl -sS -X PATCH http://localhost:3000/api/collaborators/52998224725/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"inactive"}'
```

## Users (admin-only)

```bash
TOKEN="<ADMIN_JWT>"

# Create user
curl -sS -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"user@example.com",
    "fullName":"User Name",
    "password":"secret12345",
    "roles":["hr"]
  }'

# Get by email
curl -sS http://localhost:3000/api/users/user@example.com \
  -H "Authorization: Bearer $TOKEN"

# Update status
curl -sS -X PATCH http://localhost:3000/api/users/user@example.com/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"disabled"}'

# Update roles
curl -sS -X PATCH http://localhost:3000/api/users/user@example.com/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"roles":["hr","admin"]}'
```

## Medical Certificates (protected)

```bash
TOKEN="<JWT>"

# Create
curl -sS -X POST http://localhost:3000/api/medical-certificates \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "collaboratorId": "64ddae5f2f8fb814c89bd421",
    "issuerUserId": "64ddae5f2f8fb814c89bd422",
    "startDate": "2025-01-01",
    "endDate": "2025-01-05",
    "days": 5,
    "diagnosis": "Resfriado comum",
    "icdCode": "J06.9",
    "icdTitle": "Acute upper respiratory infection, unspecified",
    "icdVersion": "10"
  }'

# List with filters
curl -sS 'http://localhost:3000/api/medical-certificates?collaboratorId=64ddae5f2f8fb814c89bd421&status=active&limit=10&offset=0' \
  -H "Authorization: Bearer $TOKEN"

# Cancel
curl -sS -X PATCH http://localhost:3000/api/medical-certificates/<id>/cancel \
  -H "Authorization: Bearer $TOKEN"
```

