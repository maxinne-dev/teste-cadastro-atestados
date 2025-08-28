
# Teste Prático (Desenvolvedor) - Sistema de Atestados Médicos
          
## 🎯 Objetivo

Desenvolver um sistema web completo para gestão de atestados médicos que permita cadastro de colaboradores, lançamento de atestados com integração obrigatória à API externa da OMS para busca de CIDs, e listagem de registros.


## 🛠 Stack Tecnológica Obrigatória

* **Backend:**
    - Node.js 18+ com TypeScript
    - NestJS
    - MongoDB para armazenamento dos dados

* **Frontend:**
    - Preferencialmente, VueJS

* **DevOps:**
    - Docker + Docker Compose
    - ESLint + Prettier

## 📊 Funcionalidades Requeridas

1. **Autenticação:**
    - Sistema de login/logout
    - Proteção de rotas
    - Sessão com duração de 4 horas

2. **Gestão de Colaboradores:**
    - Cadastro com nome completo, CPF, data de nascimento e cargo
    - Validação de CPF brasileiro
    - Listagem com busca e filtros
    - Status ativo/inativo

3. **Lançamento de Atestados:**
    - Seleção do colaborador
    - Data e hora do atestado
    - Quantidade de dias de afastamento (1-365)
    - Busca e seleção de CID através da API externa da OMS (OBRIGATÓRIO)
    - Campo opcional para observações

4. **Integração Obrigatória com API Externa da OMS:**
    - REQUISITO CRÍTICO: Implementar integração real com a API oficial da OMS
    - URL da API: https://icd.who.int/icdapi
    - Funcionalidade: Busca de códigos CID por termo de pesquisa
    - Autenticação: OAuth2 com credenciais obtidas via registro gratuito
    - Tratamento: Gerenciar erros, timeouts e indisponibilidade da API externa
    - Fallback: Implementar estratégia para quando a API externa estiver indisponível

5. **Listagem de Atestados:**
    - Visualização de todos os atestados
    - Filtros por colaborador, período e CID
    - Paginação
    - Ordenação por data

## 🌐 Integração com API Externa - REQUISITO OBRIGATÓRIO

### API da Organização Mundial da Saúde (OMS):

- URL Base: https://icd.who.int/icdapi
- Documentação Oficial: Disponível no site da API
- Registro Obrigatório: Criar conta gratuita para obter credenciais de acesso
- Tipo de Autenticação: OAuth2 Client Credentials
- Objetivo: Buscar códigos CID (Classificação Internacional de Doenças) em
tempo real

### Requisitos Técnicos da Integração:

1. Autenticação OAuth2: Implementar fluxo completo de obtenção de token
2. Busca de CIDs: Permitir busca por código ou descrição
3. Cache de Token: Gerenciar expiração e renovação automática
4. Tratamento de Erros: Lidar com falhas de rede, timeouts, rate limiting
5. Estratégia de Fallback: Funcionalidade deve continuar operando mesmo se API externa estiver indisponível

### Funcionalidade Esperada:

- Campo de busca com autocomplete para CIDs
- Resultados em tempo real da API da OMS
- Seleção do CID desejado para o atestado
- Armazenamento do código e descrição no banco local


## 📱 Interface do Usuário

### Telas Obrigatórias:

1. Login - Autenticação do usuário
2. Dashboard - Visão geral do sistema
3. Colaboradores - Listagem e cadastro
4. Novo Atestado - Formulário de lançamento com busca de CID via API externa
5. Atestados - Listagem com filtros

### Requisitos de UX:

- Interface responsiva (desktop e mobile)
- Validações em tempo real nos formulários
- Campo de busca de CID com autocomplete conectado à API externa
- Feedback visual para ações do usuário
- Indicadores de status da integração com API externa
- Tratamento adequado de estados de loading e erro


## 📁 Entregáveis

### Obrigatórios:

- Código fonte em repositório Git público
- Integração com API da OMS funcionando completamente
- README com instruções de instalação e execução
- Documentação de como obter e configurar credenciais da API da OMS
- Testes implementados e passando
- Todas as funcionalidades principais funcionando

### Opcionais (Pontos Extras):

- Funcionalidades adicionais relevantes
- Implementações avançadas da integração (cache, retry, etc.)
- Documentação técnica detalhada
