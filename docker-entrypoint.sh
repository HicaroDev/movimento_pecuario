#!/bin/sh
set -e

echo ">>> Gerando build com variáveis de ambiente..."
cd /app
npm run build

echo ">>> Copiando para nginx..."
cp -r /app/dist/* /usr/share/nginx/html/

echo ">>> Iniciando nginx..."
exec nginx -g 'daemon off;'
