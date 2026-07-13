import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { HandlingUnitStatus, HandlingUnitType } from '../../common/enums';

export class UpdateHandlingUnitDto {
  @IsOptional()
  @IsIn(HandlingUnitType)
  type?: (typeof HandlingUnitType)[number];

  @IsOptional()
  @IsIn(HandlingUnitStatus)
  status?: (typeof HandlingUnitStatus)[number];

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
