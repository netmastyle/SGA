import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findUnique({ where: { taxId: 'B00000000' } });
  if (!company) throw new Error('Empresa demo no encontrada');

  const warehouse = await prisma.warehouse.findFirst({ where: { companyId: company.id } });
  if (!warehouse) throw new Error('Almacén no encontrado');

  const zones = await prisma.zone.findMany({
    where: { companyId: company.id },
    include: {
      aisles: {
        include: {
          racks: {
            include: { levels: true },
          },
        },
      },
    },
  });

  let created = 0;

  for (const zone of zones) {
    for (const aisle of zone.aisles) {
      // Union of all level numbers used by any rack in this aisle.
      const altSet = new Set<number>();
      for (const rack of aisle.racks) {
        for (const level of rack.levels) altSet.add(level.levelNumber);
      }

      for (const rack of aisle.racks) {
        const existingAlts = new Set(rack.levels.map((l) => l.levelNumber));
        for (const alt of altSet) {
          if (existingAlts.has(alt)) continue;

          const level = await prisma.level.create({
            data: { companyId: company.id, rackId: rack.id, levelNumber: alt },
          });

          const zonaCode = zone.code.replace('Z', '').padStart(2, '0');
          const pasilloCode = aisle.code.replace('P', '').padStart(2, '0');
          const estanteriaCode = rack.code.replace('R', '').padStart(2, '0');
          const altCode = alt.toString().padStart(2, '0');
          const code = `UBI-${zonaCode}${pasilloCode}${estanteriaCode}${altCode}`;

          await prisma.location.create({
            data: {
              companyId: company.id,
              warehouseId: warehouse.id,
              levelId: level.id,
              code,
              status: 'FREE',
              type: 'RESERVE',
              multiSku: true,
            },
          });
          created += 1;
        }
      }
    }
  }

  console.log(`Huecos vacíos creados: ${created}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
