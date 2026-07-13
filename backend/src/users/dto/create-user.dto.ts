import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from '../../common/enums';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsString()
  roleId: string;

  @IsOptional()
  @IsIn(UserStatus)
  status?: (typeof UserStatus)[number];
}
