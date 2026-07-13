import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Post()
  @RequirePermissions('warehouse.create')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(user, dto);
  }

  @Get()
  @RequirePermissions('warehouse.read')
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.warehousesService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('warehouse.read')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.warehousesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('warehouse.update')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('warehouse.delete')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.warehousesService.remove(user, id);
  }
}
