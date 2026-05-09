# =============================================
# BUILD STAGE
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala OpenSSL necessário para o Prisma
RUN apk add --no-cache openssl

# Copia pacotes e prisma schema primeiro para cache de instalação
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Gera o Prisma Client (usa o binário local instalado)
RUN ./node_modules/.bin/prisma generate

# Compila TypeScript com memória otimizada
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# =============================================
# PRODUCTION STAGE
# =============================================
FROM node:20-alpine AS production

WORKDIR /app

# Instala OpenSSL necessário para o Prisma
RUN apk add --no-cache openssl

# Instala apenas dependências de produção
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --only=production

# Copia o build compilado e o Prisma Client gerado no builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
# Copia a pasta public para servir arquivos estáticos e uploads locais
COPY --from=builder /app/public ./public

# Cria usuário não-root e ajusta permissões
RUN addgroup -S haubitz && adduser -S haubitz -G haubitz \
    && mkdir -p /app/public/uploads \
    && chown -R haubitz:haubitz /app

USER haubitz

# Porta da aplicação
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Comando temporário para manutenção (impede o restart loop)
CMD ["sleep", "3600"]
