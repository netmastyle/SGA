import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse, Item } from '../api/types';

function CreateItemModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [family, setFamily] = useState('');
  const [baseUnit, setBaseUnit] = useState('UNIT');
  const [lotControlled, setLotControlled] = useState(false);
  const [expiryControlled, setExpiryControlled] = useState(false);
  const [serialControlled, setSerialControlled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.post('/items', {
        sku,
        name,
        family: family || undefined,
        baseUnit,
        lotControlled,
        expiryControlled,
        serialControlled,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al crear el artículo';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <form
        className="card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ width: 420, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <h2 style={{ fontSize: 18 }}>Nuevo artículo</h2>

        <label style={{ fontSize: 13 }}>SKU</label>
        <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} required />

        <label style={{ fontSize: 13 }}>Nombre</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />

        <label style={{ fontSize: 13 }}>Familia</label>
        <input className="input" value={family} onChange={(e) => setFamily(e.target.value)} />

        <label style={{ fontSize: 13 }}>Unidad base</label>
        <input className="input" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} />

        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={lotControlled} onChange={(e) => setLotControlled(e.target.checked)} />
            Lote
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={expiryControlled} onChange={(e) => setExpiryControlled(e.target.checked)} />
            Caducidad
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={serialControlled}
              onChange={(e) => setSerialControlled(e.target.checked)}
            />
            Nº de serie
          </label>
        </div>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Guardando…' : 'Crear'}
          </button>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function Items() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function reload() {
    setLoading(true);
    apiClient.get<ApiResponse<Item[]>>('/items', { params: { pageSize: 200 } }).then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>Artículos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo artículo</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Familia</th>
                <th>Unidad</th>
                <th>Control</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.family ?? '—'}</td>
                  <td>{item.baseUnit}</td>
                  <td>
                    {item.lotControlled && <span className="badge badge-muted" style={{ marginRight: 4 }}>Lote</span>}
                    {item.expiryControlled && <span className="badge badge-muted" style={{ marginRight: 4 }}>Caducidad</span>}
                    {item.serialControlled && <span className="badge badge-muted">Nº serie</span>}
                  </td>
                  <td>
                    <span className={`badge ${item.active ? 'badge-success' : 'badge-muted'}`}>
                      {item.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Sin artículos todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CreateItemModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}
