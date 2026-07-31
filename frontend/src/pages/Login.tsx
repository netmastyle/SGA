import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth.store';

const DEMO_USERS = [
  { label: 'Administrador', email: 'admin@sga-demo.local', password: 'Admin123!' },
  { label: 'Auditor', email: 'auditor@sga-demo.local', password: 'Auditor123!' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@sga-demo.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = res.data.data;
      setTokens(accessToken, refreshToken);
      navigate('/');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err as any).response?.data?.error?.message ?? 'Error al iniciar sesión'
        : 'Error al iniciar sesión';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #161c25, #0b0f14)',
      }}
    >
      <form onSubmit={handleSubmit} className="card" style={{ width: 360, padding: 32 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>SGA / WMS</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
          Sistema de Gestión de Almacenes
        </p>

        <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Contraseña</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 20 }}
        />

        {error && (
          <div
            style={{
              color: 'var(--color-danger)',
              fontSize: 13,
              marginBottom: 16,
              background: 'rgba(239,68,68,0.1)',
              padding: '8px 12px',
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Usuarios de prueba
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword(u.password); }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: 12,
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{u.label}</span>
                <span>{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
