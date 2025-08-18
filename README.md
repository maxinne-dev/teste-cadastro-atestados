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

## Credenciais da OMS (ICD API)
- Registre-se em: https://icd.who.int/icdapi
- Documentação de autenticação: https://icd.who.int/docs/icd-api/API-Authentication/
- Token endpoint: https://icdaccessmanagement.who.int/connect/token

Preencha as variáveis `WHO_ICD_CLIENT_ID` e `WHO_ICD_CLIENT_SECRET` no `.env`.

## Scripts úteis
- Subir containers: `docker compose up -d --build`
- Parar containers: `docker compose down`
- Logs: `docker compose logs -f api` / `docker compose logs -f web`

## Estrutura
```
/
├─ backend/           # NestJS API
├─ frontend/          # Vue 3 + Vite
├─ docker-compose.yml
├─ .env.example
└─ setup.ps1          # Script PowerShell para bootstrap no Windows
```

## Observações
- Este kit é propositalmente **mínimo** e compila/roda out‑of‑the‑box. Use-o como base para implementar os módulos descritos em `SPECS.md`/`MAIN.md`.
- O frontend faz proxy de `/api` → `http://api:3000` no Docker e `http://localhost:3000` fora do Docker.
