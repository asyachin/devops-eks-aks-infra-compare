import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recipeApi } from '../api/client';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [uploading, setUploading]       = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [copied, setCopied]             = useState(false);
  const fileRef = useRef();

  const handleShare = async () => {
    const url = `${window.location.origin}/share/${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback for browsers that block clipboard without HTTPS
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    recipeApi.get(id)
      .then((res) => setRecipe(res.data))
      .catch(() => setError('Recipe not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return;
    await recipeApi.delete(id);
    navigate('/');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await recipeApi.uploadImage(id, fd);
      setRecipe((prev) => ({ ...prev, image: res.data.image }));
      setUploadStatus('success');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch {
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader />;
  if (error)   return (
    <div className="page-content">
      <div className="container-sm">
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
        <Link to="/" style={{ color: 'var(--green-700)', fontWeight: 600, fontSize: 14 }}>← Back to recipes</Link>
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="container-sm">
        {/* Back link */}
        <Link to="/" style={s.back}>← All recipes</Link>

        {/* Main card */}
        <div className="card fade-up" style={{ overflow: 'hidden' }}>

          {/* Hero image */}
          <div style={s.hero}>
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} style={s.heroImg} />
            ) : (
              <div style={s.heroPlaceholder}>
                <span style={s.heroEmoji}>🍽️</span>
              </div>
            )}

            {/* Upload overlay */}
            <div style={s.heroOverlay}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current.click()} style={s.uploadBtn} disabled={uploading}>
                {uploading ? '⏳ Uploading…' : recipe.image ? '📷 Change photo' : '📷 Add photo'}
              </button>
              {uploadStatus === 'success' && <span style={s.uploadMsg(true)}>✓ Photo updated</span>}
              {uploadStatus === 'error'   && <span style={s.uploadMsg(false)}>Failed to upload</span>}
            </div>
          </div>

          {/* Content */}
          <div style={s.content}>

            {/* Title + actions */}
            <div style={s.titleRow}>
              <h1 style={s.title}>{recipe.title}</h1>
              <div style={s.actions}>
                <button onClick={handleShare} className="btn btn-secondary btn-sm" style={copied ? { color: 'var(--green-700)', borderColor: 'var(--green-200)' } : {}}>
                  {copied ? '✓ Link copied!' : '🔗 Share'}
                </button>
                <button onClick={() => navigate(`/recipes/${id}/edit`)} className="btn btn-secondary btn-sm">
                  ✏️ Edit
                </button>
                <button onClick={handleDelete} className="btn btn-danger btn-sm">
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Meta badges */}
            <div style={s.metaRow}>
              <MetaBadge icon={<ClockIcon />} label={`${recipe.time_minutes} min`} />
              <MetaBadge icon={<DollarIcon />} label={`$${recipe.price}`} />
              {recipe.link && (
                <a href={recipe.link} target="_blank" rel="noopener noreferrer" style={s.linkBadge}>
                  🔗 Source
                </a>
              )}
            </div>

            <div className="divider" style={{ margin: '20px 0' }} />

            {/* Description */}
            {recipe.description && (
              <Section title="Description">
                <p style={s.description}>{recipe.description}</p>
              </Section>
            )}

            {/* Ingredients */}
            {recipe.ingredients?.length > 0 && (
              <Section title="Ingredients">
                <ul style={s.ingredientList}>
                  {recipe.ingredients.map((i) => (
                    <li key={i.id} style={s.ingredientItem}>
                      <span style={s.bullet} />
                      {i.name}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Tags */}
            {recipe.tags?.length > 0 && (
              <Section title="Tags">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {recipe.tags.map((t) => (
                    <span key={t.id} className="chip chip-green">{t.name}</span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-secondary)', marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function MetaBadge({ icon, label }) {
  return (
    <span style={s.metaBadge}>
      {icon} {label}
    </span>
  );
}

function Loader() {
  return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" />
    </div>
  );
}

const ClockIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const DollarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const s = {
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13.5, fontWeight: 600, color: 'var(--green-700)',
    marginBottom: 20, textDecoration: 'none',
  },
  hero: { position: 'relative', height: 340, background: 'var(--slate-100)' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--green-50), var(--green-100))',
  },
  heroEmoji: { fontSize: 80, opacity: .5 },
  heroOverlay: {
    position: 'absolute', bottom: 14, right: 16,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  uploadBtn: {
    background: 'rgba(15,23,42,.65)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,.2)',
    color: '#fff',
    padding: '7px 14px',
    borderRadius: 'var(--radius)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  uploadMsg: (ok) => ({
    background: ok ? 'rgba(22,163,74,.9)' : 'rgba(220,38,38,.9)',
    color: '#fff', fontSize: 13, padding: '7px 12px',
    borderRadius: 'var(--radius)',
    backdropFilter: 'blur(4px)',
  }),
  content: { padding: '28px 32px 32px' },
  titleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 16, marginBottom: 16, flexWrap: 'wrap',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1,
  },
  actions: { display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px',
    background: 'var(--slate-100)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-full)',
    fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500,
  },
  linkBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px',
    background: 'var(--green-50)', border: '1px solid var(--green-200)',
    borderRadius: 'var(--radius-full)',
    fontSize: 13, color: 'var(--green-700)', fontWeight: 500,
    textDecoration: 'none',
  },
  description: { fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.75 },
  ingredientList: { listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 24px' },
  ingredientItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 14, color: 'var(--text-primary)',
  },
  bullet: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--green-500)', flexShrink: 0,
  },
};
