# syntax=docker/dockerfile:1
# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Cache da pasta npm entre builds — muito mais rápido a partir do 2º deploy
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npx vite build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
