import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { HandlingUnitsService } from './handling-units.service';
import { CreateHandlingUnitDto } from './dto/create-handling-unit.dto';
import { UpdateHandlingUnitDto } from './dto/update-handling-unit.dto';
import { MoveHandlingUnitDto } from './dto/move-handling-unit.dto';
import { HandlingUnitQueryDto } from './dto/handling-unit-query.dto';

@ApiTags('handling-units')
@Controller('handling-units')
export class HandlingUnitsController {
  constructor(private handlingUnitsService: HandlingUnitsService) {}

  @Post()
  @RequirePermissions('handling_unit.create')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHandlingUnitDto) {
    return this.handlingUnitsService.create(user, dto);
  }

  @Get()
  @RequirePermissions('handling_unit.read')
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: HandlingUnitQueryDto) {
    return this.handlingUnitsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('handling_unit.read')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.handlingUnitsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('handling_unit.update')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateHandlingUnitDto) {
    return this.handlingUnitsService.update(user, id, dto);
  }

  @Patch(':id/move')
  @RequirePermissions('handling_unit.move')
  move(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: MoveHandlingUnitDto) {
    return this.handlingUnitsService.move(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('handling_unit.update')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.handlingUnitsService.remove(user, id);
  }
}
