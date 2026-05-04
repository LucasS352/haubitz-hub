# Haubitz Hub — Sistema de Gestão & Portal de Clientes

Plataforma multi-tenant da Haubitz composta por três partes:

| Serviço | Descrição | Porta |
|---|---|---|
| **backend** | API REST Node.js/Express/Prisma | `3000` |
| **haubitz-hub** | Painel interno (React/Vite/Tailwind) | `8080` |
| **cliente-portal** | Portal do cliente (React/Vite) | `5174` |

---

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/) instalado
- [MariaDB 10.11+](https://mariadb.org/) **ou** [XAMPP](https://www.apachefriends.org/) rodando na porta `3307`
- `npm` disponível no terminal

> **Dica:** Se você usa XAMPP, certifique-se de que o serviço MySQL/MariaDB está **iniciado** e configurado para escutar na porta `3307`.

---

## 1. Configurar o Banco de Dados

### Criar o banco no MariaDB/MySQL

Abra o terminal do MariaDB (ou o phpMyAdmin do XAMPP) e rode:

```sql
CREATE DATABASE IF NOT EXISTS haubitz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Configurar o Backend

### 2.1 — Instalar dependências

```bash
cd backend
npm install
```

### 2.2 — Criar o arquivo `.env`

Copie o exemplo e ajuste conforme seu ambiente:

```bash
copy .env.example .env
```

Edite o `.env` com suas credenciais locais:

```env
# Se MariaDB sem senha (padrão XAMPP):
DATABASE_URL="mysql://root@127.0.0.1:3307/haubitz"

# Se MariaDB com senha:
DATABASE_URL="mysql://root:SUA_SENHA@127.0.0.1:3307/haubitz"

JWT_SECRET="haubitz-jwt-secret-dev"
JWT_REFRESH_SECRET="haubitz-refresh-secret-dev"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3000
NODE_ENV=development
BCRYPT_ROUNDS=12

ADMIN_EMAIL="kayke@haubitz.com.br"
ADMIN_PASSWORD="Haubitz@2024!"
ADMIN_NAME="Kayke"
```

### 2.3 — Gerar o Prisma Client e rodar migrações

```bash
# Gera o client do Prisma
npx prisma generate

# Aplica as migrações e cria as tabelas
npx prisma migrate dev --name init
```

### 2.4 — Popular o banco com dados iniciais (seed)

```bash
npm run seed
```

### 2.5 — Iniciar o backend em modo desenvolvimento

```bash
npm run dev
```

O backend estará disponível em: **http://localhost:3000**

Para verificar, acesse: **http://localhost:3000/health**

---

## 3. Configurar o Painel Interno (haubitz-hub)

```bash
cd haubitz-hub
npm install
npm run dev
```

O painel estará disponível em: **http://localhost:8080**

> O Vite já está configurado com um proxy: chamadas para `/api/*` são redirecionadas automaticamente para `http://localhost:3000`, então não precisa configurar CORS nem URL do backend.

---

## 4. Configurar o Portal do Cliente

```bash
cd cliente-portal
npm install
npm run dev
```

O portal estará disponível em: **http://localhost:5174**

---

## Resumo — Ordem de inicialização

Abra **três terminais separados** e execute nesta ordem:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Painel Interno
cd haubitz-hub
npm run dev

# Terminal 3 — Portal do Cliente
cd cliente-portal
npm run dev
```

---

## Scripts disponíveis (Backend)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento com hot-reload |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda o build compilado |
| `npm run seed` | Popula o banco com dados iniciais |
| `npx prisma migrate dev` | Cria/aplica migrações |
| `npx prisma migrate deploy` | Aplica migrações em produção |
| `npx prisma studio` | Abre interface visual do banco |

---

## Scripts disponíveis (haubitz-hub)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento (porta 8080) |
| `npm run build` | Gera build de produção |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run test` | Roda os testes |

---

## Deploy via Portainer (Produção)

O deploy em produção usa Docker + Portainer. Os arquivos relevantes são:

- `backend/Dockerfile` — imagem multi-stage (builder + production)
- `backend/docker-compose.yml` — orquestração com MariaDB + Backend

> **Atenção:** O `docker-compose.yml` usa variáveis como `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, etc. Essas variáveis devem ser configuradas como **Environment Variables** no Portainer, **não** no `.env` local.

### Variáveis obrigatórias no Portainer

```env
DB_ROOT_PASSWORD=senha_root_forte
DB_PASSWORD=senha_haubitz_user
JWT_SECRET=chave_jwt_producao_muito_segura
JWT_REFRESH_SECRET=chave_refresh_producao_muito_segura
ADMIN_EMAIL=kayke@haubitz.com.br
ADMIN_PASSWORD=SenhaForte@Prod!
ADMIN_NAME=Kayke
PORT=3000
```

---

## Estrutura do Projeto

```
Haubitz/
├── backend/              # API Node.js + Prisma + MariaDB
│   ├── src/              # Código-fonte TypeScript
│   ├── prisma/           # Schema e migrações do banco
│   ├── Dockerfile
│   └── docker-compose.yml
├── haubitz-hub/          # Painel interno (React/Vite)
│   └── src/
└── cliente-portal/       # Portal do cliente (React/Vite)
    └── src/
```
