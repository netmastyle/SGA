import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { AisleAxis, RackSide, RackType, ZoneType } from '../../common/enums';

export class CreateZoneDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsIn(ZoneType)
  type?: (typeof ZoneType)[number];

  @IsOptional()
  @IsNumber()
  minTemp?: number;

  @IsOptional()
  @IsNumber()
  maxTemp?: number;

  @IsOptional()
  @IsNumber()
  minHumidity?: number;

  @IsOptional()
  @IsNumber()
  maxHumidity?: number;

  @IsOptional()
  @IsString()
  restrictions?: string;
}

export class UpdateZoneDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(ZoneType) type?: (typeof ZoneType)[number];
  @IsOptional() @IsNumber() minTemp?: number;
  @IsOptional() @IsNumber() maxTemp?: number;
  @IsOptional() @IsNumber() minHumidity?: number;
  @IsOptional() @IsNumber() maxHumidity?: number;
  @IsOptional() @IsString() restrictions?: string;
}

export class CreateAisleDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsIn(AisleAxis)
  axis?: (typeof AisleAxis)[number];

  @IsOptional() @IsNumber() startX?: number;
  @IsOptional() @IsNumber() startY?: number;
  @IsOptional() @IsNumber() lengthM?: number;
  @IsOptional() @IsNumber() widthM?: number;
  @IsOptional() @IsBoolean() hasLeftRacks?: boolean;
  @IsOptional() @IsBoolean() hasRightRacks?: boolean;
}

export class UpdateAisleDto {
  @IsOptional() @IsIn(AisleAxis) axis?: (typeof AisleAxis)[number];
  @IsOptional() @IsNumber() startX?: number;
  @IsOptional() @IsNumber() startY?: number;
  @IsOptional() @IsNumber() lengthM?: number;
  @IsOptional() @IsNumber() widthM?: number;
  @IsOptional() @IsBoolean() hasLeftRacks?: boolean;
  @IsOptional() @IsBoolean() hasRightRacks?: boolean;
}

export class CreateRackDto {
  @IsString()
  code: string;

  @IsOptional() @IsIn(RackType) type?: (typeof RackType)[number];
  @IsOptional() @IsIn(RackSide) side?: (typeof RackSide)[number];
  @IsOptional() @IsNumber() offsetM?: number;
  @IsOptional() @IsNumber() columns?: number;
  @IsOptional() @IsNumber() levelsCount?: number;
  @IsOptional() @IsNumber() moduleLengthM?: number;
  @IsOptional() @IsNumber() moduleWidthM?: number;
  @IsOptional() @IsNumber() moduleHeightM?: number;
  @IsOptional() @IsNumber() maxLoadKg?: number;
}

export class UpdateRackDto {
  @IsOptional() @IsIn(RackType) type?: (typeof RackType)[number];
  @IsOptional() @IsIn(RackSide) side?: (typeof RackSide)[number];
  @IsOptional() @IsNumber() offsetM?: number;
  @IsOptional() @IsNumber() columns?: number;
  @IsOptional() @IsNumber() levelsCount?: number;
  @IsOptional() @IsNumber() moduleLengthM?: number;
  @IsOptional() @IsNumber() moduleWidthM?: number;
  @IsOptional() @IsNumber() moduleHeightM?: number;
  @IsOptional() @IsNumber() maxLoadKg?: number;
}

export class CreateLevelDto {
  @IsNumber()
  levelNumber: number;

  @IsOptional() @IsNumber() heightFromFloorM?: number;
  @IsOptional() @IsNumber() clearHeightM?: number;
  @IsOptional() @IsNumber() maxLoadKg?: number;
}

export class UpdateLevelDto {
  @IsOptional() @IsNumber() heightFromFloorM?: number;
  @IsOptional() @IsNumber() clearHeightM?: number;
  @IsOptional() @IsNumber() maxLoadKg?: number;
}

export class CreateLocationDto {
  @IsString()
  code: string;

  @IsOptional() @IsNumber() maxLengthM?: number;
  @IsOptional() @IsNumber() maxWidthM?: number;
  @IsOptional() @IsNumber() maxHeightM?: number;
  @IsOptional() @IsNumber() maxWeightKg?: number;
  @IsOptional() @IsBoolean() multiSku?: boolean;
  @IsOptional() @IsNumber() coordX?: number;
  @IsOptional() @IsNumber() coordY?: number;
  @IsOptional() @IsNumber() coordZ?: number;
}

export class BlockLocationDto {
  @IsString()
  reason: string;
}
