# Sistema de Atestados Médicos - Lista de Tarefas para Integração

## 📋 Visão Geral do Estado Atual

**Backend (NestJS):** ✅ Completamente implementado
- Autenticação JWT com Redis (sessões de 4h)
- CRUD de colaboradores com validação de CPF
- Sistema de atestados médicos
- Integração com API da OMS (ICD) com fallback
- Auditoria e rate limiting
- Testes implementados

**Frontend (Vue 3):** ⚠️ Parcialmente implementado (GUI-only)
- Interface completa com PrimeVue
- Componentes e páginas funcionais
- Stores Pinia configuradas
- **PROBLEMA:** Usando apenas dados mockados, sem integração real com API

**Integração:** ❌ Não implementada
- Frontend configurado com `VITE_USE_API=false`
- Serviços HTTP implementados mas não ativados
- Necessário ativar e validar integração completa

## 1. ⚡ Ativação da Integração Frontend-Backend

### 1.1 Configuração de Ambiente
- [x] **Verificar arquivo `.env`** no root do projeto
  - [x] Confirmar se `VITE_USE_API=true` está configurado
  - [x] Validar `VITE_API_BASE_URL=/api`
  - [x] Verificar `JWT_SECRET` está definido
  - [x] Confirmar `MONGODB_URI` e `REDIS_URL`

### 1.2 Validação da Infraestrutura
- [x] **Testar containers Docker**
  - [x] Executar `docker compose up -d --build`
  - [x] Verificar saúde da API: `http://localhost:3000/health`
  - [x] Verificar MongoDB está acessível
  - [x] Verificar Redis está acessível

### 1.3 Validação dos Endpoints da API
- [x] **Testar autenticação**
  - [x] `POST /api/auth/login` com credenciais do seed
  - [x] `POST /api/auth/logout` com Bearer token
  - [x] Verificar retorno de JWT válido

- [x] **Testar endpoints de colaboradores**
  - [x] `GET /api/collaborators` (listagem)
  - [x] `POST /api/collaborators` (criação)
  - [x] `PATCH /api/collaborators/:cpf` (atualização)
  - [x] `PATCH /api/collaborators/:cpf/status` (status)

- [x] **Testar endpoints de atestados**
  - [x] `GET /api/medical-certificates` (listagem)
  - [x] `POST /api/medical-certificates` (criação)
  - [x] `PATCH /api/medical-certificates/:id/cancel` (cancelamento)

- [x] **Testar endpoint ICD**
  - [x] `GET /api/icd/search?q=termo` (busca CID)

## 2. 🔧 Correções e Ajustes de Integração

### 2.1 Ajustes no Frontend
- [x] **Revisar stores Pinia**
  - [x] Verificar se `auth.ts` usa corretamente `isApiEnabled()`
  - [x] Validar `collaborators.ts` remove simulação de delay quando API ativa
  - [x] Validar `certificates.ts` remove simulação de delay quando API ativa

- [x] **Validar serviços HTTP**
  - [x] Confirmar interceptors de autenticação estão corretos
  - [x] Verificar tratamento de erros 401 (token expirado)
  - [x] Validar headers Authorization Bearer

### 2.2 Compatibilidade de Modelos
- [x] **Verificar tipos TypeScript**
  - [x] Comparar `frontend/src/types/models.ts` com schemas do backend
  - [x] Ajustar diferenças de nomenclatura (ex: `id` vs `_id`)
  - [x] Validar campos opcionais e obrigatórios

- [x] **Verificar DTOs de requisição**
  - [x] Comparar payloads frontend com DTOs backend
  - [x] Ajustar diferenças de formato de data
  - [x] Validar estrutura de filtros e paginação

### 2.3 Tratamento de Erros
- [x] **Implementar tratamento consistente**
  - [x] Mapear códigos de erro do backend
  - [x] Implementar notificações toast para erros
  - [x] Tratar casos especiais (401, 403, 429, 500)

## 3. 🔐 Funcionalidades de Autenticação

### 3.1 Fluxo de Login
- [x] **Implementar login real**
  - [x] Testar com credenciais do seed: `admin@example.com` / `hr@example.com`
  - [x] Verificar armazenamento correto do JWT no localStorage
  - [x] Validar redirecionamento após login bem-sucedido

### 3.2 Proteção de Rotas
- [x] **Validar guards do router**
  - [x] Testar redirecionamento para login quando não autenticado
  - [x] Verificar persistência de sessão após refresh da página
  - [x] Testar expiração de token (4 horas)

### 3.3 Logout e Sessões
- [x] **Implementar logout completo**
  - [x] Chamar endpoint de logout no backend
  - [x] Limpar token do localStorage
  - [x] Redirecionar para página de login

## 4. 👥 Gestão de Colaboradores

### 4.1 Listagem de Colaboradores
- [x] **Implementar busca com filtros**
  - [x] Busca por nome (campo de texto)
  - [x] Filtro por status (ativo/inativo)
  - [x] Ordenação por campos (nome, data criação)
  - [x] Paginação funcional

### 4.2 Cadastro de Colaboradores
- [x] **Formulário de criação**
  - [x] Validação de CPF brasileiro
  - [x] Formatação automática de CPF
  - [x] Campos obrigatórios: nome, CPF, data nascimento, cargo
  - [x] Campo opcional: departamento

### 4.3 Edição de Colaboradores
- [x] **Formulário de edição**
  - [x] Busca por CPF para edição
  - [x] Atualização de dados pessoais
  - [x] Alteração de status (ativo/inativo)

## 5. 📋 Sistema de Atestados Médicos

### 5.1 Listagem de Atestados
- [x] **Implementar filtros avançados**
  - [x] Filtro por colaborador (dropdown/autocomplete)
  - [x] Filtro por período (data início/fim)
  - [x] Filtro por código CID
  - [x] Filtro por status do atestado
  - [x] Ordenação por data, colaborador, CID

### 5.2 Criação de Atestados
- [x] **Formulário de novo atestado**
  - [x] Seleção de colaborador (autocomplete)
  - [x] Campos de data (início e fim do atestado)
  - [x] Cálculo automático de dias de afastamento
  - [x] Integração com busca de CID (API OMS)
  - [x] Campo opcional para observações

### 5.3 Busca de CID (Integração OMS)
- [x] **Implementar autocomplete de CID**
  - [x] Busca em tempo real na API da OMS
  - [x] Debounce para evitar muitas requisições
  - [x] Fallback para cache local quando API indisponível
  - [x] Exibição de código e descrição do CID

### 5.4 Gestão de Atestados
- [x] **Operações sobre atestados**
  - [x] Visualização detalhada de atestado
  - [x] Cancelamento de atestado
  - [x] Histórico de alterações (auditoria)

## 6. 🔧 Configuração da API OMS (ICD)

### 6.1 Credenciais da OMS
- [x] **Configurar acesso à API oficial**
  - [x] Registrar conta em https://icd.who.int/icdapi
  - [x] Obter `WHO_ICD_CLIENT_ID` e `WHO_ICD_CLIENT_SECRET`
  - [x] Configurar no arquivo `.env`
  - [x] Testar autenticação OAuth2

### 6.2 Integração e Fallback
- [x] **Validar funcionamento**
  - [x] Testar busca de CID em tempo real
  - [x] Verificar cache local de resultados
  - [x] Testar fallback quando API indisponível
  - [x] Validar rate limiting (60 req/min)

## 7. 🎨 Melhorias de Interface

### 7.1 Estados de Loading e Erro
- [ ] **Implementar feedback visual**
  - [ ] Spinners de loading durante requisições
  - [ ] Estados vazios para listas sem dados
  - [ ] Mensagens de erro user-friendly
  - [ ] Retry automático em caso de falha

### 7.2 Notificações
- [ ] **Sistema de toast/notificações**
  - [ ] Sucesso após operações (criar, editar, deletar)
  - [ ] Erros de validação e servidor
  - [ ] Avisos de sistema (sessão expirada)

### 7.3 Responsividade
- [ ] **Otimizar para mobile**
  - [ ] Tabelas responsivas (cards em mobile)
  - [ ] Formulários adaptáveis
  - [ ] Menu lateral colapsável
  - [ ] Touch-friendly nos componentes

## 8. 🧪 Testes e Validação

### 8.1 Testes de Integração Frontend
- [ ] **Atualizar testes existentes**
  - [ ] Modificar testes para usar API real quando `VITE_USE_API=true`
  - [ ] Mockar apenas requisições HTTP nos testes
  - [ ] Testar fluxos end-to-end críticos

### 8.2 Testes de Funcionalidade
- [ ] **Cenários principais**
  - [ ] Login → Dashboard → Logout
  - [ ] Criar colaborador → Listar → Editar
  - [ ] Criar atestado com busca CID → Listar → Cancelar
  - [ ] Filtros e busca funcionais
  - [ ] Paginação e ordenação

### 8.3 Testes de Erro
- [ ] **Cenários de falha**
  - [ ] API indisponível (backend offline)
  - [ ] Token expirado durante uso
  - [ ] Falhas de validação
  - [ ] Limites de rate limiting
  - [ ] Perda de conexão de rede

## 9. 📊 Dashboard e Relatórios

### 9.1 Dashboard Principal
- [ ] **Métricas básicas**
  - [ ] Total de colaboradores ativos
  - [ ] Atestados em vigor hoje
  - [ ] Atestados emitidos no mês
  - [ ] Gráfico de afastamentos por período

### 9.2 Relatórios
- [ ] **Exportação de dados**
  - [ ] Lista de colaboradores (CSV/Excel)
  - [ ] Relatório de atestados por período
  - [ ] Estatísticas por CID mais comum
  - [ ] Relatório de absenteísmo

## 10. 🚀 Deploy e Produção

### 10.1 Configuração de Produção
- [ ] **Ajustar configurações**
  - [ ] Configurar `docker-compose.prod.yml`
  - [ ] Definir variáveis de ambiente de produção
  - [ ] Configurar HTTPS e domínio
  - [ ] Ajustar CORS para domínio de produção

### 10.2 Segurança
- [ ] **Hardening de segurança**
  - [ ] Headers de segurança HTTP
  - [ ] Rate limiting adequado
  - [ ] Logs de auditoria funcionais
  - [ ] Backup automático do MongoDB

### 10.3 Monitoramento
- [ ] **Observabilidade**
  - [ ] Health checks funcionais
  - [ ] Logs estruturados
  - [ ] Métricas de performance
  - [ ] Alertas para falhas críticas

## ⏱️ Prioridades de Execução

### 🔥 **CRÍTICO - Semana 1**
1. Ativação da integração (Seção 1)
2. Correções básicas (Seção 2.1 e 2.2)
3. Autenticação funcionando (Seção 3)

### 🚨 **ALTA - Semana 2**
4. CRUD de colaboradores (Seção 4)
5. Sistema de atestados básico (Seção 5.1, 5.2)
6. Integração CID/OMS (Seção 6)

### ⚡ **MÉDIA - Semana 3**
7. Funcionalidades avançadas de atestados (Seção 5.3, 5.4)
8. Melhorias de UX (Seção 7)
9. Testes de integração (Seção 8.1, 8.2)

### 📈 **BAIXA - Semana 4**
10. Dashboard e relatórios (Seção 9)
11. Testes de erro (Seção 8.3)
12. Preparação para produção (Seção 10)

---

## 📝 Notas de Implementação

**Estado Atual Detectado:**
- Backend: Totalmente funcional com todos os endpoints implementados
- Frontend: Interface completa mas usando apenas mocks locais
- **Gap Principal**: Ativação da integração via `VITE_USE_API=true` e validação

**Riscos Identificados:**
- Diferenças entre modelos frontend/backend (campo `id` vs `_id`)
- Possíveis incompatibilidades de formato de data
- Tratamento inadequado de erros HTTP
- Falta de configuração das credenciais da OMS

**Primeira Tarefa Crítica:**
Configurar `.env` com `VITE_USE_API=true` e testar o endpoint `/api/health` para validar se a integração básica funciona.