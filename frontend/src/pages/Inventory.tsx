import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse, StockLine, Warehouse } from '../api/types';

const STATUS_LABEL: Record<string, string> = {
  FREE: 'Libre',
  PARTIAL: 'Parcial',
  OCCUPIED: 'Ocupado',
  BLOCKED: 'Bloqueado',
  RESERVED: 'Reservado',
  QUARANTINE: 'Cuarentena',
};

const STATUS_BADGE: Record<string, string> = {
  FREE: 'badge-success',
  PARTIAL: 'badge-warning',
  OCCUPIED: 'badge-danger',
  BLOCKED: 'badge-muted',
  RESERVED: 'badge-warning',
  QUARANTINE: 'badge-danger',
};

export default function Inventory() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [lines, setLines] = useState<StockLine[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<ApiResponse<Warehouse[]>>('/warehouses', { params: { pageSize: 100 } }).then((res) => {
      setWarehouses(res.data.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<ApiResponse<StockLine[]>>('/stock', {
        params: {
          page,
          pageSize,
          ...(warehouseId ? { warehouseId } : {}),
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      })
      .then((res) => {
        setLines(res.data.data);
        setTotal(res.data.pagination?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [warehouseId, status, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Inventario</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Stock por ubicación, contenedor y artículo en toda la empresa.
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select
          className="input"
          style={{ maxWidth: 220 }}
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los almacenes</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
          ))}
        </select>

        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Buscar por SKU, artículo, contenedor o ubicación…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ubicación</th>
                <th>Contenedor</th>
                <th>Artículo</th>
                <th>Lote</th>
                <th>Cantidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const loc = line.handlingUnit.location;
                return (
                  <tr key={line.id}>
                    <td>{loc?.code ?? <span style={{ color: 'var(--color-text-muted)' }}>Sin ubicar</span>}</td>
                    <td>
                      {line.handlingUnit.code} <span style={{ color: 'var(--color-text-muted)' }}>· {line.handlingUnit.type}</span>
                    </td>
                    <td>{line.item.sku} — {line.item.name}</td>
                    <td>{line.lot?.lotNumber ?? '—'}</td>
                    <td>{line.quantity} {line.unit}</td>
                    <td>
                      {loc ? (
                        <span className={`badge ${STATUS_BADGE[loc.status]}`}>{STATUS_LABEL[loc.status]}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {total} resultados · página {page} de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
