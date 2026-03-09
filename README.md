# RecipeBook — Fullstack Microservices Application

A full-stack recipe management application built with a **multi-tier microservices architecture**. Users can create, organise, and share recipes with tags, ingredients, and photos. Designed for containerised deployment on **AWS EKS** and **Azure AKS**.

---

## Architecture

```
                        ┌─────────────────────────────┐
                        │        Browser / Client      │
                        └──────────────┬──────────────┘
                                       │ :80
                        ┌──────────────▼──────────────┐
                        │   React + Nginx (frontend)   │  ← Tier 1 (Gateway + SPA)
                        │   /api, /admin  →  Django    │
                        │   /*            →  index.html│
                        └──────────┬──────────────────┘
                                   │ :9000
                        ┌──────────▼──────┐
                        │   Django + DRF  │  ← Tier 2 (API)
                        │   backend/      │
                        └──────┬──────────┘
                               │ :5432
                        ┌──────▼──────┐
                        │ PostgreSQL  │  ← Tier 3 (Data)
                        └─────────────┘
```

| Service    | Technology                  | Port (local) |
|------------|-----------------------------|--------------|
| `frontend` | React 18 · Vite · Nginx     | 80           |
| `app`      | Django 4 · DRF · runserver  | 8000 (dev)   |
| `db`       | PostgreSQL 13               | 5432         |

> The `frontend` Nginx container acts as both the SPA server and a reverse proxy for `/api`, `/admin`, and `/static` paths — eliminating the need for a dedicated proxy service.
> In EKS/AKS, this role is taken over by an **Ingress controller** (see [Deployment](#deployment)).

---

## Features

- **Recipe management** — create, edit, delete recipes with title, description, cook time, cost, and source URL
- **Tags & ingredients** — organise recipes with reusable tags and ingredients; filter the list by either
- **Photo upload** — attach images to recipes; served via Nginx from a shared Docker volume
- **Recipe sharing** — generate a public shareable link; recipients can preview the recipe and save a copy to their own account without authentication
- **Token-based authentication** — register / login with email and password; stateless Token auth via DRF
- **OpenAPI docs** — interactive Swagger UI at `/api/docs/`
- **Health check** — liveness endpoint at `/api/health-check/`

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Django | 4.0.x | Web framework |
| djangorestframework | 3.13.x | REST API |
| drf-spectacular | 0.22.x | OpenAPI 3 schema & Swagger UI |
| psycopg2 | 2.9.x | PostgreSQL adapter |
| Pillow | 9.1.x | Image processing |
| gunicorn | 21.2.x | WSGI server (production) |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| React Router DOM | 6 | Client-side routing |
| Axios | 1.6 | HTTP client |
| Vite | 5 | Build tool |

### Infrastructure
- **Docker** & **Docker Compose** — local development and CI
- **Nginx** — embedded in the frontend container; proxies API requests and serves the React SPA
- **PostgreSQL 13** — primary database

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/install/) ≥ 2.20

### 1. Clone the repository

```bash
git clone https://github.com/your-org/fullstack-microservices-ci-reciepts.git
cd fullstack-microservices-ci-reciepts
```

### 2. Configure environment

```bash
cp .env.sample .env
```

Edit `.env` with your values:

```dotenv
DB_NAME=devdb
DB_USER=devuser
DB_PASS=changeme
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

> **Production:** generate a strong `DJANGO_SECRET_KEY` — e.g. `python -c "import secrets; print(secrets.token_urlsafe(50))"`.

### 3. Build and start

```bash
docker compose up -d --build
```

Docker Compose will:
1. Start PostgreSQL and wait for it to be healthy
2. Run Django migrations
3. Build the React app and serve it via Nginx on port 80

### 4. Open the app

| URL | Description |
|---|---|
| `http://localhost/` | React frontend |
| `http://localhost/api/docs/` | Swagger / OpenAPI UI |
| `http://localhost/admin/` | Django admin panel |
| `http://localhost:8000/api/` | Direct API access (dev only) |

### 5. Create a superuser (optional)

```bash
docker compose exec app python manage.py createsuperuser
```

---

## Project Structure

```
.
├── backend/                    # Django application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements.dev.txt
│   ├── manage.py
│   ├── app/                    # Django project settings & root URLs
│   ├── core/                   # User model, health check, base models
│   ├── recipe/                 # Recipe, Tag, Ingredient — views, serializers, URLs
│   └── user/                   # Registration, login, profile endpoints
│
├── frontend/                   # React SPA
│   ├── Dockerfile              # Multi-stage: Node build → Nginx serve
│   ├── nginx.conf.tpl          # Nginx config template (envsubst: APP_HOST, APP_PORT)
│   ├── entrypoint.sh           # Renders nginx.conf.tpl and starts Nginx
│   ├── src/
│   │   ├── api/client.js       # Axios instance + API methods
│   │   ├── contexts/           # AuthContext (token storage, login/logout)
│   │   ├── components/         # Header, ProtectedRoute
│   │   └── pages/              # Login, Register, RecipeList, RecipeDetail,
│   │                           #   RecipeForm, SharePage, Profile
│   └── package.json
│
├── scripts/
│   └── run.sh                  # Gunicorn entrypoint (production)
│
├── docker-compose.yml
├── .env.sample
└── README.md
```

---

## API Reference

All API endpoints are documented interactively at `/api/docs/`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/create/` | Register a new user |
| `POST` | `/api/user/token/` | Obtain an auth token |
| `GET` | `/api/user/me/` | Get current user profile |
| `PATCH` | `/api/user/me/` | Update profile / password |

Authenticated requests require the header:
```
Authorization: Token <your-token>
```

### Recipes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recipe/recipes/` | List recipes (`?tags=1,2&ingredients=3`) |
| `POST` | `/api/recipe/recipes/` | Create a recipe |
| `GET` | `/api/recipe/recipes/{id}/` | Get recipe detail |
| `PATCH` | `/api/recipe/recipes/{id}/` | Update a recipe |
| `DELETE` | `/api/recipe/recipes/{id}/` | Delete a recipe |
| `POST` | `/api/recipe/recipes/{id}/upload-image/` | Upload recipe photo |
| `GET` | `/api/recipe/recipes/{id}/share/` | **Public** — view recipe without auth |

### Tags & Ingredients

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recipe/tags/` | List user's tags (`?assigned_only=1`) |
| `PATCH` | `/api/recipe/tags/{id}/` | Rename a tag |
| `DELETE` | `/api/recipe/tags/{id}/` | Delete a tag |
| `GET` | `/api/recipe/ingredients/` | List user's ingredients |
| `PATCH` | `/api/recipe/ingredients/{id}/` | Rename an ingredient |
| `DELETE` | `/api/recipe/ingredients/{id}/` | Delete an ingredient |

---

## Development

### Run tests

```bash
docker compose exec app python manage.py test
```

### Lint (flake8)

```bash
docker compose exec app flake8
```

### Live reload (frontend)

The frontend is a static build. For live development, run Vite directly:

```bash
cd frontend
npm install
npm run dev          # starts at http://localhost:5173
```

Vite will proxy `/api` requests to `http://localhost:8000` — configure this in `vite.config.js` if needed.

### Apply new migrations

```bash
docker compose exec app python manage.py makemigrations
docker compose exec app python manage.py migrate
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DB_NAME` | PostgreSQL database name | `devdb` |
| `DB_USER` | PostgreSQL user | `devuser` |
| `DB_PASS` | PostgreSQL password | `changeme` |
| `DJANGO_SECRET_KEY` | Django secret key | `a-long-random-string` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |

---

## Deployment

### AWS EKS / Azure AKS

Each service maps to a separate Kubernetes `Deployment` + `Service`:

| Service    | K8s resource  | Notes |
|------------|---------------|-------|
| `db`       | `StatefulSet` | Replace with managed DB (RDS / Azure Database for PostgreSQL) |
| `app`      | `Deployment`  | Scale horizontally; store media on S3 / Azure Blob |
| `frontend` | `Deployment`  | Stateless; scale freely |

In Kubernetes, the Nginx inside the frontend container is **not** used for API proxying. Instead, use an **Ingress** resource:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: recipebook-ingress
  annotations:
    kubernetes.io/ingress.class: alb                     # AWS ALB Ingress Controller
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - host: recipebook.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 9000
          - path: /admin
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 9000
          - path: /static
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 9000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

When deployed behind an Ingress, pass `APP_HOST=localhost APP_PORT=80` (or any no-op value) to the frontend container — the nginx proxy rules inside are bypassed because the Ingress handles routing before requests reach the frontend.

### Production checklist

- [ ] Set `DEBUG=0` and provide a strong `DJANGO_SECRET_KEY`
- [ ] Use a managed PostgreSQL instance (RDS / Azure Database)
- [ ] Store media files in object storage (S3 / Azure Blob Storage)
- [ ] Run `python manage.py collectstatic` in the app container startup
- [ ] Add TLS termination at the Ingress / Load Balancer level
- [ ] Set `DJANGO_ALLOWED_HOSTS` to the actual domain name

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
