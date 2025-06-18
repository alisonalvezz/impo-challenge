#!/bin/sh
# Sustituye ${PORT} por su valor real y lanza nginx
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
