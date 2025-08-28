> Para uma visão geral da arquitetura do sistema, consulte o **[Documento de Arquitetura](../docs/Architecture.md)**.
> Para instruções de setup inicial, veja o **[README principal](../README.md)**.

# Backend (NestJS)

## Setup
- Node.js 20+ e npm
- Copie `.env.example` para `.env` na raiz do monorepo e preencha as variáveis (JWT, Mongo, Redis, OMS se necessário).

## Configuração (variáveis de ambiente)
- `MONGODB_URI` (obrigatório): conexão MongoDB (Docker: `mongodb://mongodb:27017/atestados`)
- `JWT_SECRET` (obrigatório): segredo JWT
- `API_PORT` (opcional, padrão 3000)
- `CORS_ORIGINS` (opcional, csv de origens)
- `AUTH_RATE_LIMIT_RPM` (opcional, padrão 30)
- `ICD_RATE_LIMIT_RPM` (opcional, padrão 60)
- `WHO_ICD_CLIENT_ID` e `WHO_ICD_CLIENT_SECRET` (recomendado; obrigatórios para chamadas reais à OMS)
- `WHO_ICD_BASE_URL` (padrão `https://id.who.int`)
- `WHO_ICD_RELEASE` (padrão `2024-01`)
- `AUDIT_TTL_DAYS` (opcional; define TTL para logs de auditoria)

## Scripts
```bash
cd backend
npm run start:dev   # servidor Nest com watch
npm test            # testes (Jest)
npm run test:cov    # cobertura (exclui src/main.ts)
npm run build       # compila para dist/
npm run seed        # popular banco com dados de exemplo
```

## Executando localmente
- API: `http://localhost:3000/health` (global prefix: `/api`)
- CORS habilitado; configure `CORS_ORIGINS` no `.env` conforme necessidade.

## Autenticação
- `POST /api/auth/login` → `{ accessToken }`
- `POST /api/auth/logout` (Bearer token)
- Rotas protegidas por JWT; rotas de admin usam `@Roles('admin')`.

Usuários de exemplo após seed:
- `admin@example.com` (roles: `admin`)
- `hr@example.com` (roles: `hr`)
Senha padrão: `dev-hash` (o seed converte para hash bcrypt).

## Seed de dados
- Arquivos:
  - `src/seeds/mock-data.ts`: listas com usuários, colaboradores, códigos ICD e atestados.
  - `src/seeds/seed.ts`: script idempotente que faz upsert por chaves únicas e `metadata.seedKey`.
- Comandos:
```bash
npm run seed
# Para evitar popular a coleção de ICD locais
SEED_DISABLE_ICD=true npm run seed
```
- MongoDB: usa `MONGODB_URI` (ou `mongodb://localhost:27017/atestados`).
- Senhas: se `passwordHash` não for um hash bcrypt, o seed gera o hash a partir do valor informado (por exemplo, `dev-hash`).

Mais detalhes em `../docs/Seed.md`.

## Testes
- Unit + e2e (Supertest) já inclusos; execute `npm run test:cov` para cobertura.
- O Jest ignora `src/main.ts` para cobertura. Alguns e2e usam stubs no lugar de conexão real com Mongo.

## Build e Execução (produção)
- `npm run build` → `dist/main.js`
- `npm start` executa o app compilado.

```text
Rotas principais
- /api/health
- /api/auth/login, /api/auth/logout
- /api/collaborators
- /api/users (admin)
- /api/medical-certificates
- /api/icd/search (pública, com rate limit)
```

## Integração ICD (OMS)
- Endpoint: `GET /api/icd/search?q=termo` (público)
- OAuth2 Client Credentials contra `https://icdaccessmanagement.who.int/connect/token`.
- Variáveis de ambiente:
  - `WHO_ICD_CLIENT_ID` e `WHO_ICD_CLIENT_SECRET` (obrigatórias para chamadas à OMS)
  - `WHO_ICD_BASE_URL` (padrão: `https://id.who.int`)
  - `WHO_ICD_RELEASE` (padrão: `2024-01`)
  - `WHO_ICD_LANGUAGE` (opcional; padrão `en`)
  - `ICD_RATE_LIMIT_RPM` (padrão: `60`)
- Comportamento:
  - Cache local: resultados válidos são upsertados na coleção `icdcodes` (serviço `IcdCacheService`).
  - Tolerância a falhas: se a OMS falhar, faz fallback pesquisando na coleção `icdcodes` por código/título.
  - Renovação de token: token é reutilizado até ~5 min antes da expiração; 401 força refresh e 1 retry.
  - Rate limit: janela em memória por IP com 429 ao exceder.
  - Headers usados nas chamadas à OMS: `Authorization: Bearer <token>`, `API-Version: v2`, `Accept-Language` e `Accept: application/json`.

## Fluxo de Autenticação e Perfis
- Sessões JWT de 4h com registro em Redis (chave `session:<jti>`); expirada → 401.
- `JwtAuthGuard` protege rotas; `@Public()` libera (`/health`, `/icd/search`, `/auth/login`).
- `@Roles('admin')` restringe endpoints administrativos (ex.: `/users`).

## Tratamento de Erros
- Duplicidade Mongo (11000): 409 Conflict com `{ key, value, message }`.
- Cast de ID inválido: 400 Bad Request.
- Rate limit: 429 Too Many Requests.
- Upstream OMS: `AxiosExceptionFilter` mapeia para status do upstream (ou 502) com `{ error: 'UpstreamError' }`.
