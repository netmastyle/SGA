import { IsString } from 'class-validator';

export class MoveSerialNumberDto {
  @IsString()
  handlingUnitId: string;
}
