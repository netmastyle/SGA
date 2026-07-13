import { IsOptional, IsString } from 'class-validator';

export class MoveHandlingUnitDto {
  @IsString()
  locationId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
