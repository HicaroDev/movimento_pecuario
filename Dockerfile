# Build acontece no startup para que o EasyPanel já tenha escrito o .env
FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/share/nginx/html /run/nginx

EXPOSE 80

# CMD inline — sem script externo (evita problema de CRLF)
CMD sh -c "npm run build && cp -r /app/dist/* /usr/share/nginx/html/ && nginx -g 'daemon off;'"
