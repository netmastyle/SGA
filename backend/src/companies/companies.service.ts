import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({ where: { taxId: dto.taxId } });
    if (existing) {
      throw new BadRequestException('Ya existe una empresa con ese CIF/NIF');
    }
    return this.prisma.company.create({ data: dto });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);
    const where = {
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: { status: 'ACTIVE' } });
  }
}
