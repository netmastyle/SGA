import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import type {
  ApiResponse,
  Aisle,
  Level,
  Location,
  Rack,
  StockLine,
  Warehouse,
  Zone,
} from '../api/types';

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

const ZONE_TYPES = ['NORMAL', 'CONTROLLED_TEMPERATURE', 'HAZARDOUS', 'QUARANTINE', 'SHIPPING', 'RECEIVING'];
const RACK_TYPES = ['CONVENTIONAL', 'DRIVE_IN', 'CANTILEVER', 'MEZZANINE'];

function Column<T extends { id: string; code?: string }>({
  title,
  items,
  selectedId,
  onSelect,
  renderLabel,
  footer,
}: {
  title: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderLabel: (item: T) => string;
  footer?: ReactNode;
}) {
  return (
    <div className="card" style={{ minWidth: 200, padding: 12, flex: '0 0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 280, overflow: 'auto' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: selectedId === item.id ? 'var(--color-primary)' : 'transparent',
              color: selectedId === item.id ? 'white' : 'var(--color-text)',
              padding: '8px 10px',
            }}
          >
            {renderLabel(item)}
          </button>
        ))}
        {items.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 8 }}>Sin elementos</div>
        )}
      </div>
      {footer && <div style={{ marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>{footer}</div>}
    </div>
  );
}

function AddToggle({ children, label }: { children: (close: () => void) => ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className="btn" style={{ width: '100%', fontSize: 13 }} onClick={() => setOpen(true)}>
        + {label}
      </button>
    );
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children(() => setOpen(false))}</div>;
}

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'topology' | 'locations'>('topology');
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  const [zones, setZones] = useState<Zone[]>([]);
  const [aisles, setAisles] = useState<Aisle[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [zoneId, setZoneId] = useState<string | null>(null);
  const [aisleId, setAisleId] = useState<string | null>(null);
  const [rackId, setRackId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);

  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [stock, setStock] = useState<StockLine[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function reloadZones() {
    if (!id) return;
    apiClient.get<ApiResponse<Zone[]>>(`/warehouses/${id}/zones`).then((res) => setZones(res.data.data));
  }
  function reloadAisles() {
    if (!id || !zoneId) return;
    apiClient
      .get<ApiResponse<Aisle[]>>(`/warehouses/${id}/zones/${zoneId}/aisles`)
      .then((res) => setAisles(res.data.data));
  }
  function reloadRacks() {
    if (!id || !zoneId || !aisleId) return;
    apiClient
      .get<ApiResponse<Rack[]>>(`/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks`)
      .then((res) => setRacks(res.data.data));
  }
  function reloadLevels() {
    if (!id || !zoneId || !aisleId || !rackId) return;
    apiClient
      .get<ApiResponse<Level[]>>(`/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}/levels`)
      .then((res) => setLevels(res.data.data));
  }

  useEffect(() => {
    if (!id) return;
    apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`).then((res) => setWarehouse(res.data.data));
    reloadZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setAisles([]);
    setAisleId(null);
    reloadAisles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, zoneId]);

  useEffect(() => {
    setRacks([]);
    setRackId(null);
    reloadRacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, zoneId, aisleId]);

  useEffect(() => {
    setLevels([]);
    setLevelId(null);
    reloadLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, zoneId, aisleId, rackId]);

  useEffect(() => {
    setLocations([]);
    if (!id || !zoneId || !aisleId || !rackId || !levelId) return;
    apiClient
      .get<ApiResponse<Location[]>>(
        `/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}/levels/${levelId}/locations`,
      )
      .then((res) => setLocations(res.data.data));
  }, [id, zoneId, aisleId, rackId, levelId]);

  useEffect(() => {
    if (!id || tab !== 'locations') return;
    setLocationsLoading(true);
    Promise.all([
      apiClient.get<ApiResponse<Location[]>>(`/warehouses/${id}/locations`),
      apiClient.get<ApiResponse<StockLine[]>>('/stock', { params: { warehouseId: id, pageSize: 500 } }),
    ])
      .then(([locRes, stockRes]) => {
        setAllLocations(locRes.data.data);
        setStock(stockRes.data.data);
      })
      .finally(() => setLocationsLoading(false));
  }, [id, tab]);

  const stockByLocation = useMemo(() => {
    const map = new Map<string, StockLine[]>();
    for (const line of stock) {
      const locId = line.handlingUnit.locationId;
      if (!locId) continue;
      const list = map.get(locId) ?? [];
      list.push(line);
      map.set(locId, list);
    }
    return map;
  }, [stock]);

  async function handleApiCall(fn: () => Promise<unknown>, onDone: () => void) {
    setFormError(null);
    try {
      await fn();
      onDone();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al guardar';
      setFormError(Array.isArray(message) ? message.join(', ') : message);
    }
  }

  function ZoneForm({ close }: { close: () => void }) {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState(ZONE_TYPES[0]);

    function submit(e: FormEvent) {
      e.preventDefault();
      handleApiCall(
        () => apiClient.post(`/warehouses/${id}/zones`, { code, name, type }),
        () => {
          reloadZones();
          close();
        },
      );
    }

    return (
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input className="input" placeholder="Código (ej. Z03)" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input className="input" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {ZONE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
          <button type="button" className="btn" onClick={close}>Cancelar</button>
        </div>
      </form>
    );
  }

  function AisleForm({ close }: { close: () => void }) {
    const [code, setCode] = useState('');
    const [axis, setAxis] = useState<'X' | 'Y'>('X');

    function submit(e: FormEvent) {
      e.preventDefault();
      handleApiCall(
        () => apiClient.post(`/warehouses/${id}/zones/${zoneId}/aisles`, { code, axis }),
        () => {
          reloadAisles();
          close();
        },
      );
    }

    return (
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input className="input" placeholder="Código (ej. P03)" value={code} onChange={(e) => setCode(e.target.value)} required />
        <select className="input" value={axis} onChange={(e) => setAxis(e.target.value as 'X' | 'Y')}>
          <option value="X">Eje X</option>
          <option value="Y">Eje Y</option>
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
          <button type="button" className="btn" onClick={close}>Cancelar</button>
        </div>
      </form>
    );
  }

  function RackForm({ close }: { close: () => void }) {
    const [code, setCode] = useState('');
    const [side, setSide] = useState<'LEFT' | 'RIGHT'>('LEFT');
    const [type, setType] = useState(RACK_TYPES[0]);
    const [columns, setColumns] = useState(5);
    const [levelsCount, setLevelsCount] = useState(3);

    function submit(e: FormEvent) {
      e.preventDefault();
      handleApiCall(
        () =>
          apiClient.post(`/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks`, {
            code,
            side,
            type,
            columns: Number(columns),
            levelsCount: Number(levelsCount),
          }),
        () => {
          reloadRacks();
          close();
        },
      );
    }

    return (
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input className="input" placeholder="Código (ej. R03)" value={code} onChange={(e) => setCode(e.target.value)} required />
        <select className="input" value={side} onChange={(e) => setSide(e.target.value as 'LEFT' | 'RIGHT')}>
          <option value="LEFT">Lado izquierdo</option>
          <option value="RIGHT">Lado derecho</option>
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {RACK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input className="input" type="number" min={1} placeholder="Columnas" value={columns} onChange={(e) => setColumns(Number(e.target.value))} />
        <input className="input" type="number" min={1} placeholder="Niveles" value={levelsCount} onChange={(e) => setLevelsCount(Number(e.target.value))} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
          <button type="button" className="btn" onClick={close}>Cancelar</button>
        </div>
      </form>
    );
  }

  function LocationForm({ close }: { close: () => void }) {
    const [code, setCode] = useState('');

    function submit(e: FormEvent) {
      e.preventDefault();
      handleApiCall(
        () =>
          apiClient.post(
            `/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}/levels/${levelId}/locations`,
            { code },
          ),
        () => {
          apiClient
            .get<ApiResponse<Location[]>>(
              `/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}/levels/${levelId}/locations`,
            )
            .then((res) => setLocations(res.data.data));
          close();
        },
      );
    }

    return (
      <form onSubmit={submit} style={{ display: 'flex', gap: 6 }}>
        <input className="input" placeholder="Código de ubicación" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button type="submit" className="btn btn-primary">Crear</button>
        <button type="button" className="btn" onClick={close}>Cancelar</button>
      </form>
    );
  }

  function LevelForm({ close }: { close: () => void }) {
    const nextLevel = (levels.reduce((max, l) => Math.max(max, l.levelNumber), 0) || 0) + 1;
    const [levelNumber, setLevelNumber] = useState(nextLevel);

    function submit(e: FormEvent) {
      e.preventDefault();
      handleApiCall(
        () =>
          apiClient.post(`/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}/levels`, {
            levelNumber: Number(levelNumber),
          }),
        () => {
          reloadLevels();
          close();
        },
      );
    }

    return (
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input className="input" type="number" min={1} placeholder="Número de nivel" value={levelNumber} onChange={(e) => setLevelNumber(Number(e.target.value))} required />
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
          <button type="button" className="btn" onClick={close}>Cancelar</button>
        </div>
      </form>
    );
  }

  function AislePositionForm() {
    const aisle = aisles.find((a) => a.id === aisleId);
    const [startX, setStartX] = useState(aisle?.startX ?? '');
    const [startY, setStartY] = useState(aisle?.startY ?? '');
    const [axis, setAxis] = useState<'X' | 'Y'>((aisle?.axis as 'X' | 'Y') ?? 'X');
    const [saved, setSaved] = useState(false);

    if (!aisle) return null;

    function submit(e: FormEvent) {
      e.preventDefault();
      setSaved(false);
      handleApiCall(
        () =>
          apiClient.patch(`/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}`, {
            axis,
            startX: startX === '' ? undefined : Number(startX),
            startY: startY === '' ? undefined : Number(startY),
          }),
        () => {
          reloadAisles();
          setSaved(true);
        },
      );
    }

    return (
      <div className="card" style={{ padding: 16, minWidth: 260 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          Posición del pasillo {aisle.code}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13 }}>Orientación</label>
          <select className="input" value={axis} onChange={(e) => setAxis(e.target.value as 'X' | 'Y')}>
            <option value="X">Longitudinal (eje X)</option>
            <option value="Y">Transversal (eje Y)</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13 }}>Posición X (m)</label>
              <input className="input" type="number" step="0.1" value={startX} onChange={(e) => setStartX(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13 }}>Posición Y (m)</label>
              <input className="input" type="number" step="0.1" value={startY} onChange={(e) => setStartY(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Guardar posición</button>
          {saved && <div style={{ fontSize: 12, color: 'var(--color-success)' }}>Guardado</div>}
        </form>
      </div>
    );
  }

  function RackSideForm() {
    const rack = racks.find((r) => r.id === rackId);
    const [side, setSide] = useState<'LEFT' | 'RIGHT'>((rack?.side as 'LEFT' | 'RIGHT') ?? 'LEFT');
    const [saved, setSaved] = useState(false);

    if (!rack) return null;

    function submit(e: FormEvent) {
      e.preventDefault();
      setSaved(false);
      handleApiCall(
        () =>
          apiClient.patch(`/warehouses/${id}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}`, { side }),
        () => {
          reloadRacks();
          setSaved(true);
        },
      );
    }

    return (
      <div className="card" style={{ padding: 16, minWidth: 220 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          Lado de la estantería {rack.code}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select className="input" value={side} onChange={(e) => setSide(e.target.value as 'LEFT' | 'RIGHT')}>
            <option value="LEFT">Izquierda</option>
            <option value="RIGHT">Derecha</option>
          </select>
          <button type="submit" className="btn btn-primary">Guardar lado</button>
          {saved && <div style={{ fontSize: 12, color: 'var(--color-success)' }}>Guardado</div>}
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/warehouses" style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          ← Almacenes
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>{warehouse?.name ?? 'Cargando…'}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
            {warehouse?.code} {warehouse?.address ? `· ${warehouse.address}` : ''}
          </p>
        </div>
        <Link to={`/warehouses/${id}/3d`} className="btn btn-primary">
          Ver en 3D
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className="btn"
          style={{
            background: tab === 'topology' ? 'var(--color-bg-card)' : 'transparent',
            borderColor: tab === 'topology' ? 'var(--color-primary)' : 'var(--color-border)',
          }}
          onClick={() => setTab('topology')}
        >
          Topología
        </button>
        <button
          className="btn"
          style={{
            background: tab === 'locations' ? 'var(--color-bg-card)' : 'transparent',
            borderColor: tab === 'locations' ? 'var(--color-primary)' : 'var(--color-border)',
          }}
          onClick={() => setTab('locations')}
        >
          Ubicaciones y stock
        </button>
      </div>

      {tab === 'topology' && (
        <div>
          {formError && (
            <div
              style={{
                color: 'var(--color-danger)',
                fontSize: 13,
                marginBottom: 12,
                background: 'rgba(239,68,68,0.1)',
                padding: '8px 12px',
                borderRadius: 6,
              }}
            >
              {formError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            <Column
              title="Zonas"
              items={zones}
              selectedId={zoneId}
              onSelect={setZoneId}
              renderLabel={(z) => `${z.code} — ${z.name}`}
              footer={<AddToggle label="Nueva zona">{(close) => <ZoneForm close={close} />}</AddToggle>}
            />
            <Column
              title="Pasillos"
              items={aisles}
              selectedId={aisleId}
              onSelect={setAisleId}
              renderLabel={(a) => `${a.code} (eje ${a.axis})`}
              footer={
                zoneId ? (
                  <AddToggle label="Nuevo pasillo">{(close) => <AisleForm close={close} />}</AddToggle>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Selecciona una zona</div>
                )
              }
            />
            <Column
              title="Estanterías"
              items={racks}
              selectedId={rackId}
              onSelect={setRackId}
              renderLabel={(r) => `${r.code} · ${r.type} · ${r.side === 'LEFT' ? 'izq.' : 'der.'}`}
              footer={
                aisleId ? (
                  <AddToggle label="Nueva estantería">{(close) => <RackForm close={close} />}</AddToggle>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Selecciona un pasillo</div>
                )
              }
            />
            <Column
              title="Niveles"
              items={levels}
              selectedId={levelId}
              onSelect={setLevelId}
              renderLabel={(l) => `Nivel ${l.levelNumber}`}
              footer={
                rackId ? (
                  <AddToggle label="Nuevo nivel">{(close) => <LevelForm close={close} />}</AddToggle>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Selecciona una estantería</div>
                )
              }
            />
            <div className="card" style={{ minWidth: 260, padding: 12, flex: '1 1 auto' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Ubicaciones del nivel
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {locations.map((loc) => (
                  <span key={loc.id} className={`badge ${STATUS_BADGE[loc.status]}`} title={loc.blockedReason ?? ''}>
                    {loc.code.split('-').slice(-1)[0]} · {STATUS_LABEL[loc.status]}
                  </span>
                ))}
                {locations.length === 0 && !levelId && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    Selecciona zona → pasillo → estantería → nivel para ver sus ubicaciones
                  </div>
                )}
              </div>
              {levelId && (
                <div style={{ marginTop: 12, maxWidth: 320 }}>
                  <AddToggle label="Nueva ubicación">{(close) => <LocationForm close={close} />}</AddToggle>
                </div>
              )}
            </div>
          </div>

          {(aisleId || rackId) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {aisleId && <AislePositionForm />}
              {rackId && <RackSideForm />}
            </div>
          )}
        </div>
      )}

      {tab === 'locations' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {locationsLoading ? (
            <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ubicación</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {allLocations.map((loc) => {
                  const lines = stockByLocation.get(loc.id) ?? [];
                  return (
                    <tr key={loc.id}>
                      <td>{loc.code}</td>
                      <td>{loc.type}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[loc.status]}`}>{STATUS_LABEL[loc.status]}</span>
                      </td>
                      <td>
                        {lines.length === 0 ? (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        ) : (
                          lines.map((l) => (
                            <div key={l.id}>
                              [{l.handlingUnit.code}] {l.item.sku} · {l.quantity} {l.unit}
                              {l.lot ? ` · lote ${l.lot.lotNumber}` : ''}
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
                {allLocations.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Sin ubicaciones
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
