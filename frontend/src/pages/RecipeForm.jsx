import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recipeApi } from '../api/client';

const EMPTY = {
  title: '', description: '', time_minutes: '', price: '', link: '',
  tags: [], ingredients: [],
};

export default function RecipeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm]           = useState(EMPTY);
  const [tagInput, setTagInput]   = useState('');
  const [ingInput, setIngInput]   = useState('');
  const [loading, setLoading]     = useState(isEdit);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Image state
  const [currentImage, setCurrentImage] = useState(null); // existing image URL (edit mode)
  const [imageFile, setImageFile]       = useState(null); // new file selected by user
  const [imagePreview, setImagePreview] = useState(null); // local object URL for preview
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!isEdit) return;
    recipeApi.get(id)
      .then((res) => {
        const d = res.data;
        setForm({
          title:        d.title        || '',
          description:  d.description  || '',
          time_minutes: d.time_minutes ?? '',
          price:        d.price        ?? '',
          link:         d.link         || '',
          tags:         d.tags         || [],
          ingredients:  d.ingredients  || [],
        });
        if (d.image) setCurrentImage(d.image);
      })
      .catch(() => setError('Failed to load recipe.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Revoke object URL on unmount to free memory
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files[0]);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (recipeId, file) => {
    setUploadingImg(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await recipeApi.uploadImage(recipeId, fd);
      setCurrentImage(res.data.image);
    } catch {
      throw new Error('Recipe saved, but photo upload failed. You can re-upload the photo by editing the recipe.');
    } finally {
      setUploadingImg(false);
    }
  };

  const addTag = () => {
    const name = tagInput.trim();
    if (!name || form.tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) { setTagInput(''); return; }
    setForm({ ...form, tags: [...form.tags, { name }] });
    setTagInput('');
  };
  const removeTag = (i) => setForm({ ...form, tags: form.tags.filter((_, idx) => idx !== i) });

  const addIng = () => {
    const name = ingInput.trim();
    if (!name || form.ingredients.some((i) => i.name.toLowerCase() === name.toLowerCase())) { setIngInput(''); return; }
    setForm({ ...form, ingredients: [...form.ingredients, { name }] });
    setIngInput('');
  };
  const removeIng = (i) => setForm({ ...form, ingredients: form.ingredients.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      title:        form.title,
      description:  form.description,
      time_minutes: parseInt(form.time_minutes, 10),
      price:        parseFloat(form.price).toFixed(2),
      link:         form.link,
      tags:         form.tags.map((t) => ({ name: t.name })),
      ingredients:  form.ingredients.map((i) => ({ name: i.name })),
    };
    try {
      let recipeId = id;
      if (isEdit) {
        await recipeApi.update(id, payload);
      } else {
        const res = await recipeApi.create(payload);
        recipeId = res.data.id;
      }

      if (imageFile) {
        try {
          await uploadImage(recipeId, imageFile);
        } catch (imgErr) {
          setError(imgErr.message);
          navigate(`/recipes/${recipeId}`);
          return;
        }
      }

      navigate(`/recipes/${recipeId}`);
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        setError(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · '));
      } else {
        setError('Could not save recipe. Please check the fields and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" />
    </div>
  );

  const displayImage = imagePreview || currentImage;

  return (
    <div className="page-content">
      <div className="container-sm">
        <Link to={isEdit ? `/recipes/${id}` : '/'} style={s.back}>
          ← {isEdit ? 'Back to recipe' : 'All recipes'}
        </Link>

        <div className="card" style={s.card}>
          <div style={s.cardHeader}>
            <h1 style={s.title}>{isEdit ? 'Edit recipe' : 'New recipe'}</h1>
            <p style={s.subtitle}>
              {isEdit ? 'Update the details below.' : 'Fill in the details to add a recipe to your collection.'}
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ margin: '0 28px 20px' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>

            {/* ── Photo ── */}
            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Photo</legend>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleImageSelect(e.target.files[0])}
              />

              {displayImage ? (
                /* Image preview */
                <div style={s.previewWrap}>
                  <img src={displayImage} alt="Recipe preview" style={s.previewImg} />
                  <div style={s.previewActions}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      style={s.previewBtn}
                    >
                      📷 Change photo
                    </button>
                    {imageFile && (
                      <button type="button" onClick={clearImage} style={{ ...s.previewBtn, background: 'rgba(220,38,38,.7)' }}>
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  {imageFile && (
                    <div style={s.previewBadge}>New photo selected — will be saved on submit</div>
                  )}
                </div>
              ) : (
                /* Drop zone */
                <div
                  style={s.dropZone}
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  <div style={s.dropIcon}>🖼️</div>
                  <p style={s.dropTitle}>Click to upload or drag & drop</p>
                  <p style={s.dropHint}>PNG, JPG, WebP — max 10 MB</p>
                </div>
              )}

              {uploadingImg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Uploading photo…
                </div>
              )}
            </fieldset>

            {/* ── Basic info ── */}
            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Basic information</legend>
              <div style={s.grid2}>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Recipe name <Req /></label>
                  <input className="input" name="title" value={form.title} onChange={set}
                    placeholder="e.g. Classic Carbonara" required autoFocus />
                </div>

                <div className="form-field">
                  <label className="form-label">Cooking time (minutes) <Req /></label>
                  <input className="input" type="number" name="time_minutes" value={form.time_minutes}
                    onChange={set} placeholder="30" min="1" required />
                </div>
                <div className="form-field">
                  <label className="form-label">Estimated cost ($) <Req /></label>
                  <input className="input" type="number" name="price" value={form.price}
                    onChange={set} placeholder="5.00" min="0" step="0.01" required />
                </div>

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Source URL</label>
                  <input className="input" name="link" value={form.link} onChange={set}
                    placeholder="https://example.com/recipe" />
                  <span className="form-hint">Optional link to the original recipe</span>
                </div>
              </div>
            </fieldset>

            {/* ── Description ── */}
            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Description</legend>
              <div className="form-field">
                <textarea className="input" name="description" value={form.description} onChange={set}
                  placeholder="Describe the recipe — method, tips, serving suggestions…"
                  rows={5} style={{ resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            </fieldset>

            {/* ── Tags ── */}
            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Tags</legend>
              {form.tags.length > 0 && (
                <div style={s.chipList}>
                  {form.tags.map((t, i) => (
                    <span key={i} className="chip chip-green">
                      {t.name}
                      <button type="button" onClick={() => removeTag(i)} className="chip-remove">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={s.addRow}>
                <input
                  className="input" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Type a tag and press Enter"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={addTag} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Add</button>
              </div>
            </fieldset>

            {/* ── Ingredients ── */}
            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Ingredients</legend>
              {form.ingredients.length > 0 && (
                <div style={s.chipList}>
                  {form.ingredients.map((ing, i) => (
                    <span key={i} className="chip chip-amber">
                      {ing.name}
                      <button type="button" onClick={() => removeIng(i)} className="chip-remove">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={s.addRow}>
                <input
                  className="input" value={ingInput}
                  onChange={(e) => setIngInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIng(); } }}
                  placeholder="Type an ingredient and press Enter"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={addIng} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Add</button>
              </div>
            </fieldset>

            {/* ── Footer ── */}
            <div style={s.formFooter}>
              <Link to={isEdit ? `/recipes/${id}` : '/'} className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={saving || uploadingImg}>
                {saving ? (imageFile ? 'Saving & uploading…' : 'Saving…') : isEdit ? 'Save changes' : 'Create recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const Req = () => <span style={{ color: 'var(--red-500)' }}>*</span>;

const s = {
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--green-700)', marginBottom: 20, textDecoration: 'none' },
  card: { overflow: 'hidden' },
  cardHeader: { padding: '28px 28px 0', borderBottom: '1px solid var(--border)', paddingBottom: 22 },
  title: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: 'var(--text-secondary)' },
  form: { padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 8 },
  fieldset: {
    border: 'none', padding: 0, margin: 0,
    borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  legend: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-secondary)', marginBottom: 14, float: 'left', width: '100%' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  chipList: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  addRow: { display: 'flex', gap: 10, alignItems: 'center' },

  /* Drop zone */
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '36px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer',
    transition: 'border-color var(--transition), background var(--transition)',
    background: 'var(--slate-50)',
    textAlign: 'center',
  },
  dropIcon: { fontSize: 40, opacity: .6, marginBottom: 4 },
  dropTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  dropHint: { fontSize: 12, color: 'var(--text-secondary)' },

  /* Preview */
  previewWrap: { position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' },
  previewImg: { width: '100%', height: 260, objectFit: 'cover', display: 'block' },
  previewActions: { position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 8 },
  previewBtn: {
    background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,.2)', color: '#fff',
    padding: '6px 12px', borderRadius: 'var(--radius)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
  previewBadge: {
    position: 'absolute', top: 10, left: 10,
    background: 'rgba(22,163,74,.9)', color: '#fff',
    fontSize: 12, fontWeight: 500, padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
  },

  formFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 20, marginTop: 8, borderTop: '1px solid var(--border)' },
};
