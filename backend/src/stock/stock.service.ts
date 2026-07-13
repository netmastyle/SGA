import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockQueryDto } from './dto/stock-query.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, query: StockQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);

    const handlingUnitFilter: Record<string, unknown> = {};
    if (query.warehouseId) handlingUnitFilter.warehouseId = query.warehouseId;
    if (query.locationId) handlingUnitFilter.locationId = query.locationId;
    if (query.status) handlingUnitFilter.location = { status: query.status };

    const where = {
      companyId: user.companyId,
      ...(query.handlingUnitId ? { handlingUnitId: query.handlingUnitId } : {}),
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(Object.keys(handlingUnitFilter).length ? { handlingUnit: handlingUnitFilter } : {}),
      ...(query.search
        ? {
            OR: [
              { item: { sku: { contains: query.search } } },
              { item: { name: { contains: query.search } } },
              { handlingUnit: { code: { contains: query.search } } },
              { handlingUnit: { location: { code: { contains: query.search } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.stock.findMany({
        where,
        skip,
        take,
        include: { item: true, lot: true, handlingUnit: { include: { location: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.stock.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async adjust(user: AuthenticatedUser, dto: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const handlingUnit = await tx.handlingUnit.findFirst({
        where: { id: dto.handlingUnitId, companyId: user.companyId, deletedAt: null },
        include: { location: true },
      });
      if (!handlingUnit) {
        throw new NotFoundException('Contenedor no encontrado');
      }
      if (handlingUnit.location?.status === 'BLOCKED') {
        throw new BadRequestException('No se permite movimiento en una ubicación bloqueada');
      }

      const item = await tx.item.findFirst({
        where: { id: dto.itemId, companyId: user.companyId, deletedAt: null },
      });
      if (!item) {
        throw new NotFoundException('Artículo no encontrado');
      }
      if (item.serialControlled) {
        throw new BadRequestException(
          'Este artículo se controla por número de serie: use /serial-numbers en lugar de un ajuste genérico',
        );
      }

      const existing = await tx.stock.findFirst({
        where: { handlingUnitId: dto.handlingUnitId, itemId: dto.itemId, lotId: dto.lotId ?? null },
      });

      const currentQty = existing ? Number(existing.quantity) : 0;
      const newQty = currentQty + dto.quantityDelta;

      if (newQty < 0) {
        throw new BadRequestException('La operación dejaría el stock en negativo');
      }

      if (existing) {
        return tx.stock.update({ where: { id: existing.id }, data: { quantity: newQty } });
      }

      return tx.stock.create({
        data: {
          companyId: user.companyId,
          handlingUnitId: dto.handlingUnitId,
          itemId: dto.itemId,
          lotId: dto.lotId,
          quantity: newQty,
        },
      });
    });
  }
}
