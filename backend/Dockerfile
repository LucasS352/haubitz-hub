# =============================================
# BUILD STAGE
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (cache otimizado)
COPY package*.json ./
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo devDependencies para build)
RUN npm install

# Copia o restante do código
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Compila TypeScript
RUN npm run build

# =============================================
# PRODUCTION STAGE
# =============================================
FROM node:20-alpine AS production

WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --only=production

# Copia o build compilado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Usuário não-root para segurança
RUN addgroup -S haubitz && adduser -S haubitz -G haubitz
USER haubitz

# Porta da aplicação
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Roda as migrações e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
