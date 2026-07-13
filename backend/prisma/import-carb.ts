import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface ImportData {
  items: { ref: string; name: string }[];
  locations: { code: string; zona: string; pasillo: string; estanteria: string; alt: string }[];
  handlingUnits: { code: string; locationCode: string }[];
  stockRows: { ref: string; serial: string; palet: string; blocked: boolean }[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const data: ImportData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import', 'carb-data.json'), 'utf-8'),
  );

  const company = await prisma.company.findUnique({ where: { taxId: 'B00000000' } });
  if (!company) throw new Error('Empresa demo no encontrada, ejecuta primero el seed principal (npx prisma db seed)');

  console.log('Limpiando datos existentes de la empresa...');
  await prisma.stock.deleteMany({ where: { companyId: company.id } });
  await prisma.serialNumber.deleteMany({ where: { companyId: company.id } });
  await prisma.handlingUnit.deleteMany({ where: { companyId: company.id } });
  await prisma.location.deleteMany({ where: { companyId: company.id } });
  await prisma.level.deleteMany({ where: { companyId: company.id } });
  await prisma.rack.deleteMany({ where: { companyId: company.id } });
  await prisma.aisle.deleteMany({ where: { companyId: company.id } });
  await prisma.zone.deleteMany({ where: { companyId: company.id } });
  await prisma.warehouse.deleteMany({ where: { companyId: company.id } });
  await prisma.lot.deleteMany({ where: { companyId: company.id } });
  await prisma.item.deleteMany({ where: { companyId: company.id } });

  console.log('Creando almacén único...');
  const warehouse = await prisma.warehouse.create({
    data: { companyId: company.id, code: 'ALM01', name: 'Almacén Central', status: 'ACTIVE' },
  });

  console.log('Creando zonas...');
  const zonaSet = Array.from(new Set(data.locations.map((l) => l.zona))).sort();
  const zoneByZona = new Map<string, string>();
  for (const zona of zonaSet) {
    const z = await prisma.zone.create({
      data: {
        companyId: company.id,
        warehouseId: warehouse.id,
        code: `Z${zona}`,
        name: `Zona ${zona}`,
        type: 'NORMAL',
      },
    });
    zoneByZona.set(zona, z.id);
  }

  console.log('Creando pasillos...');
  const aisleKeys = Array.from(new Set(data.locations.map((l) => `${l.zona}-${l.pasillo}`))).sort();
  const aisleByKey = new Map<string, string>();
  for (const key of aisleKeys) {
    const [zona, pasillo] = key.split('-');
    const aisle = await prisma.aisle.create({
      data: {
        companyId: company.id,
        zoneId: zoneByZona.get(zona)!,
        code: `P${pasillo}`,
        axis: 'X',
      },
    });
    aisleByKey.set(key, aisle.id);
  }

  console.log('Creando estanterías...');
  const rackKeys = Array.from(
    new Set(data.locations.map((l) => `${l.zona}-${l.pasillo}-${l.estanteria}`)),
  ).sort();
  const rackByKey = new Map<string, string>();
  for (const key of rackKeys) {
    const [zona, pasillo, estanteria] = key.split('-');
    const rack = await prisma.rack.create({
      data: {
        companyId: company.id,
        aisleId: aisleByKey.get(`${zona}-${pasillo}`)!,
        code: `R${estanteria}`,
        type: 'CONVENTIONAL',
        side: 'LEFT',
        columns: 1,
        levelsCount: 1,
      },
    });
    rackByKey.set(key, rack.id);
  }

  console.log('Creando niveles y ubicaciones...');
  const locationIdByCode = new Map<string, string>();
  for (const loc of data.locations) {
    const rackKey = `${loc.zona}-${loc.pasillo}-${loc.estanteria}`;
    const level = await prisma.level.create({
      data: {
        companyId: company.id,
        rackId: rackByKey.get(rackKey)!,
        levelNumber: parseInt(loc.alt, 10) || 0,
      },
    });
    const location = await prisma.location.create({
      data: {
        companyId: company.id,
        warehouseId: warehouse.id,
        levelId: level.id,
        code: loc.code,
        status: 'OCCUPIED',
        type: 'RESERVE',
        multiSku: true,
      },
    });
    locationIdByCode.set(loc.code, location.id);
  }

  console.log('Creando artículos...');
  const itemIdByRef = new Map<string, string>();
  for (const item of data.items) {
    const created = await prisma.item.create({
      data: {
        companyId: company.id,
        sku: item.ref,
        name: item.name,
        baseUnit: 'UNIT',
        serialControlled: true,
        pickingPolicy: 'MANUAL',
      },
    });
    itemIdByRef.set(item.ref, created.id);
  }

  console.log('Creando contenedores (palets)...');
  const handlingUnitIdByCode = new Map<string, string>();
  for (const hu of data.handlingUnits) {
    const locationId = locationIdByCode.get(hu.locationCode);
    const created = await prisma.handlingUnit.create({
      data: {
        companyId: company.id,
        warehouseId: warehouse.id,
        locationId,
        code: hu.code,
        type: 'OTHER',
        status: 'ACTIVE',
      },
    });
    handlingUnitIdByCode.set(hu.code, created.id);
  }

  console.log(`Creando ${data.stockRows.length} números de serie y líneas de stock...`);
  const batches = chunk(data.stockRows, 500);
  let done = 0;
  for (const batch of batches) {
    const serialData = batch.map((row) => ({
      id: randomUUID(),
      companyId: company.id,
      itemId: itemIdByRef.get(row.ref)!,
      serialNumber: row.serial,
      status: row.blocked ? 'BLOCKED' : 'IN_STOCK',
    }));
    await prisma.serialNumber.createMany({ data: serialData });

    const stockData = batch.map((row, i) => ({
      id: randomUUID(),
      companyId: company.id,
      handlingUnitId: handlingUnitIdByCode.get(row.palet)!,
      itemId: itemIdByRef.get(row.ref)!,
      serialNumberId: serialData[i].id,
      quantity: 1,
    }));
    await prisma.stock.createMany({ data: stockData });

    done += batch.length;
    console.log(`  ${done}/${data.stockRows.length}`);
  }

  console.log('Importación completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
