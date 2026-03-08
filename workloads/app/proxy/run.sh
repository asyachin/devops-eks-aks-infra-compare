#!/bin/sh

set -e

envsubst '${LISTEN_PORT} ${APP_HOST} ${APP_PORT} ${FRONTEND_HOST} ${FRONTEND_PORT}' < /etc/nginx/default.conf.tpl > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
