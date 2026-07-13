import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemPickingPolicy } from '../../common/enums';

export class CreateItemDto {
  @IsString()
  sku: string;

  @IsOptional() @IsString() ean?: string;
  @IsOptional() @IsString() supplierCode?: string;

  @IsString()
  name: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() family?: string;
  @IsOptional() @IsString() subfamily?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsNumber() lengthCm?: number;
  @IsOptional() @IsNumber() widthCm?: number;
  @IsOptional() @IsNumber() heightCm?: number;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsString() baseUnit?: string;
  @IsOptional() @IsBoolean() stackable?: boolean;
  @IsOptional() @IsNumber() maxStack?: number;
  @IsOptional() @IsBoolean() hazardous?: boolean;
  @IsOptional() @IsString() adrClass?: string;
  @IsOptional() @IsBoolean() lotControlled?: boolean;
  @IsOptional() @IsBoolean() expiryControlled?: boolean;
  @IsOptional() @IsBoolean() serialControlled?: boolean;

  @IsOptional()
  @IsIn(ItemPickingPolicy)
  pickingPolicy?: (typeof ItemPickingPolicy)[number];

  @IsOptional() @IsNumber() minStock?: number;
  @IsOptional() @IsNumber() maxStock?: number;
  @IsOptional() @IsString() imageUrl?: string;
}
