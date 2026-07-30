import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSIONS, SYSTEM_ROLES } from '../src/common/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding permissions...');
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
  const allPermissions = await prisma.permission.findMany();

  console.log('Seeding demo company...');
  const company = await prisma.company.upsert({
    where: { taxId: 'B00000000' },
    update: {},
    create: {
      name: 'Empresa Demo SGA',
      taxId: 'B00000000',
      address: 'Polígono Industrial Demo, Nave 1',
      status: 'ACTIVE',
    },
  });

  console.log('Seeding roles...');
  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: SYSTEM_ROLES.SYSTEM_ADMIN } },
    update: {},
    create: { name: SYSTEM_ROLES.SYSTEM_ADMIN, companyId: company.id, isSystem: true },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
  });

  const managerRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: SYSTEM_ROLES.WAREHOUSE_MANAGER } },
    update: {},
    create: { name: SYSTEM_ROLES.WAREHOUSE_MANAGER, companyId: company.id, isSystem: true },
  });
  const managerCodes = [
    'warehouse.read',
    'warehouse.create',
    'warehouse.update',
    'inventory.read',
    'inventory.adjust',
    'movement.create',
    'order.create',
    'order.update',
    'task.assign',
    'report.export',
    'item.read',
    'item.create',
    'item.update',
  ];
  await prisma.rolePermission.deleteMany({ where: { roleId: managerRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.filter((p) => managerCodes.includes(p.code)).map((p) => ({ roleId: managerRole.id, permissionId: p.id })),
  });

  const operatorRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: SYSTEM_ROLES.OPERATOR } },
    update: {},
    create: { name: SYSTEM_ROLES.OPERATOR, companyId: company.id, isSystem: true },
  });
  const operatorCodes = ['warehouse.read', 'inventory.read', 'movement.create', 'task.execute', 'item.read'];
  await prisma.rolePermission.deleteMany({ where: { roleId: operatorRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.filter((p) => operatorCodes.includes(p.code)).map((p) => ({ roleId: operatorRole.id, permissionId: p.id })),
  });

  const auditorRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: SYSTEM_ROLES.AUDITOR } },
    update: {},
    create: { name: SYSTEM_ROLES.AUDITOR, companyId: company.id, isSystem: true },
  });
  const auditorCodes = ['warehouse.read', 'inventory.read', 'report.export', 'audit.read', 'item.read'];
  await prisma.rolePermission.deleteMany({ where: { roleId: auditorRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.filter((p) => auditorCodes.includes(p.code)).map((p) => ({ roleId: auditorRole.id, permissionId: p.id })),
  });

  console.log('Seeding admin user...');
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'admin@sga-demo.local' } },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@sga-demo.local',
      passwordHash,
      name: 'Administrador Demo',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });

  console.log('Seeding demo warehouse topology...');
  const warehouse = await prisma.warehouse.upsert({
    where: { companyId_code: { companyId: company.id, code: 'ALM01' } },
    update: {},
    create: {
      companyId: company.id,
      code: 'ALM01',
      name: 'Almacén Central',
      address: 'Calle Logística 1',
      status: 'ACTIVE',
      lengthM: 50,
      widthM: 30,
      heightM: 10,
    },
  });

  const zone = await prisma.zone.upsert({
    where: { warehouseId_code: { warehouseId: warehouse.id, code: 'Z01' } },
    update: {},
    create: {
      companyId: company.id,
      warehouseId: warehouse.id,
      code: 'Z01',
      name: 'Zona General',
      type: 'NORMAL',
    },
  });

  const aisle = await prisma.aisle.upsert({
    where: { zoneId_code: { zoneId: zone.id, code: 'P01' } },
    update: {},
    create: {
      companyId: company.id,
      zoneId: zone.id,
      code: 'P01',
      axis: 'X',
      startX: 0,
      startY: 0,
      lengthM: 20,
      widthM: 2,
      hasLeftRacks: true,
      hasRightRacks: true,
    },
  });

  const aisle2 = await prisma.aisle.upsert({
    where: { zoneId_code: { zoneId: zone.id, code: 'P02' } },
    update: {},
    create: {
      companyId: company.id,
      zoneId: zone.id,
      code: 'P02',
      axis: 'X',
      startX: 0,
      startY: 5,
      lengthM: 20,
      widthM: 2,
      hasLeftRacks: true,
      hasRightRacks: false,
    },
  });

  const zone2 = await prisma.zone.upsert({
    where: { warehouseId_code: { warehouseId: warehouse.id, code: 'Z02' } },
    update: {},
    create: {
      companyId: company.id,
      warehouseId: warehouse.id,
      code: 'Z02',
      name: 'Zona Refrigerados',
      type: 'CONTROLLED_TEMPERATURE',
      minTemp: 2,
      maxTemp: 6,
    },
  });

  const aisle3 = await prisma.aisle.upsert({
    where: { zoneId_code: { zoneId: zone2.id, code: 'P03' } },
    update: {},
    create: {
      companyId: company.id,
      zoneId: zone2.id,
      code: 'P03',
      axis: 'Y',
      startX: 25,
      startY: 0,
      lengthM: 10,
      widthM: 2,
      hasLeftRacks: true,
      hasRightRacks: true,
    },
  });

  const rackDefs = [
    { code: 'R01', aisleId: aisle.id, side: 'LEFT' as const, columns: 5, levelsCount: 3 },
    { code: 'R02', aisleId: aisle.id, side: 'RIGHT' as const, columns: 5, levelsCount: 3 },
    { code: 'R03', aisleId: aisle2.id, side: 'LEFT' as const, columns: 4, levelsCount: 2 },
    { code: 'R04', aisleId: aisle3.id, side: 'LEFT' as const, columns: 3, levelsCount: 2, type: 'CANTILEVER' as const },
  ];

  type LocationRef = { id: string; code: string };
  const allCreatedLocations: LocationRef[] = [];

  for (const def of rackDefs) {
    const rack = await prisma.rack.upsert({
      where: { aisleId_code: { aisleId: def.aisleId, code: def.code } },
      update: {},
      create: {
        companyId: company.id,
        aisleId: def.aisleId,
        code: def.code,
        type: def.type ?? 'CONVENTIONAL',
        side: def.side,
        columns: def.columns,
        levelsCount: def.levelsCount,
        maxLoadKg: 1000,
      },
    });

    const zoneCode = def.aisleId === aisle3.id ? zone2.code : zone.code;
    const aisleCode = def.aisleId === aisle.id ? aisle.code : def.aisleId === aisle2.id ? aisle2.code : aisle3.code;

    for (let levelNumber = 1; levelNumber <= def.levelsCount; levelNumber++) {
      const level = await prisma.level.upsert({
        where: { rackId_levelNumber: { rackId: rack.id, levelNumber } },
        update: {},
        create: {
          companyId: company.id,
          rackId: rack.id,
          levelNumber,
          heightFromFloorM: levelNumber * 1.5,
          clearHeightM: 1.4,
          maxLoadKg: 500,
        },
      });

      for (let col = 1; col <= def.columns; col++) {
        const code = `ALM01-${zoneCode}-${aisleCode}-${def.code}-${levelNumber}-${col.toString().padStart(2, '0')}`;
        const location = await prisma.location.upsert({
          where: { warehouseId_code: { warehouseId: warehouse.id, code } },
          update: {},
          create: {
            companyId: company.id,
            warehouseId: warehouse.id,
            levelId: level.id,
            code,
            maxWeightKg: 100,
            status: 'FREE',
            type: levelNumber === 1 ? 'PICKING' : 'RESERVE',
          },
        });
        allCreatedLocations.push({ id: location.id, code: location.code });
      }
    }
  }

  console.log('Seeding demo items...');
  const itemDefs = [
    {
      sku: 'SKU-0001',
      ean: '8400000000017',
      name: 'Caja de tornillos M6',
      family: 'Ferretería',
      baseUnit: 'UNIT',
      weightKg: 0.5,
      pickingPolicy: 'FIFO' as const,
      minStock: 50,
      maxStock: 1000,
    },
    {
      sku: 'SKU-0002',
      ean: '8400000000024',
      name: 'Palet de botellas de agua',
      family: 'Alimentación',
      baseUnit: 'PALLET',
      weightKg: 800,
      lotControlled: true,
      expiryControlled: true,
      pickingPolicy: 'FEFO' as const,
      minStock: 5,
      maxStock: 50,
    },
    {
      sku: 'SKU-0003',
      ean: '8400000000031',
      name: 'Pallet de cajas de cartón',
      family: 'Embalaje',
      baseUnit: 'PALLET',
      weightKg: 120,
      pickingPolicy: 'FIFO' as const,
      minStock: 10,
      maxStock: 200,
    },
    {
      sku: 'SKU-0004',
      ean: '8400000000048',
      name: 'Bidón de aceite industrial 20L',
      family: 'Químicos',
      baseUnit: 'UNIT',
      weightKg: 18,
      hazardous: true,
      adrClass: '3',
      pickingPolicy: 'FIFO' as const,
      minStock: 20,
      maxStock: 300,
    },
    {
      sku: 'SKU-0005',
      ean: '8400000000055',
      name: 'Yogures pack x12 (refrigerado)',
      family: 'Alimentación refrigerada',
      baseUnit: 'BOX',
      weightKg: 6,
      lotControlled: true,
      expiryControlled: true,
      pickingPolicy: 'FEFO' as const,
      minStock: 30,
      maxStock: 400,
    },
    {
      sku: 'SKU-0006',
      ean: '8400000000062',
      name: 'Transpaleta eléctrica',
      family: 'Maquinaria',
      baseUnit: 'UNIT',
      weightKg: 250,
      serialControlled: true,
      pickingPolicy: 'FIFO' as const,
      minStock: 1,
      maxStock: 20,
    },
  ];

  const items: Awaited<ReturnType<typeof prisma.item.upsert>>[] = [];
  for (const def of itemDefs) {
    const item = await prisma.item.upsert({
      where: { companyId_sku: { companyId: company.id, sku: def.sku } },
      update: {},
      create: { ...def, companyId: company.id } as Prisma.ItemUncheckedCreateInput,
    });
    items.push(item);
  }
  const [item1, item2, item3, item4, item5, item6] = items;

  console.log('Seeding lots...');
  const lotA = await prisma.lot.upsert({
    where: { itemId_lotNumber: { itemId: item2.id, lotNumber: 'LOTE-AGUA-2026-01' } },
    update: {},
    create: {
      companyId: company.id,
      itemId: item2.id,
      lotNumber: 'LOTE-AGUA-2026-01',
      manufactureDate: new Date('2026-01-10'),
      expiryDate: new Date('2027-01-10'),
      status: 'ACTIVE',
    },
  });
  const lotB = await prisma.lot.upsert({
    where: { itemId_lotNumber: { itemId: item5.id, lotNumber: 'LOTE-YOGUR-2026-06' } },
    update: {},
    create: {
      companyId: company.id,
      itemId: item5.id,
      lotNumber: 'LOTE-YOGUR-2026-06',
      manufactureDate: new Date('2026-06-01'),
      expiryDate: new Date('2026-07-15'),
      status: 'ACTIVE',
    },
  });

  console.log('Seeding contenedores (handling units) y stock distribuido...');

  let huCounter = 0;

  async function setStock(
    locationCode: string,
    itemId: string,
    quantity: number,
    locationStatus: string,
    lotId?: string,
    blockedReason?: string,
    huType: 'PALLET' | 'BOX' | 'CONTAINER' | 'OTHER' = 'PALLET',
  ) {
    const location = allCreatedLocations.find((l) => l.code === locationCode);
    if (!location) return;

    huCounter += 1;
    const huCode = `HU-${huCounter.toString().padStart(5, '0')}`;

    const handlingUnit = await prisma.handlingUnit.upsert({
      where: { companyId_code: { companyId: company.id, code: huCode } },
      update: {},
      create: {
        companyId: company.id,
        warehouseId: warehouse.id,
        locationId: location.id,
        code: huCode,
        type: huType,
        status: locationStatus === 'QUARANTINE' ? 'QUARANTINE' : locationStatus === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
      },
    });

    const existing = await prisma.stock.findFirst({
      where: { handlingUnitId: handlingUnit.id, itemId, lotId: lotId ?? null },
    });
    if (!existing) {
      await prisma.stock.create({
        data: {
          companyId: company.id,
          handlingUnitId: handlingUnit.id,
          itemId,
          lotId,
          quantity,
        },
      });
    }
    await prisma.location.update({
      where: { id: location.id },
      data: { status: locationStatus, blockedReason: blockedReason ?? null } as Prisma.LocationUncheckedUpdateInput,
    });
  }

  await setStock('ALM01-Z01-P01-R01-1-01', item1.id, 200, 'OCCUPIED', undefined, undefined, 'BOX');
  await setStock('ALM01-Z01-P01-R01-1-02', item1.id, 80, 'PARTIAL', undefined, undefined, 'BOX');
  await setStock('ALM01-Z01-P01-R01-1-03', item3.id, 40, 'OCCUPIED');
  await setStock('ALM01-Z01-P01-R01-2-01', item2.id, 12, 'OCCUPIED', lotA.id);
  await setStock('ALM01-Z01-P01-R01-2-02', item2.id, 6, 'PARTIAL', lotA.id);
  await setStock('ALM01-Z01-P01-R01-3-01', item3.id, 90, 'RESERVED');

  await setStock('ALM01-Z01-P01-R02-1-01', item4.id, 60, 'OCCUPIED', undefined, undefined, 'CONTAINER');
  await setStock(
    'ALM01-Z01-P01-R02-1-02',
    item4.id,
    0,
    'BLOCKED',
    undefined,
    'Estructura dañada, pendiente de inspección',
    'CONTAINER',
  );
  await setStock('ALM01-Z01-P01-R02-2-01', item4.id, 25, 'QUARANTINE', undefined, undefined, 'CONTAINER');

  await setStock('ALM01-Z01-P02-R03-1-01', item3.id, 150, 'OCCUPIED');
  await setStock('ALM01-Z01-P02-R03-1-02', item1.id, 300, 'OCCUPIED', undefined, undefined, 'BOX');

  await setStock('ALM01-Z02-P03-R04-1-01', item5.id, 80, 'OCCUPIED', lotB.id, undefined, 'BOX');
  await setStock('ALM01-Z02-P03-R04-1-02', item5.id, 20, 'PARTIAL', lotB.id, undefined, 'BOX');
  await setStock('ALM01-Z02-P03-R04-2-01', item5.id, 0, 'QUARANTINE', lotB.id, undefined, 'BOX');

  console.log('Seeding números de serie...');
  const transpaletLocation = allCreatedLocations.find((l) => l.code === 'ALM01-Z01-P02-R03-1-02');
  if (transpaletLocation) {
    const huSerial = await prisma.handlingUnit.upsert({
      where: { companyId_code: { companyId: company.id, code: 'HU-SERIAL-01' } },
      update: {},
      create: {
        companyId: company.id,
        warehouseId: warehouse.id,
        locationId: transpaletLocation.id,
        code: 'HU-SERIAL-01',
        type: 'OTHER',
        status: 'ACTIVE',
      },
    });

    const serial1 = await prisma.serialNumber.upsert({
      where: { itemId_serialNumber: { itemId: item6.id, serialNumber: 'TRANSP-2026-001' } },
      update: {},
      create: { companyId: company.id, itemId: item6.id, serialNumber: 'TRANSP-2026-001', status: 'IN_STOCK' },
    });
    const existingSerialStock = await prisma.stock.findFirst({ where: { serialNumberId: serial1.id } });
    if (!existingSerialStock) {
      await prisma.stock.create({
        data: {
          companyId: company.id,
          handlingUnitId: huSerial.id,
          itemId: item6.id,
          serialNumberId: serial1.id,
          quantity: 1,
        },
      });
    }

    await prisma.serialNumber.upsert({
      where: { itemId_serialNumber: { itemId: item6.id, serialNumber: 'TRANSP-2026-002' } },
      update: {},
      create: { companyId: company.id, itemId: item6.id, serialNumber: 'TRANSP-2026-002', status: 'SHIPPED' },
    });
  }

  console.log('Seed completado.');
  console.log('Usuario admin: admin@sga-demo.local / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
