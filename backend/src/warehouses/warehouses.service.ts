import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { companyId: user.companyId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un almacén con ese código');
    }
    return this.prisma.warehouse.create({
      data: { ...dto, companyId: user.companyId } as Prisma.WarehouseUncheckedCreateInput,
    });
  }

  async findAll(user: AuthenticatedUser, query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);
    const where = {
      companyId: user.companyId,
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
      }),
      this.prisma.warehouse.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }
    return warehouse;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateWarehouseDto) {
    await this.findOne(user, id);
    return this.prisma.warehouse.update({
      where: { id },
      data: dto as Prisma.WarehouseUncheckedUpdateInput,
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.findOne(user, id);
    const stockCount = await this.prisma.stock.count({ where: { handlingUnit: { warehouseId: id } } });
    if (stockCount > 0) {
      throw new BadRequestException('No se puede eliminar un almacén con stock');
    }
    await this.prisma.warehouse.update({ where: { id }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }
}
