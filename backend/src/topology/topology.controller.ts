import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TopologyService } from './topology.service';
import {
  BlockLocationDto,
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

@ApiTags('topology')
@Controller('warehouses/:warehouseId')
export class TopologyController {
  constructor(private topologyService: TopologyService) {}

  // Zones
  @Post('zones')
  @RequirePermissions('warehouse.update')
  createZone(@CurrentUser() user: AuthenticatedUser, @Param('warehouseId') warehouseId: string, @Body() dto: CreateZoneDto) {
    return this.topologyService.createZone(user, warehouseId, dto);
  }

  @Get('zones')
  @RequirePermissions('warehouse.read')
  listZones(@CurrentUser() user: AuthenticatedUser, @Param('warehouseId') warehouseId: string) {
    return this.topologyService.listZones(user, warehouseId);
  }

  @Get('zones/:zoneId')
  @RequirePermissions('warehouse.read')
  getZone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.topologyService.getZone(user, warehouseId, zoneId);
  }

  @Patch('zones/:zoneId')
  @RequirePermissions('warehouse.update')
  updateZone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.topologyService.updateZone(user, warehouseId, zoneId, dto);
  }

  // Aisles
  @Post('zones/:zoneId/aisles')
  @RequirePermissions('warehouse.update')
  createAisle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: CreateAisleDto,
  ) {
    return this.topologyService.createAisle(user, warehouseId, zoneId, dto);
  }

  @Get('zones/:zoneId/aisles')
  @RequirePermissions('warehouse.read')
  listAisles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.topologyService.listAisles(user, warehouseId, zoneId);
  }

  @Patch('zones/:zoneId/aisles/:aisleId')
  @RequirePermissions('warehouse.update')
  updateAisle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Body() dto: UpdateAisleDto,
  ) {
    return this.topologyService.updateAisle(user, warehouseId, zoneId, aisleId, dto);
  }

  // Racks
  @Post('zones/:zoneId/aisles/:aisleId/racks')
  @RequirePermissions('warehouse.update')
  createRack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Body() dto: CreateRackDto,
  ) {
    return this.topologyService.createRack(user, warehouseId, zoneId, aisleId, dto);
  }

  @Get('zones/:zoneId/aisles/:aisleId/racks')
  @RequirePermissions('warehouse.read')
  listRacks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
  ) {
    return this.topologyService.listRacks(user, warehouseId, zoneId, aisleId);
  }

  @Patch('zones/:zoneId/aisles/:aisleId/racks/:rackId')
  @RequirePermissions('warehouse.update')
  updateRack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Param('rackId') rackId: string,
    @Body() dto: UpdateRackDto,
  ) {
    return this.topologyService.updateRack(user, warehouseId, zoneId, aisleId, rackId, dto);
  }

  // Levels
  @Post('zones/:zoneId/aisles/:aisleId/racks/:rackId/levels')
  @RequirePermissions('warehouse.update')
  createLevel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Param('rackId') rackId: string,
    @Body() dto: CreateLevelDto,
  ) {
    return this.topologyService.createLevel(user, warehouseId, zoneId, aisleId, rackId, dto);
  }

  @Get('zones/:zoneId/aisles/:aisleId/racks/:rackId/levels')
  @RequirePermissions('warehouse.read')
  listLevels(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Param('rackId') rackId: string,
  ) {
    return this.topologyService.listLevels(user, warehouseId, zoneId, aisleId, rackId);
  }

  @Patch('zones/:zoneId/aisles/:aisleId/racks/:rackId/levels/:levelId')
  @RequirePermissions('warehouse.update')
  updateLevel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Param('rackId') rackId: string,
    @Param('levelId') levelId: string,
    @Body() dto: UpdateLevelDto,
  ) {
    return this.topologyService.updateLevel(user, warehouseId, zoneId, aisleId, rackId, levelId, dto);
  }

  // Locations
  @Post('zones/:zoneId/aisles/:aisleId/racks/:rackId/levels/:levelId/locations')
  @RequirePermissions('warehouse.update')
  createLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Param('rackId') rackId: string,
    @Param('levelId') levelId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.topologyService.createLocation(user, warehouseId, zoneId, aisleId, rackId, levelId, dto);
  }

  @Get('zones/:zoneId/aisles/:aisleId/racks/:rackId/levels/:levelId/locations')
  @RequirePermissions('warehouse.read')
  listLocations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('aisleId') aisleId: string,
    @Param('rackId') rackId: string,
    @Param('levelId') levelId: string,
  ) {
    return this.topologyService.listLocations(user, warehouseId, zoneId, aisleId, rackId, levelId);
  }

  @Get('locations')
  @RequirePermissions('warehouse.read')
  listAllLocations(@CurrentUser() user: AuthenticatedUser, @Param('warehouseId') warehouseId: string) {
    return this.topologyService.listAllLocations(user, warehouseId);
  }

  @Get('topology-tree')
  @RequirePermissions('warehouse.read')
  getFullTopology(@CurrentUser() user: AuthenticatedUser, @Param('warehouseId') warehouseId: string) {
    return this.topologyService.getFullTopology(user, warehouseId);
  }

  @Get('locations/:locationId')
  @RequirePermissions('warehouse.read')
  getLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.topologyService.getLocation(user, warehouseId, locationId);
  }

  @Patch('locations/:locationId/block')
  @RequirePermissions('warehouse.update')
  blockLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('locationId') locationId: string,
    @Body() dto: BlockLocationDto,
  ) {
    return this.topologyService.blockLocation(user, warehouseId, locationId, dto.reason);
  }

  @Patch('locations/:locationId/unblock')
  @RequirePermissions('warehouse.update')
  unblockLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('warehouseId') warehouseId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.topologyService.unblockLocation(user, warehouseId, locationId);
  }
}
