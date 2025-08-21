# Error Codes and Responses

These responses are enforced by global filters and guards (see `backend/src/common/filters/*.ts` and `backend/src/auth/*.ts`).

- 400 Bad Request
  - Invalid identifier (e.g., malformed ObjectId)
  - Validation errors (class-validator)

- 401 Unauthorized
  - Missing token
  - Invalid token
  - Session expired

- 403 Forbidden
  - Insufficient role (role-based access)

- 409 Conflict
  - Duplicate key (Mongo 11000). Body example:
    ```json
    {
      "statusCode": 409,
      "error": "Conflict",
      "message": "Duplicate cpf: 52998224725",
      "key": "cpf",
      "value": "52998224725"
    }
    ```

- 429 Too Many Requests
  - Rate limit exceeded (login or ICD search)

- 5xx UpstreamError
  - When WHO ICD API fails or times out. Example:
    ```json
    {
      "statusCode": 502,
      "error": "UpstreamError",
      "message": "Upstream request failed",
      "url": "https://id.who.int/..."
    }
    ```

