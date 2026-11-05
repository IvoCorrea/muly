# Muly 🎵

> A **rede social para quem ama música**: catalogue o que você ouve, avalie álbuns com notas e resenhas, e personalize seu perfil público com seus discos favoritos.

---

## 📌 Sumário
- [Muly 🎵](#muly-)
  - [📌 Sumário](#-sumário)
  - [🎧 Sobre o Projeto](#-sobre-o-projeto)
  - [✨ Funcionalidades (v1.0)](#-funcionalidades-v10)
  - [🏛️ Arquitetura \& Decisões](#️-arquitetura--decisões)
  - [🛠 Tech Stack](#-tech-stack)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [📂 Estrutura do Repositório](#-estrutura-do-repositório)
  - [🚀 Como Rodar Localmente](#-como-rodar-localmente)
    - [Pré-requisitos](#pré-requisitos)
    - [1. Banco de Dados (Docker)](#1-banco-de-dados-docker)
    - [2. Backend (Spring Boot)](#2-backend-spring-boot)
    - [3. Frontend (Angular)](#3-frontend-angular)
  - [🌐 Variáveis de Ambiente](#-variáveis-de-ambiente)
  - [🗺️ Roadmap Futuro (v1.1+)](#️-roadmap-futuro-v11)

---

## 🎧 Sobre o Projeto

O **Muly** é uma plataforma focada em entusiastas e amantes de música que desejam registrar suas experiências sonoras, atribuir notas, escrever resenhas de discos e compartilhar seu gosto musical com a comunidade através de um perfil público com personalização visual (capa em destaque e Top 4 álbuns).

---

## ✨ Funcionalidades (v1.0)

1. **Autenticação & Segurança (JWT)**:
   - Cadastro e login via username + senha com hash BCrypt.
   - Restrições de username (formato Instagram, sem pontos nas extremidades ou consecutivos, reserva do username `me`).
   - Sessão persistente no frontend via `localStorage` e `HttpInterceptor`.
   - Rotas protegidas devolvendo `401 Unauthorized` com entry point dedicado.

2. **Catálogo de Álbuns (Spotify Web API)**:
   - Busca em tempo real de álbuns e artistas via Spotify Client Credentials.
   - Cache local transparente no banco no primeiro acesso a um álbum.
   - Visualização detalhada de álbuns: capa, ano de lançamento, artista e tracklist completa com tempo de duração.

3. **Avaliações & Resenhas (Reviews)**:
   - Atribuição de nota (0.5 a 5.0 estrelas) e texto de resenha por álbum.
   - Modelo único de review por usuário por álbum (com opção de editar ou excluir).
   - Cálculo dinâmico da média geral e total de avaliações por disco.
   - Consulta pública de reviews por álbum e por perfil de usuário.

4. **Perfil Público & Customização**:
   - Perfil público acessível por `/profile/:username`.
   - Destaque para o **Álbum Favorito de Todos os Tempos** na capa do perfil.
   - Lista ordenada de **Top 4 Álbuns**.
   - Histórico das resenhas e avaliações do usuário.
   - Painel exclusivo `/profile/me/edit` para o usuário gerenciar seus destaques com busca no catálogo.

---

## 🏛️ Arquitetura & Decisões

- **Monólito Modular**:
  - Pacote raiz `com.muly` dividido em módulos bem definidos: `auth`, `catalog`, `reviews`, `profile` e `common`.
  - **Isolamento de Repositórios**: Um módulo nunca acessa diretamente o `Repository` de outro; toda comunicação inter-módulo é mediada pelos `Services`.
  - **Segurança contra IDOR**: Rotas de edição de perfil usam `/profile/me/...`, extraindo o usuário autenticado diretamente do token JWT (Subject), nunca de parâmetros de URL.
  - **Contratos via DTOs (Records)**: Entidades JPA nunca são expostas na camada web; toda resposta e request utiliza `record`.
  - **Tratamento Global de Erros**: `@RestControllerAdvice` centralizado com respostas padronizadas (`ApiErrorResponse`), tratando validação com mapa de campos (`fieldErrors`), duplicações (`409 Conflict`) e credenciais inválidas (`401 Unauthorized`).

---

## 🛠 Tech Stack

### Backend
- **Java 21**
- **Spring Boot 4.1.1** (Spring Security, Spring Data JPA, Jakarta Validation, Spring WebMVC)
- **jjwt 0.12.6** (JSON Web Tokens)
- **PostgreSQL 16** (Driver oficial + Hibernate 7)
- **Maven**
- **Lombok**
- **spring-dotenv** (gerenciamento de segredos locais via `.env`)

### Frontend
- **Angular (Standalone Components, Signals)**
- **Tailwind CSS** (estilização moderna e responsiva no tema dark Letterboxd-style)
- **RxJS**
- Sem bibliotecas pesadas de componentes (sem Angular Material).

---

## 📂 Estrutura do Repositório

```text
muly/
├── backend/
│   ├── src/main/java/com/muly/
│   │   ├── auth/          # Usuários, JWT, Filtro de segurança, Login/Register
│   │   ├── catalog/       # Spotify client, Cache de álbuns, Busca e Detalhes
│   │   ├── reviews/       # Avaliações com notas e resenhas
│   │   ├── profile/       # Perfil público, Top 4 e Álbum favorito
│   │   └── common/        # Exception handlers, DTOs de erro e configurações
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   ├── docker-compose.yml
│   └── .env               # Não versionado (no .gitignore)
├── frontend/
│   ├── src/app/
│   │   ├── core/          # Guards, Interceptor JWT, Services e Models
│   │   ├── shared/        # Navbar, Footer, StarRating e AlbumCard
│   │   └── features/      # Auth, Catalog, Reviews, Profile e Home
│   ├── package.json
│   ├── angular.json
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Docker & Docker Compose
- Java 21 JDK instalado
- Node.js (v20+ recomendado) e npm

### 1. Banco de Dados (Docker)
Na pasta `backend/`:
```bash
docker compose up -d
```
Isso iniciará o PostgreSQL na porta `5432:5432` com database `muly`.

### 2. Backend (Spring Boot)
Crie o arquivo `backend/.env` baseado no exemplo abaixo:
```env
JWT_SECRET=suaChaveSecretaDePeloMenos256BitsAquiEmHexOuTextoLongo
EXPIRATION_MS=86400000
FRONTEND_URL=http://localhost:4200
SPOTIFY_CLIENT_ID=seu_spotify_client_id
SPOTIFY_CLIENT_SECRET=seu_spotify_client_secret
```
Em seguida, execute a aplicação:
```bash
cd backend
./mvnw spring-boot:run
```
O servidor iniciará em `http://localhost:8080`.

### 3. Frontend (Angular)
Na pasta `frontend/`:
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
Acesse a aplicação no navegador em `http://localhost:4200`.

---

## 🌐 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `JWT_SECRET` | Chave HMAC-SHA para assinar tokens | Hexadecimal de 256 bits |
| `EXPIRATION_MS` | Tempo de expiração do JWT em milissegundos | `86400000` (24h) |
| `FRONTEND_URL` | Origem permitida nas políticas de CORS | `http://localhost:4200` |
| `SPOTIFY_CLIENT_ID` | Client ID da sua aplicação Spotify Developer | `...` |
| `SPOTIFY_CLIENT_SECRET` | Client Secret da sua aplicação Spotify Developer | `...` |

---

## 🗺️ Roadmap Futuro (v1.1+)
- [ ] Mini player de áudio integrado (iTunes Search API ou embed do Spotify).
- [ ] OAuth2 Social Login (Google e Discord).
- [ ] Follow de outros usuários e Feed de atividade na Home.
- [ ] Listas colaborativas de discos.
