import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import type { ApiResponse, Warehouse } from '../api/types';

const columnHelper = createColumnHelper<Warehouse>();

const WAREHOUSE_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

interface WarehouseFormValues {
  code: string;
  name: string;
  address: string;
  manager: string;
  status: string;
}

const EMPTY_FORM: WarehouseFormValues = { code: '', name: '', address: '', manager: '', status: 'ACTIVE' };

function WarehouseFormModal({
  warehouse,
  onClose,
  onSaved,
}: {
  warehouse: Warehouse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<WarehouseFormValues>(
    warehouse
      ? {
          code: warehouse.code,
          name: warehouse.name,
          address: warehouse.address ?? '',
          manager: warehouse.manager ?? '',
          status: warehouse.status,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (warehouse) {
        await apiClient.patch(`/warehouses/${warehouse.id}`, values);
      } else {
        await apiClient.post('/warehouses', values);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al guardar el almacén';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <form
        className="card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ width: 420, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <h2 style={{ fontSize: 18 }}>{warehouse ? 'Editar almacén' : 'Nuevo almacén'}</h2>

        <label style={{ fontSize: 13 }}>Código</label>
        <input
          className="input"
          value={values.code}
          onChange={(e) => setValues({ ...values, code: e.target.value })}
          required
          disabled={!!warehouse}
        />

        <label style={{ fontSize: 13 }}>Nombre</label>
        <input className="input" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />

        <label style={{ fontSize: 13 }}>Dirección</label>
        <input className="input" value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />

        <label style={{ fontSize: 13 }}>Responsable</label>
        <input className="input" value={values.manager} onChange={(e) => setValues({ ...values, manager: e.target.value })} />

        <label style={{ fontSize: 13 }}>Estado</label>
        <select className="input" value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
          {WAREHOUSE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function Warehouses() {
  const [data, setData] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalWarehouse, setModalWarehouse] = useState<Warehouse | null | undefined>(undefined);
  const navigate = useNavigate();

  function reload() {
    apiClient.get<ApiResponse<Warehouse[]>>('/warehouses').then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  const columns = [
    columnHelper.accessor('code', { header: 'Código' }),
    columnHelper.accessor('name', { header: 'Nombre' }),
    columnHelper.accessor('address', { header: 'Dirección', cell: (info) => info.getValue() ?? '—' }),
    columnHelper.accessor('manager', { header: 'Responsable', cell: (info) => info.getValue() ?? '—' }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: (info) => {
        const status = info.getValue();
        const cls = status === 'ACTIVE' ? 'badge-success' : status === 'MAINTENANCE' ? 'badge-warning' : 'badge-muted';
        return <span className={`badge ${cls}`}>{status}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => (
        <button
          className="btn"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            setModalWarehouse(info.row.original);
          }}
        >
          Editar
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>Almacenes</h1>
        <button className="btn btn-primary" onClick={() => setModalWarehouse(null)}>
          + Nuevo almacén
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando…</div>
        ) : (
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/warehouses/${row.original.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Sin almacenes todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalWarehouse !== undefined && (
        <WarehouseFormModal
          warehouse={modalWarehouse}
          onClose={() => setModalWarehouse(undefined)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
