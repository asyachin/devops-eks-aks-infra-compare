server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Proxy API requests to Django backend
    location /api {
        proxy_pass http://${APP_HOST}:${APP_PORT};
        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    # Proxy Django admin
    location /admin {
        proxy_pass http://${APP_HOST}:${APP_PORT};
        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        client_max_body_size 10M;
    }

    # Media and static files served by Django (DEBUG mode)
    location /static {
        proxy_pass http://${APP_HOST}:${APP_PORT};
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # React SPA — all unmatched paths fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
