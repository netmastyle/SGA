import { ArrayUnique, IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { PERMISSIONS } from '../../common/enums';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSIONS, { each: true })
  permissionCodes?: string[];
}
