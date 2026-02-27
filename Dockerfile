# Imagem única com Node + nginx
# O build acontece no startup do container, depois que o EasyPanel
# escreve o arquivo .env com as variáveis de ambiente.
FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
# Converte CRLF → LF (necessário quando gerado no Windows) e dá permissão
RUN sed -i 's/\r//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

RUN mkdir -p /usr/share/nginx/html

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
