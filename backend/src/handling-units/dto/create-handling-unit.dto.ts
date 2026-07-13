import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { HandlingUnitType } from '../../common/enums';

export class CreateHandlingUnitDto {
  @IsString()
  code: string;

  @IsString()
  warehouseId: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsIn(HandlingUnitType)
  type?: (typeof HandlingUnitType)[number];

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  lengthCm?: number;

  @IsOptional()
  @IsNumber()
  widthCm?: number;

  @IsOptional()
  @IsNumber()
  heightCm?: number;
}
