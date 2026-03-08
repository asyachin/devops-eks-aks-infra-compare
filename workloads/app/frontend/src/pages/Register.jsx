import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 5) { setError('Password must be at least 5 characters.'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      navigate(next);
    } catch (err) {
      const d = err.response?.data;
      if (d?.email)    setError(`Email: ${d.email[0]}`);
      else if (d?.password) setError(`Password: ${d.password[0]}`);
      else             setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.panel}>
        <div style={s.panelContent}>
          <div style={s.panelIcon}>📖</div>
          <h2 style={s.panelTitle}>Start your cookbook today</h2>
          <p style={s.panelText}>
            Keep all your favourite recipes in one place — neatly organised, always accessible.
          </p>
          <div style={s.steps}>
            {[
              ['1', 'Create your free account'],
              ['2', 'Add your first recipe'],
              ['3', 'Organise with tags & ingredients'],
            ].map(([n, t]) => (
              <div key={n} style={s.step}>
                <span style={s.stepNum}>{n}</span>
                <span style={s.stepText}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div style={s.formSide}>
        <div style={s.formBox} className="fade-up">
          <Link to="/" style={s.backBrand}>
            <span>🍳</span> <strong style={{ fontFamily: 'var(--font-display)' }}>RecipeBook</strong>
          </Link>

          <h1 style={s.title}>Create your account</h1>
          <p style={s.subtitle}>Free forever. No credit card required.</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div className="form-field">
              <label className="form-label">Full name</label>
              <input className="input" name="name" value={form.name} onChange={change}
                placeholder="Your name" required autoFocus />
            </div>
            <div className="form-field">
              <label className="form-label">Email address</label>
              <input className="input" type="email" name="email" value={form.email} onChange={change}
                placeholder="you@example.com" required />
            </div>
            <div style={s.row}>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Password</label>
                <input className="input" type="password" name="password" value={form.password} onChange={change}
                  placeholder="Min. 5 characters" required />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Confirm password</label>
                <input className="input" type="password" name="confirm" value={form.confirm} onChange={change}
                  placeholder="Repeat password" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={s.footer}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh' },
  panel: {
    flex: '0 0 420px',
    background: 'linear-gradient(160deg, var(--slate-900) 0%, var(--green-900) 60%, var(--green-800) 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '48px 40px',
  },
  panelContent: { color: '#fff' },
  panelIcon: { fontSize: 48, marginBottom: 24 },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 14,
  },
  panelText: { fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: 36 },
  steps: { display: 'flex', flexDirection: 'column', gap: 16 },
  step: { display: 'flex', alignItems: 'center', gap: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(255,255,255,.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  stepText: { fontSize: 14, color: 'rgba(255,255,255,.8)' },
  formSide: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px', background: 'var(--bg)',
  },
  formBox: { width: '100%', maxWidth: 440 },
  backBrand: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 16, color: 'var(--text-primary)', marginBottom: 36,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28, fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  row: { display: 'flex', gap: 14 },
  footer: { marginTop: 24, fontSize: 13.5, color: 'var(--text-secondary)', textAlign: 'center' },
  link: { color: 'var(--green-700)', fontWeight: 600 },
};
