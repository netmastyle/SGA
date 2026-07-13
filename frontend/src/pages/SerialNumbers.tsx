import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse, HandlingUnit, Item, SerialNumberRecord, Warehouse } from '../api/types';

const STATUS_LABEL: Record<string, string> = {
  IN_STOCK: 'En stock',
  RESERVED: 'Reservado',
  SHIPPED: 'Expedido',
  RETURNED: 'Devuelto',
  SCRAPPED: 'Baja',
  BLOCKED: 'Bloqueado',
};

const STATUS_BADGE: Record<string, string> = {
  IN_STOCK: 'badge-success',
  RESERVED: 'badge-warning',
  SHIPPED: 'badge-muted',
  RETURNED: 'badge-warning',
  SCRAPPED: 'badge-danger',
  BLOCKED: 'badge-danger',
};

function RegisterSerialModal({ items, onClose, onSaved }: { items: Item[]; onClose: () => void; onSaved: () => void }) {
  const serialItems = items.filter((i) => i.serialControlled);
  const [itemId, setItemId] = useState(serialItems[0]?.id ?? '');
  const [serialNumber, setSerialNumber] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [handlingUnits, setHandlingUnits] = useState<HandlingUnit[]>([]);
  const [handlingUnitId, setHandlingUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get<ApiResponse<Warehouse[]>>('/warehouses', { params: { pageSize: 100 } }).then((res) => {
      setWarehouses(res.data.data);
      if (res.data.data.length > 0) setWarehouseId(res.data.data[0].id);
    });
  }, []);

  useEffect(() => {
    setHandlingUnitId('');
    if (!warehouseId) return;
    apiClient
      .get<ApiResponse<HandlingUnit[]>>('/handling-units', { params: { warehouseId, pageSize: 200 } })
      .then((res) => setHandlingUnits(res.data.data));
  }, [warehouseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.post('/serial-numbers', {
        itemId,
        serialNumber,
        ...(handlingUnitId ? { handlingUnitId } : {}),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al registrar el número de serie';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  }

  if (serialItems.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
        <div className="card" style={{ padding: 24, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
          <p style={{ marginBottom: 16 }}>No hay artículos marcados con control por número de serie. Activa la casilla "Nº de serie" al crear o editar un artículo.</p>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
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
        <h2 style={{ fontSize: 18 }}>Registrar número de serie</h2>

        <label style={{ fontSize: 13 }}>Artículo</label>
        <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)} required>
          {serialItems.map((i) => (
            <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>
          ))}
        </select>

        <label style={{ fontSize: 13 }}>Número de serie</label>
        <input className="input" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />

        <label style={{ fontSize: 13 }}>Almacén</label>
        <select className="input" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
          ))}
        </select>

        <label style={{ fontSize: 13 }}>Contenedor inicial (opcional)</label>
        <select className="input" value={handlingUnitId} onChange={(e) => setHandlingUnitId(e.target.value)}>
          <option value="">Sin asignar</option>
          {handlingUnits.map((hu) => (
            <option key={hu.id} value={hu.id}>{hu.code} ({hu.location?.code ?? 'sin ubicar'})</option>
          ))}
        </select>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function SerialNumbers() {
  const [data, setData] = useState<SerialNumberRecord[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    apiClient
      .get<ApiResponse<SerialNumberRecord[]>>('/serial-numbers', {
        params: { pageSize: 200, ...(status ? { status } : {}), ...(search ? { search } : {}) },
      })
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    apiClient.get<ApiResponse<Item[]>>('/items', { params: { pageSize: 200 } }).then((res) => setItems(res.data.data));
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  async function changeStatus(id: string, newStatus: string) {
    setActionError(null);
    try {
      await apiClient.patch(`/serial-numbers/${id}/status`, { status: newStatus });
      reload();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al cambiar el estado';
      setActionError(Array.isArray(message) ? message.join(', ') : message);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>Números de serie</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Registrar número de serie</button>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12 }}>
        <select className="input" style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Buscar número de serie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {actionError && (
        <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>
          {actionError}
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número de serie</th>
                <th>Artículo</th>
                <th>Estado</th>
                <th>Ubicación / contenedor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((serial) => {
                const stockLine = serial.stock[0];
                return (
                  <tr key={serial.id}>
                    <td>{serial.serialNumber}</td>
                    <td>{serial.item.sku} — {serial.item.name}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[serial.status]}`}>{STATUS_LABEL[serial.status]}</span>
                    </td>
                    <td>
                      {stockLine ? (
                        <>
                          {stockLine.handlingUnit.code}
                          {stockLine.handlingUnit.location ? ` · ${stockLine.handlingUnit.location.code}` : ' · sin ubicar'}
                        </>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {serial.status !== 'SHIPPED' && (
                          <button className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => changeStatus(serial.id, 'SHIPPED')}>
                            Expedir
                          </button>
                        )}
                        {serial.status === 'SHIPPED' && (
                          <button className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => changeStatus(serial.id, 'RETURNED')}>
                            Devolver
                          </button>
                        )}
                        {serial.status !== 'SCRAPPED' && (
                          <button className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => changeStatus(serial.id, 'SCRAPPED')}>
                            Dar de baja
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Sin números de serie registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <RegisterSerialModal items={items} onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}
