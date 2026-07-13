import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { WarehouseStatus } from '../../common/enums';

export class CreateWarehouseDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  lengthM?: number;

  @IsOptional()
  @IsNumber()
  widthM?: number;

  @IsOptional()
  @IsNumber()
  heightM?: number;

  @IsOptional()
  @IsIn(WarehouseStatus)
  status?: (typeof WarehouseStatus)[number];
}
