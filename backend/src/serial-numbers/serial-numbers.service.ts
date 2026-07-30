import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SerialNumberStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { RegisterSerialNumberDto } from './dto/register-serial-number.dto';
import { UpdateSerialNumberStatusDto } from './dto/update-serial-number-status.dto';
import { MoveSerialNumberDto } from './dto/move-serial-number.dto';
import { SerialNumberQueryDto } from './dto/serial-number-query.dto';

const STOCK_INCLUDE = { handlingUnit: { include: { location: true } } } as const;

@Injectable()
export class SerialNumbersService {
  constructor(private prisma: PrismaService) {}

  private async assertHandlingUnit(user: AuthenticatedUser, handlingUnitId: string) {
    const hu = await this.prisma.handlingUnit.findFirst({
      where: { id: handlingUnitId, companyId: user.companyId, deletedAt: null },
      include: { location: true },
    });
    if (!hu) {
      throw new NotFoundException('Contenedor no encontrado');
    }
    if (hu.location?.status === 'BLOCKED') {
      throw new BadRequestException('No se puede ubicar en un contenedor cuya ubicación está bloqueada');
    }
    return hu;
  }

  async register(user: AuthenticatedUser, dto: RegisterSerialNumberDto) {
    const item = await this.prisma.item.findFirst({
      where: { id: dto.itemId, companyId: user.companyId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('Artículo no encontrado');
    }
    if (!item.serialControlled) {
      throw new BadRequestException('El artículo no está configurado con control por número de serie');
    }

    const existing = await this.prisma.serialNumber.findUnique({
      where: { itemId_serialNumber: { itemId: dto.itemId, serialNumber: dto.serialNumber } },
    });
    if (existing) {
      throw new BadRequestException('Ya existe ese número de serie para este artículo');
    }

    if (dto.handlingUnitId) {
      await this.assertHandlingUnit(user, dto.handlingUnitId);
    }

    return this.prisma.$transaction(async (tx) => {
      const serial = await tx.serialNumber.create({
        data: {
          companyId: user.companyId,
          itemId: dto.itemId,
          serialNumber: dto.serialNumber,
          status: 'IN_STOCK',
        },
      });

      if (dto.handlingUnitId) {
        await tx.stock.create({
          data: {
            companyId: user.companyId,
            handlingUnitId: dto.handlingUnitId,
            itemId: dto.itemId,
            serialNumberId: serial.id,
            quantity: 1,
          },
        });
      }

      return tx.serialNumber.findUnique({
        where: { id: serial.id },
        include: { item: true, stock: { include: STOCK_INCLUDE } },
      });
    });
  }

  async findAll(user: AuthenticatedUser, query: SerialNumberQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);

    const stockFilter: Record<string, unknown> = {};
    if (query.handlingUnitId) stockFilter.handlingUnitId = query.handlingUnitId;
    if (query.warehouseId) stockFilter.handlingUnit = { warehouseId: query.warehouseId };

    const where: Prisma.SerialNumberWhereInput = {
      companyId: user.companyId,
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(query.status ? { status: query.status as SerialNumberStatus } : {}),
      ...(query.search ? { serialNumber: { contains: query.search } } : {}),
      ...(Object.keys(stockFilter).length ? { stock: { some: stockFilter } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.serialNumber.findMany({
        where,
        skip,
        take,
        include: { item: true, stock: { include: STOCK_INCLUDE } },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
      }),
      this.prisma.serialNumber.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const serial = await this.prisma.serialNumber.findFirst({
      where: { id, companyId: user.companyId },
      include: { item: true, stock: { include: STOCK_INCLUDE } },
    });
    if (!serial) {
      throw new NotFoundException('Número de serie no encontrado');
    }
    return serial;
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateSerialNumberStatusDto) {
    const serial = await this.findOne(user, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.status === 'SHIPPED' || dto.status === 'SCRAPPED') {
        await tx.stock.deleteMany({ where: { serialNumberId: serial.id } });
      }
      return tx.serialNumber.update({
        where: { id },
        data: { status: dto.status as SerialNumberStatus },
        include: { item: true, stock: { include: STOCK_INCLUDE } },
      });
    });
  }

  async move(user: AuthenticatedUser, id: string, dto: MoveSerialNumberDto) {
    const serial = await this.findOne(user, id);
    await this.assertHandlingUnit(user, dto.handlingUnitId);

    return this.prisma.$transaction(async (tx) => {
      const existingStock = serial.stock[0];

      if (existingStock) {
        await tx.stock.update({ where: { id: existingStock.id }, data: { handlingUnitId: dto.handlingUnitId } });
      } else {
        await tx.stock.create({
          data: {
            companyId: user.companyId,
            handlingUnitId: dto.handlingUnitId,
            itemId: serial.itemId,
            serialNumberId: serial.id,
            quantity: 1,
          },
        });
      }

      return tx.serialNumber.update({
        where: { id },
        data: { status: 'IN_STOCK' },
        include: { item: true, stock: { include: STOCK_INCLUDE } },
      });
    });
  }
}
