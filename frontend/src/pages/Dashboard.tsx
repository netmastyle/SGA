import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse, Item, Warehouse } from '../api/types';

export default function Dashboard() {
  const [warehouseCount, setWarehouseCount] = useState<number | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<Warehouse[]>>('/warehouses', { params: { pageSize: 1 } })
      .then((res) => setWarehouseCount(res.data.pagination?.total ?? 0));

    apiClient
      .get<ApiResponse<Item[]>>('/items', { params: { pageSize: 1 } })
      .then((res) => setItemCount(res.data.pagination?.total ?? 0));
  }, []);

  const cards = [
    { label: 'Almacenes', value: warehouseCount },
    { label: 'Artículos', value: itemCount },
    { label: 'Tareas pendientes', value: 0 },
    { label: 'Incidencias abiertas', value: 0 },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {cards.map((card) => (
          <div key={card.label} className="card" style={{ padding: 20 }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {card.value === null ? '…' : card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
