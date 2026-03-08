import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recipeApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function SharePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [recipe, setRecipe]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    recipeApi.getPublic(id)
      .then((res) => setRecipe(res.data))
      .catch(() => setError('Recipe not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!token) {
      navigate(`/login?next=/share/${id}`);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title:        recipe.title,
        description:  recipe.description || '',
        time_minutes: recipe.time_minutes,
        price:        recipe.price,
        link:         recipe.link || '',
        tags:         (recipe.tags || []).map((t) => ({ name: t.name })),
        ingredients:  (recipe.ingredients || []).map((i) => ({ name: i.name })),
      };
      const res = await recipeApi.create(payload);
      setSaved(true);
      setTimeout(() => navigate(`/recipes/${res.data.id}`), 1200);
    } catch {
      setSaving(false);
      alert('Failed to save recipe. Please try again.');
    }
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.centerWrap}><div className="spinner" /></div>
    </div>
  );

  if (error) return (
    <div style={s.page}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🔗</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 10 }}>
          Link unavailable
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>{error}</p>
        <Link to="/" className="btn btn-primary">Go to my recipes</Link>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Top notice banner */}
        <div style={s.banner}>
          <div style={s.bannerLeft}>
            <span style={s.bannerIcon}>🔗</span>
            <div>
              <p style={s.bannerTitle}>Someone shared a recipe with you</p>
              <p style={s.bannerSub}>Save it to your collection to edit and manage it.</p>
            </div>
          </div>
          <div style={s.bannerActions}>
            {saved ? (
              <span style={s.savedBadge}>✓ Saved!</span>
            ) : (
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={saving}
                style={{ minWidth: 160 }}
              >
                {saving ? 'Saving…' : token ? '+ Save to my collection' : '🔒 Sign in to save'}
              </button>
            )}
          </div>
        </div>

        {/* Recipe card */}
        <div className="card fade-up" style={{ overflow: 'hidden' }}>

          {/* Hero */}
          <div style={s.hero}>
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} style={s.heroImg} />
            ) : (
              <div style={s.heroPlaceholder}>
                <span style={{ fontSize: 80, opacity: .45 }}>🍽️</span>
              </div>
            )}
            <div style={s.heroBadge}>Shared recipe</div>
          </div>

          {/* Content */}
          <div style={s.content}>
            <h1 style={s.title}>{recipe.title}</h1>

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

            {recipe.description && (
              <Section title="Description">
                <p style={s.description}>{recipe.description}</p>
              </Section>
            )}

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

            {recipe.tags?.length > 0 && (
              <Section title="Tags">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {recipe.tags.map((t) => (
                    <span key={t.id} className="chip chip-green">{t.name}</span>
                  ))}
                </div>
              </Section>
            )}

            {/* Bottom CTA */}
            <div style={s.bottomCta}>
              {saved ? (
                <span style={s.savedBadge}>✓ Recipe saved to your collection!</span>
              ) : (
                <>
                  <p style={s.ctaText}>
                    {token
                      ? 'Like this recipe? Save a copy to your collection.'
                      : 'Create a free account to save this recipe and build your own cookbook.'}
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {!token && (
                      <Link to={`/register?next=/share/${id}`} className="btn btn-secondary">
                        Create account
                      </Link>
                    )}
                    <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : token ? '+ Save to my collection' : '🔒 Sign in to save'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {token && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              ← Back to my recipes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-secondary)', marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function MetaBadge({ icon, label }) {
  return (
    <span style={s.metaBadge}>{icon} {label}</span>
  );
}

const ClockIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const DollarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const s = {
  page:      { background: 'var(--bg)', minHeight: 'calc(100vh - var(--header-h))' },
  container: { maxWidth: 720, margin: '0 auto', padding: '32px 24px' },
  centerWrap: { display: 'flex', justifyContent: 'center', paddingTop: 80 },

  banner: {
    background: 'var(--slate-900)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 24px',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  bannerLeft:  { display: 'flex', alignItems: 'center', gap: 14 },
  bannerIcon:  { fontSize: 28, flexShrink: 0 },
  bannerTitle: { color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 },
  bannerSub:   { color: 'rgba(255,255,255,.55)', fontSize: 13, marginTop: 2 },
  bannerActions: { flexShrink: 0 },
  savedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--green-100)', color: 'var(--green-800)',
    padding: '8px 16px', borderRadius: 'var(--radius-full)',
    fontSize: 14, fontWeight: 600,
  },

  hero:        { position: 'relative', height: 320, background: 'var(--slate-100)' },
  heroImg:     { width: '100%', height: '100%', objectFit: 'cover' },
  heroPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--green-50), var(--green-100))',
  },
  heroBadge: {
    position: 'absolute', top: 14, left: 14,
    background: 'rgba(15,23,42,.7)', backdropFilter: 'blur(6px)',
    color: 'rgba(255,255,255,.9)', fontSize: 12, fontWeight: 600,
    padding: '4px 12px', borderRadius: 'var(--radius-full)',
    textTransform: 'uppercase', letterSpacing: '.05em',
  },

  content:     { padding: '28px 32px 32px' },
  title:       { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 14 },
  metaRow:     { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaBadge:   {
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
  ingredientItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-primary)' },
  bullet: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green-500)', flexShrink: 0 },

  bottomCta: {
    marginTop: 28,
    paddingTop: 24,
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  ctaText: { fontSize: 14, color: 'var(--text-secondary)', margin: 0 },
};
