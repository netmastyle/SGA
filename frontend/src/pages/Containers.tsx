import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse, HandlingUnit, Location, Warehouse } from '../api/types';

const TYPE_LABEL: Record<string, string> = {
  PALLET: 'Palet',
  BOX: 'Caja',
  CONTAINER: 'Contenedor',
  OTHER: 'Otro',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado',
  SHIPPED: 'Expedido',
  BLOCKED: 'Bloqueado',
  QUARANTINE: 'Cuarentena',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success',
  CLOSED: 'badge-muted',
  SHIPPED: 'badge-muted',
  BLOCKED: 'badge-danger',
  QUARANTINE: 'badge-danger',
};

function CreateContainerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [code, setCode] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [type, setType] = useState('PALLET');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get<ApiResponse<Warehouse[]>>('/warehouses', { params: { pageSize: 100 } }).then((res) => {
      setWarehouses(res.data.data);
      if (res.data.data.length > 0) setWarehouseId(res.data.data[0].id);
    });
  }, []);

  useEffect(() => {
    setLocationId('');
    if (!warehouseId) return;
    apiClient.get<ApiResponse<Location[]>>(`/warehouses/${warehouseId}/locations`).then((res) => setLocations(res.data.data));
  }, [warehouseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.post('/handling-units', {
        code,
        warehouseId,
        type,
        ...(locationId ? { locationId } : {}),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al crear el contenedor';
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
        <h2 style={{ fontSize: 18 }}>Nuevo contenedor</h2>

        <label style={{ fontSize: 13 }}>Código (LPN)</label>
        <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="ej. HU-00099" />

        <label style={{ fontSize: 13 }}>Almacén</label>
        <select className="input" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
          ))}
        </select>

        <label style={{ fontSize: 13 }}>Tipo</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label style={{ fontSize: 13 }}>Ubicación inicial (opcional)</label>
        <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Sin asignar</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.code}</option>
          ))}
        </select>

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

export default function Containers() {
  const [data, setData] = useState<HandlingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  function reload() {
    setLoading(true);
    apiClient
      .get<ApiResponse<HandlingUnit[]>>('/handling-units', { params: { pageSize: 200, ...(search ? { search } : {}) } })
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>Contenedores</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo contenedor</button>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Buscar por código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Ubicación</th>
                <th>Líneas de stock</th>
              </tr>
            </thead>
            <tbody>
              {data.map((hu) => (
                <tr key={hu.id}>
                  <td>{hu.code}</td>
                  <td>{TYPE_LABEL[hu.type] ?? hu.type}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[hu.status] ?? 'badge-muted'}`}>
                      {STATUS_LABEL[hu.status] ?? hu.status}
                    </span>
                  </td>
                  <td>{hu.location?.code ?? <span style={{ color: 'var(--color-text-muted)' }}>Sin asignar</span>}</td>
                  <td>{hu._count?.stock ?? 0}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Sin contenedores todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CreateContainerModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}
