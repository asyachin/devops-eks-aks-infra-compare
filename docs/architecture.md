# Architecture

## Overview

RecipeBook is a three-tier web application composed of two repositories:

| Repository | Purpose |
|---|---|
| `fullstack-microservices-ci-reciepts` | Application source code, Dockerfiles, CI pipeline |
| `gitops-multicloud-aks-eks-receipt-app` | Infrastructure (Terraform) and Kubernetes manifests (ArgoCD) |

---

## Production Architecture (AWS EKS)

```
                         Internet
                             │ HTTPS
                    ┌────────▼────────┐
                    │   AWS ALB       │  TLS terminated (ACM certificate)
                    │   (Ingress)     │  ExternalDNS → Route53
                    └──┬──────────┬───┘
                       │          │
            /api, /admin          / (all other paths)
                       │          │
           ┌───────────▼─┐  ┌─────▼───────────────┐
           │   backend   │  │      frontend        │
           │  (Django)   │  │  (React + Nginx)     │
           │   :9000     │  │      :80             │
           └──────┬──────┘  └──────────┬───────────┘
                  │  rw                │ ro
                  └────────┬───────────┘
                           │
                  ┌────────▼────────┐
                  │   EFS Volume    │  ReadWriteMany
                  │  /vol/web/media │  shared between pods
                  └─────────────────┘

           ┌─────────────────┐
           │   PostgreSQL    │  StatefulSet, 5Gi gp3 EBS
           │   :5432         │  accessed only by backend
           └─────────────────┘

           ┌─────────────────────────────────────┐
           │   Monitoring (namespace: monitoring) │
           │   Prometheus · Grafana · Loki        │
           │   Alloy (DaemonSet log collector)    │
           └─────────────────────────────────────┘
```

### Kubernetes namespaces

| Namespace | Contents |
|---|---|
| `receipts` | backend, frontend, postgres, media-pvc |
| `monitoring` | kube-prometheus-stack, Loki, Alloy |
| `argocd` | ArgoCD server and controllers |
| `kube-system` | AWS LB Controller, ExternalDNS, EBS/EFS CSI drivers, Sealed Secrets |
| `cert-manager` | cert-manager, ClusterIssuer |

### AWS resources managed by Terraform

| Resource | Purpose |
|---|---|
| VPC `10.0.0.0/16` | 2 public + 2 private subnets, eu-north-1 |
| EKS 1.33 | Managed node group: `t3.medium`, Ubuntu 22.04, 2–3 nodes |
| ALB (via LB Controller) | Internet-facing load balancer, HTTP→HTTPS redirect |
| ACM Certificate | `receipts.buechertausch.click`, DNS-validated via Route53 |
| Route53 | DNS managed by ExternalDNS from Ingress annotations |
| EFS | Shared media volume (`ReadWriteMany`) for recipe photos |
| EBS gp3 | Postgres data PVC, Loki storage |
| IAM IRSA roles | One per addon service account — no static credentials |
| Sealed Secrets | Bitnami controller; encrypts Kubernetes Secrets for Git storage |

---

## Local Development Architecture

```
                    Browser
                        │ :80
           ┌────────────▼───────────┐
           │   frontend container   │
           │   Nginx                │
           │   /api   → app:9000    │
           │   /admin → app:9000    │
           │   /static/media/ →     │
           │     alias /vol/web/    │ ← dev-media-data volume (shared)
           │   /*     → index.html  │
           └────────────────────────┘
                        │ :9000
           ┌────────────▼───────────┐
           │   app container        │
           │   Django runserver     │
           │   DEBUG=1              │
           └────────────┬───────────┘
                        │ :5432
           ┌────────────▼───────────┐
           │   db container         │
           │   PostgreSQL 17        │
           └────────────────────────┘
```

Docker Compose volumes:

| Volume | Mounted in | Purpose |
|---|---|---|
| `dev-db-data` | `db:/var/lib/postgresql/data` | Postgres data persistence |
| `dev-static-data` | `app:/vol/web/static` | Django collectstatic output |
| `dev-media-data` | `app:/vol/web/media` (rw), `frontend:/vol/web/media` (ro) | Uploaded recipe photos |

---

## Components

### Backend (`backend/`)

| Layer | Technology | Notes |
|---|---|---|
| Language | Python 3.10 | Alpine-based Docker image |
| Framework | Django 4.0 + DRF 3.13 | REST API only — no Django templates in use |
| Auth | Token authentication (DRF) | Stateless; token stored in `localStorage` on client |
| ORM | Django ORM + psycopg2 | PostgreSQL only |
| Schema | drf-spectacular 0.22 | OpenAPI 3.0; Swagger UI at `/api/docs/` |
| Image handling | Pillow 9.1 | Validation and storage of uploaded photos |
| WSGI server | Gunicorn (4 workers) | Production; `runserver` in local dev |
| Custom user model | `core.User` | Email-based auth (no username) |

### Frontend (`frontend/`)

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 | Single-page application |
| Routing | React Router DOM 6 | Client-side routing with protected routes |
| HTTP client | Axios 1.6 | Interceptors for token injection and 401 handling |
| Build tool | Vite 5 | Static build output served by Nginx |
| Server | Nginx 1.25 | Reverse proxy + SPA server; config rendered from template at startup |

### Nginx routing (production and local)

| Path | Handler | Notes |
|---|---|---|
| `/api/*` | Django backend | Proxied; `client_max_body_size 10M` |
| `/admin/*` | Django backend | Proxied |
| `/static/media/*` | Nginx `alias /vol/web/media/` | Served directly from EFS/shared volume; `^~` prevents regex override |
| `/static/*` | Django backend | Admin static assets (CSS, JS) |
| `/*` | `try_files → index.html` | SPA fallback |
| `*.js *.css *.png …` | Nginx cache headers | `Cache-Control: public, immutable; max-age=1y` |

---

## Request Flows

### 1. Authenticated request (recipe list)

```
Browser → ALB → frontend:80
  Nginx: /api/recipe/recipes/ → proxy → backend:9000
  Django: authenticate Token → filter queryset by user → serialize → JSON response
  Nginx: return response to browser
```

### 2. Photo upload

```
Browser: POST /api/recipe/recipes/{id}/upload-image/ (multipart/form-data)
  → ALB → frontend:80 → Nginx proxy (client_max_body_size 10M)
  → backend:9000
  Django: validate image (Pillow) → save to /vol/web/media/uploads/recipe/<uuid>.jpeg
  EFS: file written; immediately visible to frontend pod via shared mount
  Response: { "id": ..., "image": "/static/media/uploads/recipe/<uuid>.jpeg" }
```

### 3. Photo retrieval

```
Browser: GET /static/media/uploads/recipe/<uuid>.jpeg
  → ALB → frontend:80
  Nginx: location ^~ /static/media/ → alias /vol/web/media/
  → reads file from EFS mount → returns image
  (Django is not involved)
```

### 4. Public recipe share

```
Browser: GET /share/:id  (no auth header)
  → frontend SPA loaded
  React: GET /api/recipe/recipes/:id/share/  (AllowAny endpoint)
  → backend returns recipe data
  React: renders read-only recipe view + "Save to my collection" CTA
  (Authenticated users: POST /api/recipe/recipes/ to copy the recipe)
```

---

## Data Model

```
User ──< Recipe >── Tag
              └──< Ingredient
              └── image (nullable, stored on EFS)
```

| Model | Key fields | Notes |
|---|---|---|
| `User` | `email` (unique, USERNAME_FIELD), `name`, `is_staff` | Custom model; email-based login |
| `Recipe` | `title`, `description`, `time_minutes`, `price`, `link`, `image` | Scoped to `user`; image UUID-named |
| `Tag` | `name` | M2M with Recipe; scoped to `user`; get-or-create on recipe save |
| `Ingredient` | `name` | M2M with Recipe; scoped to `user`; get-or-create on recipe save |

All querysets are filtered by `request.user` — users see only their own data, except the `/share/` endpoint which is public.

---

## Security Model

| Concern | Implementation |
|---|---|
| API authentication | DRF Token auth; `Authorization: Token <token>` header |
| User data isolation | All querysets filtered by `request.user` |
| Kubernetes secrets | Bitnami Sealed Secrets (asymmetrically encrypted, safe in Git) |
| AWS API access | IRSA (IAM Roles for Service Accounts) — no static credentials |
| TLS | Terminated at ALB (ACM); cert-manager/Let's Encrypt for in-cluster use |
| Container security | Non-root user (`django-user`, UID 101); no home directory |
| Vulnerability scanning | Trivy `fs` scan on every release (CRITICAL severity → blocks push) |
| IMDSv2 | Enforced on all EC2 nodes (`http_tokens = required`) |
