import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth.store';

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
      </form>
    </div>
  );
}
