#!/bin/sh
set -e

# Substitute only APP_HOST and APP_PORT to avoid corrupting nginx's own variables
envsubst '${APP_HOST} ${APP_PORT}' < /etc/nginx/nginx.conf.tpl > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
