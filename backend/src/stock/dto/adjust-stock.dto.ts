import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsString()
  handlingUnitId: string;

  @IsString()
  itemId: string;

  @IsOptional()
  @IsString()
  lotId?: string;

  @IsNumber()
  quantityDelta: number;

  @IsString()
  reason: string;
}
