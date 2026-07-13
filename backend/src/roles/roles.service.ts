import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: { name: dto.name, companyId: user.companyId },
    });
    if (dto.permissionCodes?.length) {
      await this.syncPermissions(role.id, dto.permissionCodes);
    }
    return this.findOne(user, role.id);
  }

  async findAll(user: AuthenticatedUser) {
    return this.prisma.role.findMany({
      where: { OR: [{ companyId: user.companyId }, { companyId: null }] },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, OR: [{ companyId: user.companyId }, { companyId: null }] },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    return role;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(user, id);
    if (role.isSystem) {
      throw new NotFoundException('No se puede modificar un rol del sistema');
    }
    if (dto.name) {
      await this.prisma.role.update({ where: { id }, data: { name: dto.name } });
    }
    if (dto.permissionCodes) {
      await this.syncPermissions(id, dto.permissionCodes);
    }
    return this.findOne(user, id);
  }

  private async syncPermissions(roleId: string, codes: string[]) {
    const permissions = await this.prisma.permission.findMany({ where: { code: { in: codes } } });
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    });
  }
}
