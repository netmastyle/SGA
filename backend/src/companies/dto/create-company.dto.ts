import { IsIn, IsOptional, IsString } from 'class-validator';
import { CompanyStatus } from '../../common/enums';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  taxId: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsIn(CompanyStatus)
  status?: (typeof CompanyStatus)[number];
}
