import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class SerialNumberQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  handlingUnitId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}
