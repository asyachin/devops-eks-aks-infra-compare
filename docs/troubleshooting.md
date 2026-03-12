# Troubleshooting

---

## Recipe photos not displayed after upload

### Symptoms
- Photo uploads appear to succeed but images are blank on the recipe detail page.
- `GET /static/media/uploads/recipe/<uuid>.jpeg` returns 404.

### Root causes and fixes

**1. EFS volume not mounted in the frontend pod (Kubernetes)**

The backend writes files to `/vol/web/media` on the EFS volume. The frontend Nginx must mount the same PVC to serve them.

```yaml
# app/receipts/frontend/deployment.yaml
volumes:
  - name: media
    persistentVolumeClaim:
      claimName: media-pvc
containers:
  - name: frontend
    volumeMounts:
      - name: media
        mountPath: /vol/web/media
        readOnly: true
```

Verify both pods see the same files:
```bash
kubectl -n receipts exec deploy/backend  -- ls /vol/web/media/uploads/recipe/
kubectl -n receipts exec deploy/frontend -- ls /vol/web/media/uploads/recipe/
```

**2. Nginx regex location overrides the media `alias`**

Nginx evaluates `~*` regex locations before prefix locations. The rule matching static asset extensions (`jpg`, `jpeg`, `png`, …) was intercepting requests for uploaded photos before they reached the `alias` block, causing Nginx to look in `/usr/share/nginx/html/` instead.

Fix: use `^~` on the media location to prevent regex evaluation when the prefix matches.

```nginx
# frontend/nginx.conf.tpl
location ^~ /static/media/ {
    alias /vol/web/media/;
}
```

**3. Media files not served when `DEBUG=False`**

Django's built-in media serving (`django.views.static.serve`) is only active with `DEBUG=True`. In production the Nginx `alias` approach above handles it — Django is never involved in serving media files.

**4. Uploads were made before EFS was attached**

Files written to the ephemeral container filesystem before the EFS volume was mounted are lost on pod restart. Re-upload via the recipe Edit form.

---

## Upload fails silently in the Create/Edit form

### Symptoms
- Recipe is saved but no photo appears.
- No visible error in the UI.

### Cause
The image upload step runs after the recipe is saved. If `POST /api/recipe/recipes/{id}/upload-image/` fails, the recipe still exists but without a photo. The UI navigates to the recipe page and shows a warning message.

Check the network tab in browser DevTools for a 4xx/5xx response on `upload-image/`.

Common causes:
- File exceeds 10 MB limit (`client_max_body_size 10M` in Nginx)
- Invalid image format (backend validates with Pillow)
- Backend pod restarting during upload

---

## Backend pod stuck in `Init` state

The `wait-for-db` initContainer polls PostgreSQL until it responds. If it never becomes healthy:

```bash
# Check postgres pod status
kubectl -n receipts get pods
kubectl -n receipts logs postgres-0

# Check if db-credentials secret exists
kubectl -n receipts get secret db-credentials
```

The SealedSecret controller must be running for secrets to be decrypted:
```bash
kubectl -n kube-system get pods -l app.kubernetes.io/name=sealed-secrets
```
