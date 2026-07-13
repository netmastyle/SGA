import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import { apiClient } from '../api/client';
import type { ApiResponse, Warehouse } from '../api/types';
import type { LocationDetail, ZoneNode } from '../api/topology-tree.types';
import Scene, { type DragState } from '../components/viewer3d/Scene';
import { computeLayout, STATUS_COLOR, type LayoutItem } from '../components/viewer3d/layout';

const STATUS_LABEL: Record<string, string> = {
  FREE: 'Libre',
  PARTIAL: 'Parcial',
  OCCUPIED: 'Ocupado',
  BLOCKED: 'Bloqueado',
  RESERVED: 'Reservado',
  QUARANTINE: 'Cuarentena',
};

type ViewPreset = 'iso' | 'top' | 'front' | 'side';

export default function WarehouseViewer3D() {
  const { id } = useParams<{ id: string }>();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [zones, setZones] = useState<ZoneNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LayoutItem | null>(null);
  const [locationDetail, setLocationDetail] = useState<LocationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const groundPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragGrabRef = useRef<{ x: number; z: number } | null>(null);

  function loadTopology() {
    if (!id) return;
    return Promise.all([
      apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`),
      apiClient.get<ApiResponse<ZoneNode[]>>(`/warehouses/${id}/topology-tree`),
    ]).then(([whRes, topoRes]) => {
      setWarehouse(whRes.data.data);
      setZones(topoRes.data.data);
    });
  }

  useEffect(() => {
    setLoading(true);
    Promise.resolve(loadTopology()).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { items, zoneBounds, aisleBounds } = useMemo(() => computeLayout(zones), [zones]);

  const filteredItems = useMemo(
    () => (statusFilter ? items.filter((i) => i.location.status === statusFilter) : items),
    [items, statusFilter],
  );

  const center = useMemo(() => {
    const maxX = Math.max(10, ...items.map((i) => i.position[0]));
    const maxZ = Math.max(10, ...items.map((i) => i.position[2]));
    return { x: maxX / 2, z: maxZ / 2 };
  }, [items]);

  function setView(preset: ViewPreset) {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls) return;

    const { x, z } = center;
    const positions: Record<ViewPreset, [number, number, number]> = {
      iso: [x + 18, 22, z + 24],
      top: [x, 45, z + 0.01],
      front: [x, 6, z + 30],
      side: [x + 30, 6, z],
    };
    const [px, py, pz] = positions[preset];
    cam.position.set(px, py, pz);
    controls.target.set(x, 2, z);
    controls.update();
  }

  function getGroundPoint(clientX: number, clientY: number): THREE.Vector3 | null {
    const canvas = canvasElRef.current;
    const cam = cameraRef.current;
    if (!canvas || !cam) return null;
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    const point = new THREE.Vector3();
    const hit = raycasterRef.current.ray.intersectPlane(groundPlaneRef.current, point);
    return hit ? point : null;
  }

  function handleAisleGrab(aisleId: string, clientX: number, clientY: number) {
    const point = getGroundPoint(clientX, clientY);
    if (!point) return;
    dragGrabRef.current = { x: point.x, z: point.z };
    setDragState({ aisleId, dx: 0, dz: 0 });
  }

  function commitDrag(state: DragState) {
    const aisle = aisleBounds.find((a) => a.id === state.aisleId);
    if (!aisle || !id) return;
    const newX = Math.round((aisle.originX + state.dx) * 10) / 10;
    const newZ = Math.round((aisle.originZ + state.dz) * 10) / 10;
    apiClient
      .patch(`/warehouses/${id}/zones/${aisle.zoneId}/aisles/${aisle.id}`, { startX: newX, startY: newZ })
      .then(() => loadTopology());
  }

  useEffect(() => {
    if (!dragState) return;
    const aisleId = dragState.aisleId;

    function handleMove(e: PointerEvent) {
      const point = getGroundPoint(e.clientX, e.clientY);
      if (!point || !dragGrabRef.current) return;
      setDragState({ aisleId, dx: point.x - dragGrabRef.current.x, dz: point.z - dragGrabRef.current.z });
    }

    function handleUp() {
      setDragState((current) => {
        if (current) commitDrag(current);
        return null;
      });
      dragGrabRef.current = null;
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState?.aisleId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <Link to={`/warehouses/${id}`} style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          ← Volver al detalle del almacén
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>{warehouse?.name ?? 'Cargando…'} · Visor 3D</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Arrastra el nombre de un pasillo para moverlo por el suelo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn" onClick={() => setView('iso')}>Isométrica</button>
          <button className="btn" onClick={() => setView('top')}>Cenital</button>
          <button className="btn" onClick={() => setView('front')}>Frontal</button>
          <button className="btn" onClick={() => setView('side')}>Lateral</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 560 }}>
        <div className="card" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>Cargando topología…</div>
          ) : (
            <Canvas
              onCreated={(state) => {
                canvasElRef.current = state.gl.domElement;
                setView('iso');
              }}
            >
              <PerspectiveCamera makeDefault ref={cameraRef} position={[18, 22, 24]} fov={50} />
              <Scene
                items={filteredItems}
                zoneBounds={zoneBounds}
                aisleBounds={aisleBounds}
                selectedId={selected?.location.id ?? null}
                onSelect={(item) => {
                  setSelected(item);
                  setLocationDetail(null);
                  setLoadingDetail(true);
                  apiClient
                    .get<ApiResponse<LocationDetail>>(`/warehouses/${id}/locations/${item.location.id}`)
                    .then((res) => setLocationDetail(res.data.data))
                    .finally(() => setLoadingDetail(false));
                }}
                dragState={dragState}
                onAisleGrab={handleAisleGrab}
              />
            </Canvas>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              background: 'rgba(11,15,20,0.7)',
              padding: '8px 10px',
              borderRadius: 8,
            }}
          >
            {Object.entries(STATUS_LABEL).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  background: 'transparent',
                  border: 'none',
                  color: statusFilter && statusFilter !== status ? 'var(--color-text-muted)' : 'var(--color-text)',
                  cursor: 'pointer',
                  opacity: statusFilter && statusFilter !== status ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: STATUS_COLOR[status],
                    display: 'inline-block',
                  }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ width: 280, padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            Detalle de ubicación
          </div>
          {!selected ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              Haz clic en un hueco del almacén para ver su detalle.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{selected.location.code}</div>
              <div>
                <span
                  className="badge"
                  style={{ background: `${STATUS_COLOR[selected.location.status]}26`, color: STATUS_COLOR[selected.location.status] }}
                >
                  {STATUS_LABEL[selected.location.status]}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Zona {selected.zoneCode} · Pasillo {selected.aisleCode} · Estantería {selected.rackCode} · Nivel{' '}
                {selected.levelNumber}
              </div>
              {selected.location.blockedReason && (
                <div style={{ fontSize: 13, color: 'var(--color-danger)' }}>
                  Motivo bloqueo: {selected.location.blockedReason}
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Contenedores ({selected.location._count.handlingUnits})
                </div>
                {loadingDetail ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando…</div>
                ) : !locationDetail || locationDetail.handlingUnits.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Sin contenedores</div>
                ) : (
                  locationDetail.handlingUnits.map((hu) => (
                    <div key={hu.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {hu.code} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>· {hu.type}</span>
                      </div>
                      {hu.stock.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Sin stock</div>
                      ) : (
                        hu.stock.map((s) => (
                          <div key={s.id} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {s.item.sku} — {s.quantity} {s.unit}
                            {s.lot ? ` (lote ${s.lot.lotNumber})` : ''}
                          </div>
                        ))
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
