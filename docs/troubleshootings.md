# Troubleshooting

## Recipe photo not saving / image not displayed after upload

### Symptoms

- Uploading a photo in the recipe form appears to succeed, but the image area remains blank on the recipe detail page.
- The image URL returned by the API (e.g. `/static/media/uploads/recipe/<uuid>.jpg`) results in a 404 or empty response.
- The issue is reproducible regardless of image size or format.

### Root cause

Django's built-in media file serving is only active when `DEBUG=True`:

```python
# backend/app/urls.py
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,          # /static/media/
        document_root=settings.MEDIA_ROOT,  # /vol/web/media
    )
```

When `DEBUG=False` (or if the Django process is not handling the request), uploaded files are written to disk at `/vol/web/media/` but the URL is never served — Nginx had no route to that directory.

Additionally, the `dev-media-data` Docker volume was only mounted into the `app` (Django) container, so Nginx (running in the `frontend` container) could not access the uploaded files at all.

### Fix

**1. Mount the media volume into the Nginx container (`docker-compose.yml`)**

```yaml
frontend:
  volumes:
    - dev-media-data:/vol/web/media:ro   # read-only — Nginx only serves, never writes
```

**2. Serve `/static/media/` directly from disk in Nginx (`frontend/nginx.conf.tpl`)**

Add a dedicated `location` block **before** the generic `/static` proxy block so Nginx handles media files itself without involving Django:

```nginx
# Media files served directly by Nginx from the shared volume
location /static/media/ {
    alias /vol/web/media/;
}

# Other static files (admin CSS/JS, etc.) proxied to Django
location /static {
    proxy_pass http://${APP_HOST}:${APP_PORT};
}
```

Nginx uses longest-prefix matching, so `/static/media/` takes priority over `/static`.

**3. Fix incorrect `required` type in `RecipeImageSerializer` (`backend/recipe/serializers.py`)**

```python
# Before (string — accidentally truthy, but semantically wrong)
extra_kwargs = {'image': {'required': 'True'}}

# After (boolean)
extra_kwargs = {'image': {'required': True}}
```

**4. Handle photo upload failure separately in `RecipeForm.jsx`**

Previously, if the image upload failed after a recipe was created, the error was swallowed into a generic message and navigation was blocked. Now:

- The recipe is saved first.
- If the image upload fails, the user is navigated to the recipe page anyway, with a clear message explaining that the recipe was saved but the photo upload failed and can be retried via Edit.

```jsx
if (imageFile) {
  try {
    await uploadImage(recipeId, imageFile);
  } catch (imgErr) {
    setError(imgErr.message);
    navigate(`/recipes/${recipeId}`);
    return;
  }
}
```

### Applying the fix

Rebuild and restart the containers after these changes:

```bash
docker compose down && docker compose up --build
```

### Verification

1. Open the app and create or edit a recipe.
2. Upload a photo and save.
3. The photo should appear immediately on the recipe detail page.
4. Restart the `app` container with `DEBUG=0` — images should still load (served by Nginx, not Django).
