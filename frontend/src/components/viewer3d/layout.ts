import type { LocationNode, ZoneNode } from '../../api/topology-tree.types';

export const STATUS_COLOR: Record<string, string> = {
  FREE: '#22c55e',
  PARTIAL: '#eab308',
  OCCUPIED: '#ef4444',
  BLOCKED: '#6b7280',
  RESERVED: '#3b82f6',
  QUARANTINE: '#a855f7',
};

export const ZONE_GAP_Z = 8;
export const AISLE_SPACING_Z = 8;
export const COLUMN_SPACING_X = 1.1;
export const LEVEL_HEIGHT = 1.6;
export const SIDE_OFFSET_Z = 2.4;
export const LOCATION_SIZE: [number, number, number] = [0.9, 1.3, 0.9];
export const AISLE_WALKWAY_WIDTH = SIDE_OFFSET_Z * 2 - LOCATION_SIZE[2] - 0.6;

export const ZONE_FLOOR_COLORS = [
  '#1e2a3a',
  '#2a2438',
  '#1f3329',
  '#3a2a1e',
  '#28303a',
  '#332a3a',
];

export interface LayoutItem {
  location: LocationNode;
  position: [number, number, number];
  zoneCode: string;
  zoneName: string;
  aisleId: string;
  aisleCode: string;
  rackCode: string;
  levelNumber: number;
}

export interface ZoneBounds {
  code: string;
  name: string;
  centerZ: number;
  minZ: number;
  maxZ: number;
  minX: number;
  maxX: number;
}

export interface AisleBounds {
  id: string;
  zoneId: string;
  code: string;
  zoneCode: string;
  axis: 'X' | 'Y';
  originX: number;
  originZ: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function computeLayout(
  zones: ZoneNode[],
): { items: LayoutItem[]; zoneBounds: ZoneBounds[]; aisleBounds: AisleBounds[] } {
  const items: LayoutItem[] = [];
  const zoneBounds: ZoneBounds[] = [];
  const aisleBounds: AisleBounds[] = [];

  // Zones are stacked back-to-back along Z based on each zone's *actual*
  // occupied extent (which itself depends on each aisle's real position —
  // manually configured via startX/startY, or auto-placed sequentially).
  let zCursor = 0;

  zones.forEach((zone) => {
    const zoneBaseZ = zCursor;
    let zoneMinX = Infinity;
    let zoneMaxX = -Infinity;
    let zoneMinZ = Infinity;
    let zoneMaxZ = -Infinity;

    zone.aisles.forEach((aisle, ai) => {
      const autoZ = zoneBaseZ + ai * AISLE_SPACING_Z;
      const manualX = aisle.startX != null ? parseFloat(aisle.startX) : null;
      const manualY = aisle.startY != null ? parseFloat(aisle.startY) : null;
      const originX = manualX ?? 0;
      const originZ = manualY ?? autoZ;
      const isLongitudinal = aisle.axis !== 'Y';

      let aisleMinX = Infinity;
      let aisleMaxX = -Infinity;
      let aisleMinZ = Infinity;
      let aisleMaxZ = -Infinity;

      aisle.racks.forEach((rack, ri) => {
        const along = ri * (rack.columns * COLUMN_SPACING_X + 2);
        const sideSign = rack.side === 'LEFT' ? -1 : 1;
        const perp = sideSign * SIDE_OFFSET_Z;

        rack.levels.forEach((level) => {
          const y = Math.max(0, level.levelNumber) * LEVEL_HEIGHT + LEVEL_HEIGHT / 2;

          level.locations.forEach((loc, ci) => {
            const columnOffset = ci * COLUMN_SPACING_X;
            let x: number;
            let z: number;
            if (isLongitudinal) {
              x = originX + along + columnOffset;
              z = originZ + perp;
            } else {
              x = originX + perp;
              z = originZ + along + columnOffset;
            }

            zoneMinX = Math.min(zoneMinX, x);
            zoneMaxX = Math.max(zoneMaxX, x);
            zoneMinZ = Math.min(zoneMinZ, z);
            zoneMaxZ = Math.max(zoneMaxZ, z);
            aisleMinX = Math.min(aisleMinX, x);
            aisleMaxX = Math.max(aisleMaxX, x);
            aisleMinZ = Math.min(aisleMinZ, z);
            aisleMaxZ = Math.max(aisleMaxZ, z);

            items.push({
              location: loc,
              position: [x, y, z],
              zoneCode: zone.code,
              zoneName: zone.name,
              aisleId: aisle.id,
              aisleCode: aisle.code,
              rackCode: rack.code,
              levelNumber: level.levelNumber,
            });
          });
        });
      });

      aisleBounds.push({
        id: aisle.id,
        zoneId: zone.id,
        code: aisle.code,
        zoneCode: zone.code,
        axis: aisle.axis,
        originX,
        originZ,
        minX: finite(aisleMinX, originX),
        maxX: finite(aisleMaxX, originX + 2),
        minZ: finite(aisleMinZ, originZ - 1),
        maxZ: finite(aisleMaxZ, originZ + 1),
      });
    });

    const resolvedMinZ = finite(zoneMinZ, zoneBaseZ);
    const resolvedMaxZ = finite(zoneMaxZ, zoneBaseZ);

    zoneBounds.push({
      code: zone.code,
      name: zone.name,
      centerZ: (resolvedMinZ + resolvedMaxZ) / 2,
      minZ: resolvedMinZ,
      maxZ: resolvedMaxZ,
      minX: finite(zoneMinX, 0),
      maxX: finite(zoneMaxX, 0),
    });

    zCursor = resolvedMaxZ + AISLE_SPACING_Z + ZONE_GAP_Z;
  });

  return { items, zoneBounds, aisleBounds };
}
