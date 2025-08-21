# Sistema de Atestados Médicos — Starter Kit

Este repositório inicializa um monorepo simples com **NestJS + TypeScript (API)**, **Vue 3 + Vite (Frontend)**, **MongoDB** e **Redis**, com **Docker Compose** para desenvolvimento.

> Requisitos: Docker 24+, Docker Compose, Node.js 20+ e Git.  
> (Windows) Use o `setup.ps1` para subir tudo automaticamente.

## Primeiros passos rápidos
1. Copie o arquivo `.env.example` para `.env` e preencha as variáveis (especialmente as credenciais da OMS).
2. (Windows) Execute: `./setup.ps1`
3. (Linux/macOS) Alternativa manual:
   ```bash
   docker compose up -d --build
   ```
4. Acesse:
   - API: http://localhost:3000/health
   - Web (dev): http://localhost:5173
5. (Opcional) Popular o banco com dados de exemplo (seed):
   ```bash
   cd backend
   npm run seed              # usa MONGODB_URI ou mongodb://localhost:27017/atestados
   # Para pular a carga de ICD locais durante o seed:
   SEED_DISABLE_ICD=true npm run seed
   ```
   - Usuários criados: `admin@example.com` (roles: admin) e `hr@example.com` (roles: hr)
   - Senha padrão (seed): `dev-hash` — o script transforma em hash bcrypt automaticamente.

## Credenciais da OMS (ICD API)
- Registre-se em: https://icd.who.int/icdapi
- Documentação de autenticação: https://icd.who.int/docs/icd-api/API-Authentication/
- Token endpoint: https://icdaccessmanagement.who.int/connect/token

Preencha as variáveis `WHO_ICD_CLIENT_ID` e `WHO_ICD_CLIENT_SECRET` no `.env`.

## Scripts úteis
- Subir containers: `docker compose up -d --build`
- Parar containers: `docker compose down`
- Logs: `docker compose logs -f api` / `docker compose logs -f web`

## OpenAPI / API Docs
- Especificação OpenAPI: `./openapi.yaml` (gerada)
- Para gerar/atualizar localmente:
  ```bash
  cd backend
  npm run openapi:yaml
  ```
- O CI também publica `openapi.yaml` como artifact.

## Autenticação e Acesso
- Login: `POST /api/auth/login` → `{ accessToken }` (Bearer JWT, sessão 4h)
- Logout: `POST /api/auth/logout` (envie Bearer token)
- Rotas protegidas exigem Bearer; rotas de admin usam role `admin`.
- Rate limit (por IP): login `AUTH_RATE_LIMIT_RPM` (padrão 30 rpm).

## Docs adicionais
- Guia do backend: `backend/README.md`
- Exemplos de uso de API: `docs/API-usage.md`
- Códigos de erro e payloads: `docs/Errors.md`

## Estrutura
```
/
├─ backend/           # NestJS API
├─ frontend/          # Vue 3 + Vite
├─ docker-compose.yml
├─ .env.example
└─ setup.ps1          # Script PowerShell para bootstrap no Windows
```

## Backend — Camada de Dados
Para um guia detalhado do backend (scripts, seed, testes e rotas), consulte `backend/README.md`.
- Modelos e coleções MongoDB:
  - `collaborators`: colaboradores (RH) com `cpf` único.
  - `users`: contas de aplicação com `email` único e `roles`.
  - `icdcodes`: cache local de códigos CID (OMS), único por `code`.
  - `medicalcertificates`: atestados vinculados a `collaboratorId`; guarda `icdCode/icdTitle` denormalizados.
  - `auditlogs`: trilhas de auditoria com `timestamp` (TTL opcional via `AUDIT_TTL_DAYS`).
  - `meta`: registros auxiliares (ex.: execução de seed).

- Relacionamentos (texto):
  - Collaborator 1—N MedicalCertificate (`medicalcertificates.collaboratorId → collaborators._id`).
  - MedicalCertificate — ICD: sempre armazena `icdCode/icdTitle` e pode referenciar `icdcodes._id` (opcional).
  - User N—roles (array embutido em `users.roles`).
  - AuditLog → `actorUserId` (string) e `resource/targetId` como referências lógicas.

- Índices esperados (checados por testes):
  - `collaborators.cpf` único; `collaborators.fullName` texto.
  - `medicalcertificates`: `{ collaboratorId, status }`, `issueDate: -1`, `{ startDate: 1, endDate: 1 }`.
  - `users.email` único (case-insensitive) e índice em `users.roles`.
  - `icdcodes.code` único.
  - `auditlogs.timestamp` índice descendente (+ TTL opcional).

- Execução local (backend):
  ```bash
  cd backend
  npm run start:dev         # servidor Nest em watch
  npm test                  # testes (Jest)
  npm run build             # compila para dist/
  npm run seed              # popular DB com dados de exemplo
  ```

- Seed de dados:
  - Editar `backend/src/seeds/mock-data.ts` para ajustar usuários (admin/hr), colaboradores, CIDs e atestados.
  - O seed é idempotente (usa chaves únicas e `metadata.seedKey`).
  - Usa `MONGODB_URI` ou `mongodb://localhost:27017/atestados` por padrão.
  - Hash de senhas: se `passwordHash` não for um hash bcrypt, o seed irá gerar um hash automaticamente (use um placeholder como `dev-hash`).
  - OMS/ICD: o seed NÃO chama a API da OMS; ele apenas popula a coleção `icdcodes` com alguns códigos de exemplo. Para desabilitar essa etapa, defina `SEED_DISABLE_ICD=true` ao rodar o seed.

## Observações
- Este kit é propositalmente **mínimo** e compila/roda out‑of‑the‑box. Use-o como base para implementar os módulos descritos em `SPECS.md`/`MAIN.md`.
- O frontend faz proxy de `/api` → `http://api:3000` no Docker e `http://localhost:3000` fora do Docker.
