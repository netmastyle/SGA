import { IsOptional, IsString } from 'class-validator';

export class RegisterSerialNumberDto {
  @IsString()
  itemId: string;

  @IsString()
  serialNumber: string;

  @IsOptional()
  @IsString()
  handlingUnitId?: string;
}
