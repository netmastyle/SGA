import { useEffect, useRef } from 'react';
import { OrbitControls, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { AisleBounds, LayoutItem, ZoneBounds } from './layout';
import { AISLE_WALKWAY_WIDTH, LOCATION_SIZE, STATUS_COLOR, ZONE_FLOOR_COLORS } from './layout';

export interface DragState {
  aisleId: string;
  dx: number;
  dz: number;
}

interface SceneProps {
  items: LayoutItem[];
  zoneBounds: ZoneBounds[];
  aisleBounds: AisleBounds[];
  selectedId: string | null;
  onSelect: (item: LayoutItem) => void;
  dragState: DragState | null;
  onAisleGrab: (aisleId: string, clientX: number, clientY: number) => void;
}

const STATUS_ORDER = ['FREE', 'PARTIAL', 'OCCUPIED', 'BLOCKED', 'RESERVED', 'QUARANTINE'] as const;
const BOX_GEO = new THREE.BoxGeometry(...LOCATION_SIZE);
const STATUS_COLORS = Object.fromEntries(
  STATUS_ORDER.map((s) => [s, new THREE.Color(STATUS_COLOR[s])]),
) as Record<string, THREE.Color>;
const SELECTED_COLOR = new THREE.Color('#ffffff');

function InstancedGroup({
  items,
  color,
  dragState,
  onSelect,
}: {
  items: LayoutItem[];
  color: THREE.Color;
  dragState: DragState | null;
  onSelect: (item: LayoutItem) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const itemsRef = useRef<LayoutItem[]>(items);
  itemsRef.current = items;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      const isDragging = dragState?.aisleId === item.aisleId;
      const [x, y, z] = item.position;
      dummy.position.set(isDragging ? x + dragState!.dx : x, y, isDragging ? z + dragState!.dz : z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items, dragState]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[BOX_GEO, undefined, items.length]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const item = itemsRef.current[e.instanceId ?? 0];
        if (item) onSelect(item);
      }}
    >
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </instancedMesh>
  );
}

export default function Scene({
  items,
  zoneBounds,
  aisleBounds,
  selectedId,
  onSelect,
  dragState,
  onAisleGrab,
}: SceneProps) {
  const floorWidth = Math.max(40, ...zoneBounds.map((z) => z.maxX + 8));
  const floorDepth = Math.max(20, zoneBounds.length * 14 + 4);
  const floorCenterX = floorWidth / 2 - 4;
  const floorCenterZ = floorDepth / 2 - 7;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 10]} intensity={0.8} />
      <hemisphereLight intensity={0.3} groundColor="#11161d" />

      <mesh position={[floorCenterX, -0.05, floorCenterZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial color="#161c25" />
      </mesh>

      {zoneBounds.map((zone, zi) => {
        const padX = 4;
        const width = zone.maxX - zone.minX + padX * 2;
        const depth = zone.maxZ - zone.minZ;
        const centerX = (zone.minX + zone.maxX) / 2;
        const centerZ = (zone.minZ + zone.maxZ) / 2;
        return (
          <mesh
            key={`floor-${zone.code}`}
            position={[centerX, -0.045, centerZ]}
            rotation={[-Math.PI / 2, 0, 0]}
                      >
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color={ZONE_FLOOR_COLORS[zi % ZONE_FLOOR_COLORS.length]} />
          </mesh>
        );
      })}

      <gridHelper args={[Math.max(floorWidth, floorDepth), 20, '#2a3340', '#1c232d']} position={[floorCenterX, 0, floorCenterZ]} />

      {aisleBounds.map((aisle) => {
        const isDragging = dragState?.aisleId === aisle.id;
        const dx = isDragging ? dragState!.dx : 0;
        const dz = isDragging ? dragState!.dz : 0;
        const isLongitudinal = aisle.axis !== 'Y';
        const centerX = (aisle.minX + aisle.maxX) / 2 + dx;
        const centerZ = (aisle.minZ + aisle.maxZ) / 2 + dz;
        const along = (isLongitudinal ? aisle.maxX - aisle.minX : aisle.maxZ - aisle.minZ) + 2.4;
        const planeArgs: [number, number] = isLongitudinal
          ? [along, AISLE_WALKWAY_WIDTH]
          : [AISLE_WALKWAY_WIDTH, along];
        const centerlineArgs: [number, number] = isLongitudinal ? [along, 0.06] : [0.06, along];
        const labelPos: [number, number, number] = isLongitudinal
          ? [aisle.minX - 1.6 + dx, 0.3, centerZ]
          : [centerX, 0.3, aisle.minZ - 1.6 + dz];
        const accentColor = isDragging ? '#ffffff' : '#f59e0b';

        return (
          <group key={aisle.id}>
            <mesh position={[centerX, -0.03, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={planeArgs} />
              <meshStandardMaterial color={isDragging ? '#3a4252' : '#26303d'} />
            </mesh>
            <mesh position={[centerX, -0.02, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={centerlineArgs} />
              <meshStandardMaterial color={accentColor} opacity={0.6} transparent />
            </mesh>
            <Text
              position={labelPos}
              fontSize={0.5}
              color={accentColor}
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                onAisleGrab(aisle.id, e.nativeEvent.clientX, e.nativeEvent.clientY);
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'grab';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              {aisle.code}
            </Text>
          </group>
        );
      })}

      {zoneBounds.map((zone) => (
        <Text
          key={zone.code}
          position={[(zone.minX + zone.maxX) / 2, 5.5, zone.centerZ]}
          fontSize={0.6}
          color="#8b97a6"
          anchorX="center"
          anchorY="middle"
        >
          {zone.code} · {zone.name}
        </Text>
      ))}

      {STATUS_ORDER.map((status) => {
        const regular = items.filter((it) => it.location.status === status && it.location.id !== selectedId);
        const sel = items.filter((it) => it.location.status === status && it.location.id === selectedId);
        return (
          <group key={status}>
            {regular.length > 0 && (
              <InstancedGroup items={regular} color={STATUS_COLORS[status]} dragState={dragState} onSelect={onSelect} />
            )}
            {sel.length > 0 && (
              <InstancedGroup items={sel} color={SELECTED_COLOR} dragState={dragState} onSelect={onSelect} />
            )}
          </group>
        );
      })}

      <OrbitControls makeDefault enabled={!dragState} minDistance={5} maxDistance={80} />
    </>
  );
}
