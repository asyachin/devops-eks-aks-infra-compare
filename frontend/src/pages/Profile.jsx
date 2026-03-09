import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/client';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password && form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    const payload = { name: form.name, email: form.email };
    if (form.password) payload.password = form.password;
    try {
      const res = await authApi.updateProfile(payload);
      updateUser(res.data);
      setSuccess('Profile updated successfully.');
      setForm((prev) => ({ ...prev, password: '', confirm: '' }));
    } catch (err) {
      const d = err.response?.data;
      if (d?.email)    setError(`Email: ${d.email[0]}`);
      else if (d?.password) setError(`Password: ${d.password[0]}`);
      else             setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="page-content">
      <div className="container-xs">
        <h1 style={s.pageTitle}>Profile settings</h1>

        <div className="card fade-up" style={{ overflow: 'hidden' }}>
          {/* Avatar header */}
          <div style={s.avatarSection}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <p style={s.avatarName}>{user?.name || '—'}</p>
              <p style={s.avatarEmail}>{user?.email}</p>
            </div>
          </div>

          <div className="divider" />

          <form onSubmit={handleSubmit} style={s.form}>
            {success && <div className="alert alert-success">{success}</div>}
            {error   && <div className="alert alert-error">{error}</div>}

            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Account details</legend>
              <div className="form-field">
                <label className="form-label">Full name</label>
                <input className="input" name="name" value={form.name} onChange={set} placeholder="Your name" />
              </div>
              <div className="form-field">
                <label className="form-label">Email address</label>
                <input className="input" type="email" name="email" value={form.email} onChange={set} required />
              </div>
            </fieldset>

            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Change password</legend>
              <p className="form-hint" style={{ marginBottom: 12 }}>Leave blank to keep your current password.</p>
              <div style={s.row}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">New password</label>
                  <input className="input" type="password" name="password" value={form.password}
                    onChange={set} placeholder="Min. 5 characters" />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Confirm new password</label>
                  <input className="input" type="password" name="confirm" value={form.confirm}
                    onChange={set} placeholder="Repeat password" />
                </div>
              </div>
            </fieldset>

            <div style={s.footer}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 },
  avatarSection: {
    display: 'flex', alignItems: 'center', gap: 18,
    padding: '24px 28px',
    background: 'var(--slate-50)',
  },
  avatar: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--green-600), var(--green-800))',
    color: '#fff', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarName: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  avatarEmail: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  form: { padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 8 },
  fieldset: {
    border: 'none', padding: 0, margin: 0,
    borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  legend: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-secondary)', marginBottom: 14, float: 'left', width: '100%' },
  row: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  footer: { paddingTop: 20, borderTop: '1px solid var(--border)', marginTop: 8, display: 'flex', justifyContent: 'flex-end' },
};
