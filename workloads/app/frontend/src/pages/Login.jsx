import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(next);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left panel — decorative */}
      <div style={s.panel}>
        <div style={s.panelContent}>
          <div style={s.panelIcon}>🍳</div>
          <h2 style={s.panelTitle}>Your personal recipe collection</h2>
          <p style={s.panelText}>
            Store, organise, and discover recipes tailored to your taste.
          </p>
          <div style={s.features}>
            {['Create & edit recipes', 'Filter by tags & ingredients', 'Upload recipe photos', 'Manage your cookbook'].map((f) => (
              <div key={f} style={s.feature}>
                <span style={s.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={s.formSide}>
        <div style={s.formBox} className="fade-up">
          <Link to="/" style={s.backBrand}>
            <span>🍳</span> <strong style={{ fontFamily: 'var(--font-display)' }}>RecipeBook</strong>
          </Link>

          <h1 style={s.title}>Welcome back</h1>
          <p style={s.subtitle}>Sign in to your account</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div className="form-field">
              <label className="form-label">Email address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={s.footer}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={s.link}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  },
  panel: {
    flex: '0 0 420px',
    background: 'linear-gradient(160deg, var(--slate-900) 0%, var(--green-900) 60%, var(--green-800) 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '48px 40px',
    '@media (max-width: 768px)': { display: 'none' },
  },
  panelContent: { color: '#fff' },
  panelIcon: { fontSize: 48, marginBottom: 24 },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 14,
    color: '#fff',
  },
  panelText: {
    fontSize: 15,
    color: 'rgba(255,255,255,.65)',
    lineHeight: 1.7,
    marginBottom: 32,
  },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,.8)',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--green-400, #4ade80)',
    flexShrink: 0,
  },
  formSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    background: 'var(--bg)',
  },
  formBox: {
    width: '100%',
    maxWidth: 400,
  },
  backBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    color: 'var(--text-primary)',
    marginBottom: 36,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginBottom: 28,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  footer: {
    marginTop: 24,
    fontSize: 13.5,
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  link: {
    color: 'var(--green-700)',
    fontWeight: 600,
  },
};
