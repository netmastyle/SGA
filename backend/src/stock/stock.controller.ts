import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockQueryDto } from './dto/stock-query.dto';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  @RequirePermissions('inventory.read')
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: StockQueryDto) {
    return this.stockService.findAll(user, query);
  }

  @Post('adjust')
  @RequirePermissions('inventory.adjust')
  adjust(@CurrentUser() user: AuthenticatedUser, @Body() dto: AdjustStockDto) {
    return this.stockService.adjust(user, dto);
  }
}
