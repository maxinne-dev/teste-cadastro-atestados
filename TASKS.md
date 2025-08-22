# TASKS — Full Integration Roadmap (Backend + Frontend)

> Objetivo: Implementar **todas** as funcionalidades descritas em `MAIN.md` e `SPECS.md`, evoluindo do estado atual (frontend mock + backend parcial) até um sistema integrado, seguro, testado, monitorado e pronto para produção.

Legenda de prioridade: (P0 crítico) (P1 alto) (P2 médio) (P3 extra / opcional). Use a numeração principal para rastreio (ex.: 3.4). Marque subtarefas com checkbox.

---

## 1. Fundamentos & Preparação de Ambiente
1.1 Repositório & Organização (P0)
- [ ] Confirmar estrutura monorepo final (folders `backend/`, `frontend/`, infra, docs) alinhada ao plano.
- [ ] Revisar/atualizar `.env.example` cobrindo todas as variáveis (JWT, Mongo, Redis, WHO, segurança, auditoria).
- [ ] Adicionar `.env.local.example` se for separar variáveis sensíveis do CI.
- [ ] Validar `.gitignore` para não vazar segredos / artefatos.

1.2 Docker & Compose (P0)
- [ ] Validar serviços: api, web, mongodb, redis (e opcional: elastic/opensearch, prometheus, grafana).
- [ ] Implementar healthcheck robusto para API e opcional para frontend (nginx ou node serve).
- [ ] Adicionar rede interna nomeada + volumes persistentes (mongo_data, redis_data opcional).
- [ ] Parametrizar versões de imagens via build args / env.

1.3 Qualidade & Tooling (P1)
- [ ] Ativar ESLint + Prettier no frontend (atualmente diferido) com scripts `lint`, `lint:fix`.
- [ ] Padronizar config TypeScript (paths, `strict`, `noImplicitAny`).
- [ ] Configurar Husky / lint-staged (opcional) para pré-commit.
- [ ] Definir matrizes Node (ex.: 20.x) no CI.

1.4 Segurança de Desenvolvimento (P1)
- [ ] Implementar verificação de dependências (npm audit / osv scanner) no pipeline.
- [ ] Checagem de segredos (gitleaks) opcional.
- [ ] Definir processo de rotação de segredos (.md de runbook).

---

## 2. Autenticação, Sessões & Autorização
2.1 Backend Auth Core (P0)
- [ ] JWT emissão com `jti` e expiração 4h conforme especificação.
- [ ] Armazenar sessão em Redis (`session:<jti>`) com TTL 4h.
- [ ] Logout invalidando sessão (deleção Redis) + testes.
- [ ] Middleware/guard que rejeita token expirado ou sessão ausente.
- [ ] Refresh token (DECISÃO: não implementar se não previsto; documentar). 

2.2 RBAC & Roles (P0)
- [ ] Decorator `@Roles()` e `RolesGuard` funcional.
- [ ] Tabelar permissões (admin, hr, user) em doc.
- [ ] Endpoints admin protegidos (`/users`, relatórios executivos futuros).

2.3 Rate Limiting e Proteções (P1)
- [ ] Limite de tentativas de login (`AUTH_RATE_LIMIT_RPM`).
- [ ] Throttling para `/api/icd/search` (`ICD_RATE_LIMIT_RPM`).
- [ ] Proteção básica contra brute force (incremento exponencial opcional).

2.4 Frontend Integração Auth (P0)
- [ ] Criar `authService` (login, logout, estado).
- [ ] Armazenar token (localStorage) + injetar em Authorization header via interceptor.
- [ ] Guard de rota usando roles (redirecionar se não autorizado).
- [ ] Auto-logout com 401 ou expiração detectada (timer + checagem).
- [ ] Feedback de erros de login (credenciais inválidas vs rate limit vs genérico).

---

## 3. Módulo de Colaboradores
3.1 Backend Model & Schema (P0)
- [ ] Definir schema (fullName, cpf único, birthDate, jobTitle, status enum active/inactive, timestamps).
- [ ] Índice texto em `fullName` para busca.
- [ ] Índice único `cpf` normalizado (somente dígitos).

3.2 DTOs & Validação (P0)
- [ ] DTO create/update com validação de CPF (biblioteca brasileira) e formatos de datas.
- [ ] Normalizador de CPF (remove máscara) em pipe/transform.

3.3 Endpoints & Casos (P0)
- [ ] POST /collaborators (criação) + 409 para duplicado.
- [ ] GET /collaborators com filtros: nome (texto), status, paginação, ordenação.
- [ ] PATCH /collaborators/:id (editar campos).
- [ ] PATCH /collaborators/:id/status (toggle ativo/inativo) ou inclusão em patch geral.
- [ ] GET /collaborators/:id (detalhe).

3.4 Backend Testes (P0)
- [ ] Unit: service (criação, duplicação, busca filtrada, alteração status).
- [ ] E2E: fluxo CRUD completo + paginação.

3.5 Frontend Integração (P0)
- [ ] Adaptar store `collaborators` para usar API real mantendo a interface.
- [ ] Implementar busca incremental (debounce) + filtros.
- [ ] Formulário: validação reativa (CPF, campos obrigatórios) + máscaras.
- [ ] Toggle ativo/inativo com confirmação (modal/confirm dialog).
- [ ] Mensagens de sucesso/erro alinhadas com `Errors.md`.

3.6 Extras (P2)
- [ ] Importação CSV (parcial) com relatório de erros.
- [ ] Auditoria de alterações (liga com módulo audit).

---

## 4. Integração ICD (OMS)
4.1 Credenciais & Config (P0)
- [ ] Variáveis exigidas: WHO_ICD_CLIENT_ID, WHO_ICD_CLIENT_SECRET, WHO_ICD_RELEASE, WHO_ICD_BASE_URL.
- [ ] Serviço de obtenção de token OAuth2 (Client Credentials) com cache + renovação 5min antes do expirar.

4.2 Serviço de Busca (P0)
- [ ] `GET /api/icd/search?q=` valida parâmetro (min length 2).
- [ ] Chamada upstream com headers corretos (Authorization, API-Version, Accept, Accept-Language).
- [ ] Tratamento de erros (timeout, 401→refresh, 5xx → fallback local).
- [ ] Limite de resultados configurável (e.g., ?limit=10).

4.3 Cache Local & Fallback (P0)
- [ ] Persistir resultados relevantes em coleção `icdcodes` (code, title, release, language).
- [ ] Fallback local: busca por code prefix / title regex quando upstream indisponível.
- [ ] Circuit breaker simples (contador de falhas, janela de reset).

4.4 Rate Limit & Observabilidade (P1)
- [ ] Métricas: contagem de chamadas upstream vs cache hits.
- [ ] Log estruturado com código de erro upstream / latência.

4.5 Frontend Autocomplete CID (P0)
- [ ] Composable `useCidAutocomplete` trocar mocks por chamadas reais com debounce 300ms.
- [ ] Exibir indicador de fonte (ex.: “WHO” vs “Local Cache”).
- [ ] Lidar com estados: carregando, sem resultados, erro fallback.
- [ ] Limitar chamadas quando input <2 chars.

4.6 Testes (P0)
- [ ] Unit: token service, search service (cache hit/miss, refresh token, fallback).
- [ ] E2E: endpoint search (cenário upstream ok / falha / fallback).
- [ ] Frontend: componente autocomplete (Vitest + mock API / MSW).

---

## 5. Módulo de Atestados Médicos
5.1 Backend Schema (P0)
- [ ] Campos: collaboratorId (ref), issueDate (auto?), startDate, endDate, daysCalculated, icdCode, icdTitle, diagnosis (texto livre), status (active|cancelled|expired), notes, timestamps.
- [ ] Índices: { collaboratorId, status }, issueDate -1, { startDate:1, endDate:1 }.
- [ ] Hook para calcular days (end - start + 1) e status expired via processo (cron) opcional.

5.2 DTOs & Validações (P0)
- [ ] startDate <= endDate.
- [ ] Dias máximo 365.
- [ ] Collaborator ativo obrigatório (validar status antes de criar).
- [ ] ICD opcional, mas se presente exigir `icdCode` + `icdTitle` combinados.

5.3 Endpoints (P0)
- [ ] POST /medical-certificates (criar).
- [ ] GET /medical-certificates (filtros: collaboratorId, período, icdCode, status; paginação + sort por issueDate desc default).
- [ ] GET /medical-certificates/:id.
- [ ] PATCH /medical-certificates/:id (cancelar / editar notas apenas se regra permitir).
- [ ] (P2) Export: `/medical-certificates/report.csv`.

5.4 Expiração & Status (P1)
- [ ] Job (cron) diário para marcar expired quando endDate < hoje e status active.
- [ ] Endpoint para recálculo manual (admin) (P2).

5.5 Testes Backend (P0)
- [ ] Unit: criação válida, invalid date range, collaborator inativo, limite dias.
- [ ] E2E: fluxo criar → listar → filtrar → cancelar.

5.6 Frontend Integração (P0)
- [ ] Adaptar store `certificates` para API real.
- [ ] Tela Novo Atestado: buscar colaboradores (lazy search), preencher datas, autocomplete CID, validação dinâmica dias.
- [ ] Calcular e exibir dias automaticamente ao alterar datas.
- [ ] Submeter criação e redirecionar para lista com toast.
- [ ] Lista: filtros persistidos (query params), paginação, ordenação.
- [ ] Exibição de status com badges (active/cancelled/expired).
- [ ] Cancelamento via ação contextual com confirmação.

5.7 UX & Acessibilidade (P1)
- [ ] Estados de loading skeleton.
- [ ] Empty states claros com CTAs.
- [ ] Feedback de erro mapeado para categorias (validação, conflito, upstream, rede).

---

## 6. Dashboard & Relatórios
6.1 KPIs Básicos (P1)
- [ ] Total de atestados (período selecionado).
- [ ] Afastamentos ativos.
- [ ] Top 5 CIDs (período).
- [ ] Dias afastados acumulados no período.

6.2 Endpoints de Agregação (P1)
- [ ] `/metrics/certificates/summary?range=` retornando agregados.
- [ ] (P2) Distribuição por departamento (se colaborador tiver departamento futuramente).

6.3 Frontend Dashboard (P1)
- [ ] Cards de estatísticas (com skeletons e atualização ao mudar range).
- [ ] Gráfico (P2) — libs: Chart.js ou ECharts.

6.4 Relatórios Avançados (P3 Extra)
- [ ] Bradford score cálculo.
- [ ] Detecção de picos sazonais.

---

## 7. Auditoria, Segurança & LGPD
7.1 Auditoria (P0)
- [ ] Middleware/Interceptor registra ações sensíveis (criação/edição de colaborador, atestado, login, busca CID?).
- [ ] Estrutura `auditlogs`: actorUserId, action, resource, targetId, timestamp, ip, userAgent.
- [ ] TTL opcional via `AUDIT_TTL_DAYS`.

7.2 Criptografia & Proteção de Dados (P1)
- [ ] Definir se algum campo sensível (diagnosis, notes) precisa criptografia em repouso.
- [ ] Implementar serviço AES-256-GCM (como no plano) se necessário.

7.3 Controle de Acesso Fino (P1)
- [ ] Restringir edição/cancelamento de atestados a roles específicas (hr/admin).
- [ ] Logs de acesso a dados sensíveis (CPF) marcados com tipo de evento.

7.4 Políticas LGPD (P1)
- [ ] Documento de base legal e finalidade de cada dado (`docs/privacy-processing.md`).
- [ ] Endpoint de exportação (P3) de dados do colaborador (portabilidade).
- [ ] Endpoint de anonimização (P3) — sobrescrever dados não mandatórios.

7.5 Segurança Operacional (P1)
- [ ] Helmet / segurança de headers HTTP.
- [ ] Sanitização de entrada (XSS, NoSQL injection) — revisar queries Mongoose.
- [ ] Limite de payload (body size limit).
- [ ] Logging de falhas de autenticação.

---

## 8. Observabilidade & Monitoramento
8.1 Logging Estruturado (P1)
- [ ] Winston / Pino com correlação (requestId).
- [ ] Níveis: info, warn, error, debug (toggle por env).
- [ ] Logs de integração WHO (latência, status, cacheHit boolean).

8.2 Health & Readiness (P1)
- [ ] `/health` agregando Mongo, Redis, WHO (ping leve ou simulado / cache freshness).
- [ ] `/ready` sem chamadas externas para orquestradores.

8.3 Métricas (P2)
- [ ] Expor Prometheus metrics (ops/sec, latência, errors, cache hits, ICD fallback count).
- [ ] Dashboards básicos (Grafana) — doc com queries.

8.4 Alertas (P3)
- [ ] Definir limiares (ex. taxa de fallback >30% em 5m).

---

## 9. Testes & Qualidade
9.1 Backend Test Strategy (P0)
- [ ] Cobertura mínima 80% lines/functions.
- [ ] Testes unitários módulos: auth, collaborators, medical-certificates, icd, audit.
- [ ] E2E: principais fluxos encadeados (login → criar colaborador → criar atestado → listar → cancelar).
- [ ] Testes de índices (garantir criação / duplicados retornam 409).

9.2 Frontend Test Strategy (P0)
- [ ] Atualizar testes existentes para usar MSW (mock API) em vez de stores mockadas diretas.
- [ ] Testar fluxo login (redirecionamento, guarda de rota).
- [ ] Testar criação de colaborador (validação CPF, sucesso, conflito 409 simulado).
- [ ] Testar autocomplete CID (debounce + fallback + empty state).
- [ ] Testar formulário novo atestado (datas inválidas, cálculo dias, submissão ok).

9.3 Integração & Contratos (P1)
- [ ] Testes de contrato (gerar OpenAPI → validar responses com zod/outra lib no frontend).
- [ ] Snapshot OpenAPI diffs no CI para detectar breaking changes.

9.4 Performance / Smoke (P2)
- [ ] Script k6 ou autocannon simples para endpoints críticos (login, icd search, create certificate).
- [ ] Alvos de latência p95 documentados.

9.5 Segurança (P2)
- [ ] Teste de força bruta simulado (rate limit efetivo).
- [ ] Teste de injeção (caracteres especiais nos filtros / queries).

---

## 10. Frontend Infra & UX Refinements
10.1 Camada HTTP (P0)
- [ ] Criar `httpClient` com interceptors (auth header, 401 handler, error normalization).
- [ ] Mapear erros backend → mensagens amigáveis (conflict, validation, upstream, fallback, rate limit).

10.2 Estado Global (P1)
- [ ] Adaptar stores para objetos de paginação padronizados `{ items, page, pageSize, total }`.
- [ ] Cache leve (in-memory) de últimas buscas de ICD + invalidation.

10.3 Acessibilidade (P1)
- [ ] Rever semantics ARIA nos novos componentes (autocomplete CID, tabela atestados com sort).
- [ ] Testar navegação teclado fluxo completo (login → criar atestado sem mouse).

10.4 Responsividade (P1)
- [ ] Ajustar layout certificados para cartões em mobile sem perda de filtros.

10.5 Dark Mode Consistência (P2)
- [ ] Validar contraste de badges de status em modo escuro.

---

## 11. DevOps & CI/CD
11.1 Pipeline CI (P0)
- [ ] Jobs: lint, typecheck, test backend, test frontend, build artifacts, publicar OpenAPI.
- [ ] Cache de dependências (npm cache / actions/setup-node).
- [ ] Artefatos: cobertura, openapi.yaml, relatórios de testes.

11.2 Pipeline CD (P1)
- [ ] Deploy staging (branch main) automático.
- [ ] Gate manual para produção.
- [ ] Versão semântica (semver) tag automática (P2).

11.3 Imagens Docker (P1)
- [ ] Multi-stage builds com camadas node_modules isoladas.
- [ ] Labels (org.opencontainers) para rastreio.
- [ ] Scan de vulnerabilidades (trivy) no CI (P2).

11.4 Configuração de Runtime (P1)
- [ ] Variáveis sensíveis via secrets manager (documentar).
- [ ] Estratégia de backup Mongo (cron + doc runbook).

---

## 12. Documentação & Runbooks
12.1 Atualização de READMEs (P0)
- [ ] Backend README: incluir novos endpoints, exemplos filtrados, códigos de erro.
- [ ] Frontend README: remover aviso “GUI-only” após integração; adicionar instruções de apontar para API.

12.2 OpenAPI & Referência (P0)
- [ ] Automatizar geração em build + commit ou artifact.
- [ ] Seção de erros padronizados (tabela) sincronizada com `docs/Errors.md`.

12.3 Guia de Integração (P1)
- [ ] Passo a passo para obter credenciais OMS + configurar env.
- [ ] Fluxo de fallback (como testar desligando WHO).

12.4 Runbooks (P1)
- [ ] Incidente: WHO API indisponível (procedimentos, métricas).
- [ ] Recuperação de backup Mongo.
- [ ] Rotação de segredos.

12.5 LGPD & Segurança (P2)
- [ ] Política de retenção de logs.
- [ ] Mapeamento de dados pessoais → finalidade.

---

## 13. Migração do Frontend (Mocks → API)
13.1 Faseamento (P0)
- [ ] Introduzir feature flags (ex.: `USE_REAL_API`) para transição.
- [ ] Converter store `auth` primeiro, depois `collaborators`, depois `certificates`.
- [ ] Remover mocks apenas após cobertura de testes equivalente.

13.2 Compatibilidade (P1)
- [ ] Garantir que componentes não mudem assinatura de props/eventos durante a troca.
- [ ] Documentar diferenças de latência e estados de loading adicionais.

13.3 Clean-up (P1)
- [ ] Remover arquivos em `mocks/` não utilizados.
- [ ] Atualizar testes que dependiam de mocks diretos para MSW.

---

## 14. Performance & Escalabilidade
14.1 Backend (P1)
- [ ] Validar índices criados vs plano de execução (Mongo explain) para buscas por período + status.
- [ ] Cache de resultados frequentes (ex.: top CIDs) em Redis TTL curto (P2).
- [ ] Circuit breaker WHO parametrizável.

14.2 Frontend (P2)
- [ ] Code splitting por rota (analisar bundle report).
- [ ] Debounce / throttle em filtros intensivos.

14.3 Carga & Stress (P2)
- [ ] Teste com volume simulado de 50k colaboradores e 500k atestados (seed script escalável).

---

## 15. Funcionalidades Avançadas / Extras (Opcional)
15.1 Integrações Externas (P3)
- [ ] Integração folha/ponto export JSON/CSV.
- [ ] Webhook notificação criação/cancelamento de atestado.

15.2 Inteligência / Analytics (P3)
- [ ] Bradford score back-office endpoint.
- [ ] Alertas automáticos (ex.: muitos afastamentos em curto período).

15.3 Mobile & PWA (P3)
- [ ] Manifest + service worker básico (offline caching páginas principais).

---

## 16. Critérios de Pronto (Definition of Done Global)
- [ ] Todas tarefas P0 concluídas e testadas.
- [ ] Cobertura backend & frontend ≥80% linhas.
- [ ] Integração ICD funcional com fallback comprovado (teste desligando WHO endpoint).
- [ ] Fluxos principais manuais validados: (login → criar colaborador → criar atestado → listar/filtrar → cancelar → dashboard KPIs).
- [ ] Logs estruturados visíveis (ex.: em console / agregador).
- [ ] Healthcheck retorna 200 integrando dependências.
- [ ] README(s), OpenAPI e guia OMS atualizados.
- [ ] Pipeline CI verde em 3 execuções consecutivas.
- [ ] Nenhum segredo nos commits (scan OK).

---

## 17. Sequenciamento Sugerido (High-Level Sprint Flow)
1. Infra + Auth + Colaboradores (P0 base).
2. ICD Integration + Autocomplete + Ajustes Auth front.
3. Atestados backend + frontend + filtros.
4. Dashboard KPIs + Auditoria + Segurança baseline.
5. Testes ampliação + Observabilidade + Docs.
6. Performance tuning + DevOps pipeline + Clean-up.
7. Extras / P2-P3 conforme tempo.

---

## 18. Assumptions (Documentar para Alinhamento)
* Não haverá refresh token inicialmente; sessão expira e usuário reloga.
* Criptografia em repouso só aplicada se diagnosis/notes forem considerados sensíveis pela política interna.
* Fallback ICD usa somente cache local populado por buscas anteriores e seed opcional (não há dataset completo offline).
* Exportações avançadas e análises (Bradford) são extras e não bloqueiam release inicial.

---

## 19. Riscos & Mitigações Rápidas
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| WHO API instável | Bloqueia criação de atestados com CID | Fallback local + circuit breaker + métricas de fallback |
| Index ausente em consultas grandes | Lentidão / timeouts | Planejar índices cedo + testes explain |
| Acoplamento forte frontend/stores mocks | Retrabalho grande | Camada de serviço + feature flag transicional |
| Fuga de segredos em logs | Incidente segurança | Revisão logging + máscara CPF parcial + scans |
| Baixa cobertura testes em módulos críticos | Regressões | Gate de cobertura no CI |

---

## 20. Métricas de Sucesso
- Tempo médio busca CID (p95) < 800ms com cache aquecido.
- Latência p95 criação atestado < 300ms.
- Taxa fallback WHO < 10% (normal), alerta >30% em 5m.
- Erros 5xx < 1% das requisições.
- Tempo build CI < 8 min.
- Cobertura testes ≥ 80% e tendência estável.

---

Fim do documento.
