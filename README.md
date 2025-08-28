# Sistema de Atestados Médicos — Starter Kit

Este repositório contém um sistema completo para gestão de atestados médicos, incluindo um **backend NestJS**, um **frontend Vue.js**, **MongoDB** e **Redis**, todos orquestrados com **Docker Compose**.

> **Requisitos:** Docker 24+, Docker Compose, Node.js 20+ e Git.

---

## 🚀 Primeiros Passos

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento.

1.  **Clone o repositório e configure o ambiente:**
    ```bash
    # Clone este repositório
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DO_DIRETORIO>

    # Copie o arquivo de exemplo .env e preencha as variáveis
    cp .env.example .env
    ```
    > **Nota:** É crucial preencher as variáveis no arquivo `.env`, especialmente as credenciais da API da OMS (`WHO_ICD_CLIENT_ID` e `WHO_ICD_CLIENT_SECRET`).

2.  **Inicie os serviços com Docker Compose:**
    ```bash
    # (Recomendado) Build e inicie todos os containers em background
    docker compose up -d --build
    ```
    > **Usuários de Windows:** Você pode usar o script `setup.ps1` para automatizar a inicialização.

3.  **Acesse as aplicações:**
    -   **Frontend (Web):** http://localhost:5173
    -   **Backend (API Health Check):** http://localhost:3000/health

4.  **(Opcional) Popule o banco de dados com dados de exemplo:**
    ```bash
    cd backend
    npm run seed
    ```
    -   Isso criará usuários de exemplo (`admin@example.com`, `hr@example.com`) com a senha padrão `dev-hash`.

---

## 📚 Documentação

Para ajudar no desenvolvimento e compreensão do projeto, a documentação está organizada nos seguintes arquivos:

| Documento                               | Descrição                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 📄 **[Arquitetura do Sistema][1]**      | Uma visão geral da arquitetura, componentes principais (backend, frontend, DB, cache) e fluxos de dados.      |
| 📦 **[Backend Detalhado][2]**           | Informações específicas do backend, incluindo configuração, scripts, autenticação e detalhes da API.         |
| 🛠️ **[Guia de Uso da API][3]**           | Exemplos práticos de como interagir com os principais endpoints da API.                                     |
| ⚕️ **[Configuração da API da OMS][4]**   | Instruções detalhadas sobre como obter e configurar as credenciais para a integração com a API de CIDs.     |
| 🌊 **[Fluxos de Usuário][5]**            | Documentação dos principais fluxos de usuário na aplicação, com screenshots.                                |
| 🗄️ **[Documentos Arquivados][6]**        | Artefatos históricos do projeto (especificações originais, planos), guardados para referência.              |

[1]: docs/Architecture.md
[2]: backend/README.md
[3]: docs/API-usage.md
[4]: docs/WHO-ICD-Setup.md
[5]: docs/User-Flows.md
[6]: docs/archived/

---

## ✨ Scripts Úteis

-   **Subir todos os serviços:**
    ```bash
    docker compose up -d --build
    ```
-   **Parar todos os serviços:**
    ```bash
    docker compose down
    ```
-   **Visualizar logs em tempo real:**
    ```bash
    # Para a API (backend)
    docker compose logs -f api

    # Para a aplicação web (frontend)
    docker compose logs -f web
    ```

---

## Troubleshooting

-   **API não inicia:** Verifique as variáveis `MONGODB_URI` e `REDIS_URL` no seu arquivo `.env` e consulte os logs com `docker compose logs -f api`.
-   **Erro de CORS:** Certifique-se de que `CORS_ORIGINS` no `.env` inclui o endereço do seu frontend (e.g., `http://localhost:5173`).
-   **Erro 401/429 da API da OMS:** Verifique suas credenciais `WHO_ICD_CLIENT_ID`/`SECRET` e considere que a API tem um limite de requisições. O sistema possui um cache de fallback.
