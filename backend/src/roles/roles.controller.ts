import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @RequirePermissions('role.manage')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user, dto);
  }

  @Get()
  @RequirePermissions('role.manage')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions('role.manage')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rolesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('role.manage')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(user, id, dto);
  }
}
