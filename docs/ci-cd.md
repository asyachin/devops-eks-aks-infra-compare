# CI/CD Pipeline

## Overview

The pipeline covers three scenarios:

| Event | Workflows triggered | Result |
|---|---|---|
| `git push` → `dev` | test → lint → build-push | Image pushed to Docker Hub with `sha` tag |
| Pull Request → `main` | test + lint (parallel) | Gate check only, no push |
| `git tag v*` or manual | test → release | Image pushed with semantic version tag |

---

## Branch Strategy

```
feature/xxx  ──┐
               ├──► dev ──► [CI: test + build-push] ──► main ──► [PR check]
bugfix/xxx  ───┘
```

- **`dev`** — integration branch; every push triggers tests and pushes a dev image
- **`main`** — production-ready code; merges require passing tests and lint via PR
- **tags `v*`** — trigger a versioned release build for deployment

---

## Workflow Files

```
.github/workflows/
├── ci.yml           # Entry point: push→dev / PR→main
├── test.yml         # Reusable: runs Django tests in Docker Compose
├── lint.yml         # Reusable: runs flake8 natively (fast, no Docker)
├── build-push.yml   # Reusable: builds and pushes images with sha tag
└── release.yml      # Versioned release: tag push or manual dispatch
```

### ci.yml — Entry point

Triggered on:
- `push` to `dev` → runs tests, lint (parallel) → if tests pass, pushes images
- `pull_request` to `main` → runs tests and lint only (no push)

```
push → dev
  ├─ test ──────────────────────────────────────► [pass] → build-push (sha tag)
  └─ lint ──────────────────────────────────────► [pass/fail: doesn't block push]

PR → main
  ├─ test ──────────────────────────────────────► required check
  └─ lint ──────────────────────────────────────► required check
```

### test.yml — Tests

- Builds the backend Docker image using **GHA layer cache** (fast on repeat runs)
- Starts PostgreSQL via `docker compose`
- Waits for DB readiness (`wait_for_db`), runs migrations, then `manage.py test`

### lint.yml — Lint

- Runs **natively** (no Docker build) using `actions/setup-python`
- Caches pip packages by `requirements.dev.txt` hash
- Uses `.flake8` config from `backend/`
- Typical runtime: **~15 seconds** vs ~3 minutes in Docker

### build-push.yml — Dev image push

- Tags: `<username>/recipebook-app:<sha>` + `latest`
- No dev dependencies in the image (`DEV=false` by default)
- Uses GHA cache — instant build if Dockerfile/requirements unchanged

### release.yml — Versioned release

- Tags: `<username>/recipebook-app:<version>` + `latest`
- Runs tests before pushing (gate)
- `concurrency: cancel-in-progress: false` — never cancels a release in progress
- Triggered by git tag or manual dispatch

---

## Secrets Setup

Go to **GitHub → Repository → Settings → Secrets and variables → Actions**

| Secret | Description | How to get |
|---|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub login | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token | [hub.docker.com → Account Settings → Security → New Access Token](https://hub.docker.com/settings/security) |

> **Important:** Use an **Access Token**, not your password. Tokens can be revoked without changing your password.

---

## Dev Workflow

```bash
# 1. Work on a feature
git checkout -b feature/my-feature
# ... make changes ...

# 2. Push to dev (triggers CI: test + lint + build-push)
git checkout dev
git merge feature/my-feature
git push origin dev

# 3. Images pushed to Docker Hub:
#    u745/recipebook-app:a3f9c12d...
#    u745/recipebook-app:latest
```

---

## Release Workflow

### Option A: Git Tag (recommended)

```bash
# 1. Make sure dev is stable and merged to main
git checkout main
git merge dev
git push origin main

# 2. Create and push a semantic version tag
git tag v1.2.3
git push origin v1.2.3

# 3. GitHub Actions runs release.yml:
#    - Runs tests
#    - Pushes u745/recipebook-app:v1.2.3
#    - Pushes u745/recipebook-app:latest
```

### Option B: Manual Dispatch

1. Go to **GitHub → Actions → Release → Run workflow**
2. Enter version (e.g., `v1.2.3`)
3. Click **Run workflow**

---

## ArgoCD Integration

ArgoCD tracks the image tag in your Helm values or Kubernetes manifest.

### Helm values example (`values.yaml`)

```yaml
app:
  image:
    repository: u745/recipebook-app
    tag: v1.2.3        # ← update this to deploy a new version

frontend:
  image:
    repository: u745/recipebook-frontend
    tag: v1.2.3
```

### Deploy a new version

```bash
# Update the image tag in your GitOps repo
# ArgoCD detects the change and syncs automatically
sed -i 's/tag: v1.2.2/tag: v1.2.3/' helm/values.yaml
git commit -m "chore: bump image to v1.2.3"
git push
```

### Rollback

```bash
# Revert the image tag in your GitOps repo
sed -i 's/tag: v1.2.3/tag: v1.2.2/' helm/values.yaml
git commit -m "revert: rollback to v1.2.2"
git push
# ArgoCD redeploys the previous version within seconds
```

Or via ArgoCD CLI:

```bash
argocd app set recipebook --helm-set app.image.tag=v1.2.2
argocd app sync recipebook
```

---

## Docker Hub Image Tags Reference

| Tag format | Source | Use case |
|---|---|---|
| `v1.2.3` | Git tag / manual release | **Production / ArgoCD** |
| `a3f9c12...` (40-char sha) | Every push to `dev` | Dev environment / debugging |
| `latest` | Last successful push | Quick testing only — never use in production |

---

## Cache Strategy

```
First run:   Dockerfile layers built → saved to GitHub Actions Cache
Next runs:   Layers restored from cache → pip install skipped → 3x faster

Cache invalidated when:
  - backend/Dockerfile changes
  - backend/requirements.txt changes
  - backend/requirements.dev.txt changes
```

Lint uses a separate pip cache keyed by `requirements.dev.txt` hash.

---

## Adding a New Service

1. Add a `Dockerfile` for the new service
2. Add a build step in `build-push.yml` and `release.yml`
3. Add the service to `docker-compose.yml` with an `image:` field

```yaml
# build-push.yml / release.yml — add:
- name: Build and push <service>
  uses: docker/build-push-action@v6
  with:
    context: ./<service>
    push: true
    tags: |
      ${{ secrets.DOCKERHUB_USERNAME }}/recipebook-<service>:${{ github.sha }}
      ${{ secrets.DOCKERHUB_USERNAME }}/recipebook-<service>:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
