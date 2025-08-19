# Plano Detalhado: Sistema Completo de Gestão de Atestados Médicos

## Visão geral arquitetural

Este plano apresenta uma arquitetura moderna e completa para desenvolver um sistema de gestão de atestados médicos com **backend NestJS + TypeScript, frontend Vue 3, MongoDB, Docker e integração obrigatória com a API da OMS**. O sistema será totalmente compatível com regulamentações brasileiras (LGPD, CFM) e seguirá as melhores práticas de segurança para dados de saúde.

## 1. Arquitetura backend moderna com NestJS

### Setup inicial recomendado

**Stack principal:** Node.js 18+ + NestJS + TypeScript + MongoDB (Mongoose) + Redis + Docker

```bash
# Estrutura de projeto otimizada
src/
├── modules/
│   ├── auth/           # Autenticação e autorização
│   ├── users/          # Gestão de colaboradores  
│   ├── medical-certificates/  # Atestados médicos
│   ├── icd-integration/      # Integração WHO ICD API
│   └── shared/         # Módulos compartilhados
├── common/
│   ├── decorators/     # Decorators customizados
│   ├── guards/         # Guards de segurança
│   ├── filters/        # Filtros de exceção
│   ├── interceptors/   # Interceptors (cache, logging)
│   └── pipes/          # Pipes de validação
├── config/             # Configurações por ambiente
└── main.ts
```

### Integração MongoDB otimizada

**Schemas para sistema de atestados:**

```typescript
// Schema do Atestado Médico
@Schema({ timestamps: true })
export class MedicalCertificate {
  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true, index: true })
  cpf: string;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  issueDate: Date;

  @Prop({ required: true, index: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  endDate: Date;

  @Prop({ required: true })
  diagnosis: string;

  @Prop()
  icdCode?: string;

  @Prop({ default: 'active', enum: ['active', 'cancelled', 'expired'], index: true })
  status: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

// Índices otimizados
MedicalCertificateSchema.index({ cpf: 1, status: 1 });
MedicalCertificateSchema.index({ doctorId: 1, issueDate: -1 });
MedicalCertificateSchema.index({ startDate: 1, endDate: 1 });
```

### Sistema de autenticação híbrido

**Sessões de 4 horas com JWT + Redis:**

```typescript
@Injectable()
export class SessionService {
  constructor(
    private readonly redis: RedisService,
    private readonly jwtService: JwtService
  ) {}

  async createSession(userId: string, metadata: any): Promise<string> {
    const sessionId = uuidv4();
    const sessionData = {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata
    };

    // Armazenar sessão no Redis com expiração de 4 horas
    await this.redis.set(
      `session:${sessionId}`, 
      JSON.stringify(sessionData), 
      'EX', 
      4 * 60 * 60
    );

    return sessionId;
  }
}
```

### Validação robusta com bibliotecas brasileiras

```typescript
import { IsCPF } from 'validation-br';

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsString()
  @IsCPF()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  cpf: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
```

## 2. Integração obrigatória com API da OMS

### Configuração OAuth2 para WHO ICD API

**Implementação completa da integração:**

```typescript
class WHOICDIntegration {
  constructor(private config: ICDConfig) {
    this.cache = new ICDCache(config.cacheMaxAge);
    this.circuitBreaker = new CircuitBreaker(5, 30000);
  }

  async getAccessToken(): Promise<string> {
    const tokenEndpoint = 'https://icdaccessmanagement.who.int/connect/token';
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=icdapi_access'
    });
    
    const tokenData = await response.json();
    return tokenData.access_token; // Válido por ~1 hora
  }

  async searchDiagnosisWithCache(query: string): Promise<any[]> {
    const cacheKey = `search:${query}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    const results = await this.circuitBreaker.execute(async () => {
      return await this.searchICD(query);
    });
    
    await this.cache.set(cacheKey, results, 3600); // Cache por 1 hora
    return results;
  }
}
```

### Autocomplete inteligente com debounce

```typescript
// Service para autocomplete de CID
@Injectable()
export class CIDAutocompleteService {
  private debouncedSearch = debounce(this.performSearch.bind(this), 300);

  async performSearch(query: string): Promise<CIDSearchResult[]> {
    if (query.length < 2) return [];
    
    try {
      const token = await this.icdService.getToken();
      const results = await this.icdService.search(query, {
        maxResults: 10,
        flatResults: true,
        useFlexisearch: true
      });
      
      return results.destinationEntities || [];
    } catch (error) {
      this.logger.error('CID search error:', error);
      return [];
    }
  }
}
```

## 3. Frontend Vue 3 moderno e responsivo

### Arquitetura com Composition API + TypeScript

**Setup recomendado:** Vue 3 + Composition API + Pinia + TypeScript + PrimeVue + Vite

```typescript
// Estrutura de projeto Vue 3
src/
├── api/               # Clientes de API
├── composables/       # Lógica reutilizável
├── stores/           # Pinia stores
├── components/       # Componentes Vue
├── views/            # Views/páginas
├── utils/            # Utilitários
└── types/            # Definições TypeScript
```

### Store Pinia para gerenciamento de estado

```typescript
// stores/medical-certificates.ts
export const useMedicalCertificatesStore = defineStore('certificates', () => {
  const certificates = ref<MedicalCertificate[]>([]);
  const loading = ref(false);
  const filters = ref({
    status: 'all',
    dateRange: null,
    collaborator: null
  });

  const activeCertificates = computed(() =>
    certificates.value.filter(c => c.status === 'active')
  );

  async function fetchCertificates(pagination: PaginationOptions) {
    loading.value = true;
    try {
      const data = await certificateApi.getAll({
        ...filters.value,
        ...pagination
      });
      certificates.value = data.results;
      return data;
    } finally {
      loading.value = false;
    }
  }

  return {
    certificates,
    loading,
    filters,
    activeCertificates,
    fetchCertificates
  };
});
```

### Componente de autocomplete CID otimizado

```vue
<template>
  <div class="cid-autocomplete">
    <PAutoComplete
      v-model="selectedCid"
      :suggestions="cidSuggestions"
      @complete="searchCid"
      :loading="loading"
      field="description"
      placeholder="Digite o código ou descrição do CID"
      :min-length="2"
      :delay="300"
      scroll-height="200px"
    >
      <template #item="{ item }">
        <div class="cid-item">
          <strong>{{ item.code }}</strong> - {{ item.description }}
        </div>
      </template>
    </PAutoComplete>
  </div>
</template>

<script setup lang="ts">
import { useCidAutocomplete } from '@/composables/useCidAutocomplete';

const { selectedCid, cidSuggestions, loading, searchCid } = useCidAutocomplete();
</script>
```

### Interface responsiva com PrimeVue

**PrimeVue é a biblioteca recomendada** para sistemas de saúde devido a:
- 80+ componentes especializados para dados complexos
- Excelente suporte à acessibilidade (WCAG 2.1 AA)
- Temas customizáveis para healthcare
- DataTables avançadas com filtros e paginação
- Integração nativa com Tailwind CSS

## 4. Segurança e compliance LGPD

### Implementação de controles de segurança

**LGPD compliance para dados de saúde:**

```typescript
// Middleware de auditoria LGPD
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body?.cpf || req.params?.cpf) {
      this.auditLogger.log({
        action: 'sensitive_data_access',
        user: req.user?.id,
        resource: req.path,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  }
}

// Controle de acesso baseado em perfis (RBAC)
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    
    return this.validateUserAccess(user, roles);
  }
}
```

### Criptografia de dados sensíveis

```typescript
// Criptografia AES-256 para dados em repouso
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    };
  }
}
```

## 5. Funcionalidades essenciais do sistema

### Gestão completa de colaboradores

**Funcionalidades implementadas:**
- Cadastro com validação de CPF em tempo real
- Importação automática via APIs de RH
- Status ativo/inativo com auditoria
- Histórico completo de atestados
- Integração com estrutura organizacional

### Sistema de atestados médicos

**Workflow completo:**
1. **Emissão** via plataforma médica segura
2. **Validação** automática via Atesta CFM (obrigatório março/2025)
3. **Notificação** automática para colaborador/empresa
4. **Aprovação** por gestores de RH
5. **Integração** com sistemas de folha/ponto
6. **Auditoria** completa de todas as ações

### Relatórios e dashboards executivos

**KPIs essenciais implementados:**
- Taxa de absenteísmo por departamento (ideal <4%)
- Custos com afastamentos médicos
- Distribuição por códigos CID
- Padrões sazonais de afastamentos
- Detecção de absenteísmo suspeito (Score Bradford >450)

## 6. Containerização e DevOps

### Docker setup otimizado

```dockerfile
# Multi-stage build otimizado
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .
RUN chown -R nextjs:nodejs /usr/src/app
EXPOSE 3000
USER nextjs
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node health-check.js
CMD ["node", "dist/app.js"]
```

### Cache estratégico com Redis

```typescript
// Cache para sessões e WHO API responses
class CacheService {
  // Cache WHO API responses (1 hora)
  async cacheWHOResponse(key: string, data: any) {
    await this.redis.setEx(`who:${key}`, 3600, JSON.stringify(data));
  }

  // Session management (4 horas)  
  async setSession(sessionId: string, userData: any) {
    await this.redis.setEx(`session:${sessionId}`, 14400, JSON.stringify(userData));
  }

  // Query caching para MongoDB
  async cacheQuery(queryKey: string, results: any) {
    await this.redis.setEx(`query:${queryKey}`, 300, JSON.stringify(results));
  }
}
```

### CI/CD com GitHub Actions

```yaml
# Pipeline automatizada
name: CI/CD Sistema Atestados
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        ports: [27017:27017]
      redis:
        image: redis:7.2
        ports: [6379:6379]
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - run: npm run test:e2e

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to production
      # Deploy automatizado para Kubernetes/Docker Swarm
```

## 7. Monitoramento e observabilidade

### Logging estruturado e métricas

```typescript
// Winston + ELK Stack para logs
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new ElasticsearchTransport({
      index: 'atestados-logs',
      clientOpts: { node: process.env.ELASTICSEARCH_URL }
    })
  ]
});

// Health checks robustos
app.get('/health', async (req, res) => {
  const health = await Promise.allSettled([
    checkMongoDB(),
    checkRedis(), 
    checkWHOAPI()
  ]);
  
  const status = health.every(h => h.status === 'fulfilled') ? 'healthy' : 'unhealthy';
  res.status(status === 'healthy' ? 200 : 503).json({ status, services: health });
});
```

## 8. Cronograma de implementação

### Fase 1 (1-2 meses): Base arquitetural
- [ ] Setup inicial NestJS + MongoDB + Docker
- [ ] Sistema de autenticação com sessões de 4h
- [ ] CRUD básico de colaboradores
- [ ] Integração inicial com WHO ICD API
- [ ] Frontend Vue 3 com PrimeVue

### Fase 2 (2-3 meses): Funcionalidades core
- [ ] Sistema completo de atestados médicos
- [ ] Integração Atesta CFM
- [ ] Autocomplete CID inteligente
- [ ] Listagem com filtros avançados e paginação
- [ ] Dashboard básico com KPIs

### Fase 3 (1-2 meses): Compliance e segurança
- [ ] Adequação completa à LGPD
- [ ] Sistema de auditoria robusto
- [ ] Criptografia de dados sensíveis
- [ ] Controles de acesso (RBAC)
- [ ] Testes de segurança

### Fase 4 (1-2 meses): DevOps e monitoramento
- [ ] Pipeline CI/CD automatizada
- [ ] Monitoramento completo (APM + logs)
- [ ] Cache Redis otimizado
- [ ] Backup automatizado
- [ ] Deploy em produção

### Fase 5 (1 mês): Funcionalidades avançadas
- [ ] Análise preditiva de absenteísmo
- [ ] Integração com sistemas de folha/ponto
- [ ] Relatórios executivos avançados
- [ ] Alertas automáticos
- [ ] Mobile responsivo

## 10. Próximos passos imediatos

1. **Setup do ambiente de desenvolvimento:**
   - Configurar Docker Compose com NestJS + MongoDB + Redis
   - Implementar estrutura modular do NestJS
   - Configurar Vue 3 + PrimeVue + TypeScript

2. **Integração WHO ICD API:**
   - Obter credenciais OAuth2 da OMS
   - Implementar autenticação e cache
   - Desenvolver autocomplete inteligente

3. **Compliance e segurança:**
   - Implementar logs de auditoria
   - Configurar criptografia de dados
   - Estabelecer políticas de RBAC

4. **Funcionalidades básicas:**
   - CRUD completo de colaboradores
   - Sistema de atestados médicos
   - Interface responsiva

Este plano detalhado fornece uma roadmap completa para desenvolver um sistema de gestão de atestados médicos moderno, seguro e compliant com todas as regulamentações brasileiras, utilizando as tecnologias mais atuais e melhores práticas de 2024/2025.