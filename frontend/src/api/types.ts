export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { statusCode: number; message: string | string[] } | null;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  manager: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  lengthM: string | null;
  widthM: string | null;
  heightM: string | null;
  createdAt: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  family: string | null;
  baseUnit: string;
  active: boolean;
  lotControlled?: boolean;
  expiryControlled?: boolean;
  serialControlled?: boolean;
  minStock: string | null;
  maxStock: string | null;
}

export interface Zone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  type: string;
}

export interface Aisle {
  id: string;
  zoneId: string;
  code: string;
  axis: string;
  startX: string | null;
  startY: string | null;
  hasLeftRacks: boolean;
  hasRightRacks: boolean;
}

export interface Rack {
  id: string;
  aisleId: string;
  code: string;
  type: string;
  side: string;
  columns: number;
  levelsCount: number;
}

export interface Level {
  id: string;
  rackId: string;
  levelNumber: number;
  heightFromFloorM: string | null;
  maxLoadKg: string | null;
}

export type LocationStatus = 'FREE' | 'PARTIAL' | 'OCCUPIED' | 'BLOCKED' | 'RESERVED' | 'QUARANTINE';

export interface Location {
  id: string;
  warehouseId: string;
  levelId: string;
  code: string;
  status: LocationStatus;
  type: string;
  maxWeightKg: string | null;
  blockedReason: string | null;
}

export type HandlingUnitType = 'PALLET' | 'BOX' | 'CONTAINER' | 'OTHER';
export type HandlingUnitStatus = 'ACTIVE' | 'CLOSED' | 'SHIPPED' | 'BLOCKED' | 'QUARANTINE';

export interface HandlingUnit {
  id: string;
  companyId: string;
  warehouseId: string;
  locationId: string | null;
  code: string;
  type: HandlingUnitType;
  status: HandlingUnitStatus;
  weightKg: string | null;
  lengthCm: string | null;
  widthCm: string | null;
  heightCm: string | null;
  createdAt: string;
  location?: Location | null;
  _count?: { stock: number };
}

export interface StockLine {
  id: string;
  handlingUnitId: string;
  itemId: string;
  lotId: string | null;
  quantity: string;
  reservedQty: string;
  blockedQty: string;
  quarantineQty: string;
  unit: string;
  item: Item;
  handlingUnit: HandlingUnit;
  lot: { lotNumber: string; expiryDate: string | null } | null;
}

export type SerialNumberStatus = 'IN_STOCK' | 'RESERVED' | 'SHIPPED' | 'RETURNED' | 'SCRAPPED' | 'BLOCKED';

export interface SerialNumberRecord {
  id: string;
  itemId: string;
  serialNumber: string;
  status: SerialNumberStatus;
  createdAt: string;
  item: Item;
  stock: {
    id: string;
    handlingUnit: HandlingUnit;
  }[];
}
