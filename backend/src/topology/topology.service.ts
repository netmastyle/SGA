import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  CreateAisleDto,
  CreateLevelDto,
  CreateLocationDto,
  CreateRackDto,
  CreateZoneDto,
  UpdateAisleDto,
  UpdateLevelDto,
  UpdateRackDto,
  UpdateZoneDto,
} from './dto/topology.dto';

@Injectable()
export class TopologyService {
  constructor(private prisma: PrismaService) {}

  private async assertWarehouse(user: AuthenticatedUser, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId: user.companyId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }
    return warehouse;
  }

  private async assertZone(user: AuthenticatedUser, warehouseId: string, zoneId: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, warehouseId, companyId: user.companyId, deletedAt: null },
    });
    if (!zone) {
      throw new NotFoundException('Zona no encontrada');
    }
    return zone;
  }

  private async assertAisle(user: AuthenticatedUser, zoneId: string, aisleId: string) {
    const aisle = await this.prisma.aisle.findFirst({
      where: { id: aisleId, zoneId, companyId: user.companyId, deletedAt: null },
    });
    if (!aisle) {
      throw new NotFoundException('Pasillo no encontrado');
    }
    return aisle;
  }

  private async assertRack(user: AuthenticatedUser, aisleId: string, rackId: string) {
    const rack = await this.prisma.rack.findFirst({
      where: { id: rackId, aisleId, companyId: user.companyId, deletedAt: null },
    });
    if (!rack) {
      throw new NotFoundException('Estantería no encontrada');
    }
    return rack;
  }

  private async assertLevel(user: AuthenticatedUser, rackId: string, levelId: string) {
    const level = await this.prisma.level.findFirst({
      where: { id: levelId, rackId, companyId: user.companyId, deletedAt: null },
    });
    if (!level) {
      throw new NotFoundException('Nivel no encontrado');
    }
    return level;
  }

  // ---------------------------------------------------------------- Zones --
  async createZone(user: AuthenticatedUser, warehouseId: string, dto: CreateZoneDto) {
    await this.assertWarehouse(user, warehouseId);
    return this.prisma.zone.create({
      data: { ...dto, warehouseId, companyId: user.companyId } as Prisma.ZoneUncheckedCreateInput,
    });
  }

  async listZones(user: AuthenticatedUser, warehouseId: string) {
    await this.assertWarehouse(user, warehouseId);
    return this.prisma.zone.findMany({ where: { warehouseId, deletedAt: null } });
  }

  async getZone(user: AuthenticatedUser, warehouseId: string, zoneId: string) {
    await this.assertWarehouse(user, warehouseId);
    return this.assertZone(user, warehouseId, zoneId);
  }

  async updateZone(user: AuthenticatedUser, warehouseId: string, zoneId: string, dto: UpdateZoneDto) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    return this.prisma.zone.update({
      where: { id: zoneId },
      data: dto as Prisma.ZoneUncheckedUpdateInput,
    });
  }

  // --------------------------------------------------------------- Aisles --
  async createAisle(user: AuthenticatedUser, warehouseId: string, zoneId: string, dto: CreateAisleDto) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    return this.prisma.aisle.create({ data: { ...dto, zoneId, companyId: user.companyId } });
  }

  async listAisles(user: AuthenticatedUser, warehouseId: string, zoneId: string) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    return this.prisma.aisle.findMany({ where: { zoneId, deletedAt: null } });
  }

  async updateAisle(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    dto: UpdateAisleDto,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    return this.prisma.aisle.update({ where: { id: aisleId }, data: dto });
  }

  // ---------------------------------------------------------------- Racks --
  async createRack(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    dto: CreateRackDto,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);

    return this.prisma.rack.create({
      data: { ...dto, aisleId, companyId: user.companyId } as Prisma.RackUncheckedCreateInput,
    });
  }

  async listRacks(user: AuthenticatedUser, warehouseId: string, zoneId: string, aisleId: string) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    return this.prisma.rack.findMany({ where: { aisleId, deletedAt: null } });
  }

  async updateRack(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
    dto: UpdateRackDto,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    await this.assertRack(user, aisleId, rackId);
    return this.prisma.rack.update({
      where: { id: rackId },
      data: dto as Prisma.RackUncheckedUpdateInput,
    });
  }

  // --------------------------------------------------------------- Levels --
  async createLevel(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
    dto: CreateLevelDto,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    await this.assertRack(user, aisleId, rackId);
    return this.prisma.level.create({ data: { ...dto, rackId, companyId: user.companyId } });
  }

  async listLevels(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    await this.assertRack(user, aisleId, rackId);
    return this.prisma.level.findMany({ where: { rackId, deletedAt: null } });
  }

  async updateLevel(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
    levelId: string,
    dto: UpdateLevelDto,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    await this.assertRack(user, aisleId, rackId);
    await this.assertLevel(user, rackId, levelId);
    return this.prisma.level.update({ where: { id: levelId }, data: dto });
  }

  // ------------------------------------------------------------ Locations --
  async createLocation(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
    levelId: string,
    dto: CreateLocationDto,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    await this.assertRack(user, aisleId, rackId);
    await this.assertLevel(user, rackId, levelId);
    return this.prisma.location.create({
      data: { ...dto, levelId, warehouseId, companyId: user.companyId },
    });
  }

  async listLocations(
    user: AuthenticatedUser,
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
    levelId: string,
  ) {
    await this.assertWarehouse(user, warehouseId);
    await this.assertZone(user, warehouseId, zoneId);
    await this.assertAisle(user, zoneId, aisleId);
    await this.assertRack(user, aisleId, rackId);
    await this.assertLevel(user, rackId, levelId);
    return this.prisma.location.findMany({ where: { levelId, deletedAt: null } });
  }

  async listAllLocations(user: AuthenticatedUser, warehouseId: string) {
    await this.assertWarehouse(user, warehouseId);
    return this.prisma.location.findMany({ where: { warehouseId, deletedAt: null } });
  }

  async getFullTopology(user: AuthenticatedUser, warehouseId: string) {
    await this.assertWarehouse(user, warehouseId);
    return this.prisma.zone.findMany({
      where: { warehouseId, deletedAt: null },
      orderBy: { code: 'asc' },
      include: {
        aisles: {
          where: { deletedAt: null },
          orderBy: { code: 'asc' },
          include: {
            racks: {
              where: { deletedAt: null },
              orderBy: { code: 'asc' },
              include: {
                levels: {
                  where: { deletedAt: null },
                  orderBy: { levelNumber: 'asc' },
                  include: {
                    locations: {
                      where: { deletedAt: null },
                      orderBy: { code: 'asc' },
                      select: {
                        id: true,
                        code: true,
                        status: true,
                        type: true,
                        blockedReason: true,
                        _count: { select: { handlingUnits: { where: { deletedAt: null } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getLocation(user: AuthenticatedUser, warehouseId: string, locationId: string) {
    await this.assertWarehouse(user, warehouseId);
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, warehouseId, companyId: user.companyId, deletedAt: null },
      include: {
        handlingUnits: {
          where: { deletedAt: null },
          include: { stock: { include: { item: true, lot: true } } },
        },
      },
    });
    if (!location) throw new NotFoundException('Ubicación no encontrada');
    return location;
  }

  async blockLocation(user: AuthenticatedUser, warehouseId: string, locationId: string, reason: string) {
    await this.assertWarehouse(user, warehouseId);
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, warehouseId, companyId: user.companyId, deletedAt: null },
    });
    if (!location) {
      throw new NotFoundException('Ubicación no encontrada');
    }
    return this.prisma.location.update({
      where: { id: locationId },
      data: { status: 'BLOCKED', blockedReason: reason },
    });
  }

  async unblockLocation(user: AuthenticatedUser, warehouseId: string, locationId: string) {
    await this.assertWarehouse(user, warehouseId);
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, warehouseId, companyId: user.companyId, deletedAt: null },
    });
    if (!location) {
      throw new NotFoundException('Ubicación no encontrada');
    }
    if (location.status !== 'BLOCKED') {
      throw new BadRequestException('La ubicación no está bloqueada');
    }
    return this.prisma.location.update({
      where: { id: locationId },
      data: { status: 'FREE', blockedReason: null },
    });
  }
}
