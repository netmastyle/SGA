import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/warehouses', label: 'Almacenes' },
  { to: '/items', label: 'Artículos' },
  { to: '/containers', label: 'Contenedores' },
  { to: '/serial-numbers', label: 'Nº de serie' },
  { to: '/inventory', label: 'Inventario' },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const isAdmin = hasPermission('role.manage');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside
        style={{
          width: 220,
          background: 'var(--color-bg-elevated)',
          borderRight: '1px solid var(--color-border)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 32, padding: '0 8px' }}>
          SGA / WMS
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '10px 12px',
                borderRadius: 8,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                background: isActive ? 'var(--color-bg-card)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 4px' }}>
            Documentación
          </p>
          <NavLink
            to="/docs/manual"
            style={({ isActive }) => ({
              display: 'block',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              background: isActive ? 'var(--color-bg-card)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              marginBottom: 2,
            })}
          >
            📖 Manual de usuario
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/docs/api"
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                background: isActive ? 'var(--color-bg-card)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                marginBottom: 12,
              })}
            >
              🔌 Referencia API
            </NavLink>
          )}
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            {user?.email}
          </div>
          <button className="btn" style={{ width: '100%' }} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, overflow: 'auto', minWidth: 0, height: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
