# =============================================
# BUILD STAGE
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Build limpo e com memória expandida
RUN rm -rf dist && NODE_OPTIONS="--max-old-space-size=4096" npm run build

# =============================================
# PRODUCTION STAGE (NGINX)
# =============================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
