# Backend (NestJS)

## Setup
- Node.js 20+ e npm
- Copie `.env.example` para `.env` na raiz do monorepo e preencha as variáveis (JWT, Mongo, Redis, OMS se necessário).

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

