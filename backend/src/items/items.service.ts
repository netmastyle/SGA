import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateItemDto) {
    const existing = await this.prisma.item.findFirst({ where: { companyId: user.companyId, sku: dto.sku } });
    if (existing) {
      throw new BadRequestException('Ya existe un artículo con ese SKU');
    }
    return this.prisma.item.create({ data: { ...dto, companyId: user.companyId } });
  }

  async findAll(user: AuthenticatedUser, query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);
    const where = {
      companyId: user.companyId,
      deletedAt: null,
      ...(query.search
        ? { OR: [{ name: { contains: query.search } }, { sku: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId, deletedAt: null } });
    if (!item) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return item;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateItemDto) {
    await this.findOne(user, id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.findOne(user, id);
    const stockCount = await this.prisma.stock.count({ where: { itemId: id } });
    if (stockCount > 0) {
      throw new BadRequestException('No se puede eliminar un artículo con stock o movimientos');
    }
    await this.prisma.item.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    return { deleted: true };
  }
}
