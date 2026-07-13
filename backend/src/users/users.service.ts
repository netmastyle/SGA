import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { buildPaginatedResult, paginationArgs } from '../common/paginate';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(currentUser: AuthenticatedUser, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { companyId: currentUser.companyId, email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un usuario con ese email en la empresa');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        companyId: currentUser.companyId,
        email: dto.email,
        passwordHash,
        name: dto.name,
        roleId: dto.roleId,
        status: dto.status ?? 'ACTIVE',
      },
    });
    return this.sanitize(user);
  }

  async findAll(currentUser: AuthenticatedUser, query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query);
    const where = {
      companyId: currentUser.companyId,
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
        include: { role: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return buildPaginatedResult(items.map((u) => this.sanitize(u)), total, page, pageSize);
  }

  async findOne(currentUser: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId: currentUser.companyId, deletedAt: null },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.sanitize(user);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateUserDto) {
    await this.findOne(currentUser, id);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return this.sanitize(user);
  }

  async remove(currentUser: AuthenticatedUser, id: string) {
    await this.findOne(currentUser, id);
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
    return { deleted: true };
  }

  private sanitize<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
