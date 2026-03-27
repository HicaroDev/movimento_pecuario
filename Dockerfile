# ── Stage 1: build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ARGs recebidos do EasyPanel via --build-arg
# Passados inline no RUN para não ficarem gravados nas camadas da imagem
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_SERVICE_ROLE_KEY

RUN VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
    VITE_SUPABASE_SERVICE_ROLE_KEY="$VITE_SUPABASE_SERVICE_ROLE_KEY" \
    npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback — todas as rotas retornam index.html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' \
    > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
