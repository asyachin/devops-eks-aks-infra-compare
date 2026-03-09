import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recipeApi, tagApi, ingredientApi } from '../api/client';

export default function RecipeList() {
  const [recipes, setRecipes]         = useState([]);
  const [tags, setTags]               = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedTags, setSelectedTags]             = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [search, setSearch]           = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedTags.length)        params.tags        = selectedTags.join(',');
      if (selectedIngredients.length) params.ingredients = selectedIngredients.join(',');
      const [rRes, tRes, iRes] = await Promise.all([
        recipeApi.list(params),
        tagApi.list(),
        ingredientApi.list(),
      ]);
      setRecipes(rRes.data);
      setTags(tRes.data);
      setIngredients(iRes.data);
    } catch {
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTags, selectedIngredients]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await recipeApi.delete(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('Failed to delete recipe.');
    }
  };

  const toggleTag        = (id) => setSelectedTags((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleIngredient = (id) => setSelectedIngredients((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const clearFilters     = () => { setSelectedTags([]); setSelectedIngredients([]); };
  const hasFilters       = selectedTags.length > 0 || selectedIngredients.length > 0;

  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div className="container">

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>My Recipes</h1>
            <p style={s.pageSubtitle}>
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} in your collection
            </p>
          </div>
          <button onClick={() => navigate('/recipes/new')} className="btn btn-primary">
            + New recipe
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="card" style={s.filterCard}>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            style={{ maxWidth: 340 }}
          />

          {tags.length > 0 && (
            <div style={s.filterRow}>
              <span style={s.filterLabel}>Tags</span>
              <div style={s.chipList}>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`chip ${selectedTags.includes(t.id) ? 'chip-green' : 'chip-slate'}`}
                    style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div style={s.filterRow}>
              <span style={s.filterLabel}>Ingredients</span>
              <div style={s.chipList}>
                {ingredients.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => toggleIngredient(i.id)}
                    className={`chip ${selectedIngredients.includes(i.id) ? 'chip-amber' : 'chip-slate'}`}
                    style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={s.center}>
            <div className="spinner" />
            <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Loading recipes…</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} onNew={() => navigate('/recipes/new')} />
        ) : (
          <div style={s.grid} className="fade-up">
            {filtered.map((r) => (
              <RecipeCard key={r.id} recipe={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe: r, onDelete }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/recipes/${r.id}`}
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={s.cardImg}>
        {r.image ? (
          <img src={r.image} alt={r.title} style={s.img} />
        ) : (
          <div style={s.imgPlaceholder}>
            <span style={s.imgEmoji}>🍽️</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={s.cardBody}>
        <h3 style={s.cardTitle}>{r.title}</h3>

        <div style={s.cardMeta}>
          <span style={s.metaItem}>
            <ClockIcon /> {r.time_minutes} min
          </span>
          <span style={s.metaItem}>
            <DollarIcon /> ${r.price}
          </span>
        </div>

        {r.tags?.length > 0 && (
          <div style={s.cardTags}>
            {r.tags.slice(0, 3).map((t) => (
              <span key={t.id} className="chip chip-green">{t.name}</span>
            ))}
            {r.tags.length > 3 && (
              <span className="chip chip-slate">+{r.tags.length - 3}</span>
            )}
          </div>
        )}

        <div style={s.cardActions}>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/recipes/${r.id}/edit`); }}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
          >
            Edit
          </button>
          <button
            onClick={(e) => onDelete(r.id, e)}
            className="btn btn-danger btn-sm"
            style={{ flex: 1 }}
          >
            Delete
          </button>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ search, onNew }) {
  return (
    <div style={s.empty} className="fade-up">
      <div style={s.emptyIllustration}>{search ? '🔍' : '📋'}</div>
      <h3 style={s.emptyTitle}>{search ? 'No matching recipes' : 'No recipes yet'}</h3>
      <p style={s.emptyText}>
        {search
          ? `No recipes found for "${search}". Try a different search term.`
          : 'Add your first recipe and start building your collection.'}
      </p>
      {!search && (
        <button onClick={onNew} className="btn btn-primary btn-lg" style={{ marginTop: 20 }}>
          + Add your first recipe
        </button>
      )}
    </div>
  );
}

const ClockIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const DollarIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const s = {
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24, flexWrap: 'wrap', gap: 16,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
    color: 'var(--text-primary)', margin: 0,
  },
  pageSubtitle: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 },
  filterCard: {
    padding: '20px', marginBottom: 28,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  filterRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  filterLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 80, textTransform: 'uppercase', letterSpacing: '.05em' },
  chipList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))',
    gap: 20,
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: 'var(--shadow-xs)',
    transition: 'transform var(--transition), box-shadow var(--transition)',
    display: 'flex', flexDirection: 'column',
  },
  cardHover: { transform: 'translateY(-3px)', boxShadow: 'var(--shadow-md)' },
  cardImg: { height: 192, overflow: 'hidden', background: 'var(--slate-100)', flexShrink: 0 },
  img: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s ease' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--green-50) 0%, var(--green-100) 100%)',
  },
  imgEmoji: { fontSize: 52, opacity: .7 },
  cardBody: {
    padding: '16px 18px 18px',
    flex: 1, display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTitle: {
    fontSize: 16, fontWeight: 600,
    color: 'var(--text-primary)', lineHeight: 1.35,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  cardMeta: { display: 'flex', gap: 14 },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, color: 'var(--text-secondary)',
  },
  cardTags: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  cardActions: { marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 4 },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 0',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '80px 0',
  },
  emptyIllustration: { fontSize: 64, marginBottom: 20, opacity: .7 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 },
  emptyText: { fontSize: 14, color: 'var(--text-secondary)', maxWidth: 340, lineHeight: 1.6 },
};
