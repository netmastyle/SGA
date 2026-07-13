import type { Item } from './types';

export interface StockWithRelations {
  id: string;
  quantity: string;
  unit: string;
  item: Item;
  lot: { lotNumber: string; expiryDate: string | null } | null;
}

export interface HandlingUnitWithStock {
  id: string;
  code: string;
  type: 'PALLET' | 'BOX' | 'CONTAINER' | 'OTHER';
  status: 'ACTIVE' | 'CLOSED' | 'SHIPPED' | 'BLOCKED' | 'QUARANTINE';
  stock: StockWithRelations[];
}

export interface LocationNode {
  id: string;
  code: string;
  status: 'FREE' | 'PARTIAL' | 'OCCUPIED' | 'BLOCKED' | 'RESERVED' | 'QUARANTINE';
  type: string;
  blockedReason: string | null;
  _count: { handlingUnits: number };
}

export interface LocationDetail extends Omit<LocationNode, '_count'> {
  handlingUnits: HandlingUnitWithStock[];
}

export interface LevelNode {
  id: string;
  levelNumber: number;
  locations: LocationNode[];
}

export interface RackNode {
  id: string;
  code: string;
  type: string;
  side: 'LEFT' | 'RIGHT';
  columns: number;
  levelsCount: number;
  levels: LevelNode[];
}

export interface AisleNode {
  id: string;
  code: string;
  axis: 'X' | 'Y';
  startX: string | null;
  startY: string | null;
  racks: RackNode[];
}

export interface ZoneNode {
  id: string;
  code: string;
  name: string;
  type: string;
  aisles: AisleNode[];
}
