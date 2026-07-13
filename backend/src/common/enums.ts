// SQL Server connector does not support native Prisma enums, so enumerated
// values are stored as strings and validated at the application layer here.

export const CompanyStatus = ['ACTIVE', 'INACTIVE'] as const;
export const UserStatus = ['ACTIVE', 'INACTIVE'] as const;
export const WarehouseStatus = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;
export const ZoneType = [
  'NORMAL',
  'CONTROLLED_TEMPERATURE',
  'HAZARDOUS',
  'QUARANTINE',
  'SHIPPING',
  'RECEIVING',
] as const;
export const AisleAxis = ['X', 'Y'] as const;
export const RackType = ['CONVENTIONAL', 'DRIVE_IN', 'CANTILEVER', 'MEZZANINE'] as const;
export const RackSide = ['LEFT', 'RIGHT'] as const;
export const LocationStatus = [
  'FREE',
  'PARTIAL',
  'OCCUPIED',
  'BLOCKED',
  'RESERVED',
  'QUARANTINE',
] as const;
export const LocationType = ['NORMAL', 'PICKING', 'RESERVE', 'FULL_PALLET', 'SPECIAL'] as const;
export const ItemPickingPolicy = ['FIFO', 'FEFO', 'LIFO', 'MANUAL'] as const;
export const LotStatus = ['ACTIVE', 'QUARANTINE', 'BLOCKED', 'EXPIRED'] as const;
export const HandlingUnitType = ['PALLET', 'BOX', 'CONTAINER', 'OTHER'] as const;
export const HandlingUnitStatus = ['ACTIVE', 'CLOSED', 'SHIPPED', 'BLOCKED', 'QUARANTINE'] as const;
export const SerialNumberStatus = ['IN_STOCK', 'RESERVED', 'SHIPPED', 'RETURNED', 'SCRAPPED', 'BLOCKED'] as const;

export type CompanyStatus = (typeof CompanyStatus)[number];
export type UserStatus = (typeof UserStatus)[number];
export type WarehouseStatus = (typeof WarehouseStatus)[number];
export type ZoneType = (typeof ZoneType)[number];
export type AisleAxis = (typeof AisleAxis)[number];
export type RackType = (typeof RackType)[number];
export type RackSide = (typeof RackSide)[number];
export type LocationStatus = (typeof LocationStatus)[number];
export type LocationType = (typeof LocationType)[number];
export type ItemPickingPolicy = (typeof ItemPickingPolicy)[number];
export type LotStatus = (typeof LotStatus)[number];
export type HandlingUnitType = (typeof HandlingUnitType)[number];
export type HandlingUnitStatus = (typeof HandlingUnitStatus)[number];
export type SerialNumberStatus = (typeof SerialNumberStatus)[number];

export const PERMISSIONS = [
  'warehouse.read',
  'warehouse.create',
  'warehouse.update',
  'warehouse.delete',
  'inventory.read',
  'inventory.adjust',
  'movement.create',
  'movement.cancel',
  'order.create',
  'order.update',
  'order.cancel',
  'task.assign',
  'task.execute',
  'report.export',
  'api_token.manage',
  'audit.read',
  'user.manage',
  'item.read',
  'item.create',
  'item.update',
  'item.delete',
  'company.manage',
  'role.manage',
  'handling_unit.read',
  'handling_unit.create',
  'handling_unit.update',
  'handling_unit.move',
  'serial_number.read',
  'serial_number.create',
  'serial_number.update',
  'serial_number.move',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const SYSTEM_ROLES = {
  SYSTEM_ADMIN: 'Administrador del sistema',
  WAREHOUSE_MANAGER: 'Responsable de almacén',
  OPERATOR: 'Operario',
  AUDITOR: 'Auditor/Gerencia',
} as const;
