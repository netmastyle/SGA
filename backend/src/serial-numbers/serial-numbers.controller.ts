import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { SerialNumbersService } from './serial-numbers.service';
import { RegisterSerialNumberDto } from './dto/register-serial-number.dto';
import { UpdateSerialNumberStatusDto } from './dto/update-serial-number-status.dto';
import { MoveSerialNumberDto } from './dto/move-serial-number.dto';
import { SerialNumberQueryDto } from './dto/serial-number-query.dto';

@ApiTags('serial-numbers')
@Controller('serial-numbers')
export class SerialNumbersController {
  constructor(private serialNumbersService: SerialNumbersService) {}

  @Post()
  @RequirePermissions('serial_number.create')
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterSerialNumberDto) {
    return this.serialNumbersService.register(user, dto);
  }

  @Get()
  @RequirePermissions('serial_number.read')
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: SerialNumberQueryDto) {
    return this.serialNumbersService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('serial_number.read')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.serialNumbersService.findOne(user, id);
  }

  @Patch(':id/status')
  @RequirePermissions('serial_number.update')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSerialNumberStatusDto,
  ) {
    return this.serialNumbersService.updateStatus(user, id, dto);
  }

  @Patch(':id/move')
  @RequirePermissions('serial_number.move')
  move(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: MoveSerialNumberDto) {
    return this.serialNumbersService.move(user, id, dto);
  }
}
