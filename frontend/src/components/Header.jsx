import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => pathname === path;

  return (
    <header style={s.root}>
      <div style={s.inner}>
        {/* Brand */}
        <Link to="/" style={s.brand}>
          <span style={s.brandIcon}>🍳</span>
          <span style={s.brandName}>RecipeBook</span>
        </Link>

        {/* Nav */}
        {user && (
          <nav style={s.nav}>
            <Link to="/" style={{ ...s.navLink, ...(isActive('/') ? s.navActive : {}) }}>
              Recipes
            </Link>
            <Link to="/profile" style={{ ...s.navLink, ...(isActive('/profile') ? s.navActive : {}) }}>
              Profile
            </Link>
          </nav>
        )}

        {/* Right side */}
        {user ? (
          <div style={s.right}>
            <span style={s.email}>{user.name || user.email}</span>
            <button onClick={handleLogout} style={s.logoutBtn} className="btn btn-sm">
              Sign out
            </button>
          </div>
        ) : (
          <div style={s.right}>
            <Link to="/login" style={s.signInLink}>Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ background: 'var(--green-500)' }}>
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

const s = {
  root: {
    background: 'var(--slate-900)',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    height: 'var(--header-h)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    flexShrink: 0,
  },
  brandIcon: { fontSize: 22 },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: 19,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-.3px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  navLink: {
    padding: '5px 12px',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,.65)',
    transition: 'color var(--transition), background var(--transition)',
    textDecoration: 'none',
  },
  navActive: {
    color: '#fff',
    background: 'rgba(255,255,255,.1)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,.5)',
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,.08)',
    border: '1px solid rgba(255,255,255,.12)',
    color: 'rgba(255,255,255,.8)',
    padding: '5px 13px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background var(--transition)',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,.65)',
    padding: '5px 12px',
  },
};
