import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HandlingUnitStatus, HandlingUnitType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { CreateHandlingUnitDto } from './dto/create-handling-unit.dto';
import { UpdateHandlingUnitDto } from './dto/update-handling-unit.dto';
import { MoveHandlingUnitDto } from './dto/move-handling-unit.dto';
import { HandlingUnitQueryDto } from './dto/handling-unit-query.dto';

@Injectable()
export class HandlingUnitsService {
  constructor(private prisma: PrismaService) {}

  private async assertLocation(user: AuthenticatedUser, warehouseId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, warehouseId, companyId: user.companyId, deletedAt: null },
    });
    if (!location) {
      throw new NotFoundException('Ubicación no encontrada');
    }
    if (location.status === 'BLOCKED') {
      throw new BadRequestException('No se puede ubicar un contenedor en una ubicación bloqueada');
    }
    return location;
  }

  async create(user: AuthenticatedUser, dto: CreateHandlingUnitDto) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, companyId: user.companyId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }

    const existing = await this.prisma.handlingUnit.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code } },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un contenedor con ese código');
    }

    if (dto.locationId) {
      await this.assertLocation(user, dto.warehouseId, dto.locationId);
    }

    return this.prisma.handlingUnit.create({
      data: {
        companyId: user.companyId,
        warehouseId: dto.warehouseId,
        locationId: dto.locationId,
        code: dto.code,
        type: (dto.type ?? 'PALLET') as HandlingUnitType,
        weightKg: dto.weightKg,
        lengthCm: dto.lengthCm,
        widthCm: dto.widthCm,
        heightCm: dto.heightCm,
      },
    });
  }

  async findAll(user: AuthenticatedUser, query: HandlingUnitQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);
    const where: Prisma.HandlingUnitWhereInput = {
      companyId: user.companyId,
      deletedAt: null,
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.status ? { status: query.status as HandlingUnitStatus } : {}),
      ...(query.type ? { type: query.type as HandlingUnitType } : {}),
      ...(query.search ? { code: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.handlingUnit.findMany({
        where,
        skip,
        take,
        include: { location: true, _count: { select: { stock: true } } },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
      }),
      this.prisma.handlingUnit.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const hu = await this.prisma.handlingUnit.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
      include: {
        location: true,
        stock: { include: { item: true, lot: true } },
      },
    });
    if (!hu) {
      throw new NotFoundException('Contenedor no encontrado');
    }
    return hu;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateHandlingUnitDto) {
    await this.findOne(user, id);
    return this.prisma.handlingUnit.update({
      where: { id },
      data: dto as Prisma.HandlingUnitUncheckedUpdateInput,
    });
  }

  async move(user: AuthenticatedUser, id: string, dto: MoveHandlingUnitDto) {
    const hu = await this.findOne(user, id);
    await this.assertLocation(user, hu.warehouseId, dto.locationId);
    return this.prisma.handlingUnit.update({ where: { id }, data: { locationId: dto.locationId } });
  }

  async remove(user: AuthenticatedUser, id: string) {
    const hu = await this.findOne(user, id);
    const stockCount = await this.prisma.stock.count({ where: { handlingUnitId: id } });
    if (stockCount > 0) {
      throw new BadRequestException('No se puede eliminar un contenedor con stock');
    }
    await this.prisma.handlingUnit.update({ where: { id }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }
}
