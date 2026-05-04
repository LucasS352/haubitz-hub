# =============================================
# BUILD STAGE
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia pacotes para cache
COPY package*.json ./
# O vite_react_shadcn usa npm no package.json, vamos instalar com npm
RUN npm ci

# Copia o código e compila
COPY . .
RUN npm run build

# =============================================
# PRODUCTION STAGE (NGINX)
# =============================================
FROM nginx:alpine

# Copia o build do frontend para a pasta do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia nossa configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
